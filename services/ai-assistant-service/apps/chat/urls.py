from django.urls import path
from .views import ChatView, ChatSessionListView, ChatSessionDetailView, TestGenerateView

urlpatterns = [
    path('chat/', ChatView.as_view(), name='chat'),
    path('sessions/', ChatSessionListView.as_view(), name='chat-session-list'),
    path('sessions/<uuid:session_id>/', ChatSessionDetailView.as_view(), name='chat-session-detail'),
    path('test-generate/', TestGenerateView.as_view(), name='test-generate'),
]
