@echo off
REM ============================================================================
REM PHASE 4 COMPLETE SETUP SCRIPT
REM Windows CMD Batch Script to set up all 4 Phase 4 services
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo PHASE 4 SERVICE SETUP - LawBridge
echo ============================================================================
echo.

set BASE_PATH=c:\Users\njoya\Desktop\Lawbridge\services

REM ============================================================================
REM STEP 1: Create all directory structures
REM ============================================================================
echo [STEP 1] Creating directory structures...

for %%S in (notification-service calendar-service search-service monitoring-service) do (
    mkdir "!BASE_PATH!\%%S\core" 2>nul
    mkdir "!BASE_PATH!\%%S\apps" 2>nul
    mkdir "!BASE_PATH!\%%S\tests" 2>nul
    echo ✓ Created folders for %%S
)

mkdir "!BASE_PATH!\notification-service\apps\notifications\migrations" 2>nul
mkdir "!BASE_PATH!\calendar-service\apps\calendar\migrations" 2>nul
mkdir "!BASE_PATH!\search-service\apps\search\migrations" 2>nul
mkdir "!BASE_PATH!\monitoring-service\apps\monitoring\migrations" 2>nul

echo ✓ All directories created

REM ============================================================================
REM STEP 2: Create __init__.py files
REM ============================================================================
echo.
echo [STEP 2] Creating __init__.py files...

(
    cd /d "!BASE_PATH!\notification-service"
    (
        type nul > "core\__init__.py"
        type nul > "apps\__init__.py"
        type nul > "apps\notifications\__init__.py"
        type nul > "apps\notifications\migrations\__init__.py"
        type nul > "tests\__init__.py"
    )
    echo ✓ Notification Service init files created
)

(
    cd /d "!BASE_PATH!\calendar-service"
    (
        type nul > "core\__init__.py"
        type nul > "apps\__init__.py"
        type nul > "apps\calendar\__init__.py"
        type nul > "apps\calendar\migrations\__init__.py"
        type nul > "tests\__init__.py"
    )
    echo ✓ Calendar Service init files created
)

(
    cd /d "!BASE_PATH!\search-service"
    (
        type nul > "core\__init__.py"
        type nul > "apps\__init__.py"
        type nul > "apps\search\__init__.py"
        type nul > "apps\search\migrations\__init__.py"
        type nul > "tests\__init__.py"
    )
    echo ✓ Search Service init files created
)

(
    cd /d "!BASE_PATH!\monitoring-service"
    (
        type nul > "core\__init__.py"
        type nul > "apps\__init__.py"
        type nul > "apps\monitoring\__init__.py"
        type nul > "apps\monitoring\migrations\__init__.py"
        type nul > "tests\__init__.py"
    )
    echo ✓ Monitoring Service init files created
)

REM ============================================================================
REM STEP 3: Create manage.py files if they don't exist
REM ============================================================================
echo.
echo [STEP 3] Creating manage.py files...

for %%S in (notification-service calendar-service search-service monitoring-service) do (
    if not exist "!BASE_PATH!\%%S\manage.py" (
        (
            echo #!/usr/bin/env python
            echo import os
            echo import sys
            echo.
            echo def main^(^):
            echo     os.environ.setdefault^('DJANGO_SETTINGS_MODULE', 'core.settings'^)
            echo     try:
            echo         from django.core.management import execute_from_command_line
            echo     except ImportError as exc:
            echo         raise ImportError^(
            echo             "Couldn't import Django. Are you sure it's installed and "
            echo             "available on your PYTHONPATH environment variable? Did you "
            echo             "forget to activate a virtual environment?"
            echo         ^) from exc
            echo     execute_from_command_line^(sys.argv^)
            echo.
            echo if __name__ == '__main__':
            echo     main^(^)
        ) > "!BASE_PATH!\%%S\manage.py"
        echo ✓ Created manage.py for %%S
    ) else (
        echo ✓ manage.py already exists for %%S
    )
)

REM ============================================================================
REM STEP 4: Create pytest.ini files
REM ============================================================================
echo.
echo [STEP 4] Creating pytest.ini files...

for %%S in (notification-service calendar-service search-service monitoring-service) do (
    (
        echo [pytest]
        echo DJANGO_SETTINGS_MODULE = core.settings
        echo python_files = tests.py test_*.py *_tests.py
        echo addopts = --cov=apps --cov-report=html --cov-report=term-missing
        echo testpaths = tests
    ) > "!BASE_PATH!\%%S\pytest.ini"
    echo ✓ Created pytest.ini for %%S
)

REM ============================================================================
REM SUMMARY
REM ============================================================================
echo.
echo ============================================================================
echo SETUP COMPLETE!
echo ============================================================================
echo.
echo All 4 services are now scaffolded:
echo   ✓ Notification Service  (Port 8006)
echo   ✓ Calendar Service      (Port 8008)
echo   ✓ Search Service        (Port 8010)
echo   ✓ Monitoring Service    (Port 8009)
echo.
echo NEXT STEPS:
echo -----------
echo.
echo 1. Download implementation files from session workspace:
echo    - NOTIF_*.py     → notification-service/
echo    - CAL_*.py       → calendar-service/
echo    - SEARCH_*.py    → search-service/
echo    - MON_*.py       → monitoring-service/
echo.
echo 2. Rename files (e.g., NOTIF_settings.py → core/settings.py)
echo.
echo 3. Update .env with Phase 4 database names:
echo    NOTIFICATION_DB=notification_db
echo    CALENDAR_DB=calendar_db
echo    SEARCH_DB=search_db
echo    MONITORING_DB=monitoring_db
echo.
echo 4. Update docker-compose.yml to include Phase 4 services
echo    (See PHASE4_SETUP_MANUAL.md for docker-compose entries)
echo.
echo 5. Install dependencies:
echo    pip install -r requirements.txt (in each service folder)
echo.
echo 6. Run migrations:
echo    python manage.py migrate (in each service folder)
echo.
echo 7. Start services:
echo    docker-compose up --build
echo.
echo ============================================================================
echo.

pause
