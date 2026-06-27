from rest_framework import serializers
from .models import Firm, FirmMembership, Invite, FirmActionLog
from django.contrib.auth import get_user_model

User = get_user_model()


class FirmSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Firm
        fields = ['id', 'name', 'logo_url', 'created_at']

    def get_logo_url(self, obj):
        if obj.logo:
            return f'/api/v1/firms/logo/{obj.id}/'
        return None


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
