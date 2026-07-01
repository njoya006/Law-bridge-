"""Shared fixtures for auth-service tests."""
import pytest
import jwt


@pytest.fixture
def make_token():
    """Build signed JWT tokens matching what the auth service issues."""
    from django.conf import settings
    signing_key = settings.SIMPLE_JWT.get('SIGNING_KEY', settings.SECRET_KEY)
    algorithm = settings.SIMPLE_JWT.get('ALGORITHM', 'HS256')

    def _factory(user_id=None, role='client', email=None):
        import uuid
        uid = str(user_id or uuid.uuid4())
        payload = {'user_id': uid, 'role': role, 'email': email or f'{role}@test.local'}
        raw = jwt.encode(payload, signing_key, algorithm=algorithm)
        return raw if isinstance(raw, str) else raw.decode()
    return _factory
