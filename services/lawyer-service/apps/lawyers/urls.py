from django.urls import path
from .views import LawyerProfileView, LawyerAvailabilityView

urlpatterns = [
    path('me/', LawyerProfileView.as_view(), name='lawyer-profile'),
    path('me/availability/', LawyerAvailabilityView.as_view(), name='lawyer-availability'),
]
