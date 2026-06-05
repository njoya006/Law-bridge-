@echo off
REM Phase 4 Service Setup Script for Windows
REM Creates all necessary folders and files for Phase 4 services

setlocal enabledelayedexpansion

set BASE_PATH=c:\Users\njoya\Desktop\Lawbridge\services

echo Creating Phase 4 Service Structures...
echo.

REM Create Notification Service structure
echo [1/4] Setting up Notification Service...
mkdir "%BASE_PATH%\notification-service\core" 2>nul
mkdir "%BASE_PATH%\notification-service\apps\notifications\migrations" 2>nul
mkdir "%BASE_PATH%\notification-service\tests" 2>nul
echo. > "%BASE_PATH%\notification-service\core\__init__.py"
echo. > "%BASE_PATH%\notification-service\apps\__init__.py"
echo. > "%BASE_PATH%\notification-service\apps\notifications\__init__.py"
echo. > "%BASE_PATH%\notification-service\apps\notifications\migrations\__init__.py"
echo. > "%BASE_PATH%\notification-service\tests\__init__.py"
echo OK

REM Create Calendar Service structure
echo [2/4] Setting up Calendar Service...
mkdir "%BASE_PATH%\calendar-service\core" 2>nul
mkdir "%BASE_PATH%\calendar-service\apps\calendar\migrations" 2>nul
mkdir "%BASE_PATH%\calendar-service\tests" 2>nul
echo. > "%BASE_PATH%\calendar-service\core\__init__.py"
echo. > "%BASE_PATH%\calendar-service\apps\__init__.py"
echo. > "%BASE_PATH%\calendar-service\apps\calendar\__init__.py"
echo. > "%BASE_PATH%\calendar-service\apps\calendar\migrations\__init__.py"
echo. > "%BASE_PATH%\calendar-service\tests\__init__.py"
echo OK

REM Create Search Service structure
echo [3/4] Setting up Search Service...
mkdir "%BASE_PATH%\search-service\core" 2>nul
mkdir "%BASE_PATH%\search-service\apps\search\migrations" 2>nul
mkdir "%BASE_PATH%\search-service\tests" 2>nul
echo. > "%BASE_PATH%\search-service\core\__init__.py"
echo. > "%BASE_PATH%\search-service\apps\__init__.py"
echo. > "%BASE_PATH%\search-service\apps\search\__init__.py"
echo. > "%BASE_PATH%\search-service\apps\search\migrations\__init__.py"
echo. > "%BASE_PATH%\search-service\tests\__init__.py"
echo OK

REM Create Monitoring Service structure
echo [4/4] Setting up Monitoring Service...
mkdir "%BASE_PATH%\monitoring-service\core" 2>nul
mkdir "%BASE_PATH%\monitoring-service\apps\monitoring\migrations" 2>nul
mkdir "%BASE_PATH%\monitoring-service\tests" 2>nul
echo. > "%BASE_PATH%\monitoring-service\core\__init__.py"
echo. > "%BASE_PATH%\monitoring-service\apps\__init__.py"
echo. > "%BASE_PATH%\monitoring-service\apps\monitoring\__init__.py"
echo. > "%BASE_PATH%\monitoring-service\apps\monitoring\migrations\__init__.py"
echo. > "%BASE_PATH%\monitoring-service\tests\__init__.py"
echo OK

echo.
echo All Phase 4 service folders created!
echo.
echo Next steps:
echo 1. Download the Phase 4 file structure from session workspace
echo 2. Copy all .py files to their respective services
echo 3. Run: docker-compose up --build
echo.
pause
