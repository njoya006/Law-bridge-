from django.contrib import admin
from .models import CalendarEvent, EventApproval, Alarm

@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'case_id', 'event_type', 'status', 'date', 'time', 'initiator_id')
    list_filter = ('event_type', 'status', 'date')
    search_fields = ('case_id', 'initiator_id')

@admin.register(EventApproval)
class EventApprovalAdmin(admin.ModelAdmin):
    list_display = ('id', 'event', 'approver_id', 'status', 'created_at')
    list_filter = ('status',)

@admin.register(Alarm)
class AlarmAdmin(admin.ModelAdmin):
    list_display = ('id', 'event', 'alarm_type', 'status', 'scheduled_for', 'sent_at')
    list_filter = ('alarm_type', 'status')
