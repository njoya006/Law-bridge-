from django.urls import path
from .views import (
    CaseListView, CaseDetailView, CaseAssignView, CaseNoteView,
    BookingAcceptView, BookingDeclineView, IncomingBookingsView,
)

urlpatterns = [
    path('', CaseListView.as_view(), name='case-list'),
    path('incoming-bookings/', IncomingBookingsView.as_view(), name='incoming-bookings'),
    path('<uuid:case_id>/', CaseDetailView.as_view(), name='case-detail'),
    path('<uuid:case_id>/assign/', CaseAssignView.as_view(), name='case-assign'),
    path('<uuid:case_id>/notes/', CaseNoteView.as_view(), name='case-notes'),
    path('<uuid:case_id>/accept/', BookingAcceptView.as_view(), name='booking-accept'),
    path('<uuid:case_id>/decline/', BookingDeclineView.as_view(), name='booking-decline'),
]
