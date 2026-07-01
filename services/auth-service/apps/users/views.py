from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import RegisterSerializer, UserSerializer, UserPreferencesSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, UserPreferences, PasswordResetToken
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


class UserDetailView(APIView):
    """GET /api/v1/auth/users/<user_id>/ — fetch a user's profile by UUID.
    Used by lawyers to identify their clients, and by the case service.
    Requires a valid JWT (any authenticated user may look up any profile).
    """

    def get(self, request, user_id):
        try:
            import uuid as uuid_lib
            user = User.objects.get(id=uuid_lib.UUID(str(user_id)))
        except (User.DoesNotExist, ValueError):
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'id':        str(user.id),
            'full_name': user.full_name or '',
            'email':     user.email,
            'role':      user.role,
            'avatar':    user.avatar or None,
        })


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

    def _get_or_create(self, user):
        prefs, _ = UserPreferences.objects.get_or_create(user=user)
        return prefs

    def get(self, request):
        prefs = self._get_or_create(request.user)
        return Response(UserPreferencesSerializer(prefs).data)

    def patch(self, request):
        prefs = self._get_or_create(request.user)
        serializer = UserPreferencesSerializer(prefs, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """POST /auth/password-reset/ — request a password reset email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        # Always return 200 to avoid user enumeration
        try:
            user = User.objects.get(email=email)
            token_obj = PasswordResetToken.objects.create(user=user)
            # Build reset link
            frontend_url = settings.__dict__.get('FRONTEND_URL', 'https://law-bridge-two.vercel.app')
            reset_link = f"{frontend_url}/auth/reset-password?token={token_obj.token}"
            # Send email via Django's built-in email
            from django.core.mail import send_mail
            send_mail(
                subject='LawBridge — Reset your password',
                message=(
                    f"Hi {user.full_name or user.email},\n\n"
                    f"Click the link below to reset your password (valid for 24 hours):\n\n"
                    f"{reset_link}\n\n"
                    f"If you did not request this, please ignore this email.\n\n"
                    f"— The LawBridge Team"
                ),
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@lawbridge.cm'),
                recipient_list=[user.email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass
        return Response({'detail': 'If an account exists with that email, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    """POST /auth/password-reset/confirm/ — set a new password using a valid reset token."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token_str = (request.data.get('token') or '').strip()
        new_password = request.data.get('new_password', '')
        if not token_str or not new_password:
            return Response({'error': 'token and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            import uuid as uuid_mod
            token_obj = PasswordResetToken.objects.select_related('user').get(token=uuid_mod.UUID(token_str), used=False)
        except (PasswordResetToken.DoesNotExist, ValueError):
            return Response({'error': 'Invalid or expired reset link'}, status=status.HTTP_400_BAD_REQUEST)
        if token_obj.is_expired():
            return Response({'error': 'This reset link has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        user = token_obj.user
        user.set_password(new_password)
        user.save(update_fields=['password'])
        token_obj.used = True
        token_obj.save(update_fields=['used'])
        # Invalidate all other reset tokens for this user
        PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        return Response({'detail': 'Password updated successfully. You can now sign in.'})
