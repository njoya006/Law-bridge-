from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from django.conf import settings
from io import BytesIO
from minio import Minio
from minio.error import S3Error
import jwt
import json
from decouple import config
from .models import Document
from .serializers import DocumentSerializer
import hashlib
import os
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def extract_user_id_from_token(request):
    """Extract user_id UUID from JWT token"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        try:
            token = auth_header.split(' ')[1]
            signing_key = settings.SIMPLE_JWT.get('SIGNING_KEY', settings.SECRET_KEY)
            payload = jwt.decode(token, signing_key, algorithms=['HS256'], options={'verify_aud': False})
            return payload.get('user_id')
        except Exception:
            pass
    return str(request.user.id)


STAFF_ROLES = {'lawyer', 'firm_admin', 'firm-admin', 'partner', 'associate', 'secretary', 'managing_partner'}


def extract_auth_payload(request):
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header.startswith('Bearer '):
        return {}
    token = auth_header.split(' ')[1]
    try:
        signing_key = settings.SIMPLE_JWT.get('SIGNING_KEY', settings.SECRET_KEY)
        return jwt.decode(token, signing_key, algorithms=['HS256'], options={'verify_aud': False})
    except Exception:
        return {}


def get_minio_client():
    endpoint = settings.MINIO_ENDPOINT
    return Minio(
        endpoint,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=False,
    )


def ensure_bucket_exists(client):
    bucket_name = settings.MINIO_BUCKET_NAME
    if not client.bucket_exists(bucket_name):
        client.make_bucket(bucket_name)


def is_internal_request(request):
    return request.META.get('HTTP_X_INTERNAL_API_KEY') == config('INTERNAL_API_KEY', default='dev-internal-key')


# Returns 'ok', 'forbidden', 'unauthorized', or 'service_error'
def can_access_case(request, case_id):
    if is_internal_request(request):
        return 'ok'

    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header.startswith('Bearer '):
        return 'unauthorized'

    base_url = settings.CASE_SERVICE_URL.rstrip('/')
    url = f'{base_url}/{case_id}/'
    try:
        req = Request(url, headers={'Authorization': auth_header})
        with urlopen(req, timeout=5) as response:
            return 'ok' if response.status == 200 else 'forbidden'
    except HTTPError as e:
        return 'forbidden' if e.code in (403, 404) else 'service_error'
    except (URLError, ValueError):
        return 'service_error'


def _access_error_response(access_result):
    """Convert a non-ok access result into a DRF Response."""
    if access_result == 'service_error':
        return Response(
            {'error': 'Unable to verify case access. The case service is temporarily unavailable. Please try again shortly.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    return Response(
        {'error': 'You do not have access to this matter. Please check that the matter exists and is assigned to you.'},
        status=status.HTTP_403_FORBIDDEN,
    )


class DocumentUploadView(APIView):
    """Upload a document for a case"""

    def post(self, request, case_id):
        access = can_access_case(request, case_id)
        if access != 'ok':
            return _access_error_response(access)

        file_obj = request.FILES.get('file')
        doc_type = request.data.get('type', 'other')
        user_id = extract_user_id_from_token(request)

        if not file_obj:
            return Response({'error': 'file required'}, status=status.HTTP_400_BAD_REQUEST)

        document = Document.objects.create(
            case_id=case_id,
            uploader_id=user_id,
            filename=file_obj.name,
            document_type=doc_type,
            file_size=file_obj.size,
            mime_type=file_obj.content_type,
            status='pending_scan'
        )

        password = request.data.get('password')
        if password:
            salt = os.urandom(16).hex()
            digest = hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
            document.password_salt = salt
            document.password_hash = digest
            document.save(update_fields=['password_salt', 'password_hash'])

        try:
            client = get_minio_client()
            ensure_bucket_exists(client)
            object_name = f'cases/{case_id}/{document.id}'
            file_bytes = file_obj.read()
            file_obj.seek(0)
            client.put_object(
                settings.MINIO_BUCKET_NAME,
                object_name,
                BytesIO(file_bytes),
                len(file_bytes),
                content_type=file_obj.content_type or 'application/octet-stream',
            )
            document.minio_path = object_name
            document.status = 'stored'
            document.save(update_fields=['minio_path', 'status', 'updated_at'])
        except Exception as exc:
            document.delete()
            return Response({'error': f'failed to store document: {exc}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(
            DocumentSerializer(document).data,
            status=status.HTTP_201_CREATED
        )


class DocumentDownloadView(APIView):
    """Download a document from MinIO."""

    authentication_classes = []
    permission_classes = []

    def get(self, request, document_id):
        if not is_internal_request(request):
            auth_payload = extract_auth_payload(request)
            user_id = auth_payload.get('user_id')
            if not user_id:
                return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

        try:
            document = Document.objects.get(id=document_id)
        except Document.DoesNotExist:
            return Response({'error': 'not found'}, status=status.HTTP_404_NOT_FOUND)

        access = can_access_case(request, document.case_id)
        if access != 'ok':
            return _access_error_response(access)

        if not document.minio_path:
            return Response({'error': 'document not stored'}, status=status.HTTP_404_NOT_FOUND)

        if document.password_hash:
            provided = request.META.get('HTTP_X_DOCUMENT_PASSWORD') or request.GET.get('password')
            if not provided:
                return Response({'error': 'password required'}, status=status.HTTP_403_FORBIDDEN)
            check = hashlib.sha256((document.password_salt + provided).encode('utf-8')).hexdigest()
            if check != document.password_hash:
                return Response({'error': 'invalid password'}, status=status.HTTP_403_FORBIDDEN)

        if not is_internal_request(request):
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            base_url = settings.CASE_SERVICE_URL.rstrip('/')
            case_url = f"{base_url}/{document.case_id}/"
            try:
                req = Request(case_url, headers={'Authorization': auth_header})
                with urlopen(req, timeout=5) as resp:
                    payload = resp.read().decode('utf-8')
                    case_data = json.loads(payload) if payload else {}
            except (HTTPError, URLError, ValueError):
                return Response(
                    {'error': 'Unable to verify case access. Please try again shortly.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            caller_payload = extract_auth_payload(request)
            caller_id = caller_payload.get('user_id')
            caller_role = caller_payload.get('role')

            if str(case_data.get('client_id')) == str(caller_id):
                pass
            elif caller_role in STAFF_ROLES and str(case_data.get('assigned_lawyer_id')) == str(caller_id):
                pass
            else:
                return Response({'error': 'forbidden'}, status=status.HTTP_403_FORBIDDEN)

        try:
            client = get_minio_client()
            response = client.get_object(settings.MINIO_BUCKET_NAME, document.minio_path)
            file_bytes = response.read()
            response.close()
            response.release_conn()
        except S3Error as exc:
            return Response({'error': f'minio error: {exc}'}, status=status.HTTP_404_NOT_FOUND)

        http_response = HttpResponse(file_bytes, content_type=document.mime_type or 'application/octet-stream')
        http_response['Content-Disposition'] = f'attachment; filename="{document.filename}"'
        return http_response


class DocumentListView(APIView):
    """List documents for a case"""

    def get(self, request, case_id):
        access = can_access_case(request, case_id)
        if access != 'ok':
            return _access_error_response(access)

        documents = Document.objects.filter(case_id=case_id)
        serializer = DocumentSerializer(documents, many=True)
        return Response({
            'count': documents.count(),
            'results': serializer.data
        })
