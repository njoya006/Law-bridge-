import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lawyer = models.ForeignKey(
        'lawyers.LawyerProfile',
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    client_id = models.UUIDField(db_index=True)
    client_name = models.CharField(max_length=200, blank=True)
    case_id = models.UUIDField(null=True, blank=True, db_index=True)
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # One review per client per lawyer (not per case — keeps it simple)
        unique_together = [('lawyer', 'client_id')]
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['lawyer', '-created_at']),
        ]

    def __str__(self):
        return f"Review({self.rating}★) lawyer={self.lawyer_id} client={self.client_id}"
