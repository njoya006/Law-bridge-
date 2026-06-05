import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.django_db
class TestClientProfile:
    
    def test_create_client_profile(self):
        """Test creating a client profile"""
        from apps.clients.models import ClientProfile
        
        profile = ClientProfile.objects.create(
            user_id='550e8400-e29b-41d4-a716-446655440000',
            full_name_en='John Doe',
            monthly_income=500000,
            dependants=2,
            employment_status='employed'
        )
        
        assert profile.id is not None
        assert str(profile.user_id) == '550e8400-e29b-41d4-a716-446655440000'
        assert profile.full_name_en == 'John Doe'

    def test_eligibility_score(self):
        """Test eligibility score computation"""
        from apps.clients.models import ClientProfile
        
        profile = ClientProfile.objects.create(
            user_id='550e8400-e29b-41d4-a716-446655440000',
            eligibility_score=75
        )
        
        assert profile.qualifies_for_aid() is True
        
        profile2 = ClientProfile.objects.create(
            user_id='660e8400-e29b-41d4-a716-446655440001',
            eligibility_score=60
        )
        
        assert profile2.qualifies_for_aid() is False
