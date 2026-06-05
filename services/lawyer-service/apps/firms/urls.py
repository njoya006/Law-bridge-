from django.urls import path
from .views import (
    FirmBrowseView,
    FirmSearchView,
    FirmDetailView,
    FirmMembersView,
    MyFirmMembershipsView,
    FirmCreateView,
    InviteCreateView,
    InviteAcceptView,
    MemberRoleUpdateView,
    MemberAssignFirmView,
    MemberDeleteView,
    UserFirmMembershipsView,
)

urlpatterns = [
    path('', FirmBrowseView.as_view(), name='firm-browse'),
    path('create/', FirmCreateView.as_view(), name='firm-create'),
    path('search/', FirmSearchView.as_view(), name='firm-search'),
    path('<int:firm_id>/', FirmDetailView.as_view(), name='firm-detail'),
    path('me/', MyFirmMembershipsView.as_view(), name='my-firm-memberships'),
    path('<int:firm_id>/members/', FirmMembersView.as_view(), name='firm-members'),
    path('<int:firm_id>/invites/', InviteCreateView.as_view(), name='firm-invites'),
    path('invites/<uuid:token>/accept/', InviteAcceptView.as_view(), name='invite-accept'),
    path('internal/users/<uuid:user_id>/memberships/', UserFirmMembershipsView.as_view(), name='user-firm-memberships'),
    path('members/<int:member_id>/role/', MemberRoleUpdateView.as_view(), name='member-role-update'),
    path('members/<int:member_id>/firm/', MemberAssignFirmView.as_view(), name='member-assign-firm'),
    path('members/<int:member_id>/', MemberDeleteView.as_view(), name='member-delete'),
]
