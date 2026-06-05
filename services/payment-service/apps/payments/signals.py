from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Payment


@receiver(post_save, sender=Payment)
def publish_payment_event(sender, instance, created, **kwargs):
    """Publish payment events to Redis"""
    if created:
        import redis
        from decouple import config
        from django.utils import timezone
        
        try:
            redis_url = config('REDIS_URL', default='redis://localhost:6379/0')
            r = redis.from_url(redis_url)
            
            event = {
                'payment_id': str(instance.id),
                'case_id': str(instance.case_id),
                'amount': str(instance.amount),
                'status': instance.status,
                'timestamp': timezone.now().isoformat(),
            }
            
            r.publish('payment.initiated', str(event))
        except Exception as e:
            print(f"Failed to publish payment event: {e}")
