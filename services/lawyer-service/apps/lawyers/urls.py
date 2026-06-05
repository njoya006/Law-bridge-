from django.urls import path
from .views import LawyerProfileView

urlpatterns = [
    path('me/', LawyerProfileView.as_view(), name='lawyer-profile'),
]
