"""
Django Phase 4 Service Setup
Comprehensive script to create all 4 microservices with complete Django structure.

Usage: python setup_django_comprehensive.py
Or directly in Python interactive shell: exec(open('setup_django_comprehensive.py').read())
"""

import os
import sys
from pathlib import Path


def create_file(filepath, content):
    """Create a file with content, creating parent directories as needed."""
    filepath = Path(filepath)
    filepath.parent.mkdir(parents=True, exist_ok=True)
    filepath.write_text(content)
    return True


def create_service_structure():
    """Create complete Django structure for all 4 services."""
    
    base_path = Path(r"c:\Users\njoya\Desktop\Lawbridge\services")
    
    services = {
        "notification-service": {
            "app": "notifications",
            "port": 8006,
            "db": "lawbridge_notifications",
            "extra_req": [],
            "has_asgi": False
        },
        "calendar-service": {
            "app": "calendar",
            "port": 8008,
            "db": "lawbridge_calendar",
            "extra_req": ["python-dateutil"],
            "has_asgi": False
        },
        "search-service": {
            "app": "search",
            "port": 8010,
            "db": "lawbridge_search",
            "extra_req": ["langdetect", "aiohttp"],
            "has_asgi": False
        },
        "monitoring-service": {
            "app": "monitoring",
            "port": 8009,
            "db": "lawbridge_monitoring",
            "extra_req": ["django-channels", "channels-redis", "daphne"],
            "has_asgi": True
        }
    }
    
    base_requirements = [
        "Django>=4.2",
        "djangorestframework",
        "djangorestframework-simplejwt",
        "django-cors-headers",
        "python-decouple",
        "gunicorn",
        "psycopg2-binary",
        "redis",
        "celery",
        "requests",
        "pytest",
        "pytest-django",
        "drf-spectacular",
    ]
    
    files_created = {}
    
    for service_name, config in services.items():
        service_path = base_path / service_name
        app_name = config["app"]
        db_name = config["db"]
        
        print(f"\n{'='*60}")
        print(f"Setting up {service_name}")
        print(f"{'='*60}")
        
        files_for_service = []
        
        # ====================
        # 1. Core settings.py
        # ====================
        channels_import = ""
        asgi_line = ""
        channel_layers = ""
        
        if service_name == "monitoring-service":
            channels_import = "'daphne',\n    'channels',\n    "
            asgi_line = "ASGI_APPLICATION = 'core.asgi.application'\n"
            channel_layers = "\n\nCHANNEL_LAYERS = {\n    'default': {\n        'BACKEND': 'channels_redis.core.RedisChannelLayer',\n        'CONFIG': {\n            'hosts': [('127.0.0.1', 6379)],\n        },\n    },\n}"
        
        settings_py = f"""import os
from pathlib import Path
from decouple import config
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='dev-secret')
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    {channels_import}'apps.{app_name}',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'
{asgi_line}
TEMPLATES = [
    {{
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {{
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        }},
    }},
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database
DB_HOST = config('DB_HOST', default='')
if DB_HOST:
    DATABASES = {{
        'default': {{
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='{db_name}'),
            'USER': config('DB_USER', default='lawbridge'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST'),
            'PORT': config('DB_PORT', default='5432'),
        }}
    }}
else:
    DATABASES = {{
        'default': {{
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }}
    }}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {{
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}}

SIMPLE_JWT = {{
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': config('JWT_SECRET_KEY', default=SECRET_KEY),
}}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8080",
]

CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0'){channel_layers}
"""
        
        create_file(service_path / "core" / "settings.py", settings_py)
        files_for_service.append("core/settings.py")
        print(f"  ✓ core/settings.py")
        
        # ====================
        # 2. Core urls.py
        # ====================
        urls_py = """from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health),
]
"""
        create_file(service_path / "core" / "urls.py", urls_py)
        files_for_service.append("core/urls.py")
        print(f"  ✓ core/urls.py")
        
        # ====================
        # 3. Core wsgi.py
        # ====================
        wsgi_py = """import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = get_wsgi_application()
"""
        create_file(service_path / "core" / "wsgi.py", wsgi_py)
        files_for_service.append("core/wsgi.py")
        print(f"  ✓ core/wsgi.py")
        
        # ====================
        # 4. Core asgi.py (monitoring-service only)
        # ====================
        if config["has_asgi"]:
            asgi_py = """import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(URLRouter([]))
    ),
})
"""
            create_file(service_path / "core" / "asgi.py", asgi_py)
            files_for_service.append("core/asgi.py")
            print(f"  ✓ core/asgi.py")
        
        # ====================
        # 5. Core __init__.py
        # ====================
        create_file(service_path / "core" / "__init__.py", "")
        files_for_service.append("core/__init__.py")
        print(f"  ✓ core/__init__.py")
        
        # ====================
        # 6. Apps directory __init__.py
        # ====================
        create_file(service_path / "apps" / "__init__.py", "")
        files_for_service.append("apps/__init__.py")
        print(f"  ✓ apps/__init__.py")
        
        # ====================
        # 7. App directory __init__.py
        # ====================
        create_file(service_path / "apps" / app_name / "__init__.py", "")
        files_for_service.append(f"apps/{app_name}/__init__.py")
        print(f"  ✓ apps/{app_name}/__init__.py")
        
        # ====================
        # 8. Migrations __init__.py
        # ====================
        create_file(service_path / "apps" / app_name / "migrations" / "__init__.py", "")
        files_for_service.append(f"apps/{app_name}/migrations/__init__.py")
        print(f"  ✓ apps/{app_name}/migrations/__init__.py")
        
        # ====================
        # 9. Models.py
        # ====================
        models_py = """from django.db import models


# Define your models here
"""
        create_file(service_path / "apps" / app_name / "models.py", models_py)
        files_for_service.append(f"apps/{app_name}/models.py")
        print(f"  ✓ apps/{app_name}/models.py")
        
        # ====================
        # 10. Serializers.py
        # ====================
        serializers_py = """from rest_framework import serializers


# Define your serializers here
"""
        create_file(service_path / "apps" / app_name / "serializers.py", serializers_py)
        files_for_service.append(f"apps/{app_name}/serializers.py")
        print(f"  ✓ apps/{app_name}/serializers.py")
        
        # ====================
        # 11. Views.py
        # ====================
        views_py = """from rest_framework import viewsets
from rest_framework.response import Response


# Define your views here
"""
        create_file(service_path / "apps" / app_name / "views.py", views_py)
        files_for_service.append(f"apps/{app_name}/views.py")
        print(f"  ✓ apps/{app_name}/views.py")
        
        # ====================
        # 12. URLs.py
        # ====================
        urls_app_py = """from django.urls import path


urlpatterns = [
    # Add your app URLs here
]
"""
        create_file(service_path / "apps" / app_name / "urls.py", urls_app_py)
        files_for_service.append(f"apps/{app_name}/urls.py")
        print(f"  ✓ apps/{app_name}/urls.py")
        
        # ====================
        # 13. Admin.py
        # ====================
        admin_py = """from django.contrib import admin
from .models import *


# Register your models here
"""
        create_file(service_path / "apps" / app_name / "admin.py", admin_py)
        files_for_service.append(f"apps/{app_name}/admin.py")
        print(f"  ✓ apps/{app_name}/admin.py")
        
        # ====================
        # 14. Apps.py
        # ====================
        app_class_name = "".join(word.capitalize() for word in app_name.split('_')) + "Config"
        apps_py = f"""from django.apps import AppConfig


class {app_class_name}(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.{app_name}'
"""
        create_file(service_path / "apps" / app_name / "apps.py", apps_py)
        files_for_service.append(f"apps/{app_name}/apps.py")
        print(f"  ✓ apps/{app_name}/apps.py")
        
        # ====================
        # 15. Tests __init__.py
        # ====================
        create_file(service_path / "tests" / "__init__.py", "")
        files_for_service.append("tests/__init__.py")
        print(f"  ✓ tests/__init__.py")
        
        # ====================
        # 16. Requirements.txt
        # ====================
        requirements = base_requirements + config["extra_req"]
        requirements_content = "\n".join(requirements)
        create_file(service_path / "requirements.txt", requirements_content)
        files_for_service.append("requirements.txt")
        print(f"  ✓ requirements.txt ({len(requirements)} packages)")
        
        files_created[service_name] = files_for_service
    
    return files_created


if __name__ == "__main__":
    print("\n" + "="*60)
    print("Django Phase 4 Services Setup")
    print("="*60)
    
    try:
        files_created = create_service_structure()
        
        print("\n" + "="*60)
        print("SETUP COMPLETED SUCCESSFULLY!")
        print("="*60)
        
        total_files = sum(len(files) for files in files_created.values())
        print(f"\nTotal files created: {total_files}")
        
        for service_name, files in files_created.items():
            print(f"\n{service_name}: {len(files)} files")
            for f in files:
                print(f"  - {f}")
        
        print("\n" + "="*60)
        print("NEXT STEPS:")
        print("="*60)
        print("""
1. Install dependencies for each service:
   cd c:\\Users\\njoya\\Desktop\\Lawbridge\\services\\notification-service
   pip install -r requirements.txt

2. Run migrations:
   python manage.py migrate

3. Create superuser (optional):
   python manage.py createsuperuser

4. Run the development server:
   python manage.py runserver 0.0.0.0:8006
""")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
