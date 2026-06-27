from rest_framework import serializers
from .models import ClientProfile


class ClientProfileSerializer(serializers.ModelSerializer):
    qualifies_for_aid = serializers.SerializerMethodField()

    class Meta:
        model = ClientProfile
        fields = (
            'id', 'user_id', 'full_name_en', 'full_name_fr',
            'phone', 'organization', 'location',
            'monthly_income', 'dependants', 'employment_status',
            'eligibility_score', 'case_count', 'qualifies_for_aid',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'eligibility_score', 'eligibility_computed_at', 'created_at', 'updated_at')

    def get_qualifies_for_aid(self, obj):
        return obj.qualifies_for_aid()


class ClientProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = (
            'full_name_en', 'full_name_fr',
            'phone', 'organization', 'location',
            'monthly_income', 'dependants', 'employment_status',
        )
