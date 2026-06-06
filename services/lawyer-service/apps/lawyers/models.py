import uuid
from django.db import models


class LawyerProfile(models.Model):
    """Lawyer profile linked to user from auth-service."""
    
    BIJURAL_CHOICES = [
        ('common_law', 'Common Law (Anglophone)'),
        ('civil_law', 'Civil Law (Francophone)'),
        ('both', 'Both Traditions'),
    ]
    
    AVAILABILITY_CHOICES = [
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('on_leave', 'On Leave'),
        ('inactive', 'Inactive'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField(unique=True)  # Cross-ref to auth_db
    full_name = models.CharField(max_length=255, blank=True, default='')

    # Profile info
    specialization = models.CharField(max_length=255, db_index=True)
    qualifications = models.TextField(blank=True)
    bio = models.TextField(blank=True)
    
    # Legal credentials
    bar_number = models.CharField(max_length=100, unique=True)
    years_of_experience = models.PositiveIntegerField()
    bijural_flag = models.CharField(max_length=32, choices=BIJURAL_CHOICES)
    
    # Pricing
    consultation_fee = models.DecimalField(max_digits=12, decimal_places=2)  # XAF
    
    # Status
    availability_status = models.CharField(
        max_length=32,
        choices=AVAILABILITY_CHOICES,
        default='available'
    )
    
    # Case tracking
    active_cases = models.PositiveIntegerField(default=0)
    total_cases = models.PositiveIntegerField(default=0)
    
    # Ratings
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, help_text="0-5")
    rating_count = models.PositiveIntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['specialization']),
            models.Index(fields=['bijural_flag']),
            models.Index(fields=['availability_status']),
            models.Index(fields=['average_rating']),
        ]

    def __str__(self):
        return f"Lawyer({self.user_id}) - {self.specialization}"


class LawyerAvailability(models.Model):
    """Weekly schedule for lawyers."""
    
    DAYS = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lawyer = models.ForeignKey(LawyerProfile, on_delete=models.CASCADE, related_name='availability_slots')
    
    day_of_week = models.PositiveIntegerField(choices=DAYS)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        unique_together = ('lawyer', 'day_of_week', 'start_time', 'end_time')
        indexes = [
            models.Index(fields=['lawyer', 'day_of_week']),
        ]

    def __str__(self):
        return f"{self.lawyer.user_id} - {self.get_day_of_week_display()}"


