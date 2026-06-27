from rest_framework import serializers
from .models import Case, CaseNote


class CaseNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseNote
        fields = ('id', 'lawyer_id', 'content', 'is_private', 'created_at', 'updated_at')
        read_only_fields = ('id', 'lawyer_id', 'created_at', 'updated_at')


class CaseSerializer(serializers.ModelSerializer):
    notes = CaseNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Case
        fields = (
            'id', 'client_id', 'title', 'description', 'case_type',
            'legal_tradition', 'circuit', 'language', 'status',
            'assigned_lawyer_id', 'timeline', 'notes',
            'booking_status', 'booking_metadata',
            'created_at', 'updated_at', 'filed_at', 'closed_at'
        )
        read_only_fields = ('id', 'timeline', 'created_at', 'updated_at', 'filed_at', 'closed_at')


class CaseCreateSerializer(serializers.ModelSerializer):
    booking_metadata = serializers.JSONField(required=False, default=dict)
    booking_status = serializers.CharField(required=False, default='', allow_blank=True)

    class Meta:
        model = Case
        fields = (
            'title', 'description', 'case_type',
            'legal_tradition', 'circuit', 'language',
            'booking_status', 'booking_metadata',
        )
