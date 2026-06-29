from rest_framework import serializers
from .models import CaseProgressSnapshot, LawyerStats, ReportRequest


class CaseProgressSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseProgressSnapshot
        fields = [
            'id', 'case_id', 'title', 'client_id', 'assigned_lawyer_id',
            'case_type', 'status', 'timeline_entries', 'created_at', 'updated_at',
        ]


class LawyerStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LawyerStats
        fields = [
            'id', 'lawyer_id', 'active_cases', 'closed_cases_count',
            'avg_resolution_days', 'cases_this_month', 'updated_at',
        ]


class ReportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportRequest
        fields = ['id', 'firm_id', 'requester_id', 'requester_name', 'report_type', 'period', 'notes', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
