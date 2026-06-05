import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.monitoring.consumers import CaseTimelineConsumer
from django.urls import path

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter([
            path('ws/monitoring/cases/<str:case_id>/timeline/', CaseTimelineConsumer.as_asgi()),
        ])
    ),
})
