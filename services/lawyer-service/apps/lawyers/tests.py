import pytest


@pytest.mark.django_db
class TestLawyerProfile:
    
    def test_create_lawyer_profile(self):
        """Test creating a lawyer profile"""
        from apps.lawyers.models import LawyerProfile
        
        profile = LawyerProfile.objects.create(
            user_id='550e8400-e29b-41d4-a716-446655440000',
            specialization='Criminal Law',
            bar_number='SW/2015/001',
            years_of_experience=10,
            bijural_flag='common_law',
            consultation_fee=50000
        )
        
        assert profile.id is not None
        assert profile.specialization == 'Criminal Law'
        assert profile.availability_status == 'available'
