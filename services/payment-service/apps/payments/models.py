import uuid
from django.db import models


class Payment(models.Model):
    """
    Track payments from clients for legal services.
    Supports MTN Money, Orange Money, and cash payments.
    """
    METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('mtn', 'MTN Money'),
        ('orange', 'Orange Money'),
        ('bank_transfer', 'Bank Transfer'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    case_id = models.UUIDField(db_index=True)
    client_id = models.UUIDField()
    lawyer_id = models.UUIDField(null=True, blank=True)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='XAF')
    
    payment_method = models.CharField(max_length=32, choices=METHOD_CHOICES)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    
    # Provider references
    mtn_reference = models.CharField(max_length=255, null=True, blank=True, unique=True)
    orange_reference = models.CharField(max_length=255, null=True, blank=True, unique=True)
    
    # Idempotency key to prevent duplicate payments
    idempotency_key = models.CharField(max_length=255, unique=True, db_index=True)
    
    # Receipt
    receipt_path = models.CharField(max_length=500, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['case_id', 'status']),
            models.Index(fields=['client_id']),
            models.Index(fields=['status']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment({self.amount} {self.currency}) - {self.payment_method}"
