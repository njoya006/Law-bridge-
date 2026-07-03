from django.urls import re_path
from apps.messaging import consumers

websocket_urlpatterns = [
    re_path(r'^ws/messages/thread/(?P<thread_id>\d+)/$', consumers.ThreadConsumer.as_asgi()),
]
