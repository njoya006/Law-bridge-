from django.db import models
import uuid

class CaseProgressSnapshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_id = models.CharField(max_length=64, unique=True)
    client_id = models.CharField(max_length=64)
    assigned_lawyer_id = models.CharField(max_length=64, null=True, blank=True)
    case_type = models.CharField(max_length=100)
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    
    class Meta:
        indexes = [
            models.Index(fields=['case_id']),
            models.Index(fields=['status']),
        ]

class LawyerStats(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lawyer_id = models.CharField(max_length=64, unique=True)
    active_cases = models.IntegerField(default=0)
    closed_cases_count = models.IntegerField(default=0)
    avg_resolution_days = models.FloatField(default=0.0)
    cases_this_month = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
