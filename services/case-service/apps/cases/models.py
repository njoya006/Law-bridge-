import uuid
from django.db import models
from django.contrib.postgres.fields import JSONField as DjangoJSONField


class Case(models.Model):
    """
    Legal case filed by a client.
    Tracks status, assignments, and timeline.
    """
    STATUS_CHOICES = [
        # Initial
        ('draft',               'Draft'),
        ('filed',               'Filed'),
        # Lawyer intake
        ('assigned',            'Assigned to Lawyer'),
        ('under_review',        'Under Review'),
        ('evidence_collection', 'Evidence Collection'),
        ('awaiting_court_date', 'Awaiting Court Date'),
        # Active proceedings
        ('in_progress',         'In Progress'),
        ('hearing_scheduled',   'Hearing Scheduled'),
        ('hearing_adjourned',   'Hearing Adjourned'),
        ('mediation',           'Mediation'),
        # Resolution
        ('verdict',             'Verdict Rendered'),
        ('settled',             'Settled Out of Court'),
        ('appeal_filed',        'Appeal Filed'),
        ('appeal_in_progress',  'Appeal in Progress'),
        # Terminal
        ('closed',              'Closed'),
        ('dismissed',           'Dismissed'),
        ('archived',            'Archived'),
    ]

    TERMINAL_STATUSES = {'closed', 'dismissed', 'archived', 'settled'}
    
    LEGAL_TRADITION = [
        ('common_law', 'Common Law'),
        ('civil_law', 'Civil Law'),
    ]
    
    CIRCUIT = [
        ('anglophone', 'Anglophone'),
        ('francophone', 'Francophone'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Client info
    client_id = models.UUIDField()  # Cross-ref to auth_db
    
    # Case details
    title = models.CharField(max_length=255)
    description = models.TextField()
    case_type = models.CharField(max_length=100)  # e.g., "civil", "criminal"
    
    # Legal jurisdiction
    legal_tradition = models.CharField(max_length=32, choices=LEGAL_TRADITION)
    circuit = models.CharField(max_length=32, choices=CIRCUIT)
    language = models.CharField(max_length=2, choices=[('en', 'English'), ('fr', 'French')], default='en')
    
    # Case status
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='draft')
    assigned_lawyer_id = models.UUIDField(null=True, blank=True)
    
    # Timeline (JSON array of status changes)
    timeline = models.JSONField(default=list, help_text="Array of {timestamp, status, notes}")

    # Booking fields (populated when case originates from a booking request)
    BOOKING_STATUS = [
        ('pending', 'Pending Acceptance'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    booking_status = models.CharField(max_length=20, choices=BOOKING_STATUS, blank=True, default='')
    booking_metadata = models.JSONField(default=dict, blank=True,
        help_text="Stores consultation_type, booking_fee, payment_reference, payment_status, target info")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    filed_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['client_id']),
            models.Index(fields=['status']),
            models.Index(fields=['assigned_lawyer_id']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Case({self.case_type}) - {self.title[:50]}"

    def add_timeline_entry(self, status, notes='', updated_by=None):
        """Add a status-change entry to the timeline and save."""
        from django.utils import timezone
        self.timeline.append({
            'timestamp': timezone.now().isoformat(),
            'status': status,
            'notes': notes,
            'updated_by': str(updated_by) if updated_by else None,
        })
        self.status = status
        if status == 'filed' and not self.filed_at:
            self.filed_at = timezone.now()
        elif status in self.TERMINAL_STATUSES and not self.closed_at:
            self.closed_at = timezone.now()
        self.save()


class CaseNote(models.Model):
    """Lawyer notes on a case (case review, findings, etc.)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='notes')
    
    lawyer_id = models.UUIDField()  # Cross-ref to lawyer who wrote the note
    content = models.TextField()
    is_private = models.BooleanField(default=False)  # Only visible to lawyers
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note on {self.case.id}"


class CaseApplication(models.Model):
    """A lawyer or firm applying to take on a declined/open case."""
    STATUS_CHOICES = [
        ('pending',  'Pending Review'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='applications')
    lawyer_id = models.UUIDField(help_text='UUID of the lawyer applying')
    firm_id = models.UUIDField(null=True, blank=True, help_text='Optional: firm the lawyer belongs to')
    message = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('case', 'lawyer_id')

    def __str__(self):
        return f"Application by {self.lawyer_id} for case {self.case_id}"
