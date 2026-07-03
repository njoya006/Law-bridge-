from django.urls import path
from . import views

urlpatterns = [
    path('threads/', views.ThreadListCreateView.as_view()),
    path('threads/<int:pk>/', views.ThreadDetailView.as_view()),
    path('threads/<int:pk>/messages/', views.MessageListView.as_view()),
    path('threads/<int:pk>/read/', views.mark_read),
    path('threads/<int:pk>/escalate/', views.escalate_thread),
    path('threads/<int:pk>/messages/<int:message_id>/react/', views.toggle_reaction),
]
