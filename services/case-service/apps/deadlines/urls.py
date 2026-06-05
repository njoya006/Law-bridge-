from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Deadline
from .serializers import DeadlineSerializer


class DeadlineListView(APIView):
    """List and create deadlines"""
    
    def get(self, request, case_id):
        """GET /api/v1/deadlines/{case_id}/ - List deadlines"""
        deadlines = Deadline.objects.filter(case_id=case_id)
        serializer = DeadlineSerializer(deadlines, many=True)
        return Response({
            'count': deadlines.count(),
            'results': serializer.data
        })
    
    def post(self, request, case_id):
        """POST /api/v1/deadlines/{case_id}/ - Create deadline"""
        serializer = DeadlineSerializer(data=request.data)
        if serializer.is_valid():
            deadline = Deadline.objects.create(
                case_id=case_id,
                **serializer.validated_data
            )
            return Response(
                DeadlineSerializer(deadline).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


urlpatterns = [
    path('<uuid:case_id>/', DeadlineListView.as_view(), name='deadline-list'),
]
