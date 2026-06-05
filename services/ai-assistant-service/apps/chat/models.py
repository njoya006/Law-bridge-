import uuid
from django.db import models


class ChatSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=64, db_index=True)
    case_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    language = models.CharField(
        max_length=2,
        choices=[('en', 'English'), ('fr', 'French')],
        default='en'
    )
    title = models.CharField(max_length=255, blank=True)
    messages = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_sessions'
        ordering = ['-updated_at']
