from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    is_password_protected = serializers.SerializerMethodField()

    def get_is_password_protected(self, obj: Document):
        return bool(obj.password_hash)
    class Meta:
        model = Document
        fields = (
            'id', 'case_id', 'uploader_id', 'filename', 'document_type',
            'status', 'file_size', 'mime_type', 'minio_path', 'is_encrypted', 'version',
            'created_at', 'updated_at', 'is_password_protected'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'status', 'is_encrypted')
