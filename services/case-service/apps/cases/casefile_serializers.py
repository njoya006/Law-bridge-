"""Serializers for Case File 2.0 sub-resources."""
from rest_framework import serializers
from .models import (
    Adjournment, CaseParty, CaseDeadline, Disbursement,
    HearingOutcome, DetentionRecord, ConciliationRecord, CaseProcedureStep,
)


class AdjournmentSerializer(serializers.ModelSerializer):
    reason_label = serializers.CharField(source='get_reason_display', read_only=True)

    class Meta:
        model = Adjournment
        fields = ('id', 'hearing_date', 'reason', 'reason_label', 'reason_detail',
                  'adjourned_to', 'recorded_by', 'created_at')
        read_only_fields = ('id', 'recorded_by', 'created_at')


class CasePartySerializer(serializers.ModelSerializer):
    role_label = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = CaseParty
        fields = ('id', 'role', 'role_label', 'name', 'organization', 'phone',
                  'email', 'notes', 'added_by', 'created_at')
        read_only_fields = ('id', 'added_by', 'created_at')


class CaseDeadlineSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source='get_deadline_type_display', read_only=True)

    class Meta:
        model = CaseDeadline
        fields = ('id', 'deadline_type', 'type_label', 'title', 'description',
                  'due_date', 'status', 'source', 'created_by', 'created_at', 'completed_at')
        read_only_fields = ('id', 'source', 'created_by', 'created_at', 'completed_at')


class DisbursementSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Disbursement
        fields = ('id', 'category', 'category_label', 'description', 'amount',
                  'incurred_on', 'billable', 'reimbursed', 'receipt_reference',
                  'recorded_by', 'created_at')
        read_only_fields = ('id', 'recorded_by', 'created_at')


class HearingOutcomeSerializer(serializers.ModelSerializer):
    outcome_label = serializers.CharField(source='get_outcome_display', read_only=True)

    class Meta:
        model = HearingOutcome
        fields = ('id', 'hearing_date', 'outcome', 'outcome_label', 'summary',
                  'next_hearing_date', 'next_action', 'adjournment_reason',
                  'recorded_by', 'created_at')
        read_only_fields = ('id', 'recorded_by', 'created_at')


class DetentionRecordSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source='get_detention_type_display', read_only=True)
    expiry_date = serializers.DateField(read_only=True)
    days_remaining = serializers.SerializerMethodField()

    def get_days_remaining(self, obj):
        from django.utils import timezone
        if obj.released:
            return None
        return (obj.expiry_date - timezone.now().date()).days

    class Meta:
        model = DetentionRecord
        fields = ('id', 'detention_type', 'type_label', 'person_name', 'facility',
                  'start_date', 'statutory_limit_days', 'extensions_days',
                  'expiry_date', 'days_remaining', 'released', 'released_on',
                  'notes', 'recorded_by', 'created_at')
        read_only_fields = ('id', 'recorded_by', 'created_at')


class ConciliationRecordSerializer(serializers.ModelSerializer):
    forum_label = serializers.CharField(source='get_forum_display', read_only=True)
    status_label = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ConciliationRecord
        fields = ('id', 'forum', 'forum_label', 'required', 'status', 'status_label',
                  'scheduled_date', 'completed_date', 'outcome_summary',
                  'pv_reference', 'recorded_by', 'created_at')
        read_only_fields = ('id', 'recorded_by', 'created_at')


class CaseProcedureStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseProcedureStep
        fields = ('id', 'template_key', 'step_order', 'title', 'description',
                  'due_date', 'status', 'completed_at', 'created_at')
        read_only_fields = ('id', 'template_key', 'step_order', 'title',
                            'description', 'created_at')
