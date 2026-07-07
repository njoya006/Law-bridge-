from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg, Count
from .models import Review


def _refresh_rating(lawyer_profile):
    agg = Review.objects.filter(lawyer=lawyer_profile).aggregate(
        avg=Avg('rating'), cnt=Count('id')
    )
    lawyer_profile.average_rating = agg['avg'] or 0
    lawyer_profile.rating_count = agg['cnt'] or 0
    lawyer_profile.save(update_fields=['average_rating', 'rating_count'])


@receiver(post_save, sender=Review)
def on_review_save(sender, instance, **kwargs):
    _refresh_rating(instance.lawyer)


@receiver(post_delete, sender=Review)
def on_review_delete(sender, instance, **kwargs):
    _refresh_rating(instance.lawyer)
