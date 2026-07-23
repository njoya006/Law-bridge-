"""
Reputation engine — the keystone the growth system was missing.

Computes a real 0-100 reputation_score for every LawyerProfile from signals the
platform already collects. Until now the field defaulted to 0 and nothing ever
wrote it, so every badge/tier/award rendered off a dead value. This populates it.

Score composition (sums to 100):
  Verification (trust)        20   verified_at set — the single biggest trust signal in Cameroon
  Client satisfaction         30   average_rating (0-5) x review-count confidence
  Experience                  15   years_of_experience, capped at 15 yrs
  Track record                20   total_cases handled, capped at 50
  Activity / availability     10   available > busy/in_court > on_leave > inactive
  Profile completeness         5   bio + qualifications + bar number present

v1 uses lawyer-service local fields only (fast, no fragile per-lawyer cross-service
calls). Case-resolution speed and library contributions are reserved for v2 enrichment.

Run once:      python manage.py compute_reputation
Run as daemon: python manage.py compute_reputation --loop   (recomputes daily)
"""
import json
import time
import logging
from urllib.request import Request, urlopen

from decouple import config
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.lawyers.models import LawyerProfile

logger = logging.getLogger(__name__)

AVAIL_POINTS = {'available': 10, 'busy': 6, 'in_court': 6, 'on_leave': 3, 'inactive': 0}

# Tier thresholds must match the frontend ReputationBadge tiers.
TIERS = [(85, 'Elite'), (70, 'Expert'), (50, 'Senior'), (30, 'Active'), (0, 'Rising')]


def tier_of(score: int) -> str:
    for threshold, label in TIERS:
        if score >= threshold:
            return label
    return 'Rising'


def emit_tier_feed(user_id, tier_label):
    """Announce a reputation tier-up on the network feed (best-effort)."""
    network_url = config('NETWORK_SERVICE_URL', default='http://network-service:8015').rstrip('/')
    try:
        payload = json.dumps({
            'actor_id': str(user_id),
            'item_type': 'tier_reached',
            'title': f'Reached {tier_label} reputation tier',
            'body': f'Recognised as a {tier_label}-tier practitioner on LawBridge.',
        }).encode()
        req = Request(
            f'{network_url}/api/v1/network/feed/internal/',
            data=payload,
            headers={'Content-Type': 'application/json',
                     'X-Internal-Key': config('INTERNAL_API_KEY', default='dev-internal-key')},
            method='POST',
        )
        with urlopen(req, timeout=4):
            pass
    except Exception as exc:  # noqa: BLE001
        logger.warning('tier-up feed emit failed: %s', exc)


def compute_score(p: LawyerProfile) -> int:
    score = 0.0

    # Verification — 20
    if p.verified_at:
        score += 20

    # Client satisfaction: rating quality x volume confidence — 30
    rating = float(p.average_rating or 0)                 # 0-5
    confidence = min(p.rating_count or 0, 10) / 10.0       # full confidence at 10+ reviews
    score += (rating / 5.0) * confidence * 30

    # Experience — 15 (capped at 15 years)
    score += min(p.years_of_experience or 0, 15) / 15.0 * 15

    # Track record — 20 (capped at 50 cases)
    score += min(p.total_cases or 0, 50) / 50.0 * 20

    # Activity / availability — 10
    score += AVAIL_POINTS.get(p.availability_status, 2)

    # Profile completeness — 5
    complete = bool((p.bio or '').strip()) and bool((p.qualifications or '').strip()) and bool((p.bar_number or '').strip())
    if complete:
        score += 5

    return max(0, min(100, round(score)))


class Command(BaseCommand):
    help = 'Compute reputation_score for every lawyer from platform signals'

    def add_arguments(self, parser):
        parser.add_argument('--loop', action='store_true', help='Recompute every 24h')

    def handle(self, *args, **options):
        if options['loop']:
            self.stdout.write('Reputation engine running in loop mode (daily)...')
            while True:
                self.run_once()
                time.sleep(86400)
        else:
            self.run_once()

    def run_once(self, announce_tiers=True):
        profiles = LawyerProfile.objects.all()
        updated = 0
        changed = 0
        promoted = 0
        for p in profiles:
            new_score = compute_score(p)
            old_score = p.reputation_score or 0
            if old_score != new_score:
                old_tier = tier_of(old_score)
                new_tier = tier_of(new_score)
                p.reputation_score = new_score
                p.save(update_fields=['reputation_score'])
                changed += 1
                # Only announce genuine promotions, and skip the initial backfill
                # (old_score 0 → everyone would spam the feed on first run).
                if announce_tiers and old_score > 0 and new_score > old_score and new_tier != old_tier:
                    emit_tier_feed(p.user_id, new_tier)
                    promoted += 1
            updated += 1
        self.stdout.write(
            f'[{timezone.now().isoformat()}] reputation computed for {updated} lawyers '
            f'({changed} changed, {promoted} promoted)'
        )
