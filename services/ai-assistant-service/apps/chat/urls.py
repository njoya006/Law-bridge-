from django.urls import path
from .views import (
    ChatView, ChatSessionListView, ChatSessionDetailView,
    LegalDraftCreateView, LegalDraftListView, LegalDraftDetailView,
    DraftClarifyView, LegalDraftStreamView,
)

urlpatterns = [
    path('chat/', ChatView.as_view(), name='chat'),
    path('sessions/', ChatSessionListView.as_view(), name='chat-session-list'),
    path('sessions/<uuid:session_id>/', ChatSessionDetailView.as_view(), name='chat-session-detail'),
    path('drafts/', LegalDraftListView.as_view(), name='legal-draft-list'),
    path('drafts/clarify/', DraftClarifyView.as_view(), name='legal-draft-clarify'),
    path('drafts/stream/', LegalDraftStreamView.as_view(), name='legal-draft-stream'),
    path('drafts/create/', LegalDraftCreateView.as_view(), name='legal-draft-create'),
    path('drafts/<uuid:draft_id>/', LegalDraftDetailView.as_view(), name='legal-draft-detail'),
]
