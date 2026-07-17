import uuid
from django.db import models


class Document(models.Model):
    """
    Legal documents uploaded for cases.
    Encrypted and virus-scanned before storage in MinIO.
    """
    STATUS_CHOICES = [
        ('pending_scan', 'Pending Virus Scan'),
        ('scanned', 'Scanned - Clean'),
        ('encrypted', 'Encrypted'),
        ('stored', 'Stored in MinIO'),
        ('active', 'Active'),
        ('archived', 'Archived'),
        ('deleted', 'Deleted'),
    ]
    
    DOCUMENT_TYPES = [
        ('complaint', 'Complaint'),
        ('contract', 'Contract'),
        ('evidence', 'Evidence'),
        ('motion', 'Motion'),
        ('judgment', 'Judgment'),
        ('deposition', 'Deposition'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    case_id = models.UUIDField(db_index=True)
    uploader_id = models.CharField(max_length=64)  # User who uploaded
    
    filename = models.CharField(max_length=255)
    document_type = models.CharField(max_length=32, choices=DOCUMENT_TYPES)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending_scan')
    
    # Storage metadata
    minio_path = models.CharField(max_length=500, null=True, blank=True)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    
    # Encryption
    encryption_key_id = models.CharField(max_length=255, null=True, blank=True)
    is_encrypted = models.BooleanField(default=False)
    
    # Virus scan
    scan_timestamp = models.DateTimeField(null=True, blank=True)
    scan_result = models.CharField(max_length=255, null=True, blank=True)
    
    # Versioning
    version = models.IntegerField(default=1)
    parent_document_id = models.UUIDField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    # Optional password protection for downloads (stored as salted hash)
    password_salt = models.CharField(max_length=64, null=True, blank=True)
    password_hash = models.CharField(max_length=128, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['case_id', 'status']),
            models.Index(fields=['uploader_id']),
            models.Index(fields=['document_type']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Document({self.filename}) - {self.case_id}"


class DocumentSignature(models.Model):
    STAMP_TYPES = [
        ('reviewed',     'REVIEWED'),
        ('approved',     'APPROVED'),
        ('certified',    'CERTIFIED'),
        ('confidential', 'CONFIDENTIAL'),
        ('court_filed',  'COURT FILED'),
        ('original_copy','ORIGINAL COPY'),
    ]

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document       = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='signatures')
    signer_id      = models.CharField(max_length=64)
    signer_name    = models.CharField(max_length=255, blank=True, default='')
    signature_type = models.CharField(max_length=16)   # 'draw' | 'typed' | 'stamp'
    signature_data = models.TextField()                 # base64 PNG, text, or stamp key
    stamp_type     = models.CharField(max_length=64, blank=True, default='')
    signed_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-signed_at']

    def __str__(self):
        return f"Signature({self.signer_name}) on {self.document.filename}"
