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


class BookingAcceptView(APIView):
    """POST /api/v1/cases/{case_id}/accept/ — Lawyer or firm admin accepts a booking."""

    def post(self, request, case_id):
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

        payload = extract_token_payload(request)
        role = payload.get('role', 'client')
        if role not in STAFF_ROLES:
            return Response({'error': 'Only lawyers and firm admins can accept bookings'}, status=status.HTTP_403_FORBIDDEN)

        case.booking_status = 'accepted'
        # Assign accepting lawyer so case appears in their list
        user_id = payload.get('user_id') or extract_user_id_from_token(request)
        if not case.assigned_lawyer_id:
            case.assigned_lawyer_id = user_id
        case.add_timeline_entry('filed', 'Booking accepted by lawyer/firm')

        try:
            import json as _json, urllib.request as _urllib
            notif_data = _json.dumps({
                'user_id': str(case.client_id),
                'event_type': 'booking_accepted',
                'title_en': 'Booking Accepted',
                'title_fr': 'Réservation acceptée',
                'message_en': f'Your booking request for "{case.title}" has been accepted. You will be contacted to confirm consultation details.',
                'message_fr': f'Votre demande de réservation "{case.title}" a été acceptée.',
                'metadata': {'case_id': str(case.id)},
                'send_email': bool(case.booking_metadata.get('client_email')),
                'user_email': case.booking_metadata.get('client_email', ''),
                'lang': case.language,
            }).encode()
            req = _urllib.Request('http://notification-service/api/v1/notifications/internal/create/',
                data=notif_data, headers={'X-Internal-Key': 'dev-internal-key', 'Content-Type': 'application/json'}, method='POST')
            _urllib.urlopen(req, timeout=5)
        except Exception:
            pass

        return Response(CaseSerializer(case).data)


class BookingDeclineView(APIView):
    """POST /api/v1/cases/{case_id}/decline/ — Lawyer or firm admin declines a booking."""

    def post(self, request, case_id):
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

        payload = extract_token_payload(request)
        role = payload.get('role', 'client')
        if role not in STAFF_ROLES:
            return Response({'error': 'Only lawyers and firm admins can decline bookings'}, status=status.HTTP_403_FORBIDDEN)

        reason = (request.data.get('reason') or '').strip()
        case.booking_status = 'declined'
        case.booking_metadata['decline_reason'] = reason
        case.save(update_fields=['booking_metadata'])
        case.add_timeline_entry('dismissed', f'Booking declined: {reason or "No reason provided"}')

        try:
            import json as _json, urllib.request as _urllib
            notif_data = _json.dumps({
                'user_id': str(case.client_id),
                'event_type': 'booking_declined',
                'title_en': 'Booking Declined',
                'title_fr': 'Réservation refusée',
                'message_en': f'Your booking for "{case.title}" was declined.{(" Reason: " + reason) if reason else ""} If you paid a booking fee, a refund will be processed within 3–5 business days.',
                'message_fr': f'Votre réservation "{case.title}" a été refusée.',
                'metadata': {'case_id': str(case.id), 'reason': reason},
                'send_email': bool(case.booking_metadata.get('client_email')),
                'user_email': case.booking_metadata.get('client_email', ''),
                'lang': case.language,
            }).encode()
            req = _urllib.Request('http://notification-service/api/v1/notifications/internal/create/',
                data=notif_data, headers={'X-Internal-Key': 'dev-internal-key', 'Content-Type': 'application/json'}, method='POST')
            _urllib.urlopen(req, timeout=5)
        except Exception:
            pass

        return Response(CaseSerializer(case).data)


class IncomingBookingsView(APIView):
    """GET /api/v1/cases/incoming-bookings/ — Lawyer/firm sees booking requests directed at them."""

    def get(self, request):
        payload = extract_token_payload(request)
        role = payload.get('role', 'client')
        if role not in STAFF_ROLES:
            return Response({'error': 'Only lawyers and firm admins can view incoming bookings'}, status=status.HTTP_403_FORBIDDEN)

        user_id = payload.get('user_id') or extract_user_id_from_token(request)

        # Match by target_id (lawyer profile UUID) or by assigned_lawyer_id with pending status
        # Using __icontains on JSONField is supported in Django 3.1+ with PostgreSQL
        from django.db.models import Q
        cases = Case.objects.filter(
            Q(booking_metadata__target_id=str(user_id)) |
            Q(assigned_lawyer_id=user_id, booking_status='pending')
        ).exclude(booking_status='').order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter:
            cases = cases.filter(booking_status=status_filter)

        serializer = CaseSerializer(cases, many=True)
        return Response({'count': cases.count(), 'results': serializer.data})


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

