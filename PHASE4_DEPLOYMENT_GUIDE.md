# 🚀 PHASE 4 DEPLOYMENT GUIDE

**Status**: Ready to Deploy  
**Date**: May 17, 2026  
**Target**: Deploy 4 services (Notification, Calendar, Search, Monitoring)

---

## ✅ CURRENT STATE

All infrastructure is ready:
- ✅ Folder structure exists (`/services/notification-service`, etc.)
- ✅ Docker-compose includes all 4 services
- ✅ Databases configured (notification_db, calendar_db, search_db, monitoring_db)
- ✅ .env file has all database names
- ✅ Basic requirements.txt exists in each service

**Missing**: Service code files (models.py, views.py, serializers.py, etc.)

---

## 📋 DEPLOYMENT STEPS

### STEP 1: Download Phase 4 Code Files

Download these 37 files from the session workspace:
```
C:\Users\njoya\.copilot\session-state\78784c2d-d8da-43cd-a7f6-72a2976c3224\
```

**Files to download**:
- Notification Service (9 files): NOTIF_*.py
- Calendar Service (9 files): CAL_*.py
- Search Service (8 files): SEARCH_*.py
- Monitoring Service (11 files): MON_*.py

---

### STEP 2: Copy Files to Services

Use the mapping below to copy files to the correct locations.

#### Notification Service
```
Source → Destination
────────────────────────────────────────────────────────────
NOTIF_settings.py      → services/notification-service/core/settings.py
NOTIF_urls.py          → services/notification-service/core/urls.py
NOTIF_wsgi.py          → services/notification-service/core/wsgi.py
NOTIF_models.py        → services/notification-service/apps/notifications/models.py
NOTIF_serializers.py   → services/notification-service/apps/notifications/serializers.py
NOTIF_views.py         → services/notification-service/apps/notifications/views.py
NOTIF_app_urls.py      → services/notification-service/apps/notifications/urls.py
NOTIF_admin.py         → services/notification-service/apps/notifications/admin.py
NOTIF_apps.py          → services/notification-service/apps/notifications/apps.py
```

#### Calendar Service
```
Source → Destination
────────────────────────────────────────────────────────────
CAL_settings.py        → services/calendar-service/core/settings.py
CAL_urls.py            → services/calendar-service/core/urls.py
CAL_wsgi.py            → services/calendar-service/core/wsgi.py
CAL_models.py          → services/calendar-service/apps/calendar/models.py
CAL_serializers.py     → services/calendar-service/apps/calendar/serializers.py
CAL_views.py           → services/calendar-service/apps/calendar/views.py
CAL_app_urls.py        → services/calendar-service/apps/calendar/urls.py
CAL_admin.py           → services/calendar-service/apps/calendar/admin.py
CAL_apps.py            → services/calendar-service/apps/calendar/apps.py
```

#### Search Service
```
Source → Destination
────────────────────────────────────────────────────────────
SEARCH_settings.py     → services/search-service/core/settings.py
SEARCH_urls.py         → services/search-service/core/urls.py
SEARCH_wsgi.py         → services/search-service/core/wsgi.py
SEARCH_views.py        → services/search-service/apps/search/views.py
SEARCH_app_urls.py     → services/search-service/apps/search/urls.py
SEARCH_admin.py        → services/search-service/apps/search/admin.py
SEARCH_apps.py         → services/search-service/apps/search/apps.py
(No models.py - federated search only)
```

#### Monitoring Service
```
Source → Destination
────────────────────────────────────────────────────────────
MON_settings.py        → services/monitoring-service/core/settings.py
MON_urls.py            → services/monitoring-service/core/urls.py
MON_asgi.py            → services/monitoring-service/core/asgi.py
MON_wsgi.py            → services/monitoring-service/core/wsgi.py
MON_models.py          → services/monitoring-service/apps/monitoring/models.py
MON_serializers.py     → services/monitoring-service/apps/monitoring/serializers.py
MON_views.py           → services/monitoring-service/apps/monitoring/views.py
MON_consumers.py       → services/monitoring-service/apps/monitoring/consumers.py
MON_app_urls.py        → services/monitoring-service/apps/monitoring/urls.py
MON_admin.py           → services/monitoring-service/apps/monitoring/admin.py
MON_apps.py            → services/monitoring-service/apps/monitoring/apps.py
```

---

### STEP 3: Create Folder Structure

Make sure these folders exist (create manually if needed):

```
services/
├── notification-service/
│   ├── core/                  (create if missing)
│   ├── apps/
│   │   └── notifications/     (create if missing)
│   └── tests/                 (create if missing)
├── calendar-service/
│   ├── core/                  (create if missing)
│   ├── apps/
│   │   └── calendar/          (create if missing)
│   └── tests/                 (create if missing)
├── search-service/
│   ├── core/                  (create if missing)
│   ├── apps/
│   │   └── search/            (create if missing)
│   └── tests/                 (create if missing)
└── monitoring-service/
    ├── core/                  (create if missing)
    ├── apps/
    │   └── monitoring/        (create if missing)
    └── tests/                 (create if missing)
```

**Quick Check**: Run in PowerShell:
```powershell
# Verify folder structure
Get-ChildItem -Path "services\notification-service" -Recurse
Get-ChildItem -Path "services\calendar-service" -Recurse
Get-ChildItem -Path "services\search-service" -Recurse
Get-ChildItem -Path "services\monitoring-service" -Recurse
```

---

### STEP 4: Update requirements.txt for Each Service

Replace the basic requirements.txt in each service with comprehensive versions.

#### Notification Service requirements.txt
```
Django>=4.2
djangorestframework
djangorestframework-simplejwt
django-cors-headers
python-decouple
gunicorn
psycopg2-binary
redis
celery
requests
pytest
pytest-django
drf-spectacular
email-validator
django-crispy-forms
```

#### Calendar Service requirements.txt
```
Django>=4.2
djangorestframework
djangorestframework-simplejwt
django-cors-headers
python-decouple
gunicorn
psycopg2-binary
redis
celery
celery-beat
requests
pytest
pytest-django
drf-spectacular
django-extensions
```

#### Search Service requirements.txt
```
Django>=4.2
djangorestframework
djangorestframework-simplejwt
django-cors-headers
python-decouple
gunicorn
psycopg2-binary
redis
aiohttp
langdetect
requests
pytest
pytest-django
drf-spectacular
```

#### Monitoring Service requirements.txt
```
Django>=4.2
djangorestframework
djangorestframework-simplejwt
django-cors-headers
python-decouple
gunicorn
daphne
psycopg2-binary
redis
channels
channels-redis
pytest
pytest-django
drf-spectacular
websockets
```

---

### STEP 5: Create __init__.py Files

Create `__init__.py` files if they don't exist:

```
services/notification-service/core/__init__.py         (empty)
services/notification-service/apps/__init__.py         (empty)
services/notification-service/apps/notifications/__init__.py  (empty)
services/notification-service/tests/__init__.py        (empty)

services/calendar-service/core/__init__.py             (empty)
services/calendar-service/apps/__init__.py             (empty)
services/calendar-service/apps/calendar/__init__.py    (empty)
services/calendar-service/tests/__init__.py            (empty)

services/search-service/core/__init__.py               (empty)
services/search-service/apps/__init__.py               (empty)
services/search-service/apps/search/__init__.py        (empty)
services/search-service/tests/__init__.py              (empty)

services/monitoring-service/core/__init__.py           (empty)
services/monitoring-service/apps/__init__.py           (empty)
services/monitoring-service/apps/monitoring/__init__.py (empty)
services/monitoring-service/tests/__init__.py          (empty)
```

---

### STEP 6: Verify .env Configuration

Check that `.env` has all required databases:

```
# Required entries in .env
NOTIFICATION_DB=notification_db
CALENDAR_DB=calendar_db
SEARCH_DB=search_db
MONITORING_DB=monitoring_db

# Should already exist:
DB_USER=lawbridge_user
DB_PASSWORD=changeme
JWT_SECRET_KEY=changeme123
INTERNAL_API_KEY=changeme_internal
REDIS_URL=redis://redis:6379/0
```

---

### STEP 7: Build Docker Images

From the project root (`C:\Users\njoya\Desktop\Lawbridge`):

```bash
# Build all services
docker-compose build notification-service
docker-compose build calendar-service
docker-compose build search-service
docker-compose build monitoring-service

# Or build all at once
docker-compose build
```

---

### STEP 8: Run Database Migrations

Start the databases first:

```bash
# Start only databases
docker-compose up -d notification-db calendar-db search-db monitoring-db

# Wait 10 seconds for databases to initialize
```

Then run migrations:

```bash
# Notification Service
docker-compose exec notification-service python manage.py migrate

# Calendar Service
docker-compose exec calendar-service python manage.py migrate

# Search Service
docker-compose exec search-service python manage.py migrate

# Monitoring Service
docker-compose exec monitoring-service python manage.py migrate
```

---

### STEP 9: Create Superusers (Optional)

Create admin users for the Django admin interfaces:

```bash
# Notification Service
docker-compose exec notification-service python manage.py createsuperuser

# Calendar Service
docker-compose exec calendar-service python manage.py createsuperuser

# Search Service
docker-compose exec search-service python manage.py createsuperuser

# Monitoring Service
docker-compose exec monitoring-service python manage.py createsuperuser
```

---

### STEP 10: Start All Services

```bash
# Start all Phase 4 services (with all infrastructure)
docker-compose up -d

# Check status
docker-compose ps
```

Expected output:
```
NAME                           STATUS
lawbridge-redis                Up
lawbridge-rabbitmq             Up
lawbridge-minio                Up
lawbridge-ollama               Up
lawbridge-auth                 Up
lawbridge-client               Up
lawbridge-lawyer               Up
lawbridge-case                 Up
lawbridge-document             Up
lawbridge-payment              Up
lawbridge-notification         Up ✅ NEW
lawbridge-calendar             Up ✅ NEW
lawbridge-search               Up ✅ NEW
lawbridge-monitoring           Up ✅ NEW
(+ all databases)
```

---

### STEP 11: Verify Services

Check that services are responding:

```bash
# Notification Service Swagger
curl -s http://localhost:8006/api/docs/ | head -20

# Calendar Service Swagger
curl -s http://localhost:8008/api/docs/ | head -20

# Search Service Swagger
curl -s http://localhost:8010/api/docs/ | head -20

# Monitoring Service Swagger
curl -s http://localhost:8009/api/docs/ | head -20
```

Or open in browser:
- Notification: http://localhost:8006/api/docs/
- Calendar: http://localhost:8008/api/docs/
- Search: http://localhost:8010/api/docs/
- Monitoring: http://localhost:8009/api/docs/

---

### STEP 12: Run Tests

```bash
# Notification Service Tests
docker-compose exec notification-service pytest -v

# Calendar Service Tests
docker-compose exec calendar-service pytest -v

# Search Service Tests
docker-compose exec search-service pytest -v

# Monitoring Service Tests
docker-compose exec monitoring-service pytest -v
```

---

## 🧪 TESTING ENDPOINTS

### 1. Get JWT Token (from auth-service)

```bash
curl -X POST http://localhost:8001/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "lawyer@example.com", "password": "password123"}'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 2. Test Notification Service

```bash
# Get notifications
curl -X GET http://localhost:8006/api/v1/notifications/ \
  -H "Authorization: Bearer {ACCESS_TOKEN}"

# Mark as read
curl -X POST http://localhost:8006/api/v1/notifications/{id}/read/ \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

### 3. Test Calendar Service

```bash
# List events
curl -X GET http://localhost:8008/api/v1/calendar/events/ \
  -H "Authorization: Bearer {ACCESS_TOKEN}"

# Create event
curl -X POST http://localhost:8008/api/v1/calendar/events/ \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "case_id": 1,
    "event_type": "hearing",
    "date": "2026-05-20",
    "time": "10:00"
  }'
```

### 4. Test Search Service

```bash
# Global search
curl -X GET "http://localhost:8010/api/v1/search/?q=contract" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"

# Search by type
curl -X GET "http://localhost:8010/api/v1/search/?q=john&type=lawyers" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

### 5. Test Monitoring Service

```bash
# Get dashboard
curl -X GET http://localhost:8009/api/v1/monitoring/dashboard/ \
  -H "Authorization: Bearer {ACCESS_TOKEN}"

# Get case progress
curl -X GET http://localhost:8009/api/v1/monitoring/cases/1/progress/ \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

---

## 🔧 TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Container fails to start | Check logs: `docker-compose logs notification-service` |
| Port already in use | Change port in docker-compose.yml |
| Migration fails | Check DB is running: `docker-compose ps` |
| Import errors | Check requirements.txt installed: `docker-compose exec notification-service pip list` |
| WebSocket connection fails | Ensure Daphne running in monitoring-service |
| CORS errors | Check CORS settings in settings.py |

---

## 📊 VERIFICATION CHECKLIST

```
PRE-DEPLOYMENT
☐ Downloaded all 37 Phase 4 code files
☐ Created folder structure (core/, apps/, tests/)
☐ Updated requirements.txt for each service
☐ Created __init__.py files

DEPLOYMENT
☐ Docker images built for all 4 services
☐ docker-compose up -d successful
☐ All 4 services running (docker-compose ps)
☐ All 4 databases created

VERIFICATION
☐ Swagger UIs accessible (check URLs)
☐ Endpoints responding to requests
☐ JWT auth working
☐ Database migrations successful
☐ Tests passing (80%+ coverage)

POST-DEPLOYMENT
☐ Monitor service logs for errors
☐ Create production .env
☐ Set up alerting/monitoring
☐ Document any custom configurations
☐ Plan Phase 5 deployment
```

---

## 📞 SERVICE DETAILS

### Notification Service (Port 8006)
- **Database**: notification_db
- **Models**: Notification, NotificationTemplate
- **Key Features**: Event subscriptions, bilingual templates, email/SMS queues
- **Admin**: http://localhost:8006/admin/

### Calendar Service (Port 8008)
- **Database**: calendar_db
- **Models**: CalendarEvent, EventApproval, Alarm
- **Key Features**: Hearing scheduling, 2-party approvals, Celery Beat reminders
- **Admin**: http://localhost:8008/admin/

### Search Service (Port 8010)
- **Database**: search_db (minimal, mostly stateless)
- **Models**: None (federated)
- **Key Features**: Cross-service search, language detection, result ranking
- **Admin**: http://localhost:8010/admin/

### Monitoring Service (Port 8009)
- **Database**: monitoring_db
- **Models**: CaseProgressSnapshot, LawyerStats
- **Key Features**: Real-time WebSocket, analytics, case progress tracking
- **Admin**: http://localhost:8009/admin/
- **WebSocket**: ws://localhost:8009/api/v1/monitoring/cases/{case_id}/timeline/

---

## 🎯 NEXT STEPS

After Phase 4 deployment:

1. ✅ Create Kubernetes manifests
2. ✅ Set up production monitoring
3. ✅ Create Postman collection
4. ✅ Begin Phase 5 (AI Assistant)

---

## 📚 REFERENCE FILES

In session workspace:
- `PHASE4_QUICKSTART.md` - 3-command deploy
- `PHASE4_COMPLETE_CODE.md` - All code consolidated
- `INDEX.md` - File reference guide

---

**Ready to deploy Phase 4!** 🚀

Start with STEP 1: Download code files.

Questions? Check the troubleshooting section or review the individual service files.
