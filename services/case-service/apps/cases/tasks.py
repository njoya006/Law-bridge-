from celery import shared_task
from django.utils import timezone


@shared_task(name='cases.check_deadline_escalations')
def check_deadline_escalations():
    """Mark overdue deadlines as missed and publish Redis events."""
    from apps.deadlines.models import Deadline
    overdue = Deadline.objects.filter(
        due_date__lt=timezone.now(),
        status='pending',
    )
    escalated = 0
    for deadline in overdue:
        if deadline.check_and_escalate():
            escalated += 1
    return {'escalated': escalated}


@shared_task(name='cases.auto_close_expired_mediations')
def auto_close_expired_mediations():
    """Transition mediation requests past their deadline to 'approved'."""
    from apps.cases.models import ReassignmentRequest
    expired = ReassignmentRequest.objects.filter(
        status='mediation_window',
        mediation_deadline__lt=timezone.now(),
    )
    count = expired.count()
    expired.update(status='approved')
    return {'auto_approved': count}
