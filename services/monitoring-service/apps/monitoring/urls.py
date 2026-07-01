from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CaseProgressViewSet, LawyerStatsViewSet, InternalCaseSyncView,
    ReportRequestViewSet, CaseRiskView, FirmIntelligenceView,
)

router = DefaultRouter()
router.register(r'case-progress', CaseProgressViewSet, basename='case-progress')
router.register(r'lawyer-stats', LawyerStatsViewSet, basename='lawyer-stats')
router.register(r'report-requests', ReportRequestViewSet, basename='report-requests')

urlpatterns = [
    path('', include(router.urls)),
    path('internal/sync/', InternalCaseSyncView.as_view(), name='internal-case-sync'),
    path('case-risks/', CaseRiskView.as_view(), name='case-risks'),
    path('firm-intelligence/', FirmIntelligenceView.as_view(), name='firm-intelligence'),
]
