from django.urls import path
from .views import DocumentUploadView, DocumentListView, DocumentDownloadView, SignDocumentView

urlpatterns = [
    path('upload/<uuid:case_id>/', DocumentUploadView.as_view(), name='document-upload'),
    path('<uuid:document_id>/download/', DocumentDownloadView.as_view(), name='document-download'),
    path('<uuid:document_id>/sign/', SignDocumentView.as_view(), name='document-sign'),
    path('<uuid:case_id>/', DocumentListView.as_view(), name='document-list'),
]
