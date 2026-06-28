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
    portal = models.CharField(max_length=16, default='lawyer', db_index=True)
    title = models.CharField(max_length=255, blank=True)
    messages = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chat_sessions'
        ordering = ['-updated_at']


class LegalDraft(models.Model):
    DRAFT_TYPES = [
        ('letter_to_client',    'Letter to Client'),
        ('letter_to_court',     'Letter to Court'),
        ('motion',              'Motion / Requête'),
        ('contract_clause',     'Contract Clause'),
        ('memorandum',          'Legal Memorandum'),
        ('demand_letter',       'Demand Letter'),
        ('affidavit',           'Affidavit'),
        ('settlement_proposal', 'Settlement Proposal'),
        ('appeal_brief',        'Appeal Brief'),
        ('other',               'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.CharField(max_length=64, db_index=True)
    case_id = models.CharField(max_length=64, null=True, blank=True)
    draft_type = models.CharField(max_length=32, choices=DRAFT_TYPES, default='other')
    title = models.CharField(max_length=255, blank=True)
    instructions = models.TextField(help_text='What the lawyer wants the draft to contain')
    content = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'legal_drafts'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.draft_type} by {self.user_id}"
