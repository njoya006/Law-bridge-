from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FirmViewSet, InterviewViewSet, ContactViewSet, TaskViewSet, FeatureRequestViewSet

router = DefaultRouter()
router.register('firms', FirmViewSet, basename='firm')
router.register('interviews', InterviewViewSet, basename='interview')
router.register('contacts', ContactViewSet, basename='contact')
router.register('tasks', TaskViewSet, basename='task')
router.register('feature-requests', FeatureRequestViewSet, basename='feature-request')

urlpatterns = [
    path('', include(router.urls)),
]
