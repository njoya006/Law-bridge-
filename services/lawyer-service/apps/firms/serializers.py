from rest_framework import serializers
from .models import Firm, FirmMembership, Invite, FirmActionLog, FirmPartnershipPolicy, PartnershipRequest
from django.contrib.auth import get_user_model

User = get_user_model()


class FirmSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Firm
        fields = [
            'id', 'name', 'logo_url', 'description', 'website',
            'office_address', 'city', 'country', 'phone', 'contact_email',
            'year_established', 'specializations', 'created_at', 'updated_at',
        ]

    def get_logo_url(self, obj):
        if obj.logo:
            return f'/api/v1/firms/logo/{obj.id}/'
        return None


class FirmPartnershipPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = FirmPartnershipPolicy
        fields = [
            'id', 'is_open', 'min_years_experience', 'requires_specialization_overlap',
            'revenue_share_percentage', 'process_description', 'additional_requirements',
            'created_at', 'updated_at',
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')


class PartnershipRequestSerializer(serializers.ModelSerializer):
    requesting_firm_name = serializers.CharField(source='requesting_firm.name', read_only=True)
    target_firm_name = serializers.CharField(source='target_firm.name', read_only=True)

    class Meta:
        model = PartnershipRequest
        fields = [
            'id', 'requesting_firm', 'requesting_firm_name',
            'target_firm', 'target_firm_name',
            'requested_by_id', 'status', 'message',
            'response_note', 'responded_by_id',
            'created_at', 'updated_at',
        ]
        read_only_fields = ('id', 'requesting_firm', 'requested_by_id', 'status',
                            'response_note', 'responded_by_id', 'created_at', 'updated_at')


class InviteSerializer(serializers.ModelSerializer):
    token = serializers.UUIDField(read_only=True)
    firm = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Invite
        fields = ['token', 'email', 'firm', 'role', 'created_at', 'expires_at', 'accepted_at']
        read_only_fields = ('created_at',)


class FirmMembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    user_full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = FirmMembership
        fields = ['id', 'user', 'user_full_name', 'user_email', 'user_uuid',
                  'avatar_url', 'firm', 'role', 'invited_by', 'invited_email',
                  'invited_at', 'accepted_at', 'is_active']

    def get_user_email(self, obj):
        return obj.user.email if obj.user else obj.invited_email

    def get_user_full_name(self, obj):
        if obj.user:
            return getattr(obj.user, 'full_name', None) or getattr(obj.user, 'email', None)
        return obj.invited_email

    def get_avatar_url(self, obj):
        if obj.user_uuid:
            return f'/api/v1/auth/avatars/{obj.user_uuid}/'
        return None


class FirmActionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = FirmActionLog
        fields = ['id', 'firm', 'performed_by_id', 'performed_by_email', 'action',
                  'target_email', 'old_role', 'new_role', 'reason', 'created_at']
