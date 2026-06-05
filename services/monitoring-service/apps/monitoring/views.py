from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import CaseProgressSnapshot, LawyerStats
from .serializers import CaseProgressSnapshotSerializer, LawyerStatsSerializer

class CaseProgressViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CaseProgressSnapshotSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CaseProgressSnapshot.objects.all()

class LawyerStatsViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LawyerStatsSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'lawyer_id'
    
    def get_queryset(self):
        return LawyerStats.objects.all()
