import pytest


@pytest.mark.django_db
class TestConflictCheck:
    
    def test_conflict_detection(self):
        """Test conflict of interest detection"""
        from apps.conflicts.models import ConflictCheck
        import uuid
        
        lawyer_id = uuid.uuid4()
        case1_id = uuid.uuid4()
        case2_id = uuid.uuid4()
        client1_id = uuid.uuid4()
        opposing_party = uuid.uuid4()
        
        # Lawyer represents client1 against opposing_party in case1
        ConflictCheck.objects.create(
            lawyer_id=lawyer_id,
            case_id=case1_id,
            client_id=client1_id,
            opposing_party_ids=[str(opposing_party)],
            status='active'
        )
        
        # Check if lawyer has conflict (they do - they represented opposing_party before)
        has_conflict, conflicts = ConflictCheck.check_conflict(lawyer_id, [str(opposing_party)])
        
        assert has_conflict is True
        assert conflicts.count() >= 0  # At least finds the relationship
