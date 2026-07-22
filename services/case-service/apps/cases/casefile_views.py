"""
Case File 2.0 views — adjournments, parties, deadlines, disbursements, hearing
outcomes, detention records, conciliation, procedure templates, conflict checks.
"""
import logging
from datetime import timedelta

from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Case, Adjournment, CaseParty, CaseDeadline, Disbursement,
    HearingOutcome, DetentionRecord, ConciliationRecord, CaseProcedureStep,
)
from .casefile_serializers import (
    AdjournmentSerializer, CasePartySerializer, CaseDeadlineSerializer,
    DisbursementSerializer, HearingOutcomeSerializer, DetentionRecordSerializer,
    ConciliationRecordSerializer, CaseProcedureStepSerializer,
)
from .procedures import get_template, list_templates
from .views import (
    extract_token_payload, extract_user_id_from_token,
    user_can_access_case, STAFF_ROLES,
)

logger = logging.getLogger(__name__)


def _get_case_or_403(request, case_id):
    """Returns (case, error_response). error_response is None when access is OK."""
    try:
        case = Case.objects.get(id=case_id)
    except Case.DoesNotExist:
        return None, Response({'error': 'Case not found'}, status=status.HTTP_404_NOT_FOUND)
    if not user_can_access_case(request, case):
        return None, Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    return case, None


def _is_staff(request):
    return extract_token_payload(request).get('role', 'client') in STAFF_ROLES


class CaseSubResourceView(APIView):
    """GET list + POST create for a case sub-resource. Subclasses set
    model / serializer_class / related_name / recorded_by_field."""
    model = None
    serializer_class = None
    related_name = ''
    recorded_by_field = 'recorded_by'
    staff_only_write = True
    staff_only_read = False

    def get(self, request, case_id):
        case, err = _get_case_or_403(request, case_id)
        if err:
            return err
        if self.staff_only_read and not _is_staff(request):
            return Response({'error': 'Staff only'}, status=status.HTTP_403_FORBIDDEN)
        qs = getattr(case, self.related_name).all()
        return Response(self.serializer_class(qs, many=True).data)

    def post(self, request, case_id):
        case, err = _get_case_or_403(request, case_id)
        if err:
            return err
        if self.staff_only_write and not _is_staff(request):
            return Response({'error': 'Only firm staff can modify the case file'},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        extra = {self.recorded_by_field: extract_user_id_from_token(request)} if self.recorded_by_field else {}
        obj = self.model.objects.create(case=case, **serializer.validated_data, **extra)
        self.post_create(request, case, obj)
        return Response(self.serializer_class(obj).data, status=status.HTTP_201_CREATED)

    def post_create(self, request, case, obj):
        """Hook for side effects after creation."""


class CaseSubResourceDetailView(APIView):
    """PATCH + DELETE for a single sub-resource row."""
    model = None
    serializer_class = None

    def _get(self, request, case_id, item_id):
        case, err = _get_case_or_403(request, case_id)
        if err:
            return None, err
        if not _is_staff(request):
            return None, Response({'error': 'Only firm staff can modify the case file'},
                                  status=status.HTTP_403_FORBIDDEN)
        try:
            return self.model.objects.get(id=item_id, case=case), None
        except self.model.DoesNotExist:
            return None, Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, case_id, item_id):
        obj, err = self._get(request, case_id, item_id)
        if err:
            return err
        serializer = self.serializer_class(obj, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        self.post_update(request, obj)
        return Response(serializer.data)

    def delete(self, request, case_id, item_id):
        obj, err = self._get(request, case_id, item_id)
        if err:
            return err
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def post_update(self, request, obj):
        """Hook for side effects after update."""


# ── Adjournments ──────────────────────────────────────────────────────────────

class AdjournmentListView(CaseSubResourceView):
    model = Adjournment
    serializer_class = AdjournmentSerializer
    related_name = 'adjournments'


class AdjournmentDetailView(CaseSubResourceDetailView):
    model = Adjournment
    serializer_class = AdjournmentSerializer


# ── Parties ───────────────────────────────────────────────────────────────────

class CasePartyListView(CaseSubResourceView):
    model = CaseParty
    serializer_class = CasePartySerializer
    related_name = 'parties'
    recorded_by_field = 'added_by'


class CasePartyDetailView(CaseSubResourceDetailView):
    model = CaseParty
    serializer_class = CasePartySerializer


# ── Deadlines ─────────────────────────────────────────────────────────────────

class CaseDeadlineListView(CaseSubResourceView):
    model = CaseDeadline
    serializer_class = CaseDeadlineSerializer
    related_name = 'deadlines'
    recorded_by_field = 'created_by'


class CaseDeadlineDetailView(CaseSubResourceDetailView):
    model = CaseDeadline
    serializer_class = CaseDeadlineSerializer

    def post_update(self, request, obj):
        if obj.status in ('met', 'missed', 'waived') and not obj.completed_at:
            obj.completed_at = timezone.now()
            obj.save(update_fields=['completed_at'])


# ── Disbursements ─────────────────────────────────────────────────────────────

class DisbursementListView(CaseSubResourceView):
    model = Disbursement
    serializer_class = DisbursementSerializer
    related_name = 'disbursements'

    def get(self, request, case_id):
        case, err = _get_case_or_403(request, case_id)
        if err:
            return err
        qs = case.disbursements.all()
        # Clients see billable expenses only; staff see everything
        if not _is_staff(request):
            qs = qs.filter(billable=True)
        totals = qs.aggregate(total=Sum('amount'))
        return Response({
            'results': self.serializer_class(qs, many=True).data,
            'total_xaf': int(totals['total'] or 0),
        })


class DisbursementDetailView(CaseSubResourceDetailView):
    model = Disbursement
    serializer_class = DisbursementSerializer


# ── Hearing outcomes ──────────────────────────────────────────────────────────

class HearingOutcomeListView(CaseSubResourceView):
    model = HearingOutcome
    serializer_class = HearingOutcomeSerializer
    related_name = 'hearing_outcomes'

    def post_create(self, request, case, obj):
        """One entry drives everything: timeline, adjournment log, next deadline."""
        user_id = extract_user_id_from_token(request)
        label = dict(HearingOutcome.OUTCOME_CHOICES).get(obj.outcome, obj.outcome)
        note = f'Hearing on {obj.hearing_date}: {label}'
        if obj.summary:
            note += f' — {obj.summary[:200]}'

        # Timeline entry (and status transition where the outcome implies one)
        status_map = {
            'adjourned': 'hearing_adjourned',
            'judgment_delivered': 'verdict',
            'settled': 'settled',
        }
        new_status = status_map.get(obj.outcome)
        if new_status and new_status != case.status:
            case.add_timeline_entry(new_status, notes=note, updated_by=user_id)
        else:
            case.timeline.append({
                'timestamp': timezone.now().isoformat(),
                'status': case.status,
                'notes': note,
                'updated_by': str(user_id) if user_id else None,
            })
            case.save(update_fields=['timeline'])

        # Adjourned → mirror into the structured adjournment log
        if obj.outcome == 'adjourned':
            Adjournment.objects.create(
                case=case,
                hearing_date=obj.hearing_date,
                reason=obj.adjournment_reason or 'other',
                reason_detail=obj.summary,
                adjourned_to=obj.next_hearing_date,
                recorded_by=user_id,
            )

        # Judgment delivered → auto-seed the appeal-window deadline so it is
        # impossible to forget. Default 10 days (shortest common window); editable.
        if obj.outcome in ('judgment_delivered', 'ruling_delivered'):
            CaseDeadline.objects.create(
                case=case,
                deadline_type='appeal_window',
                title='Appeal window — verify statutory period for this matter',
                description=(f'Auto-created after {label.lower()} on {obj.hearing_date}. '
                             'Default set to 10 days; adjust to the correct statutory window.'),
                due_date=obj.hearing_date + timedelta(days=10),
                source='hearing_outcome',
                created_by=user_id,
            )

        # Next action with a next hearing date → conclusions deadline
        if obj.next_hearing_date and obj.next_action:
            CaseDeadline.objects.create(
                case=case,
                deadline_type='conclusions_due',
                title=obj.next_action[:255],
                description=f'Due before the next hearing on {obj.next_hearing_date}.',
                due_date=obj.next_hearing_date,
                source='hearing_outcome',
                created_by=user_id,
            )


class HearingOutcomeDetailView(CaseSubResourceDetailView):
    model = HearingOutcome
    serializer_class = HearingOutcomeSerializer


# ── Detention records ─────────────────────────────────────────────────────────

class DetentionRecordListView(CaseSubResourceView):
    model = DetentionRecord
    serializer_class = DetentionRecordSerializer
    related_name = 'detention_records'


class DetentionRecordDetailView(CaseSubResourceDetailView):
    model = DetentionRecord
    serializer_class = DetentionRecordSerializer


# ── Conciliation ──────────────────────────────────────────────────────────────

class ConciliationListView(CaseSubResourceView):
    model = ConciliationRecord
    serializer_class = ConciliationRecordSerializer
    related_name = 'conciliation_records'


class ConciliationDetailView(CaseSubResourceDetailView):
    model = ConciliationRecord
    serializer_class = ConciliationRecordSerializer


# ── Procedure templates ───────────────────────────────────────────────────────

class ProcedureTemplateListView(APIView):
    """GET /cases/procedure-templates/ — available templates."""

    def get(self, request):
        return Response({'templates': list_templates()})


class ApplyProcedureTemplateView(APIView):
    """POST /cases/{id}/apply-procedure/ {template_key} — seed checklist + deadlines."""

    def post(self, request, case_id):
        case, err = _get_case_or_403(request, case_id)
        if err:
            return err
        if not _is_staff(request):
            return Response({'error': 'Only firm staff can apply procedures'},
                            status=status.HTTP_403_FORBIDDEN)
        key = request.data.get('template_key', '')
        template = get_template(key)
        if not template:
            return Response({'error': f'Unknown template: {key}'}, status=status.HTTP_400_BAD_REQUEST)
        if case.procedure_steps.filter(template_key=key).exists():
            return Response({'error': 'This procedure has already been applied to the case'},
                            status=status.HTTP_409_CONFLICT)

        user_id = extract_user_id_from_token(request)
        today = timezone.now().date()
        steps = []
        for i, s in enumerate(template['steps']):
            due = today + timedelta(days=s['deadline_days']) if s['deadline_days'] else None
            step = CaseProcedureStep.objects.create(
                case=case, template_key=key, step_order=i + 1,
                title=s['title'], description=s['description'], due_date=due,
            )
            steps.append(step)
            if due:
                CaseDeadline.objects.create(
                    case=case,
                    deadline_type='procedural_step',
                    title=f"[{template['name']}] {s['title']}"[:255],
                    description=s['description'],
                    due_date=due,
                    source='procedure_template',
                    created_by=user_id,
                )
        return Response({
            'applied': key,
            'steps': CaseProcedureStepSerializer(steps, many=True).data,
        }, status=status.HTTP_201_CREATED)


class ProcedureStepListView(CaseSubResourceView):
    model = CaseProcedureStep
    serializer_class = CaseProcedureStepSerializer
    related_name = 'procedure_steps'
    recorded_by_field = None

    def post(self, request, case_id):
        return Response({'error': 'Steps are created by applying a template'},
                        status=status.HTTP_405_METHOD_NOT_ALLOWED)


class ProcedureStepDetailView(CaseSubResourceDetailView):
    model = CaseProcedureStep
    serializer_class = CaseProcedureStepSerializer

    def post_update(self, request, obj):
        if obj.status == 'done' and not obj.completed_at:
            obj.completed_at = timezone.now()
            obj.save(update_fields=['completed_at'])


# ── Court & registry identity ─────────────────────────────────────────────────

COURT_FIELDS = ('court_level', 'court_name', 'court_location', 'chamber',
                'judge_name', 'suit_number', 'relation_type')


class CourtInfoView(APIView):
    """PATCH /cases/{id}/court/ — update where the matter lives in the court system."""

    def patch(self, request, case_id):
        case, err = _get_case_or_403(request, case_id)
        if err:
            return err
        if not _is_staff(request):
            return Response({'error': 'Only firm staff can update court information'},
                            status=status.HTTP_403_FORBIDDEN)
        updates = []
        for f in COURT_FIELDS:
            if f in request.data:
                setattr(case, f, request.data[f] or '')
                updates.append(f)
        if 'parent_case' in request.data:
            pc = request.data['parent_case']
            if pc:
                try:
                    case.parent_case = Case.objects.get(id=pc)
                except Case.DoesNotExist:
                    return Response({'error': 'parent_case not found'},
                                    status=status.HTTP_400_BAD_REQUEST)
            else:
                case.parent_case = None
            updates.append('parent_case')
        if not updates:
            return Response({'error': 'No court fields provided'},
                            status=status.HTTP_400_BAD_REQUEST)
        case.save(update_fields=updates + ['updated_at'])
        return Response({f: getattr(case, f) for f in COURT_FIELDS} | {
            'parent_case': str(case.parent_case_id) if case.parent_case_id else None,
        })


# ── Conflict of interest check ────────────────────────────────────────────────

class ConflictCheckView(APIView):
    """GET /cases/conflict-check/?name=X
    Searches the requesting lawyer's other matters for the name appearing as any
    party — the core question: 'have we ever acted for or against this person?'"""

    def get(self, request):
        payload = extract_token_payload(request)
        if payload.get('role', 'client') not in STAFF_ROLES:
            return Response({'error': 'Staff only'}, status=status.HTTP_403_FORBIDDEN)
        name = (request.query_params.get('name') or '').strip()
        if len(name) < 3:
            return Response({'error': 'name query param required (min 3 chars)'},
                            status=status.HTTP_400_BAD_REQUEST)

        user_id = extract_user_id_from_token(request)
        matches = (
            CaseParty.objects
            .filter(name__icontains=name)
            .filter(Q(case__assigned_lawyer_id=user_id) | Q(added_by=user_id))
            .select_related('case')[:25]
        )
        results = [{
            'case_id': str(p.case.id),
            'case_title': p.case.title,
            'case_status': p.case.status,
            'party_name': p.name,
            'party_role': p.role,
            'is_opposing': p.role in CaseParty.OPPOSING_ROLES,
        } for p in matches]
        return Response({
            'query': name,
            'match_count': len(results),
            'has_opposing_match': any(r['is_opposing'] for r in results),
            'results': results,
        })
