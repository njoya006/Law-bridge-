from django.db import models


class Thread(models.Model):
    THREAD_TYPES = [
        ('client_lawyer', 'Client ↔ Lawyer'),
        ('client_firm', 'Client ↔ Firm'),
        ('client_support', 'Client ↔ Support'),
        ('firm_internal', 'Firm Internal'),
    ]
    thread_type = models.CharField(max_length=20, choices=THREAD_TYPES, db_index=True)
    case_id = models.CharField(max_length=50, blank=True, default='', db_index=True)
    case_ref = models.CharField(max_length=50, blank=True)
    case_title = models.CharField(max_length=200, blank=True)
    subject = models.CharField(max_length=200, blank=True)
    is_ai_support = models.BooleanField(default=False)
    escalated_to_human = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.get_thread_type_display()} — {self.case_ref or self.case_id}'


class ThreadParticipant(models.Model):
    ROLES = [
        ('client', 'Client'),
        ('lawyer', 'Lawyer'),
        ('firm_admin', 'Firm Admin'),
        ('support', 'Support'),
    ]
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='participants')
    user_id = models.CharField(max_length=36, db_index=True)
    display_name = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLES)
    firm_id = models.IntegerField(null=True, blank=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('thread', 'user_id')

    def __str__(self):
        return f'{self.display_name} ({self.role}) in thread {self.thread_id}'


class Message(models.Model):
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='messages')
    sender_id = models.CharField(max_length=36, db_index=True)
    sender_name = models.CharField(max_length=100)
    sender_role = models.CharField(max_length=20)
    content = models.TextField()
    is_ai = models.BooleanField(default=False)
    is_system = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Msg {self.id} by {self.sender_name}'


class MessageReaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user_id = models.CharField(max_length=36)
    display_name = models.CharField(max_length=100)
    emoji = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user_id', 'emoji')
