from rest_framework import serializers
from .models import VerificationRequest


class VerificationRequestSerializer(serializers.ModelSerializer):
    lawyer_name = serializers.CharField(source='lawyer.full_name', read_only=True)

    class Meta:
        model = VerificationRequest
        fields = [
            'id', 'lawyer_name', 'bar_number', 'bar_council',
            'year_called', 'notes', 'status', 'rejection_reason',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'lawyer_name', 'status', 'rejection_reason', 'created_at', 'updated_at']


class VerificationSubmitSerializer(serializers.Serializer):
    bar_number = serializers.CharField(max_length=100)
    bar_council = serializers.CharField(max_length=200, default='Cameroon Bar Association')
    year_called = serializers.IntegerField(min_value=1900, max_value=2100)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
