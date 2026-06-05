from django.urls import path
from .views import LivenessView, ReadinessView, MetricsView

urlpatterns = [
    path('live/', LivenessView.as_view()),
    path('ready/', ReadinessView.as_view()),
    path('metrics/', MetricsView.as_view()),
]
