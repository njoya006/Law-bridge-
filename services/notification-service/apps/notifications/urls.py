"""
Notification Service - URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, NotificationTemplateViewSet, CreateNotificationView

router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')
router.register(r'templates', NotificationTemplateViewSet, basename='template')

urlpatterns = [
    path('internal/create/', CreateNotificationView.as_view(), name='internal-create'),
    path('', include(router.urls)),
]
