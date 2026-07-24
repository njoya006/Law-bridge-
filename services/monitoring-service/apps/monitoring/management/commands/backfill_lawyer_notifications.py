"""
One-off backfill: give lawyers a notification for each active matter they are
already handling. New case events notify lawyers going forward, but existing
matters predate that wiring — this seeds them so the notification page isn't
empty for a lawyer with active cases.

Idempotent: skips a (lawyer, case) pair that already has a case_updated /
case_assigned notification.

    python manage.py backfill_lawyer_notifications
"""
import uuid as uuidlib
from django.core.management.base import BaseCommand
from apps.monitoring.models import CaseProgressSnapshot, Notification

TERMINAL = {'closed', 'dismissed', 'archived', 'settled'}
STATUS_LABELS = {
    'filed': 'Filed', 'assigned': 'Assigned', 'under_review': 'Under Review',
    'evidence_collection': 'Evidence Collection', 'awaiting_court_date': 'Awaiting Court Date',
    'in_progress': 'In Progress', 'hearing_scheduled': 'Hearing Scheduled',
    'hearing_adjourned': 'Hearing Adjourned', 'mediation': 'Mediation',
    'verdict': 'Verdict Rendered', 'appeal_filed': 'Appeal Filed',
    'appeal_in_progress': 'Appeal in Progress',
}


class Command(BaseCommand):
    help = 'Seed lawyer notifications for active matters they already handle'

    def handle(self, *args, **options):
        created = 0
        snaps = CaseProgressSnapshot.objects.exclude(status__in=TERMINAL)
        for s in snaps:
            if not s.assigned_lawyer_id:
                continue
            try:
                lawyer_uuid = uuidlib.UUID(str(s.assigned_lawyer_id))
            except (ValueError, AttributeError):
                continue
            # Skip if this lawyer already has a notification for this case
            if Notification.objects.filter(recipient_id=lawyer_uuid, case_id=str(s.case_id)).exists():
                continue
            label = STATUS_LABELS.get(s.status, s.status.replace('_', ' ').title())
            Notification.objects.create(
                recipient_id=lawyer_uuid,
                notification_type='case_updated',
                title=f'You are handling: {s.title[:60] or "a matter"}',
                body=f'Matter "{s.title}" is currently {label}. Open the case file to review deadlines, parties and hearings.',
                case_id=str(s.case_id),
            )
            created += 1
        self.stdout.write(f'Backfilled {created} lawyer notification(s) for active matters.')
