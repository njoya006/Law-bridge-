import pytest


@pytest.mark.django_db
class TestCase:
    
    def test_create_case(self):
        """Test creating a case"""
        from apps.cases.models import Case
        import uuid
        
        case = Case.objects.create(
            client_id=uuid.uuid4(),
            title='Property Dispute',
            description='Land encroachment issue',
            case_type='civil',
            legal_tradition='common_law',
            circuit='anglophone',
            language='en'
        )
        
        assert case.id is not None
        assert case.status == 'draft'
        assert len(case.timeline) == 0
    
    def test_case_timeline(self):
        """Test case timeline tracking"""
        from apps.cases.models import Case
        import uuid
        
        case = Case.objects.create(
            client_id=uuid.uuid4(),
            title='Test Case',
            case_type='criminal',
            legal_tradition='civil_law',
            circuit='francophone',
            language='fr'
        )
        
        case.add_timeline_entry('draft', 'Case created')
        case.add_timeline_entry('filed', 'Case filed in court')
        
        assert case.status == 'filed'
        assert len(case.timeline) == 2
        assert case.timeline[0]['status'] == 'draft'
        assert case.timeline[1]['status'] == 'filed'
