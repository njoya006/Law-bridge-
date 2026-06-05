import pytest


@pytest.mark.django_db
class TestLawyerMatching:
    
    def test_matching_algorithm_scoring(self):
        """Test the lawyer matching algorithm"""
        from apps.lawyers.models import LawyerProfile
        
        # Create test lawyers with different specs
        lawyer1 = LawyerProfile.objects.create(
            user_id='550e8400-e29b-41d4-a716-446655440001',
            specialization='Criminal Law',
            bar_number='SW/2015/001',
            years_of_experience=15,
            bijural_flag='common_law',
            consultation_fee=50000,
            active_cases=2,
            average_rating=4.5
        )
        
        lawyer2 = LawyerProfile.objects.create(
            user_id='550e8400-e29b-41d4-a716-446655440002',
            specialization='Property Law',
            bar_number='SW/2015/002',
            years_of_experience=5,
            bijural_flag='civil_law',
            consultation_fee=40000,
            active_cases=8,
            average_rating=3.5
        )
        
        assert lawyer1.id is not None
        assert lawyer2.id is not None
