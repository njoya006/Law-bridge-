"""
Shared fixtures for monitoring-service tests.

- channel_layer_settings: replaces the Redis-backed channel layer with an
  in-memory one so WebSocket tests don't need a running Redis instance.
- Channels layer cache is cleared between tests so groups don't bleed over.
"""
# Stub daphne before channels.testing.__init__ can try to import it.
# channels.testing.live imports daphne.testing.DaphneProcess at package load
# time, which crashes when daphne isn't installed.  We only need
# WebsocketCommunicator from channels.testing.websocket, so the stub is safe.
import sys
from unittest.mock import MagicMock
if 'daphne' not in sys.modules:
    sys.modules['daphne'] = MagicMock()
    sys.modules['daphne.testing'] = MagicMock()

import pytest


@pytest.fixture(autouse=True)
def use_in_memory_channel_layer(settings):
    """
    Override CHANNEL_LAYERS for every test to use the thread-safe InMemory
    backend.  pytest-django's `settings` fixture handles teardown automatically.
    """
    settings.CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        }
    }
    # Clear the cached layer so the new setting takes effect
    from channels import layers as _layers
    _layers.channel_layers.backends = {}
    yield
    _layers.channel_layers.backends = {}
