"""
Network Service - Serializers
"""
from rest_framework import serializers
from .models import Follow, Referral, FeedItem


class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ('id', 'follower_id', 'following_id', 'created_at')
        read_only_fields = ('id', 'follower_id', 'created_at')


class ReferralSerializer(serializers.ModelSerializer):
    class Meta:
        model = Referral
        fields = (
            'id', 'referrer_id', 'referred_lawyer_id',
            'client_name', 'client_email', 'case_type', 'notes',
            'status', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'referrer_id', 'created_at', 'updated_at')


class FeedItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedItem
        fields = (
            'id', 'actor_id', 'item_type', 'title', 'body',
            'external_id', 'external_url', 'created_at',
        )
        read_only_fields = ('id', 'created_at')
