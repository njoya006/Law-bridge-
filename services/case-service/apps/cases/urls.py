from django.urls import path
from .views import CaseListView, CaseDetailView, CaseAssignView, CaseNoteView

urlpatterns = [
    path('', CaseListView.as_view(), name='case-list'),
    path('<uuid:case_id>/', CaseDetailView.as_view(), name='case-detail'),
    path('<uuid:case_id>/assign/', CaseAssignView.as_view(), name='case-assign'),
    path('<uuid:case_id>/notes/', CaseNoteView.as_view(), name='case-notes'),
]
