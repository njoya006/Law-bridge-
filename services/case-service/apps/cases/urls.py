from django.urls import path
from .views import (
    CaseListView, CaseDetailView, CaseAssignView, CaseNoteView,
    CaseStatusUpdateView, BookingAcceptView, BookingDeclineView, IncomingBookingsView,
    OpenCasesView, CaseApplicationView,
    ReassignmentView, ReassignmentConfirmView, ReassignmentCancelView, ReassignmentSelectLawyerView,
)

urlpatterns = [
    path('', CaseListView.as_view(), name='case-list'),
    path('open/', OpenCasesView.as_view(), name='open-cases'),
    path('incoming-bookings/', IncomingBookingsView.as_view(), name='incoming-bookings'),
    path('<uuid:case_id>/', CaseDetailView.as_view(), name='case-detail'),
    path('<uuid:case_id>/assign/', CaseAssignView.as_view(), name='case-assign'),
    path('<uuid:case_id>/status/', CaseStatusUpdateView.as_view(), name='case-status-update'),
    path('<uuid:case_id>/notes/', CaseNoteView.as_view(), name='case-notes'),
    path('<uuid:case_id>/accept/', BookingAcceptView.as_view(), name='booking-accept'),
    path('<uuid:case_id>/decline/', BookingDeclineView.as_view(), name='booking-decline'),
    path('<uuid:case_id>/apply/', CaseApplicationView.as_view(), name='case-apply'),
    path('<uuid:case_id>/reassignment/', ReassignmentView.as_view(), name='case-reassignment'),
    path('<uuid:case_id>/reassignment/confirm/', ReassignmentConfirmView.as_view(), name='case-reassignment-confirm'),
    path('<uuid:case_id>/reassignment/cancel/', ReassignmentCancelView.as_view(), name='case-reassignment-cancel'),
    path('<uuid:case_id>/reassignment/select-lawyer/', ReassignmentSelectLawyerView.as_view(), name='case-reassignment-select-lawyer'),
]
