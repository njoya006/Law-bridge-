from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ('id', 'document_id', 'user_id', 'action', 'ip_address', 'timestamp', 'details')
        read_only_fields = ('id', 'timestamp')
