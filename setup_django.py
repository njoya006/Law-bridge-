import os
from pathlib import Path
import sys

# Base requirements for all services
BASE_REQUIREMENTS = [
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

# Service-specific requirements
services_config = {
    "notification-service": {
        "app_name": "notifications",
        "port": 8006,
        "extra_deps": []
    },
    "calendar-service": {
        "app_name": "calendar",
        "port": 8008,
        "extra_deps": ["python-dateutil"]
    },
    "search-service": {
        "app_name": "search",
        "port": 8010,
        "extra_deps": ["langdetect", "aiohttp"]
    },
    "monitoring-service": {
        "app_name": "monitoring",
        "port": 8009,
        "extra_deps": ["django-channels", "channels-redis", "daphne"]
    }
}

base_dir = Path(r"c:\Users\njoya\Desktop\Lawbridge\services")

# Core settings template
SETTINGS_TEMPLATE = '''import os
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
{channels_import}    'apps.{app_name}',
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

# Database: prefer Postgres when DB_HOST provided, else sqlite for quick dev
DB_HOST = config('DB_HOST', default='')
if DB_HOST:
    DATABASES = {{
        'default': {{
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='lawbridge_{app_name}'),
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
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
{channel_layers}'''

# Create directory structure and files for each service
for service_name, config in services_config.items():
    service_path = base_dir / service_name
    app_name = config["app_name"]
    
    # Create directories
    (service_path / "core").mkdir(parents=True, exist_ok=True)
    (service_path / "apps" / app_name / "migrations").mkdir(parents=True, exist_ok=True)
    (service_path / "tests").mkdir(parents=True, exist_ok=True)
    
    # Create __init__.py files
    (service_path / "core" / "__init__.py").touch()
    (service_path / "apps" / "__init__.py").touch()
    (service_path / "apps" / app_name / "__init__.py").touch()
    (service_path / "apps" / app_name / "migrations" / "__init__.py").touch()
    (service_path / "tests" / "__init__.py").touch()
    
    # Create requirements.txt
    requirements = BASE_REQUIREMENTS + config["extra_deps"]
    req_file = service_path / "requirements.txt"
    with open(req_file, 'w') as f:
        f.write("\n".join(requirements) + "\n")
    
    # Create core/settings.py
    channels_import = "'daphne',\n    " if service_name == "monitoring-service" else ""
    channels_import += "'channels',\n    " if service_name == "monitoring-service" else ""
    asgi_line = "ASGI_APPLICATION = 'core.asgi.application'" if service_name == "monitoring-service" else ""
    channel_layers = "\n\nCHANNEL_LAYERS = {\n    'default': {\n        'BACKEND': 'channels_redis.core.RedisChannelLayer',\n        'CONFIG': {\n            'hosts': [('127.0.0.1', 6379)],\n        },\n    },\n}" if service_name == "monitoring-service" else ""
    
    settings_content = SETTINGS_TEMPLATE.format(
        app_name=app_name,
        channels_import=channels_import,
        asgi_line=asgi_line,
        channel_layers=channel_layers
    )
    
    settings_file = service_path / "core" / "settings.py"
    with open(settings_file, 'w') as f:
        f.write(settings_content)
    
    # Create core/urls.py
    urls_content = """from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health),
]
"""
    urls_file = service_path / "core" / "urls.py"
    with open(urls_file, 'w') as f:
        f.write(urls_content)
    
    # Create core/wsgi.py
    wsgi_content = """import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = get_wsgi_application()
"""
    wsgi_file = service_path / "core" / "wsgi.py"
    with open(wsgi_file, 'w') as f:
        f.write(wsgi_content)
    
    # Create core/asgi.py (only for monitoring-service)
    if service_name == "monitoring-service":
        asgi_content = """import os
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
        asgi_file = service_path / "core" / "asgi.py"
        with open(asgi_file, 'w') as f:
            f.write(asgi_content)
    
    # Create app models.py
    models_content = """from django.db import models
"""
    models_file = service_path / "apps" / app_name / "models.py"
    with open(models_file, 'w') as f:
        f.write(models_content)
    
    # Create app serializers.py
    serializers_content = """from rest_framework import serializers
"""
    serializers_file = service_path / "apps" / app_name / "serializers.py"
    with open(serializers_file, 'w') as f:
        f.write(serializers_content)
    
    # Create app views.py
    views_content = """from rest_framework import viewsets
from rest_framework.response import Response
"""
    views_file = service_path / "apps" / app_name / "views.py"
    with open(views_file, 'w') as f:
        f.write(views_content)
    
    # Create app urls.py
    urls_content = """from django.urls import path
"""
    urls_file = service_path / "apps" / app_name / "urls.py"
    with open(urls_file, 'w') as f:
        f.write(urls_content)
    
    # Create app admin.py
    admin_content = """from django.contrib import admin
from .models import *

# Register your models here.
"""
    admin_file = service_path / "apps" / app_name / "admin.py"
    with open(admin_file, 'w') as f:
        f.write(admin_content)
    
    # Create app apps.py
    apps_content = f"""from django.apps import AppConfig


class {app_name.title()}Config(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.{app_name}'
"""
    apps_file = service_path / "apps" / app_name / "apps.py"
    with open(apps_file, 'w') as f:
        f.write(apps_content)
    
    print(f"✓ Created complete Django structure for {service_name}")

print("\nAll Django services created successfully!")
