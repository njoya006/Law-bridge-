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

    class Meta:
        unique_together = ('user', 'firm')

    def __str__(self):
        return f"{self.user} @ {self.firm} ({self.role})"
