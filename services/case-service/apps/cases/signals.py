import json
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Case

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Case)
def publish_case_update_event(sender, instance, created, **kwargs):
    import redis
    import urllib.request as urllib_req
    from decouple import config
    from django.utils import timezone

    event = {
        'case_id': str(instance.id),
        'title': instance.title,
        'client_id': str(instance.client_id),
        'case_type': instance.case_type,
        'status': instance.status,
        'timestamp': timezone.now().isoformat(),
        'assigned_lawyer_id': str(instance.assigned_lawyer_id) if instance.assigned_lawyer_id else None,
        'timeline': instance.timeline[-20:],
    }

    # Path 1: Redis pub/sub (async consumer in monitoring-service)
    try:
        redis_url = config('REDIS_URL', default='redis://localhost:6379/0')
        r = redis.from_url(redis_url)
        r.publish('case.updated', json.dumps(event))
    except Exception as e:
        logger.error("Failed to publish case update event to Redis: %s", e)

    # Path 2: Direct HTTP push to monitoring-service (immediate, no consumer lag)
    try:
        monitoring_url = config(
            'MONITORING_SERVICE_URL',
            default='http://monitoring-service/api/v1/monitoring/internal/sync/',
        )
        internal_key = config('INTERNAL_API_KEY', default='dev-internal-key')
        req = urllib_req.Request(
            monitoring_url,
            data=json.dumps(event).encode(),
            headers={'Content-Type': 'application/json', 'X-Internal-Key': internal_key},
            method='POST',
        )
        urllib_req.urlopen(req, timeout=3)
    except Exception as e:
        logger.error("Failed to direct-push to monitoring service: %s", e)
