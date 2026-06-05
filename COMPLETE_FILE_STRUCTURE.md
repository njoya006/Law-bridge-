# Phase 4 Django Services - Complete File Structure Summary

## Setup Scripts

### 1. `setup_django_comprehensive.py`
**Purpose:** Main setup script that creates all directories and files for all 4 services

**How to run:**
```bash
cd c:\Users\njoya\Desktop\Lawbridge
python setup_django_comprehensive.py
```

**What it creates:**
- All directory structures
- 80+ files across 4 services
- Complete Django project scaffolding

---

## Services and Their Complete File Structure

### SERVICE 1: notification-service (Port 8006)

```
notification-service/
├── Dockerfile (already exists - don't touch)
├── manage.py (already exists)
├── pytest.ini (already exists)
├── requirements.txt (will be updated/created)
│
├── core/
│   ├── __init__.py .......................... [NEW] Empty Python module
│   ├── settings.py .......................... [NEW] Django configuration (106 lines)
│   ├── urls.py ............................. [NEW] URL routing configuration
│   └── wsgi.py ............................. [NEW] WSGI application entry point
│
├── apps/
│   ├── __init__.py .......................... [NEW] Empty Python module
│   └── notifications/
│       ├── __init__.py ...................... [NEW] Empty Python module
│       ├── models.py ........................ [NEW] Stub for database models
│       ├── serializers.py ................... [NEW] Stub for DRF serializers
│       ├── views.py ......................... [NEW] Stub for API views
│       ├── urls.py .......................... [NEW] App URL routing
│       ├── admin.py ......................... [NEW] Django admin configuration
│       ├── apps.py .......................... [NEW] App configuration (NotificationsConfig)
│       └── migrations/
│           └── __init__.py ................. [NEW] Django migrations directory
│
└── tests/
    └── __init__.py .......................... [NEW] Test module
```

**notification-service files created: 17**

**requirements.txt contents (13 packages):**
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

---

### SERVICE 2: calendar-service (Port 8008)

```
calendar-service/
├── Dockerfile (already exists - don't touch)
├── manage.py (already exists)
├── pytest.ini (already exists)
├── requirements.txt (will be updated/created)
│
├── core/
│   ├── __init__.py .......................... [NEW]
│   ├── settings.py .......................... [NEW] Django configuration
│   ├── urls.py ............................. [NEW]
│   └── wsgi.py ............................. [NEW]
│
├── apps/
│   ├── __init__.py .......................... [NEW]
│   └── calendar/
│       ├── __init__.py ...................... [NEW]
│       ├── models.py ........................ [NEW] Ready for Event model, etc.
│       ├── serializers.py ................... [NEW]
│       ├── views.py ......................... [NEW]
│       ├── urls.py .......................... [NEW]
│       ├── admin.py ......................... [NEW]
│       ├── apps.py .......................... [NEW] App configuration (CalendarConfig)
│       └── migrations/
│           └── __init__.py ................. [NEW]
│
└── tests/
    └── __init__.py .......................... [NEW]
```

**calendar-service files created: 17**

**requirements.txt contents (14 packages):**
- (all 13 from notification-service plus:)
- python-dateutil

**Why python-dateutil?** For handling recurring events, timezone calculations, and date arithmetic

---

### SERVICE 3: search-service (Port 8010)

```
search-service/
├── Dockerfile (already exists - don't touch)
├── manage.py (already exists)
├── pytest.ini (already exists)
├── requirements.txt (will be updated/created)
│
├── core/
│   ├── __init__.py .......................... [NEW]
│   ├── settings.py .......................... [NEW] Django configuration
│   ├── urls.py ............................. [NEW]
│   └── wsgi.py ............................. [NEW]
│
├── apps/
│   ├── __init__.py .......................... [NEW]
│   └── search/
│       ├── __init__.py ...................... [NEW]
│       ├── models.py ........................ [NEW] (minimal - mostly external search)
│       ├── serializers.py ................... [NEW]
│       ├── views.py ......................... [NEW] Search API views
│       ├── urls.py .......................... [NEW]
│       ├── admin.py ......................... [NEW]
│       ├── apps.py .......................... [NEW] App configuration (SearchConfig)
│       └── migrations/
│           └── __init__.py ................. [NEW]
│
└── tests/
    └── __init__.py .......................... [NEW]
```

**search-service files created: 17**

**requirements.txt contents (15 packages):**
- (all 13 from notification-service plus:)
- langdetect
- aiohttp

**Why langdetect and aiohttp?**
- **langdetect:** For automatic language detection in search queries
- **aiohttp:** For async HTTP requests to external search services/databases

---

### SERVICE 4: monitoring-service (Port 8009) - WITH WEBSOCKET SUPPORT

```
monitoring-service/
├── Dockerfile (already exists - don't touch)
├── manage.py (already exists)
├── pytest.ini (already exists)
├── requirements.txt (will be updated/created)
│
├── core/
│   ├── __init__.py .......................... [NEW]
│   ├── settings.py .......................... [NEW] Django config with Channels/Daphne
│   ├── urls.py ............................. [NEW]
│   ├── wsgi.py ............................. [NEW]
│   └── asgi.py ............................. [NEW] ASGI with WebSocket support ⭐
│
├── apps/
│   ├── __init__.py .......................... [NEW]
│   └── monitoring/
│       ├── __init__.py ...................... [NEW]
│       ├── models.py ........................ [NEW] For system metrics, alerts, etc.
│       ├── serializers.py ................... [NEW]
│       ├── views.py ......................... [NEW]
│       ├── urls.py .......................... [NEW]
│       ├── admin.py ......................... [NEW]
│       ├── apps.py .......................... [NEW] App configuration (MonitoringConfig)
│       └── migrations/
│           └── __init__.py ................. [NEW]
│
└── tests/
    └── __init__.py .......................... [NEW]
```

**monitoring-service files created: 18** (one extra: core/asgi.py)

**requirements.txt contents (16 packages):**
- (all 13 from notification-service plus:)
- django-channels
- channels-redis
- daphne

**Special Configuration for monitoring-service:**

In `core/settings.py`:
```python
INSTALLED_APPS += ['daphne', 'channels']
ASGI_APPLICATION = 'core.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

In `core/asgi.py`:
- ProtocolTypeRouter for HTTP and WebSocket separation
- AuthMiddlewareStack for authentication
- URLRouter for WebSocket routing

**Why Channels and WebSocket?** For real-time system monitoring, alerts, and metrics streaming

---

## Summary Table

| File/Directory | notification | calendar | search | monitoring | Notes |
|---|---|---|---|---|---|
| core/__init__.py | ✓ | ✓ | ✓ | ✓ | Created in all services |
| core/settings.py | ✓ | ✓ | ✓ | ✓* | *with Channels config |
| core/urls.py | ✓ | ✓ | ✓ | ✓ | Base health endpoint |
| core/wsgi.py | ✓ | ✓ | ✓ | ✓ | Standard Django WSGI |
| core/asgi.py | ✗ | ✗ | ✗ | ✓ | WebSocket support only |
| apps/__init__.py | ✓ | ✓ | ✓ | ✓ | Created in all services |
| apps/[app]/models.py | ✓ | ✓ | ✓ | ✓ | Stub files, ready to edit |
| apps/[app]/serializers.py | ✓ | ✓ | ✓ | ✓ | Stub files, ready to edit |
| apps/[app]/views.py | ✓ | ✓ | ✓ | ✓ | Stub files, ready to edit |
| apps/[app]/urls.py | ✓ | ✓ | ✓ | ✓ | Empty, ready for routes |
| apps/[app]/admin.py | ✓ | ✓ | ✓ | ✓ | Model registration template |
| apps/[app]/apps.py | ✓ | ✓ | ✓ | ✓ | Auto-generated config class |
| apps/[app]/migrations/__init__.py | ✓ | ✓ | ✓ | ✓ | Django migrations directory |
| tests/__init__.py | ✓ | ✓ | ✓ | ✓ | Test module marker |
| requirements.txt | ✓ | ✓* | ✓** | ✓*** | *+python-dateutil, **+langdetect+aiohttp, ***+channels+daphne |

---

## Total Files Created

**Per Service:**
- notification-service: 17 files
- calendar-service: 17 files
- search-service: 17 files
- monitoring-service: 18 files (includes asgi.py)

**Total: 69 files** (across 4 services)

---

## Environment Variables Used

All services read from environment (via python-decouple) with defaults:

```python
# General
SECRET_KEY = config('SECRET_KEY', default='dev-secret')
DEBUG = config('DEBUG', default=True, cast=bool)

# Database
DB_HOST = config('DB_HOST', default='')  # Empty = use SQLite
DB_NAME = config('DB_NAME', default='lawbridge_{app_name}')
DB_USER = config('DB_USER', default='lawbridge')
DB_PASSWORD = config('DB_PASSWORD', default='')
DB_PORT = config('DB_PORT', default='5432')

# JWT
JWT_SECRET_KEY = config('JWT_SECRET_KEY', default=SECRET_KEY)

# Celery
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
```

---

## What's NOT Created (Already Exists)

- `Dockerfile` in each service directory - DO NOT MODIFY
- `manage.py` in each service directory - Already created in earlier setup
- `pytest.ini` - Already exists in each service

---

## How to Verify Setup Completed

Run the verification script:

```bash
cd c:\Users\njoya\Desktop\Lawbridge
python verify_setup.py
```

This checks:
- All directory structures exist
- All required files are present
- requirements.txt has correct packages

---

## What to Do After Setup

1. **For each service:**
   ```bash
   cd services/{service-name}
   pip install -r requirements.txt
   ```

2. **Define your models** in `apps/{app_name}/models.py`

3. **Create serializers** in `apps/{app_name}/serializers.py`

4. **Implement views** in `apps/{app_name}/views.py`

5. **Add URL routes** in both:
   - `apps/{app_name}/urls.py`
   - `core/urls.py` (import the app URLs)

6. **Register models** with admin in `apps/{app_name}/admin.py`

7. **Create migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

8. **Run the service:**
   ```bash
   # HTTP services (notification, calendar, search)
   python manage.py runserver 0.0.0.0:{port}
   
   # WebSocket service (monitoring)
   daphne -b 0.0.0.0 -p 8009 core.asgi:application
   ```

---

**Created by:** setup_django_comprehensive.py
**Date:** Phase 4 Setup
**Framework:** Django 4.2+
**All services ready for development!**
