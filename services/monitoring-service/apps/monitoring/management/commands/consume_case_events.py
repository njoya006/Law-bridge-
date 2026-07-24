import json
import logging
import urllib.request as _ureq
import redis
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from decouple import config

logger = logging.getLogger(__name__)


def _get_user_email(user_id: str) -> str:
    auth_url = config('AUTH_SERVICE_URL', default='http://auth-service:8001').rstrip('/')
    try:
        req = _ureq.Request(
            f'{auth_url}/api/v1/auth/users/{user_id}/',
            headers={'X-Internal-Key': config('INTERNAL_API_KEY', default='dev-internal-key')},
        )
        with _ureq.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read())
            return data.get('email', '')
    except Exception:
        return ''


def _send_notification_email(user_id: str, subject: str, body: str):
    api_key = config('SENDGRID_API_KEY', default='')
    if not api_key:
        return
    email = _get_user_email(user_id)
    if not email:
        return
    from_email = config('SENDGRID_FROM_EMAIL', default='noreply@lawbridge.cm')
    try:
        payload = json.dumps({
            'personalizations': [{'to': [{'email': email}]}],
            'from': {'email': from_email, 'name': 'LawBridge'},
            'subject': subject,
            'content': [{'type': 'text/plain', 'value': body + '\n\n— The LawBridge Team\nhttps://law-bridge-two.vercel.app'}],
        }).encode()
        req = _ureq.Request(
            'https://api.sendgrid.com/v3/mail/send',
            data=payload,
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            method='POST',
        )
        with _ureq.urlopen(req, timeout=10) as resp:
            logger.info('Email sent to %s (user %s): HTTP %s', email, user_id, resp.status)
    except Exception as exc:
        logger.error('Email send failed for user %s: %s', user_id, exc)

ACTIVE_STATUSES = {
    'draft', 'filed', 'assigned', 'under_review', 'evidence_collection',
    'awaiting_court_date', 'in_progress', 'hearing_scheduled',
    'hearing_adjourned', 'mediation', 'appeal_filed', 'appeal_in_progress',
}
TERMINAL_STATUSES = {'closed', 'dismissed', 'archived', 'settled', 'verdict'}


def _refresh_lawyer_stats(lawyer_id):
    """Recalculate and persist LawyerStats for a lawyer from current snapshots."""
    from apps.monitoring.models import CaseProgressSnapshot, LawyerStats
    from django.utils import timezone as tz

    qs = CaseProgressSnapshot.objects.filter(assigned_lawyer_id=str(lawyer_id))
    active = qs.filter(status__in=list(ACTIVE_STATUSES)).count()
    closed = qs.filter(status__in=list(TERMINAL_STATUSES)).count()

    now = tz.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month = qs.filter(updated_at__gte=month_start).count()

    stats, _ = LawyerStats.objects.update_or_create(
        lawyer_id=str(lawyer_id),
        defaults={
            'active_cases': active,
            'closed_cases_count': closed,
            'cases_this_month': this_month,
        },
    )
    return stats


def _push_to_websocket(case_id, snapshot):
    """Push a case_update event to all WebSocket clients watching this case."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        group_name = f'case_{case_id}'
        payload = {
            'type': 'case_update',
            'data': {
                'case_id': str(snapshot.case_id),
                'title': snapshot.title,
                'status': snapshot.status,
                'assigned_lawyer_id': snapshot.assigned_lawyer_id,
                'updated_at': snapshot.updated_at.isoformat(),
                'timeline_entries': snapshot.timeline_entries[-5:],
            },
        }
        async_to_sync(channel_layer.group_send)(group_name, payload)
    except Exception as exc:
        logger.warning('WebSocket push failed for case %s: %s', case_id, exc)


STATUS_LABELS = {
    'filed': 'Filed', 'assigned': 'Assigned to Lawyer', 'under_review': 'Under Review',
    'evidence_collection': 'Collecting Evidence', 'awaiting_court_date': 'Awaiting Court Date',
    'in_progress': 'In Progress', 'hearing_scheduled': 'Hearing Scheduled',
    'hearing_adjourned': 'Hearing Adjourned', 'mediation': 'In Mediation',
    'appeal_filed': 'Appeal Filed', 'appeal_in_progress': 'Appeal In Progress',
    'closed': 'Closed', 'dismissed': 'Dismissed', 'settled': 'Settled',
    'verdict': 'Verdict Reached', 'archived': 'Archived', 'rejected': 'Rejected',
}


def _create_case_notifications(data, snapshot, created):
    """Create Notification records for relevant case events."""
    try:
        from apps.monitoring.models import Notification
        import uuid as uuid_mod

        client_id_raw = data.get('client_id', '')
        lawyer_id_raw = data.get('assigned_lawyer_id', '')
        case_id = str(data.get('case_id', ''))
        status = data.get('status', '')
        title = data.get('title', 'your case')

        def parse_uuid(val):
            try:
                return uuid_mod.UUID(str(val)) if val else None
            except (ValueError, AttributeError):
                return None

        client_uuid = parse_uuid(client_id_raw)
        lawyer_uuid = parse_uuid(lawyer_id_raw)

        notifs = []

        if created and client_uuid:
            notifs.append(Notification(
                recipient_id=client_uuid,
                notification_type='case_created',
                title='Case submitted successfully',
                body=f'Your case "{title}" has been submitted and is awaiting assignment.',
                case_id=case_id,
            ))

        elif not created:
            status_label = STATUS_LABELS.get(status, status.replace('_', ' ').title())

            if status == 'assigned':
                if client_uuid:
                    notifs.append(Notification(
                        recipient_id=client_uuid,
                        notification_type='case_assigned',
                        title='Lawyer assigned to your case',
                        body=f'A lawyer has been assigned to your case "{title}".',
                        case_id=case_id,
                    ))
                # The lawyer needs to know a new matter has landed on their desk.
                if lawyer_uuid:
                    notifs.append(Notification(
                        recipient_id=lawyer_uuid,
                        notification_type='case_assigned',
                        title='New case assigned to you',
                        body=f'You have been assigned to "{title}". Review the matter and open the case file.',
                        case_id=case_id,
                    ))

            elif status in TERMINAL_STATUSES:
                if client_uuid:
                    notifs.append(Notification(
                        recipient_id=client_uuid,
                        notification_type='case_closed',
                        title=f'Case {status_label.lower()}',
                        body=f'Your case "{title}" has been {status_label.lower()}.',
                        case_id=case_id,
                    ))
                if lawyer_uuid:
                    notifs.append(Notification(
                        recipient_id=lawyer_uuid,
                        notification_type='case_closed',
                        title=f'Case {status_label.lower()}',
                        body=f'Case "{title}" has been {status_label.lower()}.',
                        case_id=case_id,
                    ))

            elif status == 'rejected' and client_uuid:
                notifs.append(Notification(
                    recipient_id=client_uuid,
                    notification_type='case_rejected',
                    title='Case could not be processed',
                    body=f'Unfortunately, your case "{title}" was not accepted.',
                    case_id=case_id,
                ))

            elif status not in ('draft',):
                # General status update — notify BOTH the client and the lawyer
                # handling the matter, so lawyers get a live feed of their cases.
                if client_uuid:
                    notifs.append(Notification(
                        recipient_id=client_uuid,
                        notification_type='case_updated',
                        title=f'Case update: {status_label}',
                        body=f'Your case "{title}" has a new status: {status_label}.',
                        case_id=case_id,
                    ))
                if lawyer_uuid:
                    notifs.append(Notification(
                        recipient_id=lawyer_uuid,
                        notification_type='case_updated',
                        title=f'Case update: {status_label}',
                        body=f'Matter "{title}" moved to: {status_label}.',
                        case_id=case_id,
                    ))

        if notifs:
            Notification.objects.bulk_create(notifs, ignore_conflicts=True)
            for n in notifs:
                _send_notification_email(str(n.recipient_id), n.title, n.body)

    except Exception as exc:
        logger.warning('Failed to create case notifications: %s', exc)


class Command(BaseCommand):
    help = 'Subscribe to Redis case.updated pub/sub, write CaseProgressSnapshot, update LawyerStats, push to WebSocket'

    def handle(self, *args, **options):
        from apps.monitoring.models import CaseProgressSnapshot

        redis_url = getattr(settings, 'REDIS_URL', 'redis://redis:6379/0')
        r = redis.from_url(redis_url)
        pubsub = r.pubsub()
        pubsub.subscribe('case.updated')

        self.stdout.write(f'Subscribed to case.updated on {redis_url}')

        for message in pubsub.listen():
            if message['type'] != 'message':
                continue
            try:
                data = json.loads(message['data'])
                case_id = data.get('case_id')
                if not case_id:
                    continue

                ts = parse_datetime(data.get('timestamp', '')) or timezone.now()

                snapshot, created = CaseProgressSnapshot.objects.update_or_create(
                    case_id=case_id,
                    defaults={
                        'title': data.get('title', ''),
                        'client_id': data.get('client_id', ''),
                        'assigned_lawyer_id': data.get('assigned_lawyer_id'),
                        'case_type': data.get('case_type', ''),
                        'status': data.get('status', ''),
                        'timeline_entries': data.get('timeline', []),
                        'created_at': ts,
                        'updated_at': ts,
                    },
                )

                action = 'Created' if created else 'Updated'
                logger.info('%s snapshot for case %s status=%s', action, case_id, data.get('status'))
                self.stdout.write(f'{action}: case={case_id[:8]} status={data.get("status")}')

                # Update LawyerStats for the assigned lawyer
                lawyer_id = data.get('assigned_lawyer_id')
                if lawyer_id:
                    _refresh_lawyer_stats(lawyer_id)

                # Push live update to connected WebSocket clients
                _push_to_websocket(case_id, snapshot)

                # Create in-app notifications
                _create_case_notifications(data, snapshot, created)

            except Exception as exc:
                logger.exception('Error processing case.updated message: %s', exc)
