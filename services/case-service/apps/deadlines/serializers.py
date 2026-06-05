from rest_framework import serializers
from .models import Deadline


class DeadlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deadline
        fields = (
            'id', 'case_id', 'deadline_type', 'due_date', 'status',
            'description', 'assigned_to', 'created_at', 'notified_at', 'escalated_at'
        )
        read_only_fields = ('id', 'created_at', 'notified_at', 'escalated_at')
