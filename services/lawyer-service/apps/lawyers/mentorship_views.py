"""
Mentorship matching — pairs junior lawyers seeking guidance with senior lawyers
offering it, ranked by the reputation engine + specialization + circuit overlap.

The sector's real bottleneck is that juniors lack mentorship and case flow while
seniors are capacity-constrained; this routes the two to each other on merit.
"""
import json
import logging
import uuid as uuidlib
from urllib.request import Request, urlopen

from decouple import config
from django.db.models import Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import LawyerProfile, MentorshipRequest

logger = logging.getLogger(__name__)


def _user_id(request):
    payload = getattr(request, 'auth_payload', {}) or {}
    raw = payload.get('user_id') or payload.get('sub')
    if not raw:
        return None
    try:
        return uuidlib.UUID(str(raw))
    except (ValueError, AttributeError):
        return None


def _notify(recipient_id, ntype, title, body, send_email=False):
    monitoring_url = config('MONITORING_SERVICE_URL', default='http://monitoring-service:8009').rstrip('/')
    try:
        payload = json.dumps({
            'recipient_id': str(recipient_id), 'notification_type': ntype,
            'title': title, 'body': body, 'send_email': send_email,
        }).encode()
        req = Request(
            f'{monitoring_url}/api/v1/monitoring/notifications/internal/',
            data=payload,
            headers={'Content-Type': 'application/json',
                     'X-Internal-Key': config('INTERNAL_API_KEY', default='dev-internal-key')},
            method='POST',
        )
        with urlopen(req, timeout=5):
            pass
    except Exception as exc:  # noqa: BLE001
        logger.warning('mentorship notify failed: %s', exc)


def _profile_card(p: LawyerProfile):
    return {
        'user_id': str(p.user_id),
        'name': p.full_name,
        'specialization': p.specialization,
        'practice_circuit': p.practice_circuit,
        'years_of_experience': p.years_of_experience,
        'reputation_score': p.reputation_score,
        'is_verified': p.verified_at is not None,
        'mentorship_note': p.mentorship_note,
    }


class MentorshipPrefsView(APIView):
    """GET/PATCH /api/v1/lawyers/mentorship/prefs/ — my mentorship opt-in settings."""

    def get(self, request):
        uid = _user_id(request)
        try:
            p = LawyerProfile.objects.get(user_id=uid)
        except LawyerProfile.DoesNotExist:
            return Response({'detail': 'Create your lawyer profile first'}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            'open_to_mentoring': p.open_to_mentoring,
            'seeking_mentor': p.seeking_mentor,
            'mentorship_note': p.mentorship_note,
        })

    def patch(self, request):
        uid = _user_id(request)
        try:
            p = LawyerProfile.objects.get(user_id=uid)
        except LawyerProfile.DoesNotExist:
            return Response({'detail': 'Create your lawyer profile first'}, status=status.HTTP_404_NOT_FOUND)
        for f in ('open_to_mentoring', 'seeking_mentor'):
            if f in request.data:
                setattr(p, f, bool(request.data[f]))
        if 'mentorship_note' in request.data:
            p.mentorship_note = str(request.data['mentorship_note'])[:2000]
        p.save(update_fields=['open_to_mentoring', 'seeking_mentor', 'mentorship_note', 'updated_at'])
        return Response({
            'open_to_mentoring': p.open_to_mentoring,
            'seeking_mentor': p.seeking_mentor,
            'mentorship_note': p.mentorship_note,
        })


class MentorshipMatchesView(APIView):
    """GET /api/v1/lawyers/mentorship/matches/ — suggested mentors for me (as a
    mentee) and suggested mentees (if I'm open to mentoring), ranked by fit."""

    def get(self, request):
        uid = _user_id(request)
        try:
            me = LawyerProfile.objects.get(user_id=uid)
        except LawyerProfile.DoesNotExist:
            return Response({'mentors': [], 'mentees': [], 'me': None})

        # People I already have a connection with (either direction) — exclude.
        connected = set()
        for r in MentorshipRequest.objects.filter(Q(mentee_id=uid) | Q(mentor_id=uid)).exclude(status='declined'):
            connected.add(r.mentor_id)
            connected.add(r.mentee_id)

        def score_mentor(m):
            s = m.reputation_score
            if m.specialization and me.specialization and m.specialization.lower() == me.specialization.lower():
                s += 25
            if m.practice_circuit and m.practice_circuit == me.practice_circuit:
                s += 10
            if m.years_of_experience > me.years_of_experience + 3:
                s += 10
            return s

        # Mentors: open_to_mentoring, more senior than me, not me, not already connected
        mentor_qs = LawyerProfile.objects.filter(open_to_mentoring=True).exclude(user_id=uid)
        mentors = [m for m in mentor_qs if m.user_id not in connected and m.years_of_experience >= me.years_of_experience]
        mentors.sort(key=score_mentor, reverse=True)
        mentors = [{**_profile_card(m), 'match_score': score_mentor(m)} for m in mentors[:12]]

        # Mentees: only if I offer mentoring — juniors seeking, in my area/circuit
        mentees = []
        if me.open_to_mentoring:
            mentee_qs = LawyerProfile.objects.filter(seeking_mentor=True).exclude(user_id=uid)
            cand = [m for m in mentee_qs if m.user_id not in connected and m.years_of_experience <= me.years_of_experience]
            cand.sort(key=lambda m: (
                m.specialization.lower() == (me.specialization or '').lower(),
                m.practice_circuit == me.practice_circuit,
            ), reverse=True)
            mentees = [_profile_card(m) for m in cand[:12]]

        return Response({
            'me': {
                'open_to_mentoring': me.open_to_mentoring,
                'seeking_mentor': me.seeking_mentor,
            },
            'mentors': mentors,
            'mentees': mentees,
        })


class MentorshipRequestListView(APIView):
    """GET list (both directions) + POST create a mentorship request."""

    def get(self, request):
        uid = _user_id(request)
        if not uid:
            return Response({'sent': [], 'received': []})
        reqs = MentorshipRequest.objects.filter(Q(mentee_id=uid) | Q(mentor_id=uid))
        # Enrich with the other party's name
        ids = {r.mentor_id for r in reqs} | {r.mentee_id for r in reqs}
        names = {str(p.user_id): p.full_name for p in LawyerProfile.objects.filter(user_id__in=ids)}

        def row(r):
            return {
                'id': str(r.id), 'mentee_id': str(r.mentee_id), 'mentor_id': str(r.mentor_id),
                'mentee_name': names.get(str(r.mentee_id), 'Lawyer'),
                'mentor_name': names.get(str(r.mentor_id), 'Lawyer'),
                'message': r.message, 'focus_area': r.focus_area, 'status': r.status,
                'created_at': r.created_at.isoformat(),
            }
        return Response({
            'sent':     [row(r) for r in reqs if r.mentee_id == uid],
            'received': [row(r) for r in reqs if r.mentor_id == uid],
        })

    def post(self, request):
        uid = _user_id(request)
        if not uid:
            return Response({'detail': 'Auth required'}, status=status.HTTP_401_UNAUTHORIZED)
        mentor_raw = request.data.get('mentor_id')
        try:
            mentor_id = uuidlib.UUID(str(mentor_raw))
        except (ValueError, AttributeError):
            return Response({'detail': 'valid mentor_id required'}, status=status.HTTP_400_BAD_REQUEST)
        if mentor_id == uid:
            return Response({'detail': 'You cannot mentor yourself'}, status=status.HTTP_400_BAD_REQUEST)
        if MentorshipRequest.objects.filter(mentee_id=uid, mentor_id=mentor_id).exists():
            return Response({'detail': 'You already have a request with this mentor'}, status=status.HTTP_409_CONFLICT)
        req = MentorshipRequest.objects.create(
            mentee_id=uid, mentor_id=mentor_id,
            message=str(request.data.get('message', ''))[:2000],
            focus_area=str(request.data.get('focus_area', ''))[:255],
        )
        mentee_name = getattr(LawyerProfile.objects.filter(user_id=uid).first(), 'full_name', 'A junior lawyer')
        _notify(mentor_id, 'mentorship_request', 'New mentorship request',
                f'{mentee_name} has asked you to be their mentor'
                + (f' on {req.focus_area}.' if req.focus_area else '.'),
                send_email=True)
        return Response({'id': str(req.id), 'status': req.status}, status=status.HTTP_201_CREATED)


class MentorshipRequestDetailView(APIView):
    """PATCH /api/v1/lawyers/mentorship/requests/{id}/ — mentor accepts/declines/ends."""

    def patch(self, request, req_id):
        uid = _user_id(request)
        try:
            req = MentorshipRequest.objects.get(id=req_id)
        except MentorshipRequest.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get('status')
        if new_status not in {'accepted', 'declined', 'ended'}:
            return Response({'detail': 'status must be accepted/declined/ended'}, status=status.HTTP_400_BAD_REQUEST)
        # Only the mentor may accept/decline; either party may end.
        if new_status in ('accepted', 'declined') and req.mentor_id != uid:
            return Response({'detail': 'Only the mentor can respond'}, status=status.HTTP_403_FORBIDDEN)
        if new_status == 'ended' and uid not in (req.mentor_id, req.mentee_id):
            return Response({'detail': 'Not your connection'}, status=status.HTTP_403_FORBIDDEN)
        req.status = new_status
        req.responded_at = timezone.now()
        req.save(update_fields=['status', 'responded_at', 'updated_at'])
        mentor_name = getattr(LawyerProfile.objects.filter(user_id=req.mentor_id).first(), 'full_name', 'Your mentor')
        verb = {'accepted': 'accepted', 'declined': 'declined', 'ended': 'ended'}[new_status]
        _notify(req.mentee_id, f'mentorship_{new_status}', f'Mentorship {verb}',
                f'{mentor_name} {verb} your mentorship request.', send_email=(new_status == 'accepted'))
        return Response({'id': str(req.id), 'status': req.status})
