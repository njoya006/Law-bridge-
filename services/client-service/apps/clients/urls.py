from django.urls import path
from .views import ClientProfileView, ClientEligibilityView

urlpatterns = [
    path('me/', ClientProfileView.as_view(), name='client-profile'),
    path('eligibility/', ClientEligibilityView.as_view(), name='client-eligibility'),
]
