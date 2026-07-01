"""
Shared pytest fixtures for case-service.

Key decisions:
- Redis is mocked globally so signals don't crash in tests that have no Redis.
- make_token builds JWTs signed with the default 'dev-secret' key, matching
  what CustomJWTAuthentication and extract_token_payload expect.
"""
import uuid
import jwt
import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def make_token():
    """
    Return a factory that builds signed Bearer tokens for any role / user.
    The signing key is read from Django's resolved settings so it always
    matches what CustomJWTAuthentication expects, regardless of .env files.
    """
    from decouple import config
    signing_key = config('JWT_SECRET_KEY', default='dev-secret')
    algorithm = 'HS256'

    def _factory(user_id=None, role='client', email=None):
        uid = str(user_id or uuid.uuid4())
        payload = {
            'user_id': uid,
            'role': role,
            'email': email or f'{role}@test.local',
        }
        raw = jwt.encode(payload, signing_key, algorithm=algorithm)
        return raw if isinstance(raw, str) else raw.decode()
    return _factory


@pytest.fixture(autouse=True)
def mock_redis_publish():
    """
    Patch redis.from_url globally so every Case.save() in tests silently
    records what would have been published instead of hitting a real Redis.
    The fixture yields the mock Redis client so tests can inspect calls.
    """
    mock_client = MagicMock()
    with patch('redis.from_url', return_value=mock_client):
        yield mock_client


@pytest.fixture(autouse=True)
def mock_lawyer_service_http():
    """
    Prevent all outbound HTTP to the lawyer-service.  Tests that need
    firm-overlap access control should override user_can_access_case directly.
    """
    with patch('apps.cases.views.get_user_firm_ids_from_lawyer_service', return_value=set()):
        yield
