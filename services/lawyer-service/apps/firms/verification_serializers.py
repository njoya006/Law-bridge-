from rest_framework import serializers
from .models import FirmVerificationRequest


class FirmVerificationRequestSerializer(serializers.ModelSerializer):
    firm_name = serializers.CharField(source='firm.name', read_only=True)

    class Meta:
        model = FirmVerificationRequest
        fields = [
            'id', 'firm_name', 'registration_number', 'firm_type',
            'founding_year', 'number_of_partners', 'notes',
            'status', 'rejection_reason', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'firm_name', 'status', 'rejection_reason', 'created_at', 'updated_at',
        ]


class FirmVerificationSubmitSerializer(serializers.Serializer):
    registration_number = serializers.CharField(max_length=100)
    firm_type = serializers.ChoiceField(choices=[
        'sole_practice', 'partnership', 'incorporated', 'government', 'ngo',
    ])
    founding_year = serializers.IntegerField(min_value=1900, max_value=2100)
    number_of_partners = serializers.IntegerField(min_value=1, default=1)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
