from rest_framework import serializers
from .models import ChatSession


class ChatMessageSerializer(serializers.Serializer):
    role = serializers.CharField()
    content = serializers.CharField()
    timestamp = serializers.DateTimeField()


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True)

    class Meta:
        model = ChatSession
        fields = [
            'id',
            'user_id',
            'case_id',
            'language',
            'title',
            'messages',
            'created_at',
            'updated_at',
        ]
