import json
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Case


@receiver(post_save, sender=Case)
def publish_case_update_event(sender, instance, created, **kwargs):
    import redis
    from decouple import config
    from django.utils import timezone

    try:
        redis_url = config('REDIS_URL', default='redis://localhost:6379/0')
        r = redis.from_url(redis_url)

        event = {
            'case_id': str(instance.id),
            'client_id': str(instance.client_id),
            'case_type': instance.case_type,
            'status': instance.status,
            'timestamp': timezone.now().isoformat(),
            'assigned_lawyer_id': str(instance.assigned_lawyer_id) if instance.assigned_lawyer_id else None,
        }

        r.publish('case.updated', json.dumps(event))
    except Exception as e:
        print(f"Failed to publish case update event: {e}")
