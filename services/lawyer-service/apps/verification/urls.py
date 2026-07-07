from django.urls import path
from .views import VerificationSubmitView, VerificationQueueView, VerificationActionView

urlpatterns = [
    path('verification/', VerificationSubmitView.as_view()),
    path('verification/queue/', VerificationQueueView.as_view()),
    path('verification/<uuid:pk>/<str:action>/', VerificationActionView.as_view()),
]
