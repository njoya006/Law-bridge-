import uuid
from django.db import models


class ConflictCheck(models.Model):
    """
    Track lawyers' conflicts of interest.
    Before assigning a lawyer to a case, check if they already represent
    the opposing party.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    lawyer_id = models.UUIDField(db_index=True)
    case_id = models.UUIDField(db_index=True)
    
    # Who the lawyer represents in this case
    client_id = models.UUIDField()
    
    # Opposing parties (can be multiple)
    opposing_party_ids = models.JSONField(default=list, help_text="UUIDs of opposing parties")
    
    status = models.CharField(
        max_length=32,
        choices=[('active', 'Active'), ('closed', 'Closed')],
        default='active'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('lawyer_id', 'case_id')
        indexes = [
            models.Index(fields=['lawyer_id', 'status']),
            models.Index(fields=['case_id']),
        ]

    def __str__(self):
        return f"Conflict({self.lawyer_id}) - Case {self.case_id}"

    @staticmethod
    def check_conflict(lawyer_id, opposing_party_ids):
        """
        Check if a lawyer has active conflicts with any opposing parties.
        Returns: (has_conflict: bool, conflicting_cases: QuerySet)
        """
        from django.db.models import Q
        
        # Find active conflicts where this lawyer represents someone opposite to opposing parties
        conflicts = ConflictCheck.objects.filter(
            lawyer_id=lawyer_id,
            status='active'
        )
        
        has_conflict = False
        conflicting = conflicts.filter(
            Q(opposing_party_ids__contains=opposing_party_ids) |
            Q(client_id__in=opposing_party_ids)
        )
        
        if conflicting.exists():
            has_conflict = True
        
        return has_conflict, conflicting
