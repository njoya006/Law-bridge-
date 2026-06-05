from django.urls import path
from .views import AuditLogView

urlpatterns = [
    path('<uuid:document_id>/', AuditLogView.as_view(), name='audit-log'),
]
