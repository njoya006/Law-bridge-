#!/usr/bin/env python3
"""
Phase 4 Service Setup Script
Creates all necessary Django project structures for Phase 4 services
"""
import os
import sys
from pathlib import Path

BASE_PATH = Path(r"c:\Users\njoya\Desktop\Lawbridge\services")

# Define services and their apps
SERVICES = {
    'notification-service': 'notifications',
    'calendar-service': 'calendar',
    'search-service': 'search',
    'monitoring-service': 'monitoring',
}

def create_dir_structure(service_name, app_name):
    """Create Django project directory structure"""
    service_path = BASE_PATH / service_name
    
    dirs = [
        service_path / 'core',
        service_path / f'apps/{app_name}/migrations',
        service_path / 'tests',
    ]
    
    for dir_path in dirs:
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"✓ Created: {dir_path}")
    
    # Create __init__.py files
    init_files = [
        service_path / 'core/__init__.py',
        service_path / 'apps/__init__.py',
        service_path / f'apps/{app_name}/__init__.py',
        service_path / f'apps/{app_name}/migrations/__init__.py',
        service_path / 'tests/__init__.py',
    ]
    
    for init_file in init_files:
        init_file.touch()
        print(f"✓ Created: {init_file}")

def create_manage_py(service_name):
    """Create manage.py if it doesn't exist"""
    manage_path = BASE_PATH / service_name / 'manage.py'
    
    if manage_path.exists():
        print(f"✓ manage.py already exists: {manage_path}")
        return
    
    manage_content = '''#!/usr/bin/env python
import os
import sys

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
'''
    
    manage_path.write_text(manage_content)
    print(f"✓ Created: {manage_path}")

def create_pytest_ini(service_name):
    """Create pytest.ini"""
    pytest_path = BASE_PATH / service_name / 'pytest.ini'
    
    if pytest_path.exists():
        print(f"✓ pytest.ini already exists: {pytest_path}")
        return
    
    pytest_content = '''[pytest]
DJANGO_SETTINGS_MODULE = core.settings
python_files = tests.py test_*.py *_tests.py
addopts = --cov=apps --cov-report=html --cov-report=term-missing
testpaths = tests
'''
    
    pytest_path.write_text(pytest_content)
    print(f"✓ Created: {pytest_path}")

def main():
    print("=" * 70)
    print("PHASE 4 SERVICE SETUP")
    print("=" * 70)
    print()
    
    for service_name, app_name in SERVICES.items():
        print(f"\n[Setting up {service_name}]")
        create_dir_structure(service_name, app_name)
        create_manage_py(service_name)
        create_pytest_ini(service_name)
        print(f"✓ {service_name} structure complete\n")
    
    print("\n" + "=" * 70)
    print("SETUP COMPLETE!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Copy core/settings.py, core/urls.py, core/wsgi.py to each service")
    print("2. Copy apps/{app_name}/models.py, serializers.py, views.py, etc.")
    print("3. Copy requirements.txt to each service")
    print("4. Run: pip install -r requirements.txt (for each service)")
    print("5. Run: python manage.py migrate (for each service)")
    print("6. Run: docker-compose up --build")
    print()

if __name__ == '__main__':
    main()
