from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, UserPreferences


class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'role', 'avatar_url')
        read_only_fields = ('id', 'email', 'role', 'avatar_url')

    def get_avatar_url(self, obj):
        if obj.avatar:
            return f'/api/v1/auth/avatars/{obj.id}/'
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'full_name', 'password', 'role')
        # role is accepted on write but always forced to 'client' — prevents privilege escalation via registration
        read_only_fields = ('role',)

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['role'] = 'client'  # enforce: public registration always creates clients
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = (
            'language',
            'notify_case_updates', 'notify_documents', 'notify_messages',
            'notify_billing', 'notify_reminders',
            'preferred_contact',
            'profile_visible',
            'updated_at',
        )
        read_only_fields = ('updated_at',)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that includes UUID user_id in token"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Ensure user_id is properly set as a string (UUID)
        token['user_id'] = str(user.id)
        token['email'] = user.email
        token['role'] = user.role
        
        return token
