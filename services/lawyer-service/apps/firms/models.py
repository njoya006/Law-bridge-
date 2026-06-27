from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()

ROLE_CHOICES = [
    ('owner', 'Owner'),
    ('firm_admin', 'Firm Admin'),
    ('partner', 'Partner'),
    ('associate', 'Associate'),
    ('guest', 'Guest'),
]


class Firm(models.Model):
    name = models.CharField(max_length=255)
    logo = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Invite(models.Model):
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    email = models.EmailField()
    firm = models.ForeignKey(Firm, related_name='invites', on_delete=models.CASCADE)
    role = models.CharField(max_length=32, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Invite {self.email} -> {self.firm}"


class FirmMembership(models.Model):
    ROLE_CHOICES = ROLE_CHOICES

    user = models.ForeignKey(User, related_name='firm_memberships', on_delete=models.CASCADE)
    firm = models.ForeignKey(Firm, related_name='members', on_delete=models.CASCADE)
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default='associate')
    invited_by = models.ForeignKey(User, null=True, blank=True, related_name='sent_invites', on_delete=models.SET_NULL)
    invited_email = models.EmailField(null=True, blank=True)
    invited_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    user_uuid = models.UUIDField(null=True, blank=True)  # auth-service UUID for avatar lookup

    class Meta:
        unique_together = ('user', 'firm')

    def __str__(self):
        return f"{self.user} @ {self.firm} ({self.role})"


class FirmActionLog(models.Model):
    ACTION_CHOICES = [
        ('invite_sent', 'Invite Sent'),
        ('invite_accepted', 'Invite Accepted'),
        ('member_removed', 'Member Removed'),
        ('role_changed', 'Role Changed'),
    ]

    firm = models.ForeignKey(Firm, on_delete=models.CASCADE, related_name='action_logs')
    performed_by_id = models.CharField(max_length=64)   # UUID from JWT
    performed_by_email = models.EmailField(blank=True)
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    target_email = models.EmailField(blank=True)
    old_role = models.CharField(max_length=32, blank=True)
    new_role = models.CharField(max_length=32, blank=True)
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} by {self.performed_by_email} in {self.firm}"
