"""
Notification Service - Views & ViewSets
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from .models import Notification, NotificationTemplate
from .serializers import NotificationSerializer, NotificationListSerializer
import uuid
import json
import logging

logger = logging.getLogger(__name__)


def _send_email(to_email: str, subject: str, body: str):
    """Send email via SendGrid if API key is configured, otherwise log."""
    from django.conf import settings
    api_key = getattr(settings, 'SENDGRID_API_KEY', '')
    from_email = getattr(settings, 'SENDGRID_FROM_EMAIL', 'noreply@lawbridge.cm')

    if not api_key:
        logger.info(f"[EMAIL no-op] To={to_email} Subject={subject}")
        return

    try:
        import urllib.request
        payload = json.dumps({
            "personalizations": [{"to": [{"email": to_email}]}],
            "from": {"email": from_email, "name": "Lawbridge"},
            "subject": subject,
            "content": [{"type": "text/plain", "value": body}],
        }).encode()
        req = urllib.request.Request(
            "https://api.sendgrid.com/v3/mail/send",
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            logger.info(f"Email sent to {to_email}: HTTP {resp.status}")
    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")

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


class CreateNotificationView(APIView):
    """
    Internal endpoint: POST /api/v1/notifications/internal/create/
    Called by case-service, document-service, etc. to create a notification and optionally email the user.
    Requires X-Internal-Key header.
    Body: {
      user_id, user_email (optional), event_type,
      title_en, title_fr, message_en, message_fr,
      metadata (optional), send_email (optional bool)
    }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from django.conf import settings
        key = request.headers.get('X-Internal-Key', '')
        if key != getattr(settings, 'INTERNAL_API_KEY', 'dev-internal-key'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        try:
            user_id = uuid.UUID(str(data['user_id']))
        except (KeyError, ValueError):
            return Response({'detail': 'user_id (UUID) required'}, status=400)

        notif = Notification.objects.create(
            user_id=user_id,
            event_type=data.get('event_type', 'case_updated'),
            title_en=data.get('title_en', ''),
            title_fr=data.get('title_fr', ''),
            message_en=data.get('message_en', ''),
            message_fr=data.get('message_fr', ''),
            metadata=data.get('metadata', {}),
        )

        if data.get('send_email') and data.get('user_email'):
            lang = data.get('lang', 'en')
            subject = data.get('title_fr' if lang == 'fr' else 'title_en', '') or data.get('title_en', 'Lawbridge Notification')
            body = data.get('message_fr' if lang == 'fr' else 'message_en', '') or data.get('message_en', '')
            _send_email(data['user_email'], subject, body)

        return Response({'id': str(notif.id)}, status=status.HTTP_201_CREATED)


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
