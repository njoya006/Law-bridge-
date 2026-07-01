from django.urls import path
from .views import (
    ChatView, ChatSessionListView, ChatSessionDetailView,
    LegalDraftCreateView, LegalDraftListView, LegalDraftDetailView,
    DraftClarifyView, LegalDraftStreamView, DraftTranslateView,
    LegalResearchView, FirmInsightsView, MeetingSummaryView, IntakeGenerateView,
)

urlpatterns = [
    path('chat/', ChatView.as_view(), name='chat'),
    path('sessions/', ChatSessionListView.as_view(), name='chat-session-list'),
    path('sessions/<uuid:session_id>/', ChatSessionDetailView.as_view(), name='chat-session-detail'),
    path('drafts/', LegalDraftListView.as_view(), name='legal-draft-list'),
    path('drafts/clarify/', DraftClarifyView.as_view(), name='legal-draft-clarify'),
    path('drafts/stream/', LegalDraftStreamView.as_view(), name='legal-draft-stream'),
    path('drafts/translate/', DraftTranslateView.as_view(), name='legal-draft-translate'),
    path('drafts/create/', LegalDraftCreateView.as_view(), name='legal-draft-create'),
    path('drafts/<uuid:draft_id>/', LegalDraftDetailView.as_view(), name='legal-draft-detail'),
    path('research/', LegalResearchView.as_view(), name='legal-research'),
    path('insights/', FirmInsightsView.as_view(), name='firm-insights'),
    path('meetings/summarize/', MeetingSummaryView.as_view(), name='meeting-summarize'),
    path('intake/generate/', IntakeGenerateView.as_view(), name='intake-generate'),
]
