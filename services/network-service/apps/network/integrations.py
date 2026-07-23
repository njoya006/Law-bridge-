"""
Cross-service integrations for the network service — push notifications to the
monitoring-service (in-app + email) and a direct-create helper for feed items.
Same internal-key pattern used by calendar-service / case-service.
"""
import json
import logging
from urllib.request import Request, urlopen

from decouple import config

logger = logging.getLogger(__name__)


def notify(recipient_id, notification_type, title, body, send_email=False):
    """Push an in-app (and optional email) notification via monitoring-service."""
    monitoring_url = config('MONITORING_SERVICE_URL', default='http://monitoring-service:8009').rstrip('/')
    try:
        payload = json.dumps({
            'recipient_id': str(recipient_id),
            'notification_type': notification_type,
            'title': title,
            'body': body,
            'send_email': send_email,
        }).encode()
        req = Request(
            f'{monitoring_url}/api/v1/monitoring/notifications/internal/',
            data=payload,
            headers={
                'Content-Type': 'application/json',
                'X-Internal-Key': config('INTERNAL_API_KEY', default='dev-internal-key'),
            },
            method='POST',
        )
        with urlopen(req, timeout=5):
            pass
        return True
    except Exception as exc:  # noqa: BLE001 — notifications are best-effort
        logger.warning('network notify failed: %s', exc)
        return False
