import uuid
from django.db import models


class Deadline(models.Model):
    """
    Track important deadlines for cases.
    Celery Beat job runs hourly to check for missed deadlines.
    """
    DEADLINE_TYPES = [
        ('hearing', 'Court Hearing'),
        ('filing', 'Document Filing'),
        ('response', 'Defendant Response'),
        ('evidence', 'Evidence Submission'),
        ('appeal', 'Appeal Deadline'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approaching', 'Approaching (< 48hr)'),
        ('missed', 'Missed'),
        ('completed', 'Completed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    case_id = models.UUIDField(db_index=True)
    deadline_type = models.CharField(max_length=32, choices=DEADLINE_TYPES)
    due_date = models.DateTimeField()
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    
    description = models.TextField(blank=True)
    assigned_to = models.UUIDField(null=True, blank=True)  # Lawyer or admin responsible
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    notified_at = models.DateTimeField(null=True, blank=True)
    escalated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['case_id', 'status']),
            models.Index(fields=['due_date']),
            models.Index(fields=['status']),
        ]
        ordering = ['due_date']

    def __str__(self):
        return f"{self.deadline_type} - {self.case_id}"

    def check_and_escalate(self):
        """Check if deadline is missed and escalate if needed"""
        from django.utils import timezone
        import redis
        from decouple import config
        
        now = timezone.now()
        
        if self.due_date < now and self.status != 'completed':
            # Deadline missed
            self.status = 'missed'
            self.escalated_at = now
            self.save()
            
            # Publish escalation event to Redis
            try:
                redis_url = config('REDIS_URL', default='redis://localhost:6379/0')
                r = redis.from_url(redis_url)
                event = {
                    'deadline_id': str(self.id),
                    'case_id': str(self.case_id),
                    'type': 'missed',
                    'timestamp': now.isoformat(),
                }
                r.publish('deadline.missed', str(event))
            except Exception as e:
                print(f"Failed to publish deadline event: {e}")
            
            return True
        
        return False
