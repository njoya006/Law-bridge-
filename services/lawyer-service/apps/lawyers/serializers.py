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
            'availability_status',
            'max_active_cases', 'practice_circuit', 'accepted_case_types',
            'accepts_urgent_cases', 'consultation_mode',
            'active_cases', 'total_cases',
            'average_rating', 'rating_count', 'verified_at', 'availability_slots',
        )
        read_only_fields = ('id', 'active_cases', 'total_cases', 'average_rating', 'rating_count', 'verified_at')


class LawyerProfileUpdateSerializer(serializers.ModelSerializer):
    # Explicit allow_blank so empty string passes validation for optional choice fields
    practice_circuit = serializers.CharField(required=False, allow_blank=True, max_length=32)

    class Meta:
        model = LawyerProfile
        fields = (
            'specialization', 'qualifications', 'bio',
            'bar_number', 'years_of_experience', 'bijural_flag', 'consultation_fee',
            'availability_status',
            'max_active_cases', 'practice_circuit', 'accepted_case_types',
            'accepts_urgent_cases', 'consultation_mode',
        )


class LawyerAvailabilityWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LawyerAvailability
        fields = ('day_of_week', 'start_time', 'end_time', 'is_available')
