from django.urls import path
from .views import LawyerProfileView, LawyerAvailabilityView, LawyerPublicDetailView

urlpatterns = [
    path('me/', LawyerProfileView.as_view(), name='lawyer-profile'),
    path('me/availability/', LawyerAvailabilityView.as_view(), name='lawyer-availability'),
    path('<uuid:lawyer_id>/', LawyerPublicDetailView.as_view(), name='lawyer-public-detail'),
]
