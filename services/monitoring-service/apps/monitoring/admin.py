from django.contrib import admin
from .models import CaseProgressSnapshot, LawyerStats

@admin.register(CaseProgressSnapshot)
class CaseProgressSnapshotAdmin(admin.ModelAdmin):
    list_display = ('case_id', 'status', 'client_id', 'assigned_lawyer_id', 'updated_at')
    search_fields = ('case_id', 'client_id', 'assigned_lawyer_id')
    list_filter = ('status',)

@admin.register(LawyerStats)
class LawyerStatsAdmin(admin.ModelAdmin):
    list_display = ('lawyer_id', 'active_cases', 'closed_cases_count', 'avg_resolution_days', 'cases_this_month', 'updated_at')
    search_fields = ('lawyer_id',)
