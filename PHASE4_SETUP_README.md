# Django Services Phase 4 Setup

## To Set Up All 4 Django Services

Run the Python script below. Open a terminal in `c:\Users\njoya\Desktop\Lawbridge` and execute:

```bash
python setup_django.py
```

## What This Creates

This script creates a complete Django project structure for 4 microservices:

### Services Created:
1. **notification-service** (port 8006)
   - App: `apps/notifications/`
   - DB: `lawbridge_notifications`

2. **calendar-service** (port 8008)
   - App: `apps/calendar/`
   - DB: `lawbridge_calendar`
   - Extra dependencies: `python-dateutil`

3. **search-service** (port 8010)
   - App: `apps/search/`
   - DB: `lawbridge_search`
   - Extra dependencies: `langdetect`, `aiohttp`

4. **monitoring-service** (port 8009)
   - App: `apps/monitoring/`
   - DB: `lawbridge_monitoring`
   - WebSocket support via Django Channels
   - Extra dependencies: `django-channels`, `channels-redis`, `daphne`

## Directory Structure Created

Each service will have:
```
service-name/
├── core/                    # Django core configuration
│   ├── __init__.py
│   ├── settings.py         # Django settings with PostgreSQL config
│   ├── urls.py             # URL routing (blank, ready for app routes)
│   ├── wsgi.py             # WSGI application
│   └── asgi.py             # (monitoring-service only) ASGI with WebSocket support
│
├── apps/                    # Django apps directory
│   ├── __init__.py
│   └── {app-name}/         # Service-specific app
│       ├── __init__.py
│       ├── migrations/
│       │   └── __init__.py
│       ├── models.py       # (empty/stub)
│       ├── serializers.py  # (empty/stub)
│       ├── views.py        # (empty/stub)
│       ├── urls.py         # (empty, ready for routes)
│       ├── admin.py        # (with model registration)
│       ├── apps.py         # Django app configuration
│       └── __init__.py
│
├── tests/                   # Test directory
│   └── __init__.py
│
├── manage.py               # Django management script (already exists)
├── pytest.ini              # Pytest configuration (already exists)
└── requirements.txt        # Python dependencies (already exists, will be updated)
```

## Next Steps After Running the Script

1. Install dependencies in each service:
   ```bash
   cd services/notification-service
   pip install -r requirements.txt
   ```

2. Run migrations (once database is available):
   ```bash
   python manage.py migrate
   ```

3. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

4. Run the development server:
   ```bash
   python manage.py runserver 0.0.0.0:8006
   ```

## Configuration

All services are configured to use:
- **PostgreSQL** (if DB_HOST environment variable is set)
- **SQLite** for local development (default)
- **JWT Authentication** via djangorestframework-simplejwt
- **CORS headers** for cross-origin requests
- **Redis** for Celery and caching
- **Shared JWT_SECRET_KEY** across all services

Environment variables can be set via `.env` file (configure python-decouple):
```
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DEBUG=True
DB_HOST=localhost
DB_PORT=5432
DB_USER=lawbridge
DB_PASSWORD=your-password
CELERY_BROKER_URL=redis://localhost:6379/0
```

## Troubleshooting

If the script fails to run:
1. Ensure Python 3.8+ is installed
2. Ensure `c:\Users\njoya\Desktop\Lawbridge` directory exists
3. Run from the correct directory: `cd c:\Users\njoya\Desktop\Lawbridge`
4. Use `python` or `python3` depending on your system PATH

## Manual Creation

If you cannot run the Python script, manually create the directory structure and files as shown in the `setup_django.py` script. The script is self-contained and can serve as a reference for the exact file structure needed.
