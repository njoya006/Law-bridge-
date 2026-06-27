from rest_framework import serializers
from apps.lawyers.models import LawyerProfile


class LawyerDiscoverySerializer(serializers.ModelSerializer):
    """Public lawyer profile for discovery — exposes all browsable fields."""
    name = serializers.CharField(source='full_name')
    is_verified = serializers.SerializerMethodField()

    class Meta:
        model = LawyerProfile
        fields = (
            'id', 'user_id', 'name', 'specialization', 'qualifications', 'bio',
            'bar_number', 'years_of_experience', 'bijural_flag', 'consultation_fee',
            'availability_status', 'practice_circuit', 'accepted_case_types',
            'accepts_urgent_cases', 'consultation_mode',
            'active_cases', 'total_cases', 'average_rating', 'rating_count',
            'is_verified',
        )

    def get_is_verified(self, obj):
        return obj.verified_at is not None


class LawyerMatchingRequestSerializer(serializers.Serializer):
    """Request body for lawyer matching endpoint"""
    case_type = serializers.CharField(max_length=100)
    circuit = serializers.ChoiceField(choices=['anglophone', 'francophone', 'both'])
    language_preference = serializers.ChoiceField(choices=['en', 'fr'])
    urgency = serializers.ChoiceField(choices=['low', 'medium', 'high'])


class LawyerMatchingResponseSerializer(serializers.Serializer):
    """Response for lawyer matching with scores"""
    lawyer = LawyerDiscoverySerializer()
    score = serializers.IntegerField(min_value=0, max_value=100)
    match_factors = serializers.JSONField()
