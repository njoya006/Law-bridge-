"""
Notification Service - Serializers
"""
from rest_framework import serializers
from .models import Notification, NotificationTemplate

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'event_type', 'title_en', 'title_fr', 'message_en', 
                  'message_fr', 'metadata', 'read', 'created_at']
        read_only_fields = ['id', 'created_at']

class NotificationListSerializer(serializers.ModelSerializer):
    """Serializer for listing - picks language based on context"""
    title = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'event_type', 'title', 'message', 'metadata', 'read', 'created_at']
    
    def get_title(self, obj):
        language = self.context.get('language', 'en')
        return obj.title_en if language == 'en' else obj.title_fr
    
    def get_message(self, obj):
        language = self.context.get('language', 'en')
        return obj.message_en if language == 'en' else obj.message_fr

class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = ['id', 'event_type', 'template_en', 'template_fr', 'created_at']
