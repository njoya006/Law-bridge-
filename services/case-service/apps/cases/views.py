from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.utils import timezone
from django.conf import settings
import jwt
from decouple import config
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from .models import Case, CaseNote
from .serializers import CaseSerializer, CaseCreateSerializer, CaseNoteSerializer


def extract_user_id_from_token(request):
    """Extract user_id UUID from JWT token"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        try:
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, config('JWT_SECRET_KEY', default='dev-secret'), algorithms=['HS256'])
            return payload.get('user_id')
        except:
            pass
    return str(request.user.id)


def get_auth_header(request):
    auth_header = request.headers.get('Authorization', '')
    return auth_header if auth_header.startswith('Bearer ') else None


def fetch_json(url, headers=None, timeout=5):
    req = Request(url, headers=headers or {})
    with urlopen(req, timeout=timeout) as response:
        payload = response.read().decode('utf-8')
        return json.loads(payload) if payload else []


def get_user_firm_ids_from_lawyer_service(user_id, internal=False, auth_header=None):
    base_url = getattr(settings, 'LAWYER_SERVICE_URL', 'http://lawyer-service:8003/api/v1/firms').rstrip('/')
    headers = {}
    if internal:
        headers['X-Internal-Api-Key'] = config('INTERNAL_API_KEY', default='dev-internal-key')
    elif auth_header:
        headers['Authorization'] = auth_header
    url = f"{base_url}/internal/users/{user_id}/memberships/" if internal else f"{base_url}/me/"
    try:
        memberships = fetch_json(url, headers=headers)
    except (HTTPError, URLError, ValueError):
        return set()
    firm_ids = set()
    for membership in memberships or []:
        firm_id = membership.get('firm')
        if firm_id and membership.get('is_active', True):
            firm_ids.add(str(firm_id))
    return firm_ids


def is_internal_request(request):
    from decouple import config
    return request.headers.get('X-Internal-Api-Key') == config('INTERNAL_API_KEY', default='dev-internal-key')


STAFF_ROLES = {'lawyer', 'firm_admin', 'firm-admin', 'partner', 'associate', 'secretary', 'managing_partner'}


def extract_token_payload(request):
    """Decode JWT trying all possible signing keys."""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header.startswith('Bearer '):
        return {}
    token = auth_header.split(' ')[1]
    for key in [config('JWT_SECRET_KEY', default='dev-secret'), config('SECRET_KEY', default='dev-secret'), 'dev-secret']:
        try:
            return jwt.decode(token, key, algorithms=['HS256'])
        except Exception:
            continue
    return {}


def user_can_access_case(request, case):
    payload = extract_token_payload(request)
    user_id = payload.get('user_id') or extract_user_id_from_token(request)
    role = payload.get('role', 'client')

    if str(case.client_id) == str(user_id):
        return True

    if role not in STAFF_ROLES:
        return False

    if case.assigned_lawyer_id and str(case.assigned_lawyer_id) == str(user_id):
        return True

    auth_header = get_auth_header(request)
    if not auth_header:
        return False

    current_firms = get_user_firm_ids_from_lawyer_service(user_id, auth_header=auth_header)
    if not current_firms:
        return False

    if case.assigned_lawyer_id:
        assigned_firms = get_user_firm_ids_from_lawyer_service(case.assigned_lawyer_id, internal=True)
        return bool(current_firms.intersection(assigned_firms))

    return False


class CaseListView(APIView):
    """List and create cases"""

    def get(self, request):
        """GET /api/v1/cases/ - List cases (clients see own; lawyers/firm_admin see assigned)"""
        payload = extract_token_payload(request)
        user_id = payload.get('user_id') or extract_user_id_from_token(request)
        role = payload.get('role', 'client')
        if role in STAFF_ROLES:
            cases = Case.objects.filter(assigned_lawyer_id=user_id)
        else:
            cases = Case.objects.filter(client_id=user_id)
        serializer = CaseSerializer(cases, many=True)
        return Response({
            'count': cases.count(),
            'results': serializer.data
        })

    def post(self, request):
        """POST /api/v1/cases/ - File a new case"""
        serializer = CaseCreateSerializer(data=request.data)
        user_id = extract_user_id_from_token(request)
        if serializer.is_valid():
            case = Case.objects.create(
                client_id=user_id,
                **serializer.validated_data
            )
            case.add_timeline_entry('draft', 'Case created')
            return Response(
                CaseSerializer(case).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CaseDetailView(APIView):
    """Retrieve single case"""
    
    def get(self, request, case_id):
        """GET /api/v1/cases/{case_id}/ - Get case detail"""
        try:
            case = Case.objects.get(id=case_id)
            # Allow internal service calls to fetch case details without normal access checks
            if not is_internal_request(request) and not user_can_access_case(request, case):
                return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
            serializer = CaseSerializer(case)
            return Response(serializer.data)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)


class CaseAssignView(APIView):
    """Assign a lawyer to a case (admin only)"""
    
    def post(self, request, case_id):
        """POST /api/v1/cases/{case_id}/assign/ - Assign lawyer"""
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)
        
        lawyer_id = request.data.get('lawyer_id')
        if not lawyer_id:
            return Response({'error': 'lawyer_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # TODO: Check for conflicts of interest here
        # For now, just assign
        case.assigned_lawyer_id = lawyer_id
        case.add_timeline_entry('assigned', f'Assigned to lawyer {lawyer_id}')
        
        return Response(CaseSerializer(case).data)


class CaseNoteView(APIView):
    """Add notes to a case"""
    
    def post(self, request, case_id):
        """POST /api/v1/cases/{case_id}/notes/ - Add lawyer note"""
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CaseNoteSerializer(data=request.data)
        user_id = extract_user_id_from_token(request)
        if serializer.is_valid():
            note = CaseNote.objects.create(
                case=case,
                lawyer_id=user_id,
                **serializer.validated_data
            )
            return Response(
                CaseNoteSerializer(note).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

