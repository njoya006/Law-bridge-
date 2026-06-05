import uuid
from django.db import models
from django.contrib.postgres.fields import JSONField as DjangoJSONField


class Case(models.Model):
    """
    Legal case filed by a client.
    Tracks status, assignments, and timeline.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('filed', 'Filed'),
        ('assigned', 'Assigned to Lawyer'),
        ('in_progress', 'In Progress'),
        ('hearing_scheduled', 'Hearing Scheduled'),
        ('verdict', 'Verdict Rendered'),
        ('closed', 'Closed'),
        ('dismissed', 'Dismissed'),
    ]
    
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

    def add_timeline_entry(self, status, notes=''):
        """Add an entry to case timeline when status changes"""
        from django.utils import timezone
        self.timeline.append({
            'timestamp': timezone.now().isoformat(),
            'status': status,
            'notes': notes
        })
        self.status = status
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
