from rest_framework import serializers
from .models import Document, DocumentSignature


class DocumentSignatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentSignature
        fields = ('id', 'signer_id', 'signer_name', 'signature_type', 'stamp_type', 'signed_at')
        read_only_fields = ('id', 'signed_at')


class DocumentSerializer(serializers.ModelSerializer):
    is_password_protected = serializers.SerializerMethodField()
    signatures = DocumentSignatureSerializer(many=True, read_only=True)

    def get_is_password_protected(self, obj: Document):
        return bool(obj.password_hash)

    class Meta:
        model = Document
        fields = (
            'id', 'case_id', 'uploader_id', 'filename', 'document_type',
            'status', 'file_size', 'mime_type', 'minio_path', 'is_encrypted',
            'version', 'parent_document_id',
            'created_at', 'updated_at', 'is_password_protected', 'signatures',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'status', 'is_encrypted')
