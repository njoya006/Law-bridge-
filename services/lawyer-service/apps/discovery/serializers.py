from rest_framework import serializers
from apps.lawyers.models import LawyerProfile


class LawyerDiscoverySerializer(serializers.ModelSerializer):
    """Simplified lawyer profile for public discovery"""
    name = serializers.CharField(source='full_name')

    class Meta:
        model = LawyerProfile
        fields = (
            'id', 'name', 'specialization', 'qualifications', 'bio',
            'years_of_experience', 'bijural_flag', 'consultation_fee',
            'availability_status', 'active_cases', 'average_rating',
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
