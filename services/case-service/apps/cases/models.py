import uuid
from django.db import models
from django.contrib.postgres.fields import JSONField as DjangoJSONField


class Case(models.Model):
    """
    Legal case filed by a client.
    Tracks status, assignments, and timeline.
    """
    STATUS_CHOICES = [
        # Initial
        ('draft',               'Draft'),
        ('filed',               'Filed'),
        # Lawyer intake
        ('assigned',            'Assigned to Lawyer'),
        ('under_review',        'Under Review'),
        ('evidence_collection', 'Evidence Collection'),
        ('awaiting_court_date', 'Awaiting Court Date'),
        # Active proceedings
        ('in_progress',         'In Progress'),
        ('hearing_scheduled',   'Hearing Scheduled'),
        ('hearing_adjourned',   'Hearing Adjourned'),
        ('mediation',           'Mediation'),
        # Resolution
        ('verdict',             'Verdict Rendered'),
        ('settled',             'Settled Out of Court'),
        ('appeal_filed',        'Appeal Filed'),
        ('appeal_in_progress',  'Appeal in Progress'),
        # Terminal
        ('closed',              'Closed'),
        ('dismissed',           'Dismissed'),
        ('archived',            'Archived'),
    ]

    TERMINAL_STATUSES = {'closed', 'dismissed', 'archived', 'settled'}
    
    LEGAL_TRADITION = [
        ('common_law', 'Common Law'),
        ('civil_law', 'Civil Law'),
        ('customary', 'Customary Law'),
    ]

    CIRCUIT = [
        ('anglophone', 'Anglophone'),
        ('francophone', 'Francophone'),
    ]

    COURT_LEVEL = [
        ('customary_court',     'Customary Court'),
        ('first_instance',      'Court of First Instance (TPI)'),
        ('high_court',          'High Court (TGI)'),
        ('appeal_court',        'Court of Appeal'),
        ('supreme_court',       'Supreme Court'),
        ('administrative_court','Administrative Court'),
        ('military_tribunal',   'Military Tribunal'),
        ('labour_bench',        'Labour Bench'),
        ('other',               'Other'),
    ]

    CASE_RELATION = [
        ('appeal_of',         'Appeal of'),
        ('related_to',        'Related to'),
        ('consolidated_with', 'Consolidated with'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Client info
    client_id = models.UUIDField()  # Cross-ref to auth_db
    
    # Case details
    title = models.CharField(max_length=255)
    description = models.TextField()
    case_type = models.CharField(max_length=100)  # e.g., "civil", "criminal"
    
    # Legal jurisdiction
    legal_tradition = models.CharField(max_length=32, choices=LEGAL_TRADITION)
    circuit = models.CharField(max_length=32, choices=CIRCUIT)
    language = models.CharField(max_length=2, choices=[('en', 'English'), ('fr', 'French')], default='en')
    
    # Case status
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='draft')
    assigned_lawyer_id = models.UUIDField(null=True, blank=True)
    
    # Timeline (JSON array of status changes)
    timeline = models.JSONField(default=list, help_text="Array of {timestamp, status, notes}")

    # Booking fields (populated when case originates from a booking request)
    BOOKING_STATUS = [
        ('pending', 'Pending Acceptance'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    booking_status = models.CharField(max_length=20, choices=BOOKING_STATUS, blank=True, default='', db_index=True)
    booking_metadata = models.JSONField(default=dict, blank=True,
        help_text="Stores consultation_type, booking_fee, payment_reference, payment_status, target info")

    # Court & registry identity — where the matter actually lives in the Cameroonian court system
    court_level = models.CharField(max_length=32, choices=COURT_LEVEL, blank=True, default='')
    court_name = models.CharField(max_length=255, blank=True, default='',
        help_text='e.g. "TPI Douala-Bonanjo", "Court of Appeal of the Northwest"')
    court_location = models.CharField(max_length=128, blank=True, default='')
    chamber = models.CharField(max_length=128, blank=True, default='',
        help_text='Chamber/section handling the matter, e.g. "Chambre civile"')
    judge_name = models.CharField(max_length=255, blank=True, default='')
    suit_number = models.CharField(max_length=128, blank=True, default='', db_index=True,
        help_text='Registry suit number / numéro de rôle assigned by the court registry')

    # Case linking — an appeal is procedurally a NEW case at a higher court linked to the original
    parent_case = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='child_cases')
    relation_type = models.CharField(max_length=32, choices=CASE_RELATION, blank=True, default='')

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    filed_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['client_id']),
            models.Index(fields=['status']),
            models.Index(fields=['assigned_lawyer_id']),
            models.Index(fields=['created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Case({self.case_type}) - {self.title[:50]}"

    def add_timeline_entry(self, status, notes='', updated_by=None):
        """Add a status-change entry to the timeline and save."""
        from django.utils import timezone
        self.timeline.append({
            'timestamp': timezone.now().isoformat(),
            'status': status,
            'notes': notes,
            'updated_by': str(updated_by) if updated_by else None,
        })
        self.status = status
        if status == 'filed' and not self.filed_at:
            self.filed_at = timezone.now()
        elif status in self.TERMINAL_STATUSES and not self.closed_at:
            self.closed_at = timezone.now()
        self.save()


class CaseNote(models.Model):
    """Lawyer notes on a case (case review, findings, etc.)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='notes')
    
    lawyer_id = models.UUIDField()  # Cross-ref to lawyer who wrote the note
    content = models.TextField()
    is_private = models.BooleanField(default=False)  # Only visible to lawyers
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Note on {self.case.id}"


class ReassignmentRequest(models.Model):
    """
    A client's request to change the assigned lawyer on a case.
    Implements a conflict-aware, multi-step process with a mediation window
    before any transfer is approved.
    """

    REASON_CHOICES = [
        ('unresponsive',     'Lawyer is unresponsive'),
        ('slow_progress',    'Case progress is too slow'),
        ('unprofessional',   'Unprofessional conduct'),
        ('lack_expertise',   'Lack of required expertise'),
        ('breach_agreement', 'Breach of engagement agreement'),
        ('communication',    'Poor communication'),
        ('personal_reasons', 'Personal / conflict of interest'),
        ('other',            'Other'),
    ]

    STATUS_CHOICES = [
        ('pending_review',    'Pending Conflict Review'),   # just submitted — auto-evaluated
        ('mediation_window',  'Mediation Window Open'),     # lawyer notified; 48 h to respond
        ('approved',          'Reassignment Approved'),     # conflict cleared; searching
        ('searching',         'Searching for New Lawyer'),  # client selecting replacement
        ('transferring',      'Transfer in Progress'),      # handoff underway
        ('completed',         'Transfer Complete'),         # done
        ('cancelled',         'Cancelled by Client'),
        ('resolved',          'Resolved — No Transfer'),    # lawyer addressed concerns
        ('blocked',           'Blocked — Cannot Reassign'), # active appeal / terminal
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='reassignment_requests')
    client_id = models.CharField(max_length=64)

    # Client's evaluation of the lawyer
    reason_code = models.CharField(max_length=32, choices=REASON_CHOICES)
    reason_detail = models.TextField()
    performance_rating = models.PositiveSmallIntegerField(default=3, help_text='1–5 star rating')

    # Conflict-check snapshot stored at submission time
    conflict_flags = models.JSONField(default=dict)
    # Keys: payment_made, payment_amount, court_date_imminent, active_appeal,
    #       is_terminal, work_progress_pct, recent_activity_count,
    #       recommendation ('proceed'|'caution'|'blocked'), block_reason

    # Workflow state
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending_review')

    # Mediation window — 48 h from creation
    mediation_deadline = models.DateTimeField(null=True, blank=True)
    lawyer_response = models.TextField(blank=True)
    lawyer_responded_at = models.DateTimeField(null=True, blank=True)

    # Replacement
    selected_lawyer_id = models.UUIDField(null=True, blank=True)
    handoff_summary = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"ReassignmentRequest({self.case_id}) [{self.status}]"


class IntakeForm(models.Model):
    """AI-generated client intake questionnaire shared with clients via a unique link."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case_id = models.UUIDField(null=True, blank=True, db_index=True)
    case_type = models.CharField(max_length=100)
    circuit = models.CharField(max_length=32, blank=True, default='')
    form_fields = models.JSONField(help_text='[{label, type, required, placeholder, options?}]')
    responses = models.JSONField(default=dict)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_by = models.UUIDField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"IntakeForm({self.case_type}) token={self.token}"


class CaseApplication(models.Model):
    """A lawyer or firm applying to take on a declined/open case."""
    STATUS_CHOICES = [
        ('pending',  'Pending Review'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='applications')
    lawyer_id = models.UUIDField(help_text='UUID of the lawyer applying')
    firm_id = models.UUIDField(null=True, blank=True, help_text='Optional: firm the lawyer belongs to')
    message = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('case', 'lawyer_id')

    def __str__(self):
        return f"Application by {self.lawyer_id} for case {self.case_id}"


# ═══════════════════════════════════════════════════════════════════════════════
# CASE FILE 2.0 — models that make the case record match real Cameroonian practice
# ═══════════════════════════════════════════════════════════════════════════════

class Adjournment(models.Model):
    """One adjournment of a hearing. Cameroonian matters routinely adjourn 10-20+
    times over years — the adjournment log IS the litigation history."""

    REASON_CHOICES = [
        ('judge_absent',            'Judge Absent'),
        ('opposing_counsel_absent', 'Opposing Counsel Absent'),
        ('counsel_request',         'Counsel Requested Adjournment'),
        ('ruling_not_ready',        'Ruling / Judgment Not Ready'),
        ('party_absent',            'Party Absent / Not Served'),
        ('court_congestion',        'Court Congestion / List Not Reached'),
        ('evidence_pending',        'Evidence / Expert Report Pending'),
        ('settlement_talks',        'Settlement Negotiations Ongoing'),
        ('strike_action',           'Court Staff / Bar Strike'),
        ('other',                   'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='adjournments')
    hearing_date = models.DateField(help_text='The hearing date that was adjourned')
    reason = models.CharField(max_length=32, choices=REASON_CHOICES, default='other')
    reason_detail = models.TextField(blank=True, default='')
    adjourned_to = models.DateField(null=True, blank=True, help_text='New hearing date, if fixed')
    recorded_by = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-hearing_date']
        indexes = [models.Index(fields=['case', 'hearing_date'])]


class CaseParty(models.Model):
    """Any person/entity attached to a matter beyond the platform client.
    Also the substrate for conflict-of-interest checks."""

    ROLE_CHOICES = [
        ('plaintiff',        'Plaintiff / Demandeur'),
        ('co_plaintiff',     'Co-Plaintiff'),
        ('defendant',        'Defendant / Defendeur'),
        ('co_defendant',     'Co-Defendant'),
        ('opposing_counsel', 'Opposing Counsel'),
        ('witness',          'Witness'),
        ('expert',           'Expert'),
        ('interested_party', 'Interested Party'),
        ('bailiff',          'Bailiff / Huissier'),
    ]

    OPPOSING_ROLES = {'defendant', 'co_defendant', 'opposing_counsel'}

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='parties')
    role = models.CharField(max_length=32, choices=ROLE_CHOICES)
    name = models.CharField(max_length=255, db_index=True)
    organization = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=32, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    added_by = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['role', 'name']
        indexes = [models.Index(fields=['case', 'role'])]


class CaseDeadline(models.Model):
    """A procedural deadline with alerting. Appeal windows in Cameroon can be as
    short as 10 days — missing one is malpractice, so alerts are first-class."""

    TYPE_CHOICES = [
        ('appeal_window',     'Appeal Window'),
        ('prescription',      'Prescription / Limitation Period'),
        ('conclusions_due',   'Conclusions / Submissions Due'),
        ('service_deadline',  'Service of Process Deadline'),
        ('opposition_window', 'Opposition Window (OHADA)'),
        ('payment_deadline',  'Payment Deadline'),
        ('detention_review',  'Detention Review'),
        ('procedural_step',   'Procedural Step'),
        ('custom',            'Custom'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('met',     'Met'),
        ('missed',  'Missed'),
        ('waived',  'Waived / No Longer Applicable'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='deadlines')
    deadline_type = models.CharField(max_length=32, choices=TYPE_CHOICES, default='custom')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    due_date = models.DateField(db_index=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    source = models.CharField(max_length=32, blank=True, default='manual',
        help_text='manual | procedure_template | hearing_outcome | detention')
    # Alert bookkeeping — the check_deadlines runner flips these so alerts fire once
    alert_7d_sent = models.BooleanField(default=False)
    alert_1d_sent = models.BooleanField(default=False)
    overdue_alert_sent = models.BooleanField(default=False)
    created_by = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['due_date']
        indexes = [models.Index(fields=['status', 'due_date'])]


class Disbursement(models.Model):
    """Out-of-pocket case expenses billed to the client separately from fees:
    court filing fees, stamp duty (timbres), bailiff, experts, travel."""

    CATEGORY_CHOICES = [
        ('court_fees',           'Court / Filing Fees'),
        ('stamp_duty',           'Stamp Duty (Timbres)'),
        ('bailiff_fees',         'Bailiff / Huissier Fees'),
        ('expert_fees',          'Expert Fees'),
        ('registration_fees',    'Registration Fees'),
        ('copies_certification', 'Copies & Certification'),
        ('travel',               'Travel & Transport'),
        ('other',                'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='disbursements')
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='other')
    description = models.CharField(max_length=255, blank=True, default='')
    amount = models.DecimalField(max_digits=12, decimal_places=0, help_text='Amount in XAF')
    incurred_on = models.DateField()
    billable = models.BooleanField(default=True)
    reimbursed = models.BooleanField(default=False)
    receipt_reference = models.CharField(max_length=128, blank=True, default='')
    recorded_by = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-incurred_on']


class HearingOutcome(models.Model):
    """Structured record of what happened at a hearing. One entry updates the
    timeline, optionally logs an adjournment, and seeds the next steps."""

    OUTCOME_CHOICES = [
        ('held_proceeded',     'Hearing Held — Matter Proceeded'),
        ('adjourned',          'Adjourned'),
        ('ruling_delivered',   'Ruling Delivered'),
        ('judgment_delivered', 'Judgment Delivered'),
        ('struck_out',         'Struck Out'),
        ('settled',            'Settled'),
        ('other',              'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='hearing_outcomes')
    hearing_date = models.DateField()
    outcome = models.CharField(max_length=32, choices=OUTCOME_CHOICES)
    summary = models.TextField(blank=True, default='')
    next_hearing_date = models.DateField(null=True, blank=True)
    next_action = models.CharField(max_length=255, blank=True, default='',
        help_text='What must happen before the next hearing')
    adjournment_reason = models.CharField(max_length=32, blank=True, default='',
        help_text='If outcome=adjourned: reason code mirrored into the Adjournment log')
    recorded_by = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-hearing_date']


class DetentionRecord(models.Model):
    """Tracks garde a vue / detention provisoire time limits for criminal matters.
    Exceeding the statutory limit is grounds for release — lawyers track this to the day."""

    TYPE_CHOICES = [
        ('garde_a_vue',          'Garde a Vue (Police Custody)'),
        ('detention_provisoire', 'Detention Provisoire (Remand)'),
    ]

    # Statutory defaults (Cameroon Criminal Procedure Code): garde a vue 48h
    # renewable twice (max 6 days); detention provisoire 6 months (misdemeanour)
    # or 12 months (felony), renewable by reasoned order.
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='detention_records')
    detention_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    person_name = models.CharField(max_length=255)
    facility = models.CharField(max_length=255, blank=True, default='')
    start_date = models.DateField()
    statutory_limit_days = models.PositiveIntegerField(
        help_text='Statutory limit in days (e.g. 2 for garde a vue, 180/365 for remand)')
    extensions_days = models.PositiveIntegerField(default=0,
        help_text='Total additional days granted by renewal orders')
    released = models.BooleanField(default=False)
    released_on = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    alert_sent = models.BooleanField(default=False)
    recorded_by = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    @property
    def expiry_date(self):
        from datetime import timedelta
        return self.start_date + timedelta(days=self.statutory_limit_days + self.extensions_days)


class ConciliationRecord(models.Model):
    """Mandatory pre-litigation conciliation: labour disputes must attempt
    conciliation before the labour inspector; divorce requires conciliation
    attempts. The non-conciliation PV is the ticket into court."""

    FORUM_CHOICES = [
        ('labour_inspector',    'Labour Inspector'),
        ('family_conciliation', 'Family / Divorce Conciliation'),
        ('customary_authority', 'Customary Authority'),
        ('private_mediation',   'Private Mediation'),
        ('other',               'Other'),
    ]

    STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('scheduled',   'Scheduled'),
        ('in_progress', 'In Progress'),
        ('successful',  'Successful — Dispute Resolved'),
        ('failed',      'Failed — PV of Non-Conciliation Issued'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='conciliation_records')
    forum = models.CharField(max_length=32, choices=FORUM_CHOICES)
    required = models.BooleanField(default=True,
        help_text='Whether conciliation is a statutory precondition to filing')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='not_started')
    scheduled_date = models.DateField(null=True, blank=True)
    completed_date = models.DateField(null=True, blank=True)
    outcome_summary = models.TextField(blank=True, default='')
    pv_reference = models.CharField(max_length=128, blank=True, default='',
        help_text='Proces-verbal de non-conciliation reference — required to file at court')
    recorded_by = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class CaseProcedureStep(models.Model):
    """One step of an applied procedure template (e.g. OHADA injonction de payer).
    Applying a template seeds the checklist + auto-creates deadline entries."""

    STATUS_CHOICES = [
        ('pending',     'Pending'),
        ('in_progress', 'In Progress'),
        ('done',        'Done'),
        ('skipped',     'Skipped'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    case = models.ForeignKey(Case, on_delete=models.CASCADE, related_name='procedure_steps')
    template_key = models.CharField(max_length=64, db_index=True)
    step_order = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['step_order']
        unique_together = ('case', 'template_key', 'step_order')
