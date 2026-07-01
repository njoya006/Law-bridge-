import jwt
from decouple import config
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import CaseProgressSnapshot, LawyerStats, ReportRequest
from .serializers import CaseProgressSnapshotSerializer, LawyerStatsSerializer, ReportRequestSerializer

ACTIVE_STATUSES = {
    'draft', 'filed', 'assigned', 'under_review', 'evidence_collection',
    'awaiting_court_date', 'in_progress', 'hearing_scheduled',
    'hearing_adjourned', 'mediation', 'appeal_filed', 'appeal_in_progress',
}


def _compute_risk(snapshot):
    now = timezone.now()
    days_stale = max((now - snapshot.updated_at).days, 0)
    score = 0
    factors = []

    if days_stale > 14:
        score += 30
        factors.append(f'No updates in {days_stale} days')
    elif days_stale > 7:
        score += 15
        factors.append(f'Stale for {days_stale} days')

    if not snapshot.assigned_lawyer_id:
        score += 25
        factors.append('No lawyer assigned')

    if snapshot.status in ('draft', 'filed') and days_stale > 3:
        score += 20
        factors.append('Intake stalled')

    if snapshot.status == 'evidence_collection' and days_stale > 21:
        score += 25
        factors.append('Evidence collection overdue')

    if snapshot.status == 'mediation' and days_stale > 5:
        score += 15
        factors.append('Mediation window expiring')

    score = min(score, 100)
    if score >= 75:
        level = 'critical'
    elif score >= 45:
        level = 'watch'
    else:
        level = 'healthy'

    return score, level, factors


def _get_user_id(request):
    auth = request.META.get('HTTP_AUTHORIZATION', '')
    if auth.startswith('Bearer '):
        try:
            token = auth.split(' ')[1]
            payload = jwt.decode(token, config('JWT_SECRET_KEY', default='dev-secret'), algorithms=['HS256'])
            return payload.get('user_id')
        except Exception:
            pass
    return None


class CaseProgressViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CaseProgressSnapshotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = _get_user_id(self.request)
        if user_id:
            return CaseProgressSnapshot.objects.filter(assigned_lawyer_id=str(user_id))
        return CaseProgressSnapshot.objects.none()


class LawyerStatsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LawyerStatsSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'lawyer_id'

    def get_queryset(self):
        return LawyerStats.objects.all()


class InternalCaseSyncView(APIView):
    """POST /api/v1/monitoring/internal/sync/ — direct push from case-service (fallback to Redis pub/sub)."""
    permission_classes = []

    def post(self, request):
        key = request.headers.get('X-Internal-Key', '')
        if key != config('INTERNAL_API_KEY', default='dev-internal-key'):
            return Response({'error': 'Forbidden'}, status=403)

        data = request.data
        case_id = data.get('case_id')
        if not case_id:
            return Response({'error': 'case_id required'}, status=400)

        ts = parse_datetime(data.get('timestamp', '')) or timezone.now()
        snapshot, created = CaseProgressSnapshot.objects.update_or_create(
            case_id=str(case_id),
            defaults={
                'title': data.get('title', ''),
                'client_id': str(data.get('client_id', '')),
                'assigned_lawyer_id': data.get('assigned_lawyer_id') or None,
                'case_type': data.get('case_type', ''),
                'status': data.get('status', ''),
                'timeline_entries': data.get('timeline', []),
                'created_at': ts,
                'updated_at': ts,
            },
        )

        # Refresh LawyerStats if a lawyer is assigned
        lawyer_id = snapshot.assigned_lawyer_id
        if lawyer_id:
            from apps.monitoring.management.commands.consume_case_events import _refresh_lawyer_stats
            _refresh_lawyer_stats(lawyer_id)

        return Response({'created': created, 'case_id': case_id})


class CaseRiskView(APIView):
    """GET /api/v1/monitoring/case-risks/ — ranked list of active cases by risk score."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        snapshots = CaseProgressSnapshot.objects.filter(
            status__in=list(ACTIVE_STATUSES)
        ).order_by('-updated_at')

        results = []
        for snap in snapshots:
            score, level, factors = _compute_risk(snap)
            results.append({
                'case_id': snap.case_id,
                'title': snap.title or f'Case {snap.case_id[:8]}',
                'status': snap.status,
                'risk_score': score,
                'risk_level': level,
                'risk_factors': factors,
            })

        results.sort(key=lambda x: x['risk_score'], reverse=True)
        results = results[:15]

        counts = {'critical': 0, 'watch': 0, 'healthy': 0}
        for r in results:
            counts[r['risk_level']] += 1

        return Response({'cases': results, 'counts': counts})


class FirmIntelligenceView(APIView):
    """GET /api/v1/monitoring/firm-intelligence/ — aggregated firm KPIs + AI narrative."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        firm_id = None
        lawyer_ids = []
        if auth.startswith('Bearer '):
            try:
                token = auth.split(' ')[1]
                payload = jwt.decode(token, config('JWT_SECRET_KEY', default='dev-secret'), algorithms=['HS256'])
                firm_id = payload.get('firmId')
                # Collect all lawyer IDs from the monitoring snapshot for this firm
                # (we approximate by looking at all snapshots, filtered later by lawyer stats)
            except Exception:
                pass

        # All active case snapshots
        active_snaps = CaseProgressSnapshot.objects.filter(status__in=list(ACTIVE_STATUSES))
        all_snaps = CaseProgressSnapshot.objects.all()

        # Status distribution
        status_dist = {}
        for snap in active_snaps:
            status_dist[snap.status] = status_dist.get(snap.status, 0) + 1

        # Stalled cases (no update >14 days)
        now = timezone.now()
        stalled = []
        for snap in active_snaps:
            days = max((now - snap.updated_at).days, 0)
            if days > 14:
                stalled.append({
                    'case_id': snap.case_id,
                    'title': snap.title or f'Case {snap.case_id[:8]}',
                    'status': snap.status,
                    'days_stale': days,
                })
        stalled.sort(key=lambda x: x['days_stale'], reverse=True)

        # Lawyer load distribution
        all_stats = LawyerStats.objects.all().order_by('-active_cases')[:20]
        lawyer_loads = [
            {
                'lawyer_id': s.lawyer_id,
                'active_cases': s.active_cases,
                'closed_cases_count': s.closed_cases_count,
                'avg_resolution_days': round(s.avg_resolution_days, 1),
                'cases_this_month': s.cases_this_month,
            }
            for s in all_stats
        ]

        total_active = active_snaps.count()
        total_all = all_snaps.count()
        avg_resolution = (
            sum(s.avg_resolution_days for s in all_stats) / len(all_stats)
            if all_stats else 0
        )

        # AI insights narrative (non-streaming, best-effort)
        narrative = []
        bullet_insights = []
        try:
            import urllib.request as _req
            import json as _json
            ai_url = config('AI_SERVICE_URL', default='http://ai-assistant-service:80')
            body = _json.dumps({
                'firm_data': {
                    'total_active_cases': total_active,
                    'total_cases_all_time': total_all,
                    'stalled_cases_count': len(stalled),
                    'lawyer_count': len(lawyer_loads),
                    'avg_resolution_days': round(avg_resolution, 1),
                    'status_distribution': status_dist,
                    'top_stalled': stalled[:3],
                    'lawyer_loads': lawyer_loads[:5],
                }
            }).encode()
            rq = _req.Request(
                f'{ai_url}/api/v1/ai/insights/',
                data=body,
                method='POST',
                headers={
                    'Content-Type': 'application/json',
                    'X-Internal-Api-Key': config('INTERNAL_API_KEY', default='dev-internal-key'),
                },
            )
            with _req.urlopen(rq, timeout=10) as resp:
                result = _json.loads(resp.read())
                narrative = result.get('narrative', '')
                bullet_insights = result.get('bullet_insights', [])
        except Exception:
            pass

        return Response({
            'total_active_cases': total_active,
            'total_cases_all_time': total_all,
            'stalled_cases': stalled[:10],
            'lawyer_loads': lawyer_loads,
            'status_distribution': status_dist,
            'avg_resolution_days': round(avg_resolution, 1),
            'ai_narrative': narrative,
            'ai_bullet_insights': bullet_insights,
        })


class ReportRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ReportRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        firm_id = self.request.query_params.get('firm_id')
        if firm_id:
            return ReportRequest.objects.filter(firm_id=firm_id)
        return ReportRequest.objects.none()

    @action(detail=True, methods=['patch'], url_path='update_status')
    def update_status(self, request, pk=None):
        obj = self.get_object()
        new_status = request.data.get('status')
        valid = ['pending', 'acknowledged', 'generated', 'delivered']
        if new_status not in valid:
            return Response({'error': f'Invalid status. Choose from: {valid}'}, status=400)
        obj.status = new_status
        obj.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(obj).data)
