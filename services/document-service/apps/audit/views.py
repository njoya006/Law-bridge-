from rest_framework.views import APIView
from rest_framework.response import Response
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogView(APIView):
    """Retrieve audit logs for document operations"""
    
    def get(self, request, document_id):
        """GET /api/v1/audit/{document_id}/ - Get audit trail"""
        logs = AuditLog.objects.filter(document_id=document_id)
        serializer = AuditLogSerializer(logs, many=True)
        return Response({
            'count': logs.count(),
            'results': serializer.data
        })
