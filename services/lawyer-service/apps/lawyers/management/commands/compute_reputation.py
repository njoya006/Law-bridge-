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
import time
import logging

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.lawyers.models import LawyerProfile

logger = logging.getLogger(__name__)

AVAIL_POINTS = {'available': 10, 'busy': 6, 'in_court': 6, 'on_leave': 3, 'inactive': 0}


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

    def run_once(self):
        profiles = LawyerProfile.objects.all()
        updated = 0
        changed = 0
        for p in profiles:
            new_score = compute_score(p)
            if p.reputation_score != new_score:
                p.reputation_score = new_score
                p.save(update_fields=['reputation_score'])
                changed += 1
            updated += 1
        self.stdout.write(
            f'[{timezone.now().isoformat()}] reputation computed for {updated} lawyers '
            f'({changed} changed)'
        )
