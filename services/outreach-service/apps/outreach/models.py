import uuid
from django.db import models

RELATIONSHIP_STATUSES = [
    ('not_contacted', 'Not Contacted'),
    ('contacted', 'Contacted'),
    ('meeting_requested', 'Meeting Requested'),
    ('meeting_scheduled', 'Meeting Scheduled'),
    ('interview_completed', 'Interview Completed'),
    ('interested', 'Interested'),
    ('follow_up_needed', 'Follow-Up Needed'),
    ('joined_founding_network', 'Founding Network'),
    ('founding_council_member', 'Founding Council'),
    ('pilot_partner', 'Pilot Partner'),
    ('active_partner', 'Active Partner'),
]

INTERVIEW_TYPES = [('in_person', 'In Person'), ('virtual', 'Virtual'), ('phone', 'Phone')]
INTERVIEW_STATUSES = [('scheduled', 'Scheduled'), ('completed', 'Completed'), ('cancelled', 'Cancelled'), ('rescheduled', 'Rescheduled')]
PRIORITIES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]
TASK_STATUSES = [('pending', 'Pending'), ('in_progress', 'In Progress'), ('done', 'Done')]
FR_STATUSES = [('under_review', 'Under Review'), ('approved', 'Approved'), ('planned', 'Planned'), ('in_development', 'In Development'), ('released', 'Released'), ('declined', 'Declined')]
FR_SOURCES = [('interview', 'Interview'), ('firm', 'Firm'), ('internal', 'Internal'), ('email', 'Email')]


class OutreachFirm(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm_name = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='Cameroon')
    address = models.TextField(blank=True, default='')
    website = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    practice_areas = models.JSONField(default=list)
    firm_size = models.CharField(max_length=20, blank=True, default='')
    status = models.CharField(max_length=50, choices=RELATIONSHIP_STATUSES, default='not_contacted')
    source = models.CharField(max_length=50, blank=True, default='')
    tags = models.JSONField(default=list)
    assigned_to = models.CharField(max_length=100, blank=True, default='')
    last_contact = models.DateField(null=True, blank=True)
    next_followup = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.firm_name


class Interview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey(OutreachFirm, on_delete=models.CASCADE, related_name='interviews')
    firm_name = models.CharField(max_length=255)
    contact_name = models.CharField(max_length=255, blank=True, default='')
    date = models.DateField()
    time = models.CharField(max_length=10, blank=True, default='')
    duration = models.PositiveIntegerField(null=True, blank=True)
    type = models.CharField(max_length=20, choices=INTERVIEW_TYPES, default='virtual')
    location = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=INTERVIEW_STATUSES, default='scheduled')
    interviewer_name = models.CharField(max_length=100, blank=True, default='')
    summary = models.TextField(blank=True, default='')
    takeaways = models.JSONField(default=list)
    next_steps = models.JSONField(default=list)
    overall_interest_level = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.firm_name} — {self.date}'


class Contact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    firm = models.ForeignKey(OutreachFirm, on_delete=models.CASCADE, related_name='contacts')
    firm_name = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    position = models.CharField(max_length=255, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=50, blank=True, default='')
    whatsapp = models.CharField(max_length=50, blank=True, default='')
    linkedin = models.CharField(max_length=255, blank=True, default='')
    is_primary = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_primary', 'name']

    def __str__(self):
        return f'{self.name} — {self.firm_name}'


class Task(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    assigned_to = models.CharField(max_length=100, blank=True, default='')
    firm = models.ForeignKey(OutreachFirm, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    firm_name = models.CharField(max_length=255, blank=True, default='')
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=TASK_STATUSES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITIES, default='medium')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date', '-created_at']

    def __str__(self):
        return self.title


class FeatureRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    requested_by = models.CharField(max_length=255, blank=True, default='')
    firm = models.ForeignKey(OutreachFirm, on_delete=models.SET_NULL, null=True, blank=True, related_name='feature_requests')
    firm_name = models.CharField(max_length=255, blank=True, default='')
    priority = models.CharField(max_length=10, choices=PRIORITIES, default='medium')
    status = models.CharField(max_length=20, choices=FR_STATUSES, default='under_review')
    source = models.CharField(max_length=20, choices=FR_SOURCES, default='interview')
    description = models.TextField(blank=True, default='')
    requested_on = models.DateField()
    interview_id = models.UUIDField(null=True, blank=True)

    class Meta:
        ordering = ['-requested_on']

    def __str__(self):
        return self.title
