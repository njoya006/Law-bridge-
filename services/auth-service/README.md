# Auth Service

Lightweight Django auth service scaffold. Endpoints:

- `POST /api/v1/auth/register/` — register new user
- `POST /api/v1/auth/login/` — obtain JWT pair
- `GET /api/v1/auth/me/` — get current user (requires auth)

Run locally:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8001
```
