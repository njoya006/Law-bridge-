from rest_framework import serializers
from apps.lawyers.models import LawyerProfile
from apps.lawyers.serializers import LawyerAvailabilitySerializer


class LawyerDiscoverySerializer(serializers.ModelSerializer):
    """Simplified lawyer profile for public discovery"""
    availability_slots = LawyerAvailabilitySerializer(many=True, read_only=True)
    
    class Meta:
        model = LawyerProfile
        fields = (
            'id', 'specialization', 'qualifications', 'bio',
            'years_of_experience', 'bijural_flag', 'consultation_fee',
            'availability_status', 'active_cases', 'average_rating', 'availability_slots'
        )


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
