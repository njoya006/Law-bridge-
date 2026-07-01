import json
import logging
import redis
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

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

            except Exception as exc:
                logger.exception('Error processing case.updated message: %s', exc)
