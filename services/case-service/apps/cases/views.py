import logging
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
from .models import Case, CaseNote, CaseApplication, ReassignmentRequest, IntakeForm
from .serializers import CaseSerializer, CaseCreateSerializer, CaseNoteSerializer, ReassignmentRequestSerializer
from apps.conflicts.models import ConflictCheck

from rest_framework.pagination import PageNumberPagination

logger = logging.getLogger(__name__)


class StandardPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


def extract_user_id_from_token(request):
    """Extract user_id UUID from JWT token"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        try:
            token = auth_header.split(' ')[1]
            signing_key = settings.SIMPLE_JWT.get('SIGNING_KEY', settings.SECRET_KEY)
            payload = jwt.decode(token, signing_key, algorithms=['HS256'], options={'verify_aud': False})
            return payload.get('user_id')
        except Exception as exc:
            logger.warning("JWT decode failed in extract_user_id_from_token: %s", exc)
    return str(request.user.id)


def get_auth_header(request):
    auth_header = request.headers.get('Authorization', '')
    return auth_header if auth_header.startswith('Bearer ') else None


def fetch_json(url, headers=None, timeout=5):
    req = Request(url, headers=headers or {})
    with urlopen(req, timeout=timeout) as response:
        payload = response.read().decode('utf-8')
        return json.loads(payload) if payload else []


def get_firm_member_uuids(auth_header):
    """Return set of auth-service UUIDs for all active members in the user's first firm.
    Used so secretaries can see all cases assigned to lawyers in their firm."""
    base_url = getattr(settings, 'LAWYER_SERVICE_URL', 'http://lawyer-service:8003/api/v1/firms').rstrip('/')
    headers = {'Authorization': auth_header}
    try:
        memberships = fetch_json(f'{base_url}/me/', headers=headers)
    except (HTTPError, URLError, ValueError):
        return set()
    if not memberships:
        return set()
    firm_id = memberships[0].get('firm')
    if not firm_id:
        return set()
    internal_key = config('INTERNAL_API_KEY', default='dev-internal-key')
    try:
        members = fetch_json(f'{base_url}/{firm_id}/members/', headers={'X-Internal-Api-Key': internal_key})
    except (HTTPError, URLError, ValueError):
        return set()
    return {str(m['user_uuid']) for m in members if m.get('user_uuid')}


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
    """Decode JWT using the same signing key as CustomJWTAuthentication."""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header.startswith('Bearer '):
        return {}
    token = auth_header.split(' ')[1]
    try:
        signing_key = settings.SIMPLE_JWT.get('SIGNING_KEY', settings.SECRET_KEY)
        return jwt.decode(token, signing_key, algorithms=['HS256'], options={'verify_aud': False})
    except Exception:
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
        if role == 'secretary':
            # Secretaries see all cases assigned to any lawyer in their firm
            auth_header = get_auth_header(request)
            firm_uuids = get_firm_member_uuids(auth_header) if auth_header else set()
            if firm_uuids:
                cases = Case.objects.filter(assigned_lawyer_id__in=firm_uuids).prefetch_related('notes')
            else:
                cases = Case.objects.none()
        elif role in STAFF_ROLES:
            cases = Case.objects.filter(assigned_lawyer_id=user_id).prefetch_related('notes')
        else:
            cases = Case.objects.filter(client_id=user_id).prefetch_related('notes')
        paginator = StandardPagination()
        page = paginator.paginate_queryset(cases, request)
        serializer = CaseSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

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


_ASSIGN_ROLES = {'firm_admin', 'owner', 'managing_partner', 'partner'}


class CaseAssignView(APIView):
    """Assign a lawyer to a case (admin only)"""

    def post(self, request, case_id):
        """POST /api/v1/cases/{case_id}/assign/ - Assign lawyer"""
        payload = extract_token_payload(request)
        if payload.get('role') not in _ASSIGN_ROLES:
            return Response({'error': 'Only firm admins and owners can assign cases'}, status=status.HTTP_403_FORBIDDEN)

        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

        lawyer_id = request.data.get('lawyer_id')
        if not lawyer_id:
            return Response({'error': 'lawyer_id required'}, status=status.HTTP_400_BAD_REQUEST)

        # Conflict of interest check: reject if lawyer already represents an opposing client
        has_conflict, conflicting = ConflictCheck.check_conflict(lawyer_id, [str(case.client_id)])
        if has_conflict:
            conflict_ids = list(conflicting.values_list('case_id', flat=True)[:5])
            return Response({
                'error': 'Conflict of interest: this lawyer already represents an opposing party.',
                'conflicting_case_ids': [str(cid) for cid in conflict_ids],
            }, status=status.HTTP_400_BAD_REQUEST)

        assigning_user = payload.get('user_id', 'unknown')
        case.assigned_lawyer_id = lawyer_id
        case.add_timeline_entry('assigned', f'Assigned to lawyer {lawyer_id}')
        logger.info("Case %s assigned to lawyer %s by user %s", case_id, lawyer_id, assigning_user)

        # Record this assignment so future conflict checks can detect it
        ConflictCheck.objects.get_or_create(
            lawyer_id=lawyer_id,
            case_id=case.id,
            defaults={'client_id': case.client_id, 'opposing_party_ids': []},
        )

        case.save()
        return Response(CaseSerializer(case).data)


class BookingAcceptView(APIView):
    """POST /api/v1/cases/{case_id}/accept/ — Lawyer or firm admin accepts a booking."""

    def post(self, request, case_id):
        payload = extract_token_payload(request)
        role = payload.get('role', 'client')
        if role not in STAFF_ROLES:
            return Response({'error': 'Only lawyers and firm admins can accept bookings'}, status=status.HTTP_403_FORBIDDEN)

        from django.db import transaction
        try:
            with transaction.atomic():
                case = Case.objects.select_for_update().get(id=case_id)
                if case.booking_status == 'accepted':
                    return Response({'error': 'This booking has already been accepted by another lawyer'}, status=status.HTTP_409_CONFLICT)

                user_id = payload.get('user_id') or extract_user_id_from_token(request)
                case.booking_status = 'accepted'
                if not case.assigned_lawyer_id:
                    case.assigned_lawyer_id = user_id
                case.add_timeline_entry('filed', 'Booking accepted by lawyer/firm')
                logger.info("Case %s booking accepted by user %s", case_id, user_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

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
        except Exception as notif_err:
            logger.error("Notification failed for booking accept on case %s: %s", case_id, notif_err)

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
        user_id = payload.get('user_id') or extract_user_id_from_token(request)
        case.booking_status = 'declined'
        case.booking_metadata['decline_reason'] = reason
        case.save(update_fields=['booking_metadata'])
        case.add_timeline_entry('dismissed', f'Booking declined: {reason or "No reason provided"}')
        logger.info("Case %s booking declined by user %s. Reason: %s", case_id, user_id, reason or 'none')

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
        except Exception as notif_err:
            logger.error("Notification failed for booking decline on case %s: %s", case_id, notif_err)

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

        cases = Case.objects.filter(q).exclude(booking_status='').prefetch_related('notes').order_by('-created_at')

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

        old_status = case.status
        user_id = payload.get('user_id') or extract_user_id_from_token(request)
        case.add_timeline_entry(new_status, notes=note, updated_by=user_id)
        logger.info("Case %s status changed %s → %s by user %s", case_id, old_status, new_status, user_id)

        # Fire bilingual in-app notification to the client
        try:
            from .workflow import get_status_message
            msg_en = get_status_message(new_status, 'en')
            msg_fr = get_status_message(new_status, 'fr')
            note_en = f'\n\nNote from your lawyer: {note}' if note else ''
            note_fr = f'\n\nNote de votre avocat : {note}' if note else ''
            notif_url = config(
                'NOTIFICATION_SERVICE_URL',
                default='http://notification-service/api/v1/notifications/internal/create/',
            )
            notif_payload = json.dumps({
                'user_id': str(case.client_id),
                'event_type': 'case_status_updated',
                'title_en': msg_en['headline'],
                'title_fr': msg_fr['headline'],
                'message_en': (
                    f"{msg_en['detail']}\n\n"
                    f"What happens next: {msg_en['next']}"
                    f"{note_en}"
                ),
                'message_fr': (
                    f"{msg_fr['detail']}\n\n"
                    f"Prochaine étape : {msg_fr['next']}"
                    f"{note_fr}"
                ),
                'metadata': {
                    'case_id': str(case.id),
                    'case_title': case.title,
                    'case_type': case.case_type,
                    'old_status': old_status,
                    'new_status': new_status,
                },
                'lang': case.language or 'en',
                'send_email': True,
            }).encode()
            notif_req = Request(
                notif_url,
                data=notif_payload,
                headers={'Content-Type': 'application/json', 'X-Internal-Key': config('INTERNAL_API_KEY', default='dev-internal-key')},
                method='POST',
            )
            urlopen(notif_req, timeout=3)
        except Exception as notif_err:
            logger.error("Notification failed for status update on case %s: %s", case_id, notif_err)

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
        ).prefetch_related('notes').order_by('-created_at')

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
        reason_label = dict(ReassignmentRequest.REASON_CHOICES).get(req.reason_code, req.reason_code)
        old_lawyer_id = str(case.assigned_lawyer_id) if case.assigned_lawyer_id else None
        case.assigned_lawyer_id = new_lawyer_id
        case.add_timeline_entry(
            status=case.status,
            notes=f'Lawyer reassigned. Previous lawyer: {old_lawyer_id or "none"}. Reason: {reason_label}.',
            updated_by=str(client_id),
        )

        req.status = 'completed'
        req.completed_at = timezone.now()
        req.handoff_summary = (
            f'Case transferred from lawyer {old_lawyer_id or "unassigned"} to {new_lawyer_id}. '
            f'Client rating of previous representation: {req.performance_rating}/5. '
            f'Reason: {reason_label}.'
        )
        req.save(update_fields=['status', 'completed_at', 'handoff_summary', 'updated_at'])

        return Response(ReassignmentRequestSerializer(req).data)


class ReassignmentRespondView(APIView):
    """POST /cases/{id}/reassignment/respond/ — assigned lawyer submits a response during the mediation window."""

    def post(self, request, case_id):
        lawyer_id = extract_user_id_from_token(request)
        payload = extract_token_payload(request)
        if payload.get('role', '') not in STAFF_ROLES:
            return Response({'error': 'Only lawyers can respond to reassignment requests'}, status=status.HTTP_403_FORBIDDEN)

        try:
            case = Case.objects.get(id=case_id, assigned_lawyer_id=lawyer_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found or you are not the assigned lawyer'}, status=status.HTTP_404_NOT_FOUND)

        req = ReassignmentRequest.objects.filter(
            case=case, status='mediation_window'
        ).order_by('-created_at').first()
        if not req:
            return Response({'error': 'No active mediation window for this case'}, status=status.HTTP_404_NOT_FOUND)

        lawyer_response = (request.data.get('response') or '').strip()
        if not lawyer_response:
            return Response({'error': 'response text is required'}, status=status.HTTP_400_BAD_REQUEST)

        req.lawyer_response = lawyer_response
        req.lawyer_responded_at = timezone.now()
        req.status = 'resolved'
        req.save(update_fields=['lawyer_response', 'lawyer_responded_at', 'status', 'updated_at'])

        return Response(ReassignmentRequestSerializer(req).data)


class PaymentVerifyView(APIView):
    """POST /cases/{id}/payment/verify/ — secretary verifies or rejects a client payment."""

    def post(self, request, case_id):
        payload = extract_token_payload(request)
        if payload.get('role', '') not in STAFF_ROLES:
            return Response({'error': 'Only firm staff can verify payments'}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action', '').strip()
        if action not in ('verify', 'reject'):
            return Response({'error': "action must be 'verify' or 'reject'"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            case = Case.objects.get(id=case_id)
        except Case.DoesNotExist:
            return Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)

        # Firm scope check: requestor must belong to the same firm as the assigned lawyer
        if case.assigned_lawyer_id:
            auth_header = get_auth_header(request)
            if auth_header:
                firm_members = get_firm_member_uuids(auth_header)
                if firm_members and str(case.assigned_lawyer_id) not in firm_members:
                    return Response({'error': 'You can only verify payments for cases in your firm'}, status=status.HTTP_403_FORBIDDEN)

        meta = dict(case.booking_metadata or {})
        new_status = 'verified' if action == 'verify' else 'rejected'
        meta['payment_status'] = new_status
        case.booking_metadata = meta
        verifier_id = payload.get('user_id', 'staff')
        case.add_timeline_entry(
            status=case.status,
            notes=f'Payment {new_status} by firm staff.',
            updated_by=str(verifier_id),
        )
        case.save()
        logger.info("Payment %s for case %s by user %s", new_status, case_id, verifier_id)

        # Notify client
        try:
            notif_url = config(
                'NOTIFICATION_SERVICE_URL',
                default='http://notification-service/api/v1/notifications/internal/create/',
            )
            notif_payload = json.dumps({
                'user_id': str(case.client_id),
                'event_type': 'payment_confirmed' if action == 'verify' else 'payment_declined',
                'title_en': 'Payment Verified' if action == 'verify' else 'Payment Rejected',
                'title_fr': 'Paiement vérifié' if action == 'verify' else 'Paiement rejeté',
                'message_en': 'Your payment has been verified and your booking is confirmed.' if action == 'verify'
                    else 'Your payment could not be verified. Please contact the firm.',
                'message_fr': 'Votre paiement a été vérifié et votre réservation est confirmée.' if action == 'verify'
                    else "Votre paiement n'a pas pu être vérifié. Veuillez contacter le cabinet.",
                'metadata': {'case_id': str(case.id), 'case_title': case.title},
                'lang': case.language or 'en',
                'send_email': False,
            }).encode()
            notif_req = Request(
                notif_url, data=notif_payload,
                headers={'Content-Type': 'application/json', 'X-Internal-Api-Key': config('INTERNAL_API_KEY', default='')},
                method='POST',
            )
            urlopen(notif_req, timeout=3)
        except Exception as notif_err:
            logger.error("Notification failed for payment verify on case %s: %s", case_id, notif_err)

        return Response(CaseSerializer(case).data)


# ── Intake Forms ───────────────────────────────────────────────────────────────

class IntakeFormCreateView(APIView):
    """GET /api/v1/cases/intake/ — list intakes created by this user.
       POST /api/v1/cases/intake/ — secretary saves an AI-generated intake form."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        uid = extract_user_id_from_token(request)
        forms = IntakeForm.objects.filter(created_by=uid).order_by('-created_at')
        return Response([
            {
                'id': str(f.id),
                'token': str(f.token),
                'case_type': f.case_type,
                'circuit': f.circuit,
                'completed': f.completed_at is not None,
                'response_count': len(f.responses) if f.responses else 0,
                'created_at': f.created_at.isoformat(),
                'completed_at': f.completed_at.isoformat() if f.completed_at else None,
            }
            for f in forms
        ])

    def post(self, request):
        fields = request.data.get('form_fields')
        case_type = (request.data.get('case_type') or '').strip()
        circuit = (request.data.get('circuit') or '').strip()
        case_id = request.data.get('case_id') or None

        if not fields or not isinstance(fields, list):
            return Response({'detail': 'form_fields must be a non-empty list'}, status=400)
        if not case_type:
            return Response({'detail': 'case_type is required'}, status=400)

        uid = extract_user_id_from_token(request)
        form = IntakeForm.objects.create(
            case_id=case_id,
            case_type=case_type,
            circuit=circuit,
            form_fields=fields,
            created_by=uid,
        )
        return Response({
            'id': str(form.id),
            'token': str(form.token),
            'case_type': form.case_type,
            'circuit': form.circuit,
            'form_fields': form.form_fields,
            'created_at': form.created_at.isoformat(),
        }, status=201)


class IntakeFormDetailView(APIView):
    """GET /api/v1/cases/intake/<token>/detail/ — authenticated: view responses."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, token):
        uid = extract_user_id_from_token(request)
        try:
            form = IntakeForm.objects.get(token=token, created_by=uid)
        except IntakeForm.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        return Response({
            'id': str(form.id),
            'token': str(form.token),
            'case_type': form.case_type,
            'circuit': form.circuit,
            'form_fields': form.form_fields,
            'responses': form.responses,
            'completed': form.completed_at is not None,
            'completed_at': form.completed_at.isoformat() if form.completed_at else None,
            'created_at': form.created_at.isoformat(),
        })


class IntakeFormPublicView(APIView):
    """GET/POST /api/v1/cases/intake/<token>/ — public: retrieve + submit intake form."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            form = IntakeForm.objects.get(token=token)
        except IntakeForm.DoesNotExist:
            return Response({'detail': 'Intake form not found.'}, status=404)
        return Response({
            'id': str(form.id),
            'token': str(form.token),
            'case_type': form.case_type,
            'circuit': form.circuit,
            'form_fields': form.form_fields,
            'completed': form.completed_at is not None,
        })

    def post(self, request, token):
        try:
            form = IntakeForm.objects.get(token=token)
        except IntakeForm.DoesNotExist:
            return Response({'detail': 'Intake form not found.'}, status=404)

        if form.completed_at:
            return Response({'detail': 'This form has already been submitted.'}, status=400)

        responses = request.data.get('responses')
        if not responses or not isinstance(responses, dict):
            return Response({'detail': 'responses must be a non-empty object'}, status=400)

        form.responses = responses
        form.completed_at = timezone.now()
        form.save(update_fields=['responses', 'completed_at'])

        return Response({'detail': 'Thank you — your responses have been submitted successfully.'})
