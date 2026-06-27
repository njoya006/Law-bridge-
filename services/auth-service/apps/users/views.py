from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import RegisterSerializer, UserSerializer, UserPreferencesSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, UserPreferences
from django.shortcuts import get_object_or_404


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
