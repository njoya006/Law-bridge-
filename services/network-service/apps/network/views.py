"""
Network Service - Views & ViewSets
"""
import uuid
import logging

from django.db.models import Q
from django.utils import timezone
from decouple import config
from rest_framework import viewsets, status, mixins
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Follow, Referral, FeedItem
from .serializers import FollowSerializer, ReferralSerializer, FeedItemSerializer
from .integrations import notify

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
        follow = serializer.save(follower_id=user_id)
        # Notify the followed lawyer that they have a new follower.
        payload = getattr(self.request, 'auth_payload', {}) or {}
        follower_name = payload.get('full_name') or 'A colleague'
        notify(
            follow.following_id, 'new_follower',
            'New follower',
            f'{follower_name} started following you on LawBridge.',
        )


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
        if not user_id:
            return Referral.objects.none()
        # Both parties see the referral: the one who sent it AND the one who received it.
        return Referral.objects.filter(Q(referrer_id=user_id) | Q(referred_lawyer_id=user_id))

    def perform_create(self, serializer):
        user_id = _get_user_id(self.request)
        ref = serializer.save(referrer_id=user_id)
        # Notify the referred lawyer that a matter has been sent their way.
        notify(
            ref.referred_lawyer_id, 'referral_received',
            'New client referral',
            f'A colleague referred {ref.client_name} to you'
            + (f' for a {ref.case_type} matter' if ref.case_type else '')
            + (f'. Agreed referral share: {ref.fee_split_pct}%.' if ref.fee_split_pct else '.'),
            send_email=True,
        )

    def perform_update(self, serializer):
        prev_status = serializer.instance.status
        ref = serializer.save()
        new_status = ref.status
        if new_status != prev_status and new_status in ('accepted', 'declined', 'completed'):
            ref.responded_at = timezone.now()
            ref.save(update_fields=['responded_at'])
            labels = {'accepted': 'accepted', 'declined': 'declined', 'completed': 'marked complete'}
            # Tell the referrer how their referral is progressing.
            notify(
                ref.referrer_id, f'referral_{new_status}',
                f'Referral {labels[new_status]}',
                f'Your referral of {ref.client_name} was {labels[new_status]}'
                + (f'. Your {ref.fee_split_pct}% share applies.' if new_status == 'completed' and ref.fee_split_pct else '.'),
                send_email=(new_status == 'completed'),
            )
            # A completed referral is public professional activity → feed event.
            if new_status == 'completed':
                FeedItem.objects.create(
                    actor_id=ref.referred_lawyer_id,
                    item_type='referral_completed',
                    title='Completed a referred matter',
                    body=f'{ref.case_type or "A referred matter"} concluded successfully.',
                )


class FeedItemListView(APIView):
    """
    GET /api/v1/network/feed/
    Personalised professional activity feed: items from the lawyers you follow,
    plus your own. Falls back to recent global activity for lawyers who don't yet
    follow anyone, so the feed is never empty for a new user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = _get_user_id(request)
        if not user_id:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        following = list(
            Follow.objects.filter(follower_id=user_id).values_list('following_id', flat=True)
        )
        actor_ids = following + [user_id]
        items = FeedItem.objects.filter(actor_id__in=actor_ids).order_by('-created_at')[:50]

        # New lawyer with no follows yet — show recent platform activity so the feed
        # is a place worth returning to rather than an empty state.
        if not items and not following:
            items = FeedItem.objects.all().order_by('-created_at')[:30]

        return Response(FeedItemSerializer(items, many=True).data)


class NetworkStatsView(APIView):
    """GET /api/v1/network/stats/ — network-density metrics for the admin/investor view."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payload = getattr(request, 'auth_payload', {}) or {}
        if payload.get('role', '') not in ('admin', 'support'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        from django.db.models import Count
        total_follows = Follow.objects.count()
        distinct_followers = Follow.objects.values('follower_id').distinct().count()
        referrals = Referral.objects.count()
        completed = Referral.objects.filter(status='completed').count()
        accepted = Referral.objects.filter(status__in=['accepted', 'completed']).count()
        feed_items = FeedItem.objects.count()
        return Response({
            'total_follows': total_follows,
            'lawyers_following': distinct_followers,
            'avg_follows_per_active': round(total_follows / distinct_followers, 1) if distinct_followers else 0,
            'total_referrals': referrals,
            'referrals_accepted': accepted,
            'referrals_completed': completed,
            'referral_acceptance_rate': round(100 * accepted / referrals) if referrals else 0,
            'feed_events': feed_items,
        })


class InternalFeedEmitView(APIView):
    """
    POST /api/v1/network/feed/internal/  (internal-key; blocked at the public edge)
    Lets other services publish professional-activity feed items:
    case wins, verifications, tier-ups, capacity changes.
    """
    permission_classes = []

    def post(self, request):
        key = request.headers.get('X-Internal-Key', '')
        if key != config('INTERNAL_API_KEY', default='dev-internal-key'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data
        actor_raw = data.get('actor_id')
        item_type = data.get('item_type')
        title = data.get('title', '')
        if not actor_raw or not item_type:
            return Response({'detail': 'actor_id and item_type are required'}, status=status.HTTP_400_BAD_REQUEST)
        valid_types = {t[0] for t in FeedItem.TYPES}
        if item_type not in valid_types:
            return Response({'detail': f'invalid item_type; one of {sorted(valid_types)}'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            actor_id = uuid.UUID(str(actor_raw))
        except (ValueError, AttributeError):
            return Response({'detail': 'invalid actor_id UUID'}, status=status.HTTP_400_BAD_REQUEST)
        item = FeedItem.objects.create(
            actor_id=actor_id,
            item_type=item_type,
            title=title[:255],
            body=data.get('body', ''),
            external_id=str(data.get('external_id', ''))[:255],
            external_url=data.get('external_url', '') or '',
        )
        return Response({'id': str(item.id), 'created': True}, status=status.HTTP_201_CREATED)


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
