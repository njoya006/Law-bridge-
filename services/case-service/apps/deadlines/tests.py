import pytest
from django.utils import timezone
from datetime import timedelta


@pytest.mark.django_db
class TestDeadline:
    
    def test_deadline_escalation(self):
        """Test missed deadline detection"""
        from apps.deadlines.models import Deadline
        import uuid
        
        # Create a deadline in the past
        case_id = uuid.uuid4()
        past_time = timezone.now() - timedelta(hours=1)
        
        deadline = Deadline.objects.create(
            case_id=case_id,
            deadline_type='hearing',
            due_date=past_time,
            description='Court hearing',
            status='pending'
        )
        
        # Check and escalate
        is_missed = deadline.check_and_escalate()
        
        assert is_missed is True
        assert deadline.status == 'missed'
        assert deadline.escalated_at is not None
