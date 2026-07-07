from django.urls import path
from .views import ReviewListCreateView

urlpatterns = [
    path('<uuid:lawyer_id>/reviews/', ReviewListCreateView.as_view()),
]
