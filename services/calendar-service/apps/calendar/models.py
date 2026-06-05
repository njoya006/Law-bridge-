from django.db import models
import uuid
from django.utils import timezone

class CalendarEvent(models.Model):
    EVENT_TYPES = [
        ('hearing', 'Hearing'),
        ('meeting', 'Meeting'),
        ('verdict', 'Verdict'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('reschedule_proposed', 'Reschedule Proposed'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_id = models.UUIDField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=255)
    virtual_link = models.URLField(null=True, blank=True)
    initiator_id = models.UUIDField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['date', 'time']
        indexes = [
            models.Index(fields=['case_id', 'status']),
            models.Index(fields=['date', 'time']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.date} {self.time}"

class EventApproval(models.Model):
    APPROVAL_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(CalendarEvent, on_delete=models.CASCADE, related_name='approvals')
    approver_id = models.UUIDField()
    status = models.CharField(max_length=20, choices=APPROVAL_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('event', 'approver_id')

class Alarm(models.Model):
    ALARM_TYPES = [
        ('48hr', '48 Hours'),
        ('1hr', '1 Hour'),
    ]
    
    ALARM_STATUS = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(CalendarEvent, on_delete=models.CASCADE, related_name='alarms')
    alarm_type = models.CharField(max_length=10, choices=ALARM_TYPES)
    status = models.CharField(max_length=10, choices=ALARM_STATUS, default='pending')
    scheduled_for = models.DateTimeField()
    sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['scheduled_for']
