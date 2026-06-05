from celery import shared_task
from django.utils import timezone
from .models import Payment


@shared_task(bind=True, max_retries=3)
def verify_payment(self, reference, provider, status):
    """
    Verify payment status from provider webhook.
    """
    try:
        # Find payment by reference
        if provider == 'mtn':
            payment = Payment.objects.get(mtn_reference=reference)
        elif provider == 'orange':
            payment = Payment.objects.get(orange_reference=reference)
        else:
            return {'error': 'Unknown provider'}
        
        if status == 'success':
            payment.status = 'confirmed'
            payment.confirmed_at = timezone.now()
            payment.save()
            
            # Publish payment.confirmed event
            import redis
            from decouple import config
            redis_url = config('REDIS_URL', default='redis://localhost:6379/0')
            r = redis.from_url(redis_url)
            r.publish('payment.confirmed', str({
                'payment_id': str(payment.id),
                'case_id': str(payment.case_id),
                'amount': str(payment.amount),
            }))
            
            return {'payment_id': str(payment.id), 'status': 'confirmed'}
        
        elif status == 'failed':
            payment.status = 'failed'
            payment.save()
            return {'payment_id': str(payment.id), 'status': 'failed'}
    
    except Payment.DoesNotExist:
        return {'error': 'Payment not found'}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
