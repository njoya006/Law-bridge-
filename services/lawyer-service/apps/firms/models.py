from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
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
    description = models.TextField(blank=True, default='')
    website = models.URLField(blank=True, default='')
    office_address = models.CharField(max_length=500, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='Cameroon')
    phone = models.CharField(max_length=32, blank=True, default='')
    contact_email = models.EmailField(blank=True, default='')
    year_established = models.PositiveIntegerField(null=True, blank=True)
    specializations = models.JSONField(default=list, blank=True,
        help_text='List of practice areas this firm covers')
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class FirmPartnershipPolicy(models.Model):
    firm = models.OneToOneField(Firm, on_delete=models.CASCADE, related_name='partnership_policy')
    is_open = models.BooleanField(default=False,
        help_text='Whether this firm is currently accepting partnership requests')
    min_years_experience = models.PositiveIntegerField(default=0,
        help_text='Minimum years of experience required from partner firm lawyers')
    requires_specialization_overlap = models.BooleanField(default=False,
        help_text='Partner firm must practice in at least one of the same areas')
    revenue_share_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=50,
        help_text='This firm\'s share of revenue on jointly handled cases (0–100)')
    process_description = models.TextField(blank=True, default='',
        help_text='Step-by-step description of the partnership onboarding process')
    additional_requirements = models.TextField(blank=True, default='',
        help_text='Any other requirements or expectations for partners')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Partnership policy for {self.firm.name}"


class PartnershipRequest(models.Model):
    STATUS_CHOICES = [
        ('pending',      'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved',     'Approved'),
        ('rejected',     'Rejected'),
    ]

    requesting_firm = models.ForeignKey(Firm, on_delete=models.CASCADE,
        related_name='sent_partnership_requests')
    target_firm = models.ForeignKey(Firm, on_delete=models.CASCADE,
        related_name='received_partnership_requests')
    requested_by_id = models.CharField(max_length=64, help_text='UUID of the user who submitted the request')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, default='')
    response_note = models.TextField(blank=True, default='')
    responded_by_id = models.CharField(max_length=64, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('requesting_firm', 'target_firm')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.requesting_firm} → {self.target_firm} ({self.status})"


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


class FirmVerificationRequest(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
    ]
    FIRM_TYPE_CHOICES = [
        ('sole_practice', 'Sole Practice'),
        ('partnership', 'Partnership'),
        ('incorporated', 'Incorporated Law Firm'),
        ('government', 'Government / Public Sector'),
        ('ngo', 'NGO / Non-profit'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.OneToOneField(Firm, on_delete=models.CASCADE, related_name='verification_request')
    registration_number = models.CharField(max_length=100)
    firm_type = models.CharField(max_length=50, choices=FIRM_TYPE_CHOICES)
    founding_year = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1900), MaxValueValidator(2100)],
    )
    number_of_partners = models.PositiveSmallIntegerField(default=1)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    submitted_by_id = models.UUIDField()
    reviewed_by_id = models.UUIDField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'FirmVerificationRequest({self.firm_id}, {self.status})'
