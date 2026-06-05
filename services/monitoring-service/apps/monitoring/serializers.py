from rest_framework import serializers
from .models import CaseProgressSnapshot, LawyerStats

class CaseProgressSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseProgressSnapshot
        fields = ['id', 'case_id', 'client_id', 'assigned_lawyer_id', 'case_type', 'status', 'created_at', 'updated_at']

class LawyerStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LawyerStats
        fields = ['id', 'lawyer_id', 'active_cases', 'closed_cases_count', 'avg_resolution_days', 'cases_this_month', 'updated_at']
