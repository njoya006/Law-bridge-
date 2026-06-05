from rest_framework import serializers
from .models import CalendarEvent, EventApproval, Alarm

class EventApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventApproval
        fields = ['id', 'approver_id', 'status', 'created_at']

class CalendarEventSerializer(serializers.ModelSerializer):
    approvals = EventApprovalSerializer(many=True, read_only=True)
    
    class Meta:
        model = CalendarEvent
        fields = ['id', 'case_id', 'event_type', 'date', 'time', 'location',
                  'virtual_link', 'initiator_id', 'status', 'approvals', 'created_at']
        read_only_fields = ['id', 'created_at', 'status']
