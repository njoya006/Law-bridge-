from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, MeView, UserLookupView, UserDetailView,
    PreferencesView, AvatarUploadView, AvatarServeView, PasswordChangeView,
    PasswordResetRequestView, PasswordResetConfirmView,
)
from .serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('me/avatar/', AvatarUploadView.as_view(), name='avatar-upload'),
    path('me/password/', PasswordChangeView.as_view(), name='password-change'),
    path('avatars/<uuid:user_uuid>/', AvatarServeView.as_view(), name='avatar-serve'),
    path('preferences/', PreferencesView.as_view(), name='preferences'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('users/', UserLookupView.as_view(), name='user-lookup'),
    path('users/<uuid:user_id>/', UserDetailView.as_view(), name='user-detail'),
]
