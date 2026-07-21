"""
Network Service - URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FollowViewSet, ReferralViewSet, FeedItemListView, FollowerCountView

router = DefaultRouter()
router.register(r'follows', FollowViewSet, basename='follow')
router.register(r'referrals', ReferralViewSet, basename='referral')

urlpatterns = [
    path('feed/', FeedItemListView.as_view(), name='feed'),
    path('lawyers/<uuid:lawyer_id>/follower-count/', FollowerCountView.as_view(), name='follower-count'),
    path('', include(router.urls)),
]
