import uuid
from django.db import models


class AuditLog(models.Model):
    """
    Immutable audit log for document operations.
    Records all access, downloads, uploads, shares with timestamp and user info.
    THIS IS WRITE-ONCE: Do not update or delete audit records.
    """
    ACTION_CHOICES = [
        ('view', 'View'),
        ('download', 'Download'),
        ('upload', 'Upload'),
        ('share', 'Share'),
        ('delete', 'Delete'),
        ('archive', 'Archive'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    document_id = models.UUIDField(db_index=True)
    user_id = models.UUIDField()
    action = models.CharField(max_length=32, choices=ACTION_CHOICES)
    
    # Context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Additional context
    details = models.JSONField(default=dict)

    class Meta:
        indexes = [
            models.Index(fields=['document_id', 'timestamp']),
            models.Index(fields=['user_id', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
        ]
        ordering = ['-timestamp']
        # Prevent updates and deletes at model level
        permissions = [
            ('cannot_update_audit', 'Cannot update audit logs'),
            ('cannot_delete_audit', 'Cannot delete audit logs'),
        ]

    def __str__(self):
        return f"{self.action}({self.document_id}) by {self.user_id} @ {self.timestamp}"
    
    def save(self, *args, **kwargs):
        """Prevent updates to existing audit records"""
        if self.pk is not None:
            raise ValueError("Audit logs are immutable. Cannot update existing records.")
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Prevent deletion of audit records"""
        raise ValueError("Audit logs are immutable. Cannot delete records.")
