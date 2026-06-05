from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Document


@receiver(post_save, sender=Document)
def publish_document_event(sender, instance, created, **kwargs):
    """Publish document events to Redis"""
    if created:
        import redis
        from decouple import config
        from django.utils import timezone
        
        try:
            redis_url = config('REDIS_URL', default='redis://localhost:6379/0')
            r = redis.from_url(redis_url)
            
            event = {
                'document_id': str(instance.id),
                'case_id': str(instance.case_id),
                'status': instance.status,
                'timestamp': timezone.now().isoformat(),
            }
            
            r.publish('document.uploaded', str(event))
        except Exception as e:
            print(f"Failed to publish document event: {e}")
