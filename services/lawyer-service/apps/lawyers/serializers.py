from rest_framework import serializers
from .models import LawyerProfile, LawyerAvailability


class LawyerAvailabilitySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = LawyerAvailability
        fields = ('id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'is_available')


class LawyerProfileSerializer(serializers.ModelSerializer):
    availability_slots = LawyerAvailabilitySerializer(many=True, read_only=True)
    
    class Meta:
        model = LawyerProfile
        fields = (
            'id', 'user_id', 'specialization', 'qualifications', 'bio',
            'bar_number', 'years_of_experience', 'bijural_flag', 'consultation_fee',
            'availability_status', 'active_cases', 'total_cases',
            'average_rating', 'rating_count', 'verified_at', 'availability_slots'
        )
        read_only_fields = ('id', 'active_cases', 'total_cases', 'average_rating', 'rating_count', 'verified_at')


class LawyerProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LawyerProfile
        fields = (
            'specialization', 'qualifications', 'bio',
            'bar_number', 'years_of_experience', 'bijural_flag', 'consultation_fee',
            'availability_status'
        )
