from django.urls import path
from .views import DocumentAnalysisListView, DocumentAnalysisDetailView, DirectFileAnalysisView

urlpatterns = [
    path('', DocumentAnalysisListView.as_view(), name='document-analysis-list'),
    path('direct/', DirectFileAnalysisView.as_view(), name='document-analysis-direct'),
    path('<uuid:analysis_id>/', DocumentAnalysisDetailView.as_view(), name='document-analysis-detail'),
]
