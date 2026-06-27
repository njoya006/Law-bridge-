import uuid
from django.db import models


class ClientProfile(models.Model):
    """
    Client profile linked to user from auth-service.
    Stores bilingual fields and legal aid eligibility info.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(unique=True)  # Cross-ref to auth_db
    
    # Bilingual fields
    full_name_en = models.CharField(max_length=255, blank=True)
    full_name_fr = models.CharField(max_length=255, blank=True)

    # Contact & identity
    phone = models.CharField(max_length=50, blank=True)
    organization = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)

    # Legal aid eligibility inputs
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    dependants = models.PositiveIntegerField(default=0)
    employment_status = models.CharField(
        max_length=32,
        choices=[
            ('employed', 'Employed'),
            ('unemployed', 'Unemployed'),
            ('self_employed', 'Self-Employed'),
            ('student', 'Student'),
            ('other', 'Other'),
        ],
        default='other'
    )
    
    # Eligibility scoring (0-100, cached in Redis)
    eligibility_score = models.PositiveIntegerField(null=True, blank=True)
    eligibility_computed_at = models.DateTimeField(null=True, blank=True)
    
    # Case tracking
    case_count = models.PositiveIntegerField(default=0)
    total_legal_aid_used = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user_id']),
            models.Index(fields=['eligibility_score']),
        ]

    def __str__(self):
        return f"ClientProfile({self.user_id})"

    def qualifies_for_aid(self):
        """Returns True if eligibility_score > 70"""
        if self.eligibility_score is None:
            return False
        return self.eligibility_score > 70
