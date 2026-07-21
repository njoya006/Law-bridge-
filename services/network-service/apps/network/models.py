"""
Network Service - Models
"""
from django.db import models
from uuid import uuid4


class Follow(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    follower_id = models.UUIDField(db_index=True)
    following_id = models.UUIDField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower_id', 'following_id')

    def __str__(self):
        return f"{self.follower_id} -> {self.following_id}"


class Referral(models.Model):
    STATUS = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    referrer_id = models.UUIDField(db_index=True)
    referred_lawyer_id = models.UUIDField(db_index=True)
    client_name = models.CharField(max_length=255)
    client_email = models.EmailField(blank=True)
    case_type = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default='pending', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Referral({self.referrer_id} -> {self.referred_lawyer_id}) [{self.status}]"


class FeedItem(models.Model):
    TYPES = [
        ('article', 'Article'),
        ('referral_accepted', 'Referral Accepted'),
        ('follow', 'New Follow'),
        ('partnership', 'Partnership'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    actor_id = models.UUIDField(db_index=True)
    item_type = models.CharField(max_length=30, choices=TYPES, db_index=True)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    external_id = models.CharField(max_length=255, blank=True)
    external_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"FeedItem({self.item_type}) - {self.title[:50]}"
