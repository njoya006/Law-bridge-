from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ConflictCheck
from .serializers import ConflictCheckSerializer


class ConflictCheckView(APIView):
    """Check for conflicts of interest"""
    
    def get(self, request, case_id):
        """GET /api/v1/conflicts/{case_id}/ - Check conflicts"""
        conflicts = ConflictCheck.objects.filter(case_id=case_id)
        serializer = ConflictCheckSerializer(conflicts, many=True)
        return Response({
            'count': conflicts.count(),
            'results': serializer.data
        })


urlpatterns = [
    path('<uuid:case_id>/', ConflictCheckView.as_view(), name='conflict-check'),
]
