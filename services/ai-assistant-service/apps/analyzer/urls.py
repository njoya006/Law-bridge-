from django.urls import path
from .views import DocumentAnalysisListView, DocumentAnalysisDetailView

urlpatterns = [
    path('', DocumentAnalysisListView.as_view(), name='document-analysis-list'),
    path('<uuid:analysis_id>/', DocumentAnalysisDetailView.as_view(), name='document-analysis-detail'),
]
