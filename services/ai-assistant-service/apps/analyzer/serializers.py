from rest_framework import serializers
from .models import DocumentAnalysis


class DocumentAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentAnalysis
        fields = '__all__'
        read_only_fields = ('requested_by', 'status', 'raw_response', 'error_message', 'completed_at')
