"""
Notification Service - Admin Configuration
"""
from django.contrib import admin
from .models import Notification, NotificationTemplate

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'event_type', 'read', 'created_at')
    list_filter = ('event_type', 'read', 'created_at')
    search_fields = ('user_id', 'title_en', 'title_fr')
    readonly_fields = ('id', 'created_at')
    date_hierarchy = 'created_at'

@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'created_at', 'updated_at')
    search_fields = ('event_type',)
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Template Info', {'fields': ('event_type',)}),
        ('English', {'fields': ('template_en',)}),
        ('French', {'fields': ('template_fr',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
