"""
Deadline & detention alert runner.

Scans pending CaseDeadlines and active DetentionRecords, and pushes in-app +
email notifications to the assigned lawyer through the monitoring-service
internal endpoint (same pattern as calendar-service booking notifications).

Alert schedule:
  deadlines  — once at T-7 days, once at T-1 day, once when overdue
  detention  — once when <= 3 days remain before the statutory limit expires

Run once:      python manage.py check_deadlines
Run as daemon: python manage.py check_deadlines --loop   (checks hourly)
"""
import json
import logging
import time
from datetime import timedelta
from urllib.request import Request, urlopen

from decouple import config
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.cases.models import CaseDeadline, DetentionRecord

logger = logging.getLogger(__name__)


def _push_notification(recipient_id, notification_type, title, body, case_id='', send_email=True):
    monitoring_url = config('MONITORING_SERVICE_URL', default='http://monitoring-service:8009').rstrip('/')
    try:
        payload = json.dumps({
            'recipient_id': str(recipient_id),
            'notification_type': notification_type,
            'title': title,
            'body': body,
            'case_id': str(case_id),
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
    except Exception as exc:
        logger.warning('Failed to push deadline notification: %s', exc)
        return False


class Command(BaseCommand):
    help = 'Send alerts for approaching/overdue case deadlines and detention limits'

    def add_arguments(self, parser):
        parser.add_argument('--loop', action='store_true',
                            help='Run continuously, checking every hour')

    def handle(self, *args, **options):
        if options['loop']:
            self.stdout.write('Deadline checker running in loop mode (hourly)...')
            while True:
                self.run_checks()
                time.sleep(3600)
        else:
            self.run_checks()

    def run_checks(self):
        today = timezone.now().date()
        sent = 0
        sent += self.check_deadlines(today)
        sent += self.check_detention(today)
        self.stdout.write(f'[{timezone.now().isoformat()}] deadline check complete — {sent} alert(s) sent')

    def check_deadlines(self, today):
        sent = 0
        pending = (CaseDeadline.objects
                   .filter(status='pending', case__assigned_lawyer_id__isnull=False)
                   .select_related('case'))
        for d in pending:
            days_left = (d.due_date - today).days
            case = d.case
            fire = None
            if days_left < 0 and not d.overdue_alert_sent:
                fire = ('overdue_alert_sent',
                        f'OVERDUE: {d.title}',
                        f'The deadline "{d.title}" on case "{case.title}" was due {d.due_date} '
                        f'and is now {-days_left} day(s) overdue. Mark it met, missed, or waived.')
            elif 0 <= days_left <= 1 and not d.alert_1d_sent:
                when = 'TODAY' if days_left == 0 else 'TOMORROW'
                fire = ('alert_1d_sent',
                        f'Deadline {when}: {d.title}',
                        f'"{d.title}" on case "{case.title}" is due {d.due_date} ({when.lower()}).')
            elif 1 < days_left <= 7 and not d.alert_7d_sent:
                fire = ('alert_7d_sent',
                        f'Deadline in {days_left} days: {d.title}',
                        f'"{d.title}" on case "{case.title}" is due {d.due_date}.')
            if fire:
                flag, title, body = fire
                if _push_notification(case.assigned_lawyer_id, 'case_deadline', title, body,
                                      case_id=case.id):
                    setattr(d, flag, True)
                    d.save(update_fields=[flag])
                    sent += 1
        return sent

    def check_detention(self, today):
        sent = 0
        active = (DetentionRecord.objects
                  .filter(released=False, alert_sent=False,
                          case__assigned_lawyer_id__isnull=False)
                  .select_related('case'))
        for rec in active:
            days_left = (rec.expiry_date - today).days
            if days_left <= 3:
                label = dict(DetentionRecord.TYPE_CHOICES).get(rec.detention_type, rec.detention_type)
                if days_left < 0:
                    title = f'DETENTION LIMIT EXCEEDED: {rec.person_name}'
                    body = (f'{label} of {rec.person_name} on case "{rec.case.title}" exceeded its '
                            f'statutory limit on {rec.expiry_date} — grounds for immediate release application.')
                else:
                    title = f'Detention limit in {days_left} day(s): {rec.person_name}'
                    body = (f'{label} of {rec.person_name} on case "{rec.case.title}" reaches its '
                            f'statutory limit on {rec.expiry_date}. Prepare the release application '
                            f'or verify a renewal order exists.')
                if _push_notification(rec.case.assigned_lawyer_id, 'detention_alert', title, body,
                                      case_id=rec.case.id):
                    rec.alert_sent = True
                    rec.save(update_fields=['alert_sent'])
                    sent += 1
        return sent
