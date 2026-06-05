from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DocumentAnalysis
from .serializers import DocumentAnalysisSerializer
from .tasks import analyze_document_task


class DocumentAnalysisListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        analyses = DocumentAnalysis.objects.filter(requested_by=str(request.user.id))
        serializer = DocumentAnalysisSerializer(analyses, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DocumentAnalysisSerializer(data=request.data)
        if serializer.is_valid():
            analysis = serializer.save(requested_by=str(request.user.id))
            analyze_document_task.delay(str(analysis.id))
            return Response(DocumentAnalysisSerializer(analysis).data, status=201)
        return Response(serializer.errors, status=400)


class DocumentAnalysisDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, analysis_id):
        try:
            analysis = DocumentAnalysis.objects.get(id=analysis_id, requested_by=str(request.user.id))
            serializer = DocumentAnalysisSerializer(analysis)
            return Response(serializer.data)
        except DocumentAnalysis.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
