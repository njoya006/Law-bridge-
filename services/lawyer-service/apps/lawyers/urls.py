from django.urls import path
from .views import LawyerProfileView, LawyerAvailabilityView, LawyerPublicDetailView
from .mentorship_views import (
    MentorshipPrefsView, MentorshipMatchesView,
    MentorshipRequestListView, MentorshipRequestDetailView,
)

urlpatterns = [
    path('me/', LawyerProfileView.as_view(), name='lawyer-profile'),
    path('me/availability/', LawyerAvailabilityView.as_view(), name='lawyer-availability'),
    # Mentorship — registered before the <uuid> catch-all so 'mentorship' isn't
    # mistaken for a lawyer id.
    path('mentorship/prefs/', MentorshipPrefsView.as_view(), name='mentorship-prefs'),
    path('mentorship/matches/', MentorshipMatchesView.as_view(), name='mentorship-matches'),
    path('mentorship/requests/', MentorshipRequestListView.as_view(), name='mentorship-requests'),
    path('mentorship/requests/<uuid:req_id>/', MentorshipRequestDetailView.as_view(), name='mentorship-request-detail'),
    path('<uuid:lawyer_id>/', LawyerPublicDetailView.as_view(), name='lawyer-public-detail'),
]
