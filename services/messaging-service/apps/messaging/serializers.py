from rest_framework import serializers
from .models import Thread, ThreadParticipant, Message, MessageReaction


class ReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageReaction
        fields = ['emoji', 'user_id', 'display_name', 'created_at']


class MessageSerializer(serializers.ModelSerializer):
    reactions = ReactionSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'sender_id', 'sender_name', 'sender_role',
            'content', 'is_ai', 'is_system', 'is_deleted',
            'created_at', 'edited_at', 'reactions',
        ]


class ParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThreadParticipant
        fields = ['user_id', 'display_name', 'role', 'firm_id', 'last_read_at', 'joined_at', 'is_active']


class ThreadSerializer(serializers.ModelSerializer):
    participants = ParticipantSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Thread
        fields = [
            'id', 'thread_type', 'case_id', 'case_ref', 'case_title', 'subject',
            'is_ai_support', 'escalated_to_human', 'is_closed',
            'created_at', 'updated_at', 'participants', 'last_message', 'unread_count',
        ]

    def get_last_message(self, obj):
        msg = obj.messages.filter(is_deleted=False).order_by('-created_at').first()
        if msg:
            return {
                'id': msg.id,
                'content': msg.content[:100],
                'sender_name': msg.sender_name,
                'created_at': msg.created_at.isoformat(),
                'is_ai': msg.is_ai,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        user_id = getattr(request, 'auth_payload', {}).get('user_id', '')
        try:
            participant = obj.participants.get(user_id=user_id)
            if participant.last_read_at:
                return obj.messages.filter(
                    created_at__gt=participant.last_read_at,
                    is_deleted=False,
                ).exclude(sender_id=user_id).count()
            return obj.messages.filter(is_deleted=False).exclude(sender_id=user_id).count()
        except ThreadParticipant.DoesNotExist:
            return 0


class ThreadCreateSerializer(serializers.Serializer):
    thread_type = serializers.ChoiceField(choices=['client_lawyer', 'client_firm', 'client_support', 'firm_internal'])
    case_id = serializers.CharField(max_length=50, default='', required=False)
    case_ref = serializers.CharField(required=False, default='')
    case_title = serializers.CharField(required=False, default='')
    subject = serializers.CharField(required=False, default='')
    participants = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )
