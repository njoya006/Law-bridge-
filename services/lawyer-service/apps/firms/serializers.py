from rest_framework import serializers
from .models import Firm, FirmMembership, Invite
from django.contrib.auth import get_user_model

User = get_user_model()


class FirmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Firm
        fields = ['id', 'name', 'created_at']


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

    class Meta:
        model = FirmMembership
        fields = ['id', 'user', 'user_full_name', 'user_email', 'firm', 'role', 'invited_by', 'invited_email', 'invited_at', 'accepted_at', 'is_active']

    def get_user_email(self, obj):
        return obj.user.email if obj.user else obj.invited_email

    def get_user_full_name(self, obj):
        # Prefer the linked user's full_name when available, otherwise fall back to invited_email or email
        if obj.user:
            return getattr(obj.user, 'full_name', None) or getattr(obj.user, 'email', None)
        return obj.invited_email
