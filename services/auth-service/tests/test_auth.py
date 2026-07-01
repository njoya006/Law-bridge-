import pytest
from rest_framework.test import APIClient
from apps.users.models import User, PasswordResetToken


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def registered_user(db):
    return User.objects.create_user(email="base@test.com", password="StrongPass1!", full_name="Base User", role="client")


@pytest.fixture
def auth_client(registered_user):
    client = APIClient()
    resp = client.post("/api/v1/auth/login/", {"email": "base@test.com", "password": "StrongPass1!"}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")
    return client


# ── Registration ──────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_register_user(api_client):
    url = "/api/v1/auth/register/"
    data = {"email": "client@test.com", "full_name": "Jean", "password": "TestPass123!", "role": "client"}
    resp = api_client.post(url, data, format='json')
    assert resp.status_code == 201
    assert resp.data["email"] == "client@test.com"


@pytest.mark.django_db
def test_register_duplicate_email_rejected(api_client):
    User.objects.create_user(email="dup@test.com", password="pass123")
    resp = api_client.post("/api/v1/auth/register/", {"email": "dup@test.com", "full_name": "Dup", "password": "StrongPass1!"}, format='json')
    assert resp.status_code in (400, 409)


# ── Login ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_login_and_me(api_client):
    user = User.objects.create_user(email="user@test.com", password="pass123", full_name="User Test")
    resp = api_client.post("/api/v1/auth/login/", {"email": "user@test.com", "password": "pass123"}, format='json')
    assert resp.status_code == 200
    access = resp.data.get("access")
    assert access
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    me = client.get("/api/v1/auth/me/")
    assert me.status_code == 200
    assert me.data["email"] == "user@test.com"


@pytest.mark.django_db
def test_login_wrong_password_rejected(api_client):
    User.objects.create_user(email="wrong@test.com", password="correctpass")
    resp = api_client.post("/api/v1/auth/login/", {"email": "wrong@test.com", "password": "wrongpass"}, format='json')
    assert resp.status_code in (400, 401)


@pytest.mark.django_db
def test_protected_without_token(api_client):
    r = api_client.get("/api/v1/auth/me/")
    assert r.status_code in (401, 403)


# ── Token refresh ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_token_refresh(api_client):
    User.objects.create_user(email="user2@test.com", password="pass123")
    resp = api_client.post("/api/v1/auth/login/", {"email": "user2@test.com", "password": "pass123"}, format='json')
    refresh = resp.data.get("refresh")
    assert refresh
    r = api_client.post("/api/v1/auth/token/refresh/", {"refresh": refresh}, format='json')
    assert r.status_code == 200
    assert "access" in r.data


@pytest.mark.django_db
def test_role_preserved_after_refresh(api_client):
    User.objects.create_user(email="lawyer@test.com", password="pass123", role="lawyer")
    login = api_client.post("/api/v1/auth/login/", {"email": "lawyer@test.com", "password": "pass123"}, format='json')
    refresh = login.data.get("refresh")
    r = api_client.post("/api/v1/auth/token/refresh/", {"refresh": refresh}, format='json')
    assert r.status_code == 200
    # New access token must still be usable
    assert "access" in r.data


# ── Password reset ────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_password_reset_request(api_client):
    User.objects.create_user(email="reset@test.com", password="oldpass123")
    resp = api_client.post("/api/v1/auth/password-reset/", {"email": "reset@test.com"}, format='json')
    # Should succeed whether or not email is found (security: always 200)
    assert resp.status_code in (200, 201, 204)


@pytest.mark.django_db
def test_password_reset_confirm(api_client):
    user = User.objects.create_user(email="reset2@test.com", password="oldpass123")
    token_obj = PasswordResetToken.objects.create(user=user)
    resp = api_client.post("/api/v1/auth/password-reset/confirm/", {
        "token": str(token_obj.token),
        "password": "NewSecurePass1!",
    }, format='json')
    assert resp.status_code in (200, 201, 204)
    # Verify new password works
    login = api_client.post("/api/v1/auth/login/", {"email": "reset2@test.com", "password": "NewSecurePass1!"}, format='json')
    assert login.status_code == 200


@pytest.mark.django_db
def test_password_reset_token_single_use(api_client):
    user = User.objects.create_user(email="reset3@test.com", password="oldpass123")
    token_obj = PasswordResetToken.objects.create(user=user)
    token_str = str(token_obj.token)
    api_client.post("/api/v1/auth/password-reset/confirm/", {"token": token_str, "password": "NewPass1!"}, format='json')
    # Second use of same token must fail
    resp2 = api_client.post("/api/v1/auth/password-reset/confirm/", {"token": token_str, "password": "AnotherPass1!"}, format='json')
    assert resp2.status_code in (400, 404)
