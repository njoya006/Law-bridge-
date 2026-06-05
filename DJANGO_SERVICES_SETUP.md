# LawBridge Phase 4 - Django Services Setup Guide

## Overview

This guide sets up 4 microservices for Phase 4 of LawBridge, all based on Django and Django REST Framework. Each service is a complete, self-contained Django project with its own database, authentication, and API endpoints.

## Services to Create

| Service | Port | App Name | Database | Special Features |
|---------|------|----------|----------|-----------------|
| notification-service | 8006 | notifications | lawbridge_notifications | Email/SMS notifications |
| calendar-service | 8008 | calendar | lawbridge_calendar | Event scheduling, python-dateutil |
| search-service | 8010 | search | lawbridge_search | Full-text search, langdetect, aiohttp |
| monitoring-service | 8009 | monitoring | lawbridge_monitoring | WebSocket support via Django Channels |

## Quick Start

### Step 1: Run the Setup Script

Open a terminal and navigate to the project root:

```bash
cd c:\Users\njoya\Desktop\Lawbridge
python setup_django_comprehensive.py
```

This will:
- Create all directory structures
- Generate all Django configuration files
- Set up requirements.txt for each service
- Create Django apps with models, serializers, views, URLs, admin, and apps.py

### Step 2: Install Dependencies

For each service:

```bash
cd services/notification-service
pip install -r requirements.txt

cd ../calendar-service
pip install -r requirements.txt

cd ../search-service
pip install -r requirements.txt

cd ../monitoring-service
pip install -r requirements.txt
```

### Step 3: Run Migrations (Once Database is Available)

```bash
cd services/notification-service
python manage.py migrate
# Repeat for other services
```

### Step 4: Verify Setup

```bash
cd c:\Users\njoya\Desktop\Lawbridge
python verify_setup.py
```

## Project Structure

Each service follows this structure:

```
service-name/
├── Dockerfile                     # Already exists, don't modify
├── manage.py                      # Already exists
├── pytest.ini                     # Already exists
├── requirements.txt               # Will be created/updated
│
├── core/                          # Django core configuration
│   ├── __init__.py
│   ├── settings.py               # Django settings with PostgreSQL, JWT, CORS
│   ├── urls.py                   # URL routing (blank, ready for app routes)
│   ├── wsgi.py                   # WSGI application for deployment
│   └── asgi.py                   # (monitoring-service only) ASGI with WebSocket
│
├── apps/                          # Django apps directory
│   ├── __init__.py
│   └── {app_name}/               # Service-specific app
│       ├── __init__.py
│       ├── migrations/
│       │   └── __init__.py       # Django migrations directory
│       ├── models.py             # Database models (stub)
│       ├── serializers.py        # DRF serializers (stub)
│       ├── views.py              # API views (stub)
│       ├── urls.py               # App URL routing (blank)
│       ├── admin.py              # Django admin registration
│       ├── apps.py               # Django app configuration
│       └── __init__.py
│
└── tests/                         # Test directory
    └── __init__.py
```

## Configuration

### Environment Variables (via .env file)

Create a `.env` file in each service directory:

```env
# Common settings
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
DEBUG=True

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=lawbridge
DB_PASSWORD=your-password

# Redis/Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Database Configuration

Each service uses:
- **PostgreSQL** when `DB_HOST` environment variable is set
- **SQLite** for local development (default, auto-uses `db.sqlite3`)

Database names:
- notification-service: `lawbridge_notifications`
- calendar-service: `lawbridge_calendar`
- search-service: `lawbridge_search`
- monitoring-service: `lawbridge_monitoring`

### Authentication

All services use JWT authentication via `djangorestframework-simplejwt`:
- Access token lifetime: 60 minutes
- Refresh token lifetime: 7 days
- Algorithm: HS256

### CORS Configuration

All services allow requests from:
- `http://localhost:3000` (frontend)
- `http://localhost:8000` (API gateway)
- `http://localhost:8080` (secondary frontend)

## File Contents Summary

### core/settings.py
- Django configuration with PostgreSQL and SQLite support
- JWT authentication setup
- CORS headers middleware
- REST framework configuration
- Celery broker and result backend
- Daphne ASGI server (monitoring-service only)
- Django Channels with Redis (monitoring-service only)

### core/urls.py
- Base URL configuration
- Health check endpoint at `/api/v1/health/`
- Ready to add app-specific routes via `include('apps.{app_name}.urls')`

### core/wsgi.py
- Standard Django WSGI application for deployment

### core/asgi.py (monitoring-service only)
- Django Channels ASGI for WebSocket support
- ProtocolTypeRouter for HTTP and WebSocket
- AuthMiddlewareStack for authentication

### apps/{app_name}/models.py
- Empty stub with Django models import
- Ready for defining database models

### apps/{app_name}/serializers.py
- Empty stub with DRF serializers import
- Ready for defining DRF serializers

### apps/{app_name}/views.py
- Empty stub with DRF viewsets import
- Ready for defining API views

### apps/{app_name}/admin.py
- Django admin registration
- Ready for registering models

### apps/{app_name}/apps.py
- Django app configuration
- Automatically generated with correct app name

### requirements.txt

**Base (all services):**
- Django>=4.2
- djangorestframework
- djangorestframework-simplejwt
- django-cors-headers
- python-decouple
- gunicorn
- psycopg2-binary
- redis
- celery
- requests
- pytest
- pytest-django
- drf-spectacular

**notification-service:** None extra

**calendar-service:** python-dateutil

**search-service:** langdetect, aiohttp

**monitoring-service:** django-channels, channels-redis, daphne

## Development Workflow

### 1. Define Models
Edit `apps/{app_name}/models.py` to define your database models.

### 2. Create Serializers
Edit `apps/{app_name}/serializers.py` to define DRF serializers for your models.

### 3. Implement Views
Edit `apps/{app_name}/views.py` to implement your API views/viewsets.

### 4. Add URL Routes
Edit `apps/{app_name}/urls.py` to define your URL patterns.

### 5. Register with Admin
Edit `apps/{app_name}/admin.py` to register your models with Django admin.

### 6. Update core/urls.py
Add to `core/urls.py`:
```python
from django.urls import include
urlpatterns += [
    path('api/v1/{app_name}/', include('apps.{app_name}.urls')),
]
```

### 7. Create Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 8. Run Tests
```bash
pytest
# or
python manage.py test
```

## Testing

Each service is configured for pytest. Create tests in the `tests/` directory:

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_models.py

# Run with coverage
pytest --cov=apps
```

## Deployment

### Using Gunicorn (HTTP)
```bash
gunicorn core.wsgi:application --bind 0.0.0.0:8006 --workers 4
```

### Using Daphne (WebSocket, monitoring-service only)
```bash
daphne -b 0.0.0.0 -p 8009 core.asgi:application
```

### Docker
Each service has a pre-existing `Dockerfile`. Build and run:

```bash
docker build -t notification-service .
docker run -p 8006:8006 -e DB_HOST=postgres notification-service
```

## Troubleshooting

### Script Fails to Run
1. Ensure Python 3.8+ is installed
2. Ensure you're in `c:\Users\njoya\Desktop\Lawbridge`
3. Check that the script file exists

### Database Connection Errors
1. Ensure PostgreSQL is running (if using DB_HOST)
2. Check database credentials in environment variables
3. Run `python manage.py migrate` to create tables

### Import Errors
1. Ensure all dependencies are installed: `pip install -r requirements.txt`
2. Ensure PYTHONPATH includes the project root
3. Verify no circular imports in your code

### Static Files Not Found (Production)
Run collectstatic:
```bash
python manage.py collectstatic --noinput
```

## Next Steps

1. **Run the setup script** (if not already done):
   ```bash
   python setup_django_comprehensive.py
   ```

2. **Verify the setup**:
   ```bash
   python verify_setup.py
   ```

3. **Install dependencies** for each service:
   ```bash
   cd services/{service-name}
   pip install -r requirements.txt
   ```

4. **Start developing** by editing the app models, serializers, and views

5. **Run tests** to ensure everything works:
   ```bash
   pytest
   ```

## Files Created by Setup Script

- `setup_django_comprehensive.py` - Main setup script (this file)
- `verify_setup.py` - Verification script to check setup completeness
- `PHASE4_SETUP_README.md` - Basic setup instructions
- `PHASE4_MANIFEST.json` - Manifest of files to create
- `run_setup.bat` - Windows batch script to run setup

## Support

For issues or questions:
1. Check the TROUBLESHOOTING section above
2. Review Django documentation: https://docs.djangoproject.com/
3. Review DRF documentation: https://www.django-rest-framework.org/
4. Check Django Channels docs: https://channels.readthedocs.io/

---

**Last Updated:** Phase 4 Setup
**Services Configured:** 4 (notification, calendar, search, monitoring)
**Django Version:** 4.2+
**Python Version:** 3.8+
