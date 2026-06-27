import json
import logging
import redis
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Subscribe to Redis case.updated pub/sub and write CaseProgressSnapshot records'

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
                obj, created = CaseProgressSnapshot.objects.update_or_create(
                    case_id=case_id,
                    defaults={
                        'client_id': data.get('client_id', ''),
                        'assigned_lawyer_id': data.get('assigned_lawyer_id'),
                        'case_type': data.get('case_type', ''),
                        'status': data.get('status', ''),
                        'created_at': ts,
                        'updated_at': ts,
                    },
                )
                action = 'Created' if created else 'Updated'
                logger.info('%s snapshot for case %s status=%s', action, case_id, data.get('status'))
                self.stdout.write(f'{action} snapshot: case={case_id[:8]} status={data.get("status")}')

            except Exception as exc:
                logger.exception('Error processing case.updated message: %s', exc)
