import pytest
from rest_framework.test import APIClient
from apps.users.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_register_user(api_client):
    url = "/api/v1/auth/register/"
    data = {"email": "client@test.com", "full_name": "Jean", "password": "TestPass123!", "role": "client"}
    resp = api_client.post(url, data, format='json')
    assert resp.status_code == 201
    assert resp.data["email"] == "client@test.com"


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
def test_token_refresh(api_client):
    User.objects.create_user(email="user2@test.com", password="pass123")
    resp = api_client.post("/api/v1/auth/login/", {"email": "user2@test.com", "password": "pass123"}, format='json')
    refresh = resp.data.get("refresh")
    assert refresh
    r = api_client.post("/api/v1/auth/token/refresh/", {"refresh": refresh}, format='json')
    assert r.status_code == 200
    assert "access" in r.data


@pytest.mark.django_db
def test_protected_without_token(api_client):
    r = api_client.get("/api/v1/auth/me/")
    assert r.status_code in (401, 403)
