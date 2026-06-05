from celery import shared_task
from django.core.cache import cache
from decimal import Decimal
import redis
from decouple import config
from .models import ClientProfile


@shared_task(bind=True, max_retries=3)
def compute_eligibility_score(self, client_profile_id):
    """
    Compute legal aid eligibility score asynchronously.
    Triggered when a client profile is created or updated.
    
    Scoring algorithm:
    - Base: 50 points
    - Income adjustment: up to 30 points (lower income = higher score)
    - Employment: up to 15 points (unemployed = 15, self-employed = 8, employed = 3)
    - Dependants: up to 5 points (1 point per dependent, max 5)
    
    Total: 0-100
    Score > 70 = qualifies for free legal aid
    """
    try:
        profile = ClientProfile.objects.get(id=client_profile_id)
    except ClientProfile.DoesNotExist:
        self.retry(countdown=5)
        return
    
    score = 50  # Base score
    
    # Income adjustment (max 30 points)
    if profile.monthly_income:
        # Cameroon minimum wage is ~36,270 XAF/month
        # Higher income = lower score
        if profile.monthly_income <= Decimal('100000'):  # Very low income
            score += 30
        elif profile.monthly_income <= Decimal('250000'):
            score += 20
        elif profile.monthly_income <= Decimal('500000'):
            score += 10
        # else: score += 0
    else:
        score += 30  # Unknown income = high score (benefit of doubt)
    
    # Employment status (max 15 points)
    employment_scores = {
        'unemployed': 15,
        'student': 15,
        'self_employed': 8,
        'employed': 3,
        'other': 5,
    }
    score += employment_scores.get(profile.employment_status, 5)
    
    # Dependants (max 5 points, 1 point per dependent)
    score += min(profile.dependants, 5)
    
    # Cap at 100
    score = min(score, 100)
    
    # Save to database
    profile.eligibility_score = score
    from django.utils import timezone
    profile.eligibility_computed_at = timezone.now()
    profile.save(update_fields=['eligibility_score', 'eligibility_computed_at'])
    
    # Cache in Redis (TTL 1 hour = 3600 seconds)
    redis_url = config('REDIS_URL', default='redis://localhost:6379/0')
    r = redis.from_url(redis_url)
    cache_key = f'client:eligibility:{profile.user_id}'
    r.setex(cache_key, 3600, score)
    
    return {
        'client_id': str(profile.id),
        'user_id': str(profile.user_id),
        'score': score,
        'qualifies_for_aid': score > 70
    }


@shared_task
def recompute_eligibility_for_all():
    """
    Periodic task to recompute eligibility scores for all clients.
    Can be scheduled as a Celery Beat task.
    """
    profiles = ClientProfile.objects.all()
    for profile in profiles:
        compute_eligibility_score.delay(str(profile.id))
    return f"Recomputed eligibility for {profiles.count()} clients"
