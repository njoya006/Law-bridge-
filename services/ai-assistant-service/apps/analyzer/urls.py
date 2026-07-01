from django.urls import path
from .views import DocumentAnalysisListView, DocumentAnalysisDetailView, DirectFileAnalysisView, ContractIntelligenceView

urlpatterns = [
    path('', DocumentAnalysisListView.as_view(), name='document-analysis-list'),
    path('direct/', DirectFileAnalysisView.as_view(), name='document-analysis-direct'),
    path('contract/', ContractIntelligenceView.as_view(), name='contract-intelligence'),
    path('<uuid:analysis_id>/', DocumentAnalysisDetailView.as_view(), name='document-analysis-detail'),
]
