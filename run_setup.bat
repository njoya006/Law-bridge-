@echo off
setlocal enabledelayedexpansion
cd /d c:\Users\njoya\Desktop\Lawbridge
if exist "setup_django.py" (
    python setup_django.py
    if errorlevel 1 (
        echo Setup failed with error code %errorlevel%
        pause
        exit /b %errorlevel%
    )
    echo.
    echo Setup completed successfully!
    echo.
    echo Created Django services:
    echo - notification-service (port 8006)
    echo - calendar-service (port 8008)
    echo - search-service (port 8010)
    echo - monitoring-service (port 8009)
    echo.
) else (
    echo setup_django.py not found in c:\Users\njoya\Desktop\Lawbridge
    pause
    exit /b 1
)
