from rest_framework import viewsets, status
import logging
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime, timedelta
from .models import CalendarEvent, EventApproval, Alarm
from .serializers import CalendarEventSerializer

logger = logging.getLogger(__name__)
import uuid
import json
from django.conf import settings
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from decouple import config

class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        case_id = self.request.query_params.get('case_id')
        if case_id:
            return CalendarEvent.objects.filter(case_id=case_id)
        return CalendarEvent.objects.all()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        event_date = datetime.strptime(request.data['date'], '%Y-%m-%d').date()
        if event_date <= timezone.now().date():
            return Response({'error': 'Event date must be in the future'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Prevent a firm from booking itself: if the case is assigned and the
        # initiator belongs to the same firm as the assigned lawyer, reject.
        case_id = request.data.get('case_id')
        try:
            assigned_lawyer_id = None
            if case_id:
                case_url = f"{getattr(settings, 'CASE_SERVICE_URL', 'http://case-service:8004')}/api/v1/cases/{case_id}/"
                req = Request(case_url, headers={'X-Internal-Api-Key': config('INTERNAL_API_KEY', default='dev-internal-key')})
                with urlopen(req, timeout=5) as resp:
                    payload = resp.read().decode('utf-8')
                    data = json.loads(payload) if payload else {}
                    assigned_lawyer_id = data.get('assigned_lawyer_id')
        except Exception:
            assigned_lawyer_id = None

        def fetch_firm_ids(user_id, auth_header=None, internal=False):
            base = getattr(settings, 'LAWYER_SERVICE_URL', 'http://lawyer-service:8003/api/v1/firms').rstrip('/')
            headers = {}
            if internal:
                headers['X-Internal-Api-Key'] = config('INTERNAL_API_KEY', default='dev-internal-key')
            elif auth_header:
                headers['Authorization'] = auth_header
            url = f"{base}/internal/users/{user_id}/memberships/" if internal else f"{base}/me/"
            try:
                logger.warning("Fetching memberships from %s with headers %s", url, headers)
                req = Request(url, headers=headers)
                with urlopen(req, timeout=5) as r:
                    payload = r.read().decode('utf-8')
                    logger.warning("Received payload: %s", payload[:100])
                    memberships = json.loads(payload) if payload else []
            except (HTTPError, URLError, ValueError) as e:
                logger.warning("Membership lookup failed for %s: %s", url, e)
                return set()
            ids = set()
            for m in memberships or []:
                firm_id = m.get('firm')
                if firm_id and m.get('is_active', True):
                    ids.add(str(firm_id))
            return ids

        initiator_id = str(request.user.id) if getattr(request, 'user', None) else None
        if assigned_lawyer_id and initiator_id:
            # Use internal lookup for both users to reliably resolve firm memberships
            initiator_firms = fetch_firm_ids(initiator_id, internal=True)
            assigned_firms = fetch_firm_ids(assigned_lawyer_id, internal=True)
            logger.warning("Initiator firms: %s", initiator_firms)
            logger.warning("Assigned lawyer firms: %s", assigned_firms)
            if initiator_firms and assigned_firms and initiator_firms.intersection(assigned_firms):
                return Response({'error': 'Cannot book a firm you belong to'}, status=status.HTTP_400_BAD_REQUEST)

        event = serializer.save()

        # Notify the assigned lawyer about the new booking
        if assigned_lawyer_id:
            self._push_notification(
                recipient_id=str(assigned_lawyer_id),
                notification_type='booking_received',
                title='New booking request',
                body=f'You have a new booking request for case #{str(event.case_id)[:8]}. Please review and approve or reject.',
                case_id=str(event.case_id) if event.case_id else '',
                send_email=True,
            )

        EventApproval.objects.create(event=event, approver_id=event.initiator_id, status='pending')
        
        event_datetime = timezone.make_aware(
            datetime.combine(event.date, event.time)
        )
        Alarm.objects.create(
            event=event,
            alarm_type='48hr',
            scheduled_for=event_datetime - timedelta(hours=48)
        )
        Alarm.objects.create(
            event=event,
            alarm_type='1hr',
            scheduled_for=event_datetime - timedelta(hours=1)
        )
        
        return Response(CalendarEventSerializer(event).data, 
                       status=status.HTTP_201_CREATED)
    
    def _push_notification(self, recipient_id, notification_type, title, body, case_id='', send_email=False):
        """Fire-and-forget notification to monitoring-service internal endpoint."""
        monitoring_url = config('MONITORING_SERVICE_URL', default='http://monitoring-service:8009').rstrip('/')
        try:
            payload = json.dumps({
                'recipient_id': recipient_id,
                'notification_type': notification_type,
                'title': title,
                'body': body,
                'case_id': case_id,
                'send_email': send_email,
            }).encode()
            req = Request(
                f'{monitoring_url}/api/v1/monitoring/notifications/internal/',
                data=payload,
                headers={
                    'Content-Type': 'application/json',
                    'X-Internal-Key': config('INTERNAL_API_KEY', default='dev-internal-key'),
                },
                method='POST',
            )
            with urlopen(req, timeout=5):
                pass
        except Exception as exc:
            logger.warning('Failed to push notification to monitoring-service: %s', exc)

    def _approver_uuid(self, request):
        payload = getattr(request, 'auth_payload', {})
        uid = payload.get('user_id') or payload.get('sub')
        if uid:
            return uuid.UUID(str(uid))
        raise ValueError('Cannot determine approver UUID from token')

    @action(detail=True, methods=['patch'])
    def approve(self, request, pk=None):
        event = self.get_object()
        try:
            approver_id = self._approver_uuid(request)
        except (ValueError, AttributeError):
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            approval = EventApproval.objects.get(event=event, approver_id=approver_id)
        except EventApproval.DoesNotExist:
            return Response({'error': 'No approval required from this user'},
                          status=status.HTTP_400_BAD_REQUEST)

        approval.status = 'approved'
        approval.save()

        if event.approvals.filter(status='approved').count() == event.approvals.count():
            event.status = 'confirmed'
            event.save()

        # Notify the client/initiator that the booking was confirmed
        self._push_notification(
            recipient_id=str(event.initiator_id),
            notification_type='booking_received',
            title='Booking confirmed',
            body=f'Your booking request has been approved. The event is now confirmed.',
            case_id=str(event.case_id) if event.case_id else '',
            send_email=True,
        )

        return Response(CalendarEventSerializer(event).data)

    @action(detail=True, methods=['patch'])
    def reject(self, request, pk=None):
        event = self.get_object()
        try:
            approver_id = self._approver_uuid(request)
        except (ValueError, AttributeError):
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        approver_id = approver_id  # keep variable name consistent below

        try:
            approval = EventApproval.objects.get(event=event, approver_id=approver_id)
        except EventApproval.DoesNotExist:
            return Response({'error': 'No approval to reject'},
                          status=status.HTTP_400_BAD_REQUEST)

        approval.status = 'rejected'
        approval.save()
        event.status = 'rejected'
        event.save()

        # Notify the client/initiator that the booking was rejected
        self._push_notification(
            recipient_id=str(event.initiator_id),
            notification_type='booking_received',
            title='Booking not approved',
            body=f'Your booking request was not approved at this time. You may submit a new request.',
            case_id=str(event.case_id) if event.case_id else '',
            send_email=True,
        )

        return Response(CalendarEventSerializer(event).data)
