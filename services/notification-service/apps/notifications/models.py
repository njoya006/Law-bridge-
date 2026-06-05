"""
Notification Service - Models
"""
from django.db import models
import uuid

class Notification(models.Model):
    EVENT_TYPES = [
        ('case_updated', 'Case Updated'),
        ('case_assigned', 'Case Assigned'),
        ('deadline_missed', 'Deadline Missed'),
        ('hearing_scheduled', 'Hearing Scheduled'),
        ('payment_confirmed', 'Payment Confirmed'),
        ('document_uploaded', 'Document Uploaded'),
        ('analysis_ready', 'Analysis Ready'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.UUIDField()
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    title_en = models.CharField(max_length=255)
    title_fr = models.CharField(max_length=255)
    message_en = models.TextField()
    message_fr = models.TextField()
    metadata = models.JSONField(default=dict)
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user_id', '-created_at']),
            models.Index(fields=['user_id', 'read']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.user_id}"


class NotificationTemplate(models.Model):
    event_type = models.CharField(max_length=50, unique=True)
    template_en = models.TextField()  # {var} syntax for placeholders
    template_fr = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.event_type} Template"
    
    def render_en(self, **context):
        """Render English template with context"""
        return self.template_en.format(**context)
    
    def render_fr(self, **context):
        """Render French template with context"""
        return self.template_fr.format(**context)
