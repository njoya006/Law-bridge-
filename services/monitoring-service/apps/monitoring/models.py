from django.db import models
import uuid


REPORT_TYPES = [
    ('financial', 'Financial Summary'),
    ('case_summary', 'Case Summary'),
    ('activity', 'Activity Report'),
    ('clients', 'Clients Report'),
    ('lawyers', 'Lawyers Participation'),
    ('all', 'Full Firm Report'),
]

REPORT_PERIODS = [
    ('current_month', 'Current Month'),
    ('last_month', 'Last Month'),
    ('ytd', 'Year to Date'),
    ('all_time', 'All Time'),
]

REPORT_STATUSES = [
    ('pending', 'Pending'),
    ('acknowledged', 'Acknowledged'),
    ('generated', 'Generated'),
    ('delivered', 'Delivered'),
]


ACTIVE_STATUSES = {
    'draft', 'filed', 'assigned', 'under_review', 'evidence_collection',
    'awaiting_court_date', 'in_progress', 'hearing_scheduled',
    'hearing_adjourned', 'mediation', 'appeal_filed', 'appeal_in_progress',
}

TERMINAL_STATUSES = {'closed', 'dismissed', 'archived', 'settled', 'verdict'}


class CaseProgressSnapshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_id = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=255, blank=True, default='')
    client_id = models.CharField(max_length=64)
    assigned_lawyer_id = models.CharField(max_length=64, null=True, blank=True)
    case_type = models.CharField(max_length=100)
    status = models.CharField(max_length=50)
    # Last 20 timeline entries mirrored from case-service for display
    timeline_entries = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=['case_id']),
            models.Index(fields=['status']),
            models.Index(fields=['assigned_lawyer_id']),
        ]

    def __str__(self):
        return f"Snapshot({self.case_id[:8]}) status={self.status}"


class LawyerStats(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lawyer_id = models.CharField(max_length=64, unique=True)
    active_cases = models.IntegerField(default=0)
    closed_cases_count = models.IntegerField(default=0)
    avg_resolution_days = models.FloatField(default=0.0)
    cases_this_month = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Stats({self.lawyer_id[:8]}) active={self.active_cases}"


class ReportRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm_id = models.IntegerField()
    requester_id = models.CharField(max_length=64)
    requester_name = models.CharField(max_length=255, blank=True, default='')
    report_type = models.CharField(max_length=30, choices=REPORT_TYPES, default='all')
    period = models.CharField(max_length=20, choices=REPORT_PERIODS, default='current_month')
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=REPORT_STATUSES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['firm_id', 'status'])]

    def __str__(self):
        return f"ReportRequest(firm={self.firm_id}, type={self.report_type}, status={self.status})"
