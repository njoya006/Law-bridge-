# 🎯 PHASE 4 DEPLOYMENT - STEP-BY-STEP ACTION PLAN

**Current Status**: Ready to Deploy  
**Last Updated**: May 17, 2026 - 04:05 UTC+1  
**Target Completion**: Today (2-3 hours)

---

## 📋 WHAT'S READY

✅ **Infrastructure**: All databases and services configured in docker-compose.yml  
✅ **Folder Structure**: All 4 service folders exist with manage.py and pytest.ini  
✅ **Environment**: .env file with all required database names  
✅ **Basic Requirements**: Base requirements.txt in each service  
✅ **Documentation**: Comprehensive deployment guides created  
✅ **Automation**: PowerShell deployment script ready  

❌ **Missing**: Service code files (models, views, serializers, etc.)

---

## 🚀 QUICK START (3 COMMANDS)

```powershell
# 1. Download files and copy to services
# (See detailed steps below)

# 2. Run PowerShell verification
.\phase4-deploy.ps1 -Action verify

# 3. Deploy
docker-compose up --build
```

---

## 📥 DETAILED DEPLOYMENT STEPS

### Phase 1: Prepare (30 minutes)

**1.1 Download Code Files**

Go to session workspace:
```
C:\Users\njoya\.copilot\session-state\78784c2d-d8da-43cd-a7f6-72a2976c3224\
```

Download these 37 files:
- ✅ NOTIF_settings.py, NOTIF_urls.py, NOTIF_wsgi.py, NOTIF_models.py, NOTIF_serializers.py, NOTIF_views.py, NOTIF_app_urls.py, NOTIF_admin.py, NOTIF_apps.py
- ✅ CAL_settings.py, CAL_urls.py, CAL_wsgi.py, CAL_models.py, CAL_serializers.py, CAL_views.py, CAL_app_urls.py, CAL_admin.py, CAL_apps.py
- ✅ SEARCH_settings.py, SEARCH_urls.py, SEARCH_wsgi.py, SEARCH_views.py, SEARCH_app_urls.py, SEARCH_admin.py, SEARCH_apps.py (8 files)
- ✅ MON_settings.py, MON_urls.py, MON_asgi.py, MON_wsgi.py, MON_models.py, MON_serializers.py, MON_views.py, MON_consumers.py, MON_app_urls.py, MON_admin.py, MON_apps.py (11 files)

**1.2 Create Folder Structure**

Create these folders if they don't exist:

```powershell
# Notification Service
New-Item -ItemType Directory -Path "services\notification-service\core" -Force
New-Item -ItemType Directory -Path "services\notification-service\apps\notifications" -Force
New-Item -ItemType Directory -Path "services\notification-service\tests" -Force

# Calendar Service
New-Item -ItemType Directory -Path "services\calendar-service\core" -Force
New-Item -ItemType Directory -Path "services\calendar-service\apps\calendar" -Force
New-Item -ItemType Directory -Path "services\calendar-service\tests" -Force

# Search Service
New-Item -ItemType Directory -Path "services\search-service\core" -Force
New-Item -ItemType Directory -Path "services\search-service\apps\search" -Force
New-Item -ItemType Directory -Path "services\search-service\tests" -Force

# Monitoring Service
New-Item -ItemType Directory -Path "services\monitoring-service\core" -Force
New-Item -ItemType Directory -Path "services\monitoring-service\apps\monitoring" -Force
New-Item -ItemType Directory -Path "services\monitoring-service\tests" -Force
```

**1.3 Create __init__.py Files**

```powershell
# Notification Service
New-Item -ItemType File -Path "services\notification-service\core\__init__.py" -Force
New-Item -ItemType File -Path "services\notification-service\apps\__init__.py" -Force
New-Item -ItemType File -Path "services\notification-service\apps\notifications\__init__.py" -Force
New-Item -ItemType File -Path "services\notification-service\tests\__init__.py" -Force

# Calendar Service
New-Item -ItemType File -Path "services\calendar-service\core\__init__.py" -Force
New-Item -ItemType File -Path "services\calendar-service\apps\__init__.py" -Force
New-Item -ItemType File -Path "services\calendar-service\apps\calendar\__init__.py" -Force
New-Item -ItemType File -Path "services\calendar-service\tests\__init__.py" -Force

# Search Service
New-Item -ItemType File -Path "services\search-service\core\__init__.py" -Force
New-Item -ItemType File -Path "services\search-service\apps\__init__.py" -Force
New-Item -ItemType File -Path "services\search-service\apps\search\__init__.py" -Force
New-Item -ItemType File -Path "services\search-service\tests\__init__.py" -Force

# Monitoring Service
New-Item -ItemType File -Path "services\monitoring-service\core\__init__.py" -Force
New-Item -ItemType File -Path "services\monitoring-service\apps\__init__.py" -Force
New-Item -ItemType File -Path "services\monitoring-service\apps\monitoring\__init__.py" -Force
New-Item -ItemType File -Path "services\monitoring-service\tests\__init__.py" -Force
```

**1.4 Copy Code Files**

Using Windows Explorer or PowerShell:

```powershell
# Example for notification service (repeat for others)
Copy-Item "Downloads\NOTIF_settings.py" "services\notification-service\core\settings.py" -Force
Copy-Item "Downloads\NOTIF_urls.py" "services\notification-service\core\urls.py" -Force
Copy-Item "Downloads\NOTIF_wsgi.py" "services\notification-service\core\wsgi.py" -Force
Copy-Item "Downloads\NOTIF_models.py" "services\notification-service\apps\notifications\models.py" -Force
Copy-Item "Downloads\NOTIF_serializers.py" "services\notification-service\apps\notifications\serializers.py" -Force
Copy-Item "Downloads\NOTIF_views.py" "services\notification-service\apps\notifications\views.py" -Force
Copy-Item "Downloads\NOTIF_app_urls.py" "services\notification-service\apps\notifications\urls.py" -Force
Copy-Item "Downloads\NOTIF_admin.py" "services\notification-service\apps\notifications\admin.py" -Force
Copy-Item "Downloads\NOTIF_apps.py" "services\notification-service\apps\notifications\apps.py" -Force
```

---

### Phase 2: Configure (20 minutes)

**2.1 Update requirements.txt**

Replace the basic requirements in each service with complete versions from `PHASE4_DEPLOYMENT_GUIDE.md`.

**2.2 Verify .env**

Check `.env` has all Phase 4 database names:
```
NOTIFICATION_DB=notification_db
CALENDAR_DB=calendar_db
SEARCH_DB=search_db
MONITORING_DB=monitoring_db
```

**2.3 Run Verification**

```powershell
cd C:\Users\njoya\Desktop\Lawbridge
.\phase4-deploy.ps1 -Action verify
```

Expected output:
```
✓ Docker found
✓ Docker Compose found
✓ services\notification-service
✓ services\calendar-service
✓ services\search-service
✓ services\monitoring-service
✓ All checks passed! Ready for deployment.
```

---

### Phase 3: Build (30 minutes)

**3.1 Build Docker Images**

```powershell
# Build all services
docker-compose build

# Or one at a time
docker-compose build notification-service
docker-compose build calendar-service
docker-compose build search-service
docker-compose build monitoring-service
```

**3.2 Wait for Build**

Expected time: 5-10 minutes per service (15-30 minutes total)

---

### Phase 4: Deploy (20 minutes)

**4.1 Start Databases**

```powershell
docker-compose up -d notification-db calendar-db search-db monitoring-db

# Wait 10 seconds
Start-Sleep -Seconds 10
```

**4.2 Run Migrations**

```powershell
docker-compose exec notification-service python manage.py migrate
docker-compose exec calendar-service python manage.py migrate
docker-compose exec search-service python manage.py migrate
docker-compose exec monitoring-service python manage.py migrate
```

**4.3 Start All Services**

```powershell
docker-compose up -d

# Wait 5 seconds
Start-Sleep -Seconds 5

# Check status
docker-compose ps
```

**4.4 Verify Services Running**

```powershell
# Should see all services as "Up"
docker-compose ps | grep -E "notification|calendar|search|monitoring"
```

---

### Phase 5: Verify (30 minutes)

**5.1 Check Service Health**

```powershell
# Notification Service
curl http://localhost:8006/api/docs/

# Calendar Service
curl http://localhost:8008/api/docs/

# Search Service
curl http://localhost:8010/api/docs/

# Monitoring Service
curl http://localhost:8009/api/docs/
```

Expected: HTML pages with Swagger UI

**5.2 Create Test User**

```powershell
# In auth-service
docker-compose exec auth-service python manage.py createsuperuser
# Email: test@example.com
# Password: TestPass123
```

**5.3 Get JWT Token**

```bash
curl -X POST http://localhost:8001/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

Copy the `access` token from response.

**5.4 Test Each Service**

```powershell
$token = "YOUR_JWT_TOKEN_HERE"

# Notification Service
curl -H "Authorization: Bearer $token" http://localhost:8006/api/v1/notifications/

# Calendar Service
curl -H "Authorization: Bearer $token" http://localhost:8008/api/v1/calendar/events/

# Search Service
curl -H "Authorization: Bearer $token" "http://localhost:8010/api/v1/search/?q=test"

# Monitoring Service
curl -H "Authorization: Bearer $token" http://localhost:8009/api/v1/monitoring/dashboard/
```

Expected: JSON responses (may be empty if no data, but valid responses)

**5.5 Run Tests**

```powershell
docker-compose exec notification-service pytest -v
docker-compose exec calendar-service pytest -v
docker-compose exec search-service pytest -v
docker-compose exec monitoring-service pytest -v
```

---

## 📊 DEPLOYMENT TIMELINE

| Phase | Task | Time |
|-------|------|------|
| 1 | Prepare (download, folders, copy) | 30 min |
| 2 | Configure (requirements, env, verify) | 20 min |
| 3 | Build (Docker images) | 30 min |
| 4 | Deploy (migrations, start) | 20 min |
| 5 | Verify (health checks, tests) | 30 min |
| **Total** | **Phase 4 Deployment Complete** | **130 min (~2.2 hrs)** |

---

## ✅ SUCCESS CHECKLIST

Use this to verify deployment:

```
PREPARATION
☐ Downloaded all 37 code files
☐ Created all folder structures
☐ Created all __init__.py files
☐ Copied all code files to correct locations
☐ Updated all requirements.txt files

CONFIGURATION
☐ .env has all Phase 4 database names
☐ docker-compose.yml has all services
☐ nginx.conf includes Phase 4 routes (if needed)

BUILD
☐ docker-compose build successful
☐ All 4 images built without errors

DEPLOYMENT
☐ docker-compose up -d successful
☐ All containers running (docker-compose ps)
☐ All databases created
☐ Migrations completed

VERIFICATION
☐ Swagger UIs accessible (8006, 8008, 8009, 8010)
☐ JWT auth working
☐ All endpoints responding
☐ WebSocket connection works (monitoring)
☐ Tests passing (80%+ coverage)

POST-DEPLOYMENT
☐ Check logs for errors: docker-compose logs
☐ Monitor health: docker stats
☐ Document any issues
☐ Plan Phase 5 deployment
```

---

## 🆘 TROUBLESHOOTING

### Containers won't start

```powershell
# Check logs
docker-compose logs notification-service
docker-compose logs calendar-service
docker-compose logs search-service
docker-compose logs monitoring-service
```

Common issues:
- Missing code files → Copy files
- Requirements not installed → Run `docker-compose build --no-cache`
- Port conflicts → Change in docker-compose.yml

### Migrations fail

```powershell
# Check database is running
docker-compose ps | grep -E "db"

# Check database logs
docker-compose logs notification-db
```

### Import errors

```powershell
# Check requirements.txt
cat services\notification-service\requirements.txt

# Rebuild image
docker-compose build --no-cache notification-service
```

### Port already in use

Edit docker-compose.yml, change port:
```yaml
notification-service:
  ports:
    - "8016:8006"  # Changed from 8006 to 8016
```

---

## 📚 REFERENCE GUIDES

In project root:
- `PHASE4_DEPLOYMENT_GUIDE.md` - Detailed step-by-step guide
- `phase4-deploy.ps1` - PowerShell automation script
- `docker-compose.yml` - Service configuration

In session workspace:
- `PHASE4_QUICKSTART.md` - 3-command quick start
- `PHASE4_COMPLETE_CODE.md` - All code files consolidated
- `INDEX.md` - File reference

---

## 🎯 NEXT AFTER PHASE 4

Once Phase 4 is deployed and verified:

### Immediate (1 day)
- ✅ Create Kubernetes manifests for Phase 4
- ✅ Set up CI/CD pipeline
- ✅ Document APIs in Postman
- ✅ Create production .env

### Short-term (1 week)
- ✅ Phase 5 planning (AI Assistant Service)
- ✅ Design Ollama integration
- ✅ Implement chat module

### Medium-term (2 weeks)
- ✅ Phase 6 (Frontend - Next.js 15)
- ✅ UI/UX design
- ✅ Integration testing

---

## 📞 SUPPORT RESOURCES

| Need | Location |
|------|----------|
| Full deployment guide | `PHASE4_DEPLOYMENT_GUIDE.md` |
| Quick start | `PHASE4_QUICKSTART.md` |
| Code reference | `PHASE4_COMPLETE_CODE.md` |
| File mapping | Session workspace `INDEX.md` |
| Automation script | `phase4-deploy.ps1` |

---

## 🎉 YOU'RE READY!

Everything is prepared. Start with Phase 1 (Prepare).

**Estimated completion: 2-3 hours from now**

Good luck! 🚀
