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
