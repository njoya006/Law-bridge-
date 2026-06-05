from rest_framework import serializers
from .models import ConflictCheck


class ConflictCheckSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConflictCheck
        fields = ('id', 'lawyer_id', 'case_id', 'client_id', 'opposing_party_ids', 'status', 'created_at')
        read_only_fields = ('id', 'created_at')
