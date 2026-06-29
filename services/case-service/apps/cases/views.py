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
from .models import Case, CaseNote, CaseApplication, ReassignmentRequest
from .serializers import CaseSerializer, CaseCreateSerializer, CaseNoteSerializer, ReassignmentRequestSerializer


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


STAFF_ROLES = {'lawyer', 'firm_admin', 'firm-admin', 'partner', 'associate', 'secretary', 'managing_partner', 'owner', 'guest'}


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

    # Firm member can access a booking directed at their firm (pending, no lawyer assigned yet)
    if case.booking_metadata:
        target_id = str(case.booking_metadata.get('target_id', ''))
        if target_id and target_id in current_firms:
            return True

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
        auth_header = get_auth_header(request)

        # Fetch firm IDs this user belongs to so firm bookings are visible to all members
        user_firm_ids = get_user_firm_ids_from_lawyer_service(user_id, auth_header=auth_header)

        from django.db.models import Q
        # Direct lawyer bookings (target_id == lawyer's auth UUID)
        q = Q(booking_metadata__target_id=str(user_id))
        # Firm bookings (target_id == firm's integer ID, e.g. "7")
        for firm_id in user_firm_ids:
            q |= Q(booking_metadata__target_id=str(firm_id))
        # Cases directly assigned to this lawyer with a pending booking status
        q |= Q(assigned_lawyer_id=user_id, booking_status='pending')

        cases = Case.objects.filter(q).exclude(booking_status='').order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter:
            cases = cases.filter(booking_status=status_filter)

        serializer = CaseSerializer(cases, many=True)
        return Response({'count': cases.count(), 'results': serializer.data})


class CaseStatusUpdateView(APIView):
    """POST /api/v1/cases/{case_id}/status/ — Lawyer or firm member updates the case status."""

    def post(self, request, case_id):
        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

        payload = extract_token_payload(request)
        role = payload.get('role', 'client')
        if role not in STAFF_ROLES:
            return Response({'error': 'Only lawyers and firm members can update case status'}, status=status.HTTP_403_FORBIDDEN)

        if not user_can_access_case(request, case):
            return Response({'error': 'You do not have access to this case'}, status=status.HTTP_403_FORBIDDEN)

        new_status = (request.data.get('status') or '').strip()
        note = (request.data.get('note') or '').strip()

        valid = [s for s, _ in Case.STATUS_CHOICES]
        if new_status not in valid:
            return Response(
                {'error': f'Invalid status. Valid values: {", ".join(valid)}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_id = payload.get('user_id') or extract_user_id_from_token(request)
        case.add_timeline_entry(new_status, notes=note, updated_by=user_id)

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



class OpenCasesView(APIView):
    """GET /api/v1/cases/open/ — cases with declined bookings that lawyers can apply for."""

    def get(self, request):
        payload = extract_token_payload(request)
        role = payload.get('role', 'client')
        if role not in STAFF_ROLES:
            return Response({'error': 'Only lawyers and firm staff can view open cases'}, status=403)

        qs = Case.objects.filter(
            booking_status='declined',
            assigned_lawyer_id__isnull=True,
        ).order_by('-created_at')

        data = CaseSerializer(qs, many=True).data
        return Response({'count': len(data), 'results': data})


class CaseApplicationView(APIView):
    """POST /api/v1/cases/{case_id}/apply/ — lawyer applies to take on a declined case."""

    def post(self, request, case_id):
        payload = extract_token_payload(request)
        role = payload.get('role', 'client')
        if role not in STAFF_ROLES:
            return Response({'error': 'Only lawyers and firm staff can apply for cases'}, status=403)

        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=404)

        if case.booking_status != 'declined':
            return Response({'error': 'This case is not open for applications'}, status=400)

        lawyer_id = payload.get('user_id') or extract_user_id_from_token(request)
        if not lawyer_id:
            return Response({'error': 'Could not identify requesting lawyer'}, status=400)

        message = (request.data.get('message') or '').strip()
        application, created = CaseApplication.objects.get_or_create(
            case=case,
            lawyer_id=lawyer_id,
            defaults={'message': message},
        )
        if not created:
            return Response({'error': 'You have already applied for this case'}, status=400)

        return Response({
            'id': str(application.id),
            'case_id': str(case.id),
            'lawyer_id': str(application.lawyer_id),
            'message': application.message,
            'status': application.status,
            'created_at': application.created_at.isoformat(),
        }, status=201)


# ── Reassignment ──────────────────────────────────────────────────────────────

import datetime


REASSIGNMENT_WORK_PROGRESS = {
    'draft': 0, 'filed': 10, 'assigned': 20, 'under_review': 35,
    'evidence_collection': 50, 'awaiting_court_date': 60, 'in_progress': 65,
    'hearing_scheduled': 75, 'hearing_adjourned': 80, 'mediation': 70,
    'verdict': 90, 'settled': 100, 'closed': 100, 'dismissed': 0, 'archived': 0,
    'appeal_filed': 85, 'appeal_in_progress': 90,
}

ACTIVE_REASSIGNMENT_STATUSES = {'pending_review', 'mediation_window', 'approved', 'searching', 'transferring'}


def _run_conflict_checks(case) -> dict:
    """Analyse the case for reassignment conflicts and return a structured report."""
    flags: dict = {}

    # Payment check
    bm = case.booking_metadata or {}
    payment_status = bm.get('payment_status', '')
    flags['payment_made'] = payment_status in ('paid', 'captured', 'completed')
    flags['payment_amount'] = str(bm.get('booking_fee') or '0')
    flags['payment_currency'] = 'XAF'

    # Court date imminence
    high_risk_statuses = {'hearing_scheduled', 'awaiting_court_date', 'hearing_adjourned'}
    flags['court_date_imminent'] = case.status in high_risk_statuses

    # Active appeal — cannot reassign
    appeal_statuses = {'appeal_filed', 'appeal_in_progress'}
    flags['active_appeal'] = case.status in appeal_statuses

    # Terminal — no reassignment
    terminal = {'closed', 'dismissed', 'archived', 'settled', 'verdict'}
    flags['is_terminal'] = case.status in terminal

    # Work progress %
    flags['work_progress_pct'] = REASSIGNMENT_WORK_PROGRESS.get(case.status, 0)

    # Recent activity (last 7 days)
    week_ago = (timezone.now() - datetime.timedelta(days=7)).isoformat()
    recent = [t for t in (case.timeline or []) if t.get('timestamp', '') >= week_ago]
    flags['recent_activity_count'] = len(recent)

    # Whether a lawyer is assigned
    flags['has_lawyer'] = bool(case.assigned_lawyer_id)

    # Overall recommendation
    if flags['is_terminal']:
        flags['recommendation'] = 'blocked'
        flags['block_reason'] = 'Case is in a terminal state and cannot be reassigned'
    elif flags['active_appeal']:
        flags['recommendation'] = 'blocked'
        flags['block_reason'] = 'Case has an active appeal — reassignment is not permitted during appeal proceedings'
    elif flags['court_date_imminent']:
        flags['recommendation'] = 'caution'
    elif flags['work_progress_pct'] >= 70:
        flags['recommendation'] = 'caution'
    else:
        flags['recommendation'] = 'proceed'

    return flags


class ReassignmentView(APIView):
    """
    GET  /cases/{id}/reassignment/ — return active reassignment request if any
    POST /cases/{id}/reassignment/ — initiate a new reassignment request
    """

    def _get_case_for_client(self, request, case_id):
        client_id = extract_user_id_from_token(request)
        try:
            return Case.objects.get(id=case_id, client_id=client_id), client_id
        except Case.DoesNotExist:
            return None, client_id

    def get(self, request, case_id):
        case, client_id = self._get_case_for_client(request, case_id)
        if not case:
            return Response({'error': 'Case not found'}, status=404)
        req = ReassignmentRequest.objects.filter(
            case=case, client_id=str(client_id),
        ).order_by('-created_at').first()
        if not req:
            return Response({'active': False}, status=200)
        return Response({'active': True, **ReassignmentRequestSerializer(req).data})

    def post(self, request, case_id):
        case, client_id = self._get_case_for_client(request, case_id)
        if not case:
            return Response({'error': 'Case not found or not owned by you'}, status=404)

        # Block if there is already an active request
        if ReassignmentRequest.objects.filter(
            case=case, client_id=str(client_id), status__in=ACTIVE_REASSIGNMENT_STATUSES
        ).exists():
            return Response({'error': 'An active reassignment request already exists for this case'}, status=400)

        reason_code = (request.data.get('reason_code') or '').strip()
        reason_detail = (request.data.get('reason_detail') or '').strip()
        performance_rating = request.data.get('performance_rating', 3)

        if not reason_code:
            return Response({'error': 'reason_code is required'}, status=400)
        if not reason_detail:
            return Response({'error': 'Please describe the issue in detail'}, status=400)
        try:
            performance_rating = max(1, min(5, int(performance_rating)))
        except (TypeError, ValueError):
            performance_rating = 3

        conflict_flags = _run_conflict_checks(case)

        req_status = 'blocked' if conflict_flags.get('recommendation') == 'blocked' else 'pending_review'
        mediation_deadline = None
        if req_status == 'pending_review':
            mediation_deadline = timezone.now() + datetime.timedelta(hours=48)

        req = ReassignmentRequest.objects.create(
            case=case,
            client_id=str(client_id),
            reason_code=reason_code,
            reason_detail=reason_detail,
            performance_rating=performance_rating,
            conflict_flags=conflict_flags,
            status=req_status,
            mediation_deadline=mediation_deadline,
        )

        return Response(ReassignmentRequestSerializer(req).data, status=201)


class ReassignmentConfirmView(APIView):
    """POST /cases/{id}/reassignment/confirm/ — client confirms after reviewing conflict report."""

    def post(self, request, case_id):
        client_id = extract_user_id_from_token(request)
        try:
            case = Case.objects.get(id=case_id, client_id=client_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=404)

        req = ReassignmentRequest.objects.filter(
            case=case, client_id=str(client_id), status='pending_review'
        ).order_by('-created_at').first()
        if not req:
            return Response({'error': 'No pending reassignment request found'}, status=404)

        req.status = 'mediation_window'
        req.save(update_fields=['status', 'updated_at'])
        return Response(ReassignmentRequestSerializer(req).data)


class ReassignmentCancelView(APIView):
    """POST /cases/{id}/reassignment/cancel/ — client cancels the current request."""

    def post(self, request, case_id):
        client_id = extract_user_id_from_token(request)
        try:
            case = Case.objects.get(id=case_id, client_id=client_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=404)

        req = ReassignmentRequest.objects.filter(
            case=case, client_id=str(client_id), status__in=ACTIVE_REASSIGNMENT_STATUSES
        ).order_by('-created_at').first()
        if not req:
            return Response({'error': 'No active reassignment request to cancel'}, status=404)

        req.status = 'cancelled'
        req.completed_at = timezone.now()
        req.save(update_fields=['status', 'completed_at', 'updated_at'])
        return Response({'status': 'cancelled'})


class ReassignmentSelectLawyerView(APIView):
    """POST /cases/{id}/reassignment/select-lawyer/ — client picks the replacement lawyer."""

    def post(self, request, case_id):
        client_id = extract_user_id_from_token(request)
        try:
            case = Case.objects.get(id=case_id, client_id=client_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=404)

        new_lawyer_id = (request.data.get('lawyer_id') or '').strip()
        if not new_lawyer_id:
            return Response({'error': 'lawyer_id is required'}, status=400)

        req = ReassignmentRequest.objects.filter(
            case=case, client_id=str(client_id), status__in={'mediation_window', 'approved', 'searching'}
        ).order_by('-created_at').first()
        if not req:
            return Response({'error': 'No eligible reassignment request found'}, status=404)

        req.selected_lawyer_id = new_lawyer_id
        req.status = 'transferring'
        req.save(update_fields=['selected_lawyer_id', 'status', 'updated_at'])

        # Execute the case transfer
        old_lawyer_id = str(case.assigned_lawyer_id) if case.assigned_lawyer_id else None
        case.assigned_lawyer_id = new_lawyer_id
        case.add_timeline_entry(
            status=case.status,
            notes=f'Lawyer reassigned. Previous lawyer: {old_lawyer_id or "none"}. Reason: {req.get_reason_code_display()}.',
            updated_by=str(client_id),
        )

        req.status = 'completed'
        req.completed_at = timezone.now()
        req.handoff_summary = (
            f'Case transferred from lawyer {old_lawyer_id or "unassigned"} to {new_lawyer_id}. '
            f'Client rating of previous representation: {req.performance_rating}/5. '
            f'Reason: {req.get_reason_code_display()}.'
        )
        req.save(update_fields=['status', 'completed_at', 'handoff_summary', 'updated_at'])

        return Response(ReassignmentRequestSerializer(req).data)
