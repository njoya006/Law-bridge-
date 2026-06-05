import uuid
from django.db import models


class DocumentAnalysis(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_id = models.UUIDField(db_index=True)
    case_id = models.UUIDField(null=True, blank=True)
    requested_by = models.CharField(max_length=64)
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.PENDING
    )
    summary = models.TextField(blank=True)
    key_points = models.JSONField(default=list)
    risks = models.JSONField(default=list)
    recommendations = models.JSONField(default=list)
    language_detected = models.CharField(max_length=2, default='en')
    raw_response = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'document_analyses'
        ordering = ['-created_at']
