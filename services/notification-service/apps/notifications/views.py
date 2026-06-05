"""
Notification Service - Views & ViewSets
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification, NotificationTemplate
from .serializers import NotificationSerializer, NotificationListSerializer
import uuid
import json

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for notifications:
    - GET /api/v1/notifications/ - List user's notifications
    - GET /api/v1/notifications/{id}/ - Retrieve single notification
    - GET /api/v1/notifications/unread-count/ - Get unread count
    - PATCH /api/v1/notifications/{id}/read/ - Mark as read
    - DELETE /api/v1/notifications/{id}/ - Delete notification
    """
    serializer_class = NotificationListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get only this user's notifications"""
        # Extract user_id from the decoded auth token, not the local Django user PK.
        payload = getattr(self.request, 'auth_payload', {}) or {}
        try:
            user_id = uuid.UUID(str(payload.get('user_id'))) if payload.get('user_id') else None
        except (ValueError, AttributeError):
            user_id = None
        
        if user_id:
            return Notification.objects.filter(user_id=user_id)
        return Notification.objects.none()
    
    def get_serializer_context(self):
        """Pass language preference to serializer"""
        context = super().get_serializer_context()
        context['language'] = self.request.query_params.get('language', 'en')
        return context
    
    def list(self, request, *args, **kwargs):
        """List notifications with pagination"""
        queryset = self.get_queryset()
        limit = int(request.query_params.get('limit', 10))
        offset = int(request.query_params.get('offset', 0))
        
        paginated_qs = queryset[offset:offset+limit]
        
        serializer = self.get_serializer(
            paginated_qs, 
            many=True,
            context=self.get_serializer_context()
        )
        
        return Response({
            'count': queryset.count(),
            'limit': limit,
            'offset': offset,
            'results': serializer.data
        })
    
    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.read = True
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        queryset = self.get_queryset()
        count = queryset.filter(read=False).count()
        return Response({'unread_count': count})
    
    @action(detail=False, methods=['delete'])
    def delete_all(self, request):
        """Delete all read notifications for user"""
        queryset = self.get_queryset()
        deleted_count, _ = queryset.filter(read=True).delete()
        return Response({'deleted': deleted_count})


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """Admin endpoint to manage notification templates"""
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Only allow GET unless user is admin"""
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        # For POST/PUT/DELETE, would need admin permission (not implemented)
        return super().get_permissions()
