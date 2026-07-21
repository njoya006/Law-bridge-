import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions


class AuthProxyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ', 1)[1].strip()
        try:
            payload = jwt.decode(
                token,
                settings.SIMPLE_JWT.get('SIGNING_KEY', settings.SECRET_KEY),
                algorithms=[settings.SIMPLE_JWT.get('ALGORITHM', 'HS256')],
                options={"verify_aud": False},
            )
        except jwt.PyJWTError:
            raise exceptions.AuthenticationFailed('Invalid token')

        email = payload.get('email')
        if not email:
            raise exceptions.AuthenticationFailed('Token missing email')

        User = get_user_model()
        user, _ = User.objects.get_or_create(username=email, defaults={'email': email})
        try:
            request.auth_payload = payload
        except Exception:
            pass
        return (user, token)
