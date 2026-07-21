"""
Network Service - Admin Configuration
"""
from django.contrib import admin
from .models import Follow, Referral, FeedItem


@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('id', 'follower_id', 'following_id', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('follower_id', 'following_id')
    readonly_fields = ('id', 'created_at')


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ('id', 'referrer_id', 'referred_lawyer_id', 'client_name', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('referrer_id', 'referred_lawyer_id', 'client_name', 'client_email')
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(FeedItem)
class FeedItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'actor_id', 'item_type', 'title', 'created_at')
    list_filter = ('item_type', 'created_at')
    search_fields = ('actor_id', 'title', 'external_id')
    readonly_fields = ('id', 'created_at')
