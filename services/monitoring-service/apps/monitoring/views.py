import jwt
import uuid
import urllib.request as _ureq
import json as _json
import logging
from decouple import config
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import CaseProgressSnapshot, LawyerStats, ReportRequest, Notification
from .serializers import CaseProgressSnapshotSerializer, LawyerStatsSerializer, ReportRequestSerializer, NotificationSerializer

logger = logging.getLogger(__name__)


# ── Email helpers ─────────────────────────────────────────────────────────────

def _get_user_email(user_id: str) -> str:
    """Fetch user email from auth-service by UUID. Silent on failure."""
    auth_url = config('AUTH_SERVICE_URL', default='http://auth-service:8001').rstrip('/')
    try:
        req = _ureq.Request(
            f'{auth_url}/api/v1/auth/users/{user_id}/',
            headers={'X-Internal-Key': config('INTERNAL_API_KEY', default='dev-internal-key')},
        )
        with _ureq.urlopen(req, timeout=3) as resp:
            data = _json.loads(resp.read())
            return data.get('email', '')
    except Exception as exc:
        logger.debug('Could not fetch email for user %s: %s', user_id, exc)
        return ''


def _send_notification_email(user_id: str, subject: str, body: str):
    """Look up user email then send via SendGrid. No-op if API key not configured."""
    api_key = config('SENDGRID_API_KEY', default='')
    if not api_key:
        return
    email = _get_user_email(user_id)
    if not email:
        return
    from_email = config('SENDGRID_FROM_EMAIL', default='noreply@lawbridge.cm')
    try:
        payload = _json.dumps({
            'personalizations': [{'to': [{'email': email}]}],
            'from': {'email': from_email, 'name': 'LawBridge'},
            'subject': subject,
            'content': [{'type': 'text/plain', 'value': body + '\n\n— The LawBridge Team\nhttps://law-bridge-two.vercel.app'}],
        }).encode()
        req = _ureq.Request(
            'https://api.sendgrid.com/v3/mail/send',
            data=payload,
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            method='POST',
        )
        with _ureq.urlopen(req, timeout=10) as resp:
            logger.info('Email sent to %s (user %s): HTTP %s', email, user_id, resp.status)
    except Exception as exc:
        logger.error('Email send failed for user %s: %s', user_id, exc)


def _get_firm_scope(auth_header):
    """Return (firm_id, firm_name, frozenset_of_lawyer_uuids) for the authenticated user.
    Calls lawyer-service via /me/ then /firms/{id}/members/.
    Falls back to (None, '', None) on any error — callers treat None as 'no filter'."""
    lawyer_svc = config('LAWYER_SERVICE_URL', default='http://lawyer-service:80').rstrip('/') + '/api/v1/firms'

    # 1. User's own memberships
    try:
        req = _ureq.Request(f'{lawyer_svc}/me/', headers={'Authorization': auth_header})
        with _ureq.urlopen(req, timeout=5) as resp:
            memberships = _json.loads(resp.read())
    except Exception:
        return None, '', None

    if not memberships:
        return None, '', None

    firm_id = memberships[0].get('firm')
    if not firm_id:
        return None, '', None

    # 2. Firm name
    firm_name = ''
    try:
        req = _ureq.Request(f'{lawyer_svc}/{firm_id}/')
        with _ureq.urlopen(req, timeout=3) as resp:
            firm_data = _json.loads(resp.read())
            firm_name = firm_data.get('name', '')
    except Exception:
        pass

    # 3. All members → their auth-service UUIDs (internal key required since endpoint is now auth-gated)
    try:
        internal_key = config('INTERNAL_API_KEY', default='dev-internal-key')
        req = _ureq.Request(f'{lawyer_svc}/{firm_id}/members/', headers={'X-Internal-Api-Key': internal_key})
        with _ureq.urlopen(req, timeout=5) as resp:
            members = _json.loads(resp.read())
    except Exception:
        members = []

    uuids = frozenset(
        str(m['user_uuid']) for m in members if m.get('user_uuid')
    )
    return firm_id, firm_name, uuids

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
            from django.conf import settings as _settings
            token = auth.split(' ')[1]
            signing_key = _settings.SIMPLE_JWT.get('SIGNING_KEY', _settings.SECRET_KEY)
            payload = jwt.decode(token, signing_key, algorithms=['HS256'], options={'verify_aud': False})
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

        # Create in-app notifications (mirrors the Redis consumer path)
        from apps.monitoring.management.commands.consume_case_events import _create_case_notifications
        _create_case_notifications(data, snapshot, created)

        return Response({'created': created, 'case_id': case_id})


class CaseRiskView(APIView):
    """GET /api/v1/monitoring/case-risks/ — ranked list of active cases by risk score (firm-scoped)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        _, _, lawyer_uuids = _get_firm_scope(auth) if auth else (None, '', None)

        qs = CaseProgressSnapshot.objects.filter(status__in=list(ACTIVE_STATUSES))
        if lawyer_uuids is not None:
            qs = qs.filter(assigned_lawyer_id__in=lawyer_uuids)
        # Limit at DB level (sorted by most recently updated) before computing scores
        snapshots = qs.order_by('-updated_at')[:50]

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
    """GET /api/v1/monitoring/firm-intelligence/ — firm-scoped KPIs + AI narrative."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        firm_id, firm_name, lawyer_uuids = _get_firm_scope(auth) if auth else (None, '', None)

        # Scope snapshots to this firm's lawyers (lawyer_uuids=None → no filter, fallback)
        base_qs = CaseProgressSnapshot.objects
        if lawyer_uuids is not None:
            base_qs = base_qs.filter(assigned_lawyer_id__in=lawyer_uuids)

        active_snaps = base_qs.filter(status__in=list(ACTIVE_STATUSES))
        all_snaps = base_qs.all()

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

        # Lawyer load distribution (scoped to firm's lawyers when available)
        from django.db.models import Count
        stats_qs = LawyerStats.objects
        if lawyer_uuids is not None:
            stats_qs = stats_qs.filter(lawyer_id__in=lawyer_uuids)
        all_stats = list(stats_qs.order_by('-active_cases')[:20])

        if all_stats:
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
        else:
            # LawyerStats not yet populated — derive directly from snapshots
            active_by = {
                row['assigned_lawyer_id']: row['c']
                for row in active_snaps.exclude(assigned_lawyer_id__isnull=True)
                    .values('assigned_lawyer_id').annotate(c=Count('id'))
            }
            all_by = {
                row['assigned_lawyer_id']: row['c']
                for row in all_snaps.exclude(assigned_lawyer_id__isnull=True)
                    .values('assigned_lawyer_id').annotate(c=Count('id'))
            }
            lawyer_loads = sorted([
                {
                    'lawyer_id': lid,
                    'active_cases': active_by.get(lid, 0),
                    'closed_cases_count': max(all_by.get(lid, 0) - active_by.get(lid, 0), 0),
                    'avg_resolution_days': 0.0,
                    'cases_this_month': 0,
                }
                for lid in all_by
            ], key=lambda x: x['active_cases'], reverse=True)[:20]

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
            'firm_id': firm_id,
            'firm_name': firm_name,
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


class NotificationListView(APIView):
    """GET /notifications/ — returns the caller's notifications (most recent 50)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = str(getattr(request, 'auth_payload', {}).get('user_id', ''))
        if not user_id:
            return Response({'count': 0, 'unread': 0, 'results': []})

        qs = Notification.objects.filter(recipient_id=user_id).order_by('-created_at')[:50]
        unread = Notification.objects.filter(recipient_id=user_id, is_read=False).count()
        return Response({
            'count': len(qs),
            'unread': unread,
            'results': NotificationSerializer(qs, many=True).data,
        })


class NotificationUnreadCountView(APIView):
    """GET /notifications/unread-count/ — lightweight badge endpoint"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = str(getattr(request, 'auth_payload', {}).get('user_id', ''))
        count = Notification.objects.filter(recipient_id=user_id, is_read=False).count() if user_id else 0
        return Response({'unread': count})


class NotificationMarkReadView(APIView):
    """POST /notifications/{id}/read/ or POST /notifications/read-all/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        user_id = str(getattr(request, 'auth_payload', {}).get('user_id', ''))
        if pk == 'all':
            Notification.objects.filter(recipient_id=user_id, is_read=False).update(is_read=True)
            return Response({'detail': 'All notifications marked as read.'})
        try:
            notif = Notification.objects.get(pk=pk, recipient_id=user_id)
            notif.is_read = True
            notif.save(update_fields=['is_read'])
            return Response(NotificationSerializer(notif).data)
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)


class CreateInternalNotificationView(APIView):
    """POST /notifications/internal/ — called by calendar-service, case-service, etc. to push notifications."""
    permission_classes = []

    def post(self, request):
        key = request.headers.get('X-Internal-Key', '')
        if key != config('INTERNAL_API_KEY', default='dev-internal-key'):
            return Response({'error': 'Forbidden'}, status=403)

        data = request.data
        recipient_id_raw = data.get('recipient_id')
        notification_type = data.get('notification_type')
        title = data.get('title', '')
        body = data.get('body', '')
        case_id = data.get('case_id', '')
        send_email = data.get('send_email', False)

        if not recipient_id_raw or not notification_type:
            return Response({'error': 'recipient_id and notification_type are required'}, status=400)

        try:
            recipient_uuid = uuid.UUID(str(recipient_id_raw))
        except (ValueError, AttributeError):
            return Response({'error': 'Invalid recipient_id UUID'}, status=400)

        try:
            notif = Notification.objects.create(
                recipient_id=recipient_uuid,
                notification_type=notification_type,
                title=title,
                body=body,
                case_id=str(case_id) if case_id else '',
            )
            if send_email:
                _send_notification_email(str(recipient_id_raw), title, body)
            return Response({'id': str(notif.id), 'created': True}, status=201)
        except Exception as exc:
            logger.error('CreateInternalNotificationView error: %s', exc)
            return Response({'error': str(exc)}, status=400)


class AdminPlatformStatsView(APIView):
    """GET /api/v1/monitoring/admin/platform-stats/ — platform-wide case stats for admin/support."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        role = ''
        if auth.startswith('Bearer '):
            try:
                from django.conf import settings as _s
                token_str = auth.split(' ')[1]
                payload = jwt.decode(token_str, _s.SIMPLE_JWT.get('SIGNING_KEY', _s.SECRET_KEY),
                                     algorithms=['HS256'], options={'verify_aud': False})
                role = payload.get('role', '')
            except Exception:
                pass
        if role.lower() not in ('admin', 'support'):
            return Response({'error': 'Admin access required'}, status=403)

        from django.db.models import Count
        from datetime import timedelta
        from .models import TERMINAL_STATUSES

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        all_snaps = CaseProgressSnapshot.objects.all()

        case_type_dist = {
            (row['case_type'] or 'unknown'): row['count']
            for row in all_snaps.values('case_type').annotate(count=Count('id')).order_by('-count')
        }
        status_dist = {
            (row['status'] or 'unknown'): row['count']
            for row in all_snaps.values('status').annotate(count=Count('id')).order_by('-count')
        }

        total = all_snaps.count()
        active_count = all_snaps.filter(status__in=list(ACTIVE_STATUSES)).count()
        closed_count = all_snaps.filter(status__in=list(TERMINAL_STATUSES)).count()
        new_last_30 = all_snaps.filter(created_at__gte=thirty_days_ago).count()

        return Response({
            'total': total,
            'active': active_count,
            'closed': closed_count,
            'new_last_30_days': new_last_30,
            'case_type_distribution': case_type_dist,
            'status_distribution': status_dist,
        })
