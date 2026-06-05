from django.contrib import admin
from .models import Firm, FirmMembership, Invite


@admin.register(Firm)
class FirmAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at')


@admin.register(FirmMembership)
class FirmMembershipAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'firm', 'role', 'is_active')


@admin.register(Invite)
class InviteAdmin(admin.ModelAdmin):
    list_display = ('token', 'email', 'firm', 'role', 'created_at', 'accepted_at')
