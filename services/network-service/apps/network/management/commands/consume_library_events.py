import json
import logging
import redis
from django.core.management.base import BaseCommand
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Subscribe to Redis library.article_published pub/sub and create FeedItems'

    def handle(self, *args, **options):
        from apps.network.models import FeedItem

        redis_url = getattr(settings, 'REDIS_URL', 'redis://redis:6379/0')
        r = redis.from_url(redis_url)
        pubsub = r.pubsub()
        pubsub.subscribe('library.article_published')

        self.stdout.write(f'Subscribed to library.article_published on {redis_url}')

        for message in pubsub.listen():
            if message['type'] != 'message':
                continue
            try:
                data = json.loads(message['data'])
                feed_item = FeedItem.objects.create(
                    actor_id=data.get('author_id', '00000000-0000-0000-0000-000000000000'),
                    item_type='article',
                    title=data.get('title', 'New Article'),
                    body=data.get('summary', ''),
                    external_id=data.get('article_id', ''),
                    external_url=data.get('url', ''),
                )
                logger.info('Created FeedItem %s for article %s', feed_item.id, data.get('article_id'))
                self.stdout.write(f'FeedItem created: article={data.get("article_id", "")[:8]} title={data.get("title", "")[:40]}')
            except Exception as exc:
                logger.exception('Error processing library.article_published message: %s', exc)
