from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseProgressViewSet, LawyerStatsViewSet, InternalCaseSyncView

router = DefaultRouter()
router.register(r'case-progress', CaseProgressViewSet, basename='case-progress')
router.register(r'lawyer-stats', LawyerStatsViewSet, basename='lawyer-stats')

urlpatterns = [
    path('', include(router.urls)),
    path('internal/sync/', InternalCaseSyncView.as_view(), name='internal-case-sync'),
]
