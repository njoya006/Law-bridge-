"""
Network Service - Views & ViewSets
"""
import uuid
import logging

from rest_framework import viewsets, status, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Follow, Referral, FeedItem
from .serializers import FollowSerializer, ReferralSerializer, FeedItemSerializer

logger = logging.getLogger(__name__)


def _get_user_id(request):
    """Extract UUID user_id from JWT auth payload."""
    payload = getattr(request, 'auth_payload', {}) or {}
    raw = payload.get('user_id')
    if not raw:
        return None
    try:
        return uuid.UUID(str(raw))
    except (ValueError, AttributeError):
        return None


class FollowViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    list:   GET  /api/v1/network/follows/        — list lawyers I follow
    create: POST /api/v1/network/follows/        — follow a lawyer
    destroy: DELETE /api/v1/network/follows/{id}/ — unfollow
    """
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user_id = _get_user_id(self.request)
        if user_id:
            return Follow.objects.filter(follower_id=user_id)
        return Follow.objects.none()

    def perform_create(self, serializer):
        user_id = _get_user_id(self.request)
        serializer.save(follower_id=user_id)


class ReferralViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """
    list:         GET   /api/v1/network/referrals/        — list my referrals
    create:       POST  /api/v1/network/referrals/        — create referral
    partial_update: PATCH /api/v1/network/referrals/{id}/ — update status
    """
    serializer_class = ReferralSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user_id = _get_user_id(self.request)
        if user_id:
            return Referral.objects.filter(referrer_id=user_id)
        return Referral.objects.none()

    def perform_create(self, serializer):
        user_id = _get_user_id(self.request)
        serializer.save(referrer_id=user_id)


class FeedItemListView(APIView):
    """
    GET /api/v1/network/feed/
    Returns the last 50 FeedItems ordered by -created_at.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = _get_user_id(request)
        if not user_id:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        items = FeedItem.objects.all().order_by('-created_at')[:50]
        serializer = FeedItemSerializer(items, many=True)
        return Response(serializer.data)


class FollowerCountView(APIView):
    """
    GET /api/v1/network/lawyers/<lawyer_id>/follower-count/
    Returns {"count": N} — the number of users following this lawyer.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, lawyer_id):
        try:
            lid = uuid.UUID(str(lawyer_id))
        except (ValueError, AttributeError):
            return Response({'detail': 'Invalid lawyer_id.'}, status=status.HTTP_400_BAD_REQUEST)
        count = Follow.objects.filter(following_id=lid).count()
        return Response({'count': count})
