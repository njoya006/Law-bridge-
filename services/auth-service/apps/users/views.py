from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import RegisterSerializer, UserSerializer, UserPreferencesSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, UserPreferences
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.conf import settings
from io import BytesIO


def _minio_client():
    from minio import Minio
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_USE_SSL,
    )


def _ensure_bucket(client):
    bucket = settings.MINIO_BUCKET_NAME
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)
    return bucket


class UserLookupView(APIView):
    """Lookup a user by email. Returns 200 with user data or 404 if not found.

    Example: GET /api/v1/auth/users/?email=someone@example.com
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        email = request.query_params.get('email')
        if not email:
            return Response({'detail': 'email query param required'}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, email=email)
        serializer = UserSerializer(user)
        return Response(serializer.data)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AvatarUploadView(APIView):
    """POST /api/v1/auth/me/avatar/ — upload or replace the caller's profile photo."""

    def post(self, request):
        file = request.FILES.get('avatar')
        if not file:
            return Response({'detail': 'avatar file is required (multipart field: avatar)'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = {'image/jpeg', 'image/png', 'image/webp', 'image/gif'}
        if file.content_type not in allowed_types:
            return Response({'detail': 'Only JPEG, PNG, WebP, or GIF images are accepted.'}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > 5 * 1024 * 1024:
            return Response({'detail': 'Image must be under 5 MB.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from PIL import Image
            img = Image.open(file).convert('RGB')
            img.thumbnail((512, 512), Image.LANCZOS)
            buf = BytesIO()
            img.save(buf, format='JPEG', quality=85, optimize=True)
            data = buf.getvalue()
        except Exception:
            return Response({'detail': 'Could not process the image. Please upload a valid image file.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            object_name = f'avatars/{request.user.id}.jpg'
            client = _minio_client()
            bucket = _ensure_bucket(client)
            client.put_object(bucket, object_name, BytesIO(data), len(data), content_type='image/jpeg')
        except Exception as exc:
            return Response({'detail': f'Storage error: {exc}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        request.user.avatar = object_name
        request.user.save(update_fields=['avatar'])
        return Response({'avatar_url': f'/api/v1/auth/avatars/{request.user.id}/'}, status=status.HTTP_200_OK)


class AvatarServeView(APIView):
    """GET /api/v1/auth/avatars/<user_uuid>/ — serve a user's avatar (public, no auth)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, user_uuid):
        user = get_object_or_404(User, id=user_uuid)
        if not user.avatar:
            return Response({'detail': 'No avatar set for this user.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            client = _minio_client()
            bucket = settings.MINIO_BUCKET_NAME
            obj = client.get_object(bucket, user.avatar)
            data = obj.read()
            content_type = obj.headers.get('content-type', 'image/jpeg')
            response = HttpResponse(data, content_type=content_type)
            response['Cache-Control'] = 'public, max-age=86400'
            return response
        except Exception:
            return Response({'detail': 'Avatar not found.'}, status=status.HTTP_404_NOT_FOUND)


class PasswordChangeView(APIView):
    """POST /api/v1/auth/me/password/ — change the caller's own password."""

    def post(self, request):
        current = request.data.get('current_password', '')
        new_pw = request.data.get('new_password', '')
        confirm = request.data.get('confirm_password', '')

        if not current:
            return Response({'detail': 'current_password is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_pw) < 8:
            return Response({'detail': 'new_password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        if new_pw != confirm:
            return Response({'detail': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(current):
            return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_pw)
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class PreferencesView(APIView):
    """GET or PATCH user preferences — auto-creates with defaults on first access."""

    def _get_or_create(self, user_id):
        prefs, _ = UserPreferences.objects.get_or_create(user_id=user_id)
        return prefs

    def get(self, request):
        prefs = self._get_or_create(request.user.id)
        return Response(UserPreferencesSerializer(prefs).data)

    def patch(self, request):
        prefs = self._get_or_create(request.user.id)
        serializer = UserPreferencesSerializer(prefs, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
