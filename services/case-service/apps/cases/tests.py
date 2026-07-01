"""
Integration tests for the case-service cases app.

Covers:
  1. Case model — add_timeline_entry behaviour (updated_by, date stamps, accumulation)
  2. CaseStatusUpdateView — role-based access, validation, response shape
  3. Signal payload — what gets published to Redis on Case.save()
"""
import json
import uuid
from unittest.mock import patch, MagicMock

import pytest
from django.utils import timezone
from rest_framework.test import APIClient


# ── helpers ────────────────────────────────────────────────────────────────────

def _case(**kwargs):
    """Create a bare-minimum Case with SQLite-compatible defaults."""
    from apps.cases.models import Case
    defaults = dict(
        client_id=uuid.uuid4(),
        title='Test Matter',
        description='A test case',
        case_type='civil',
        legal_tradition='common_law',
        circuit='anglophone',
        language='en',
    )
    defaults.update(kwargs)
    return Case.objects.create(**defaults)


ALL_STATUSES = [
    'draft', 'filed', 'assigned', 'under_review', 'evidence_collection',
    'awaiting_court_date', 'in_progress', 'hearing_scheduled', 'hearing_adjourned',
    'mediation', 'verdict', 'settled', 'appeal_filed', 'appeal_in_progress',
    'closed', 'dismissed', 'archived',
]


# ── 1. Model tests ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCaseModel:

    def test_default_status_is_draft(self):
        case = _case()
        assert case.status == 'draft'
        assert case.timeline == []

    def test_add_timeline_entry_changes_status(self):
        case = _case()
        case.add_timeline_entry('filed', notes='Filed in court')
        assert case.status == 'filed'

    def test_add_timeline_entry_stores_notes(self):
        case = _case()
        case.add_timeline_entry('in_progress', notes='Hearing prep underway')
        entry = case.timeline[-1]
        assert entry['notes'] == 'Hearing prep underway'

    def test_add_timeline_entry_stores_updated_by(self):
        lawyer_id = uuid.uuid4()
        case = _case()
        case.add_timeline_entry('under_review', updated_by=lawyer_id)
        entry = case.timeline[-1]
        assert entry['updated_by'] == str(lawyer_id)

    def test_updated_by_none_stored_as_null(self):
        case = _case()
        case.add_timeline_entry('filed')
        entry = case.timeline[-1]
        assert entry['updated_by'] is None

    def test_entries_accumulate_in_order(self):
        case = _case()
        case.add_timeline_entry('filed', notes='First')
        case.add_timeline_entry('assigned', notes='Second')
        case.add_timeline_entry('in_progress', notes='Third')
        assert len(case.timeline) == 3
        assert case.timeline[0]['status'] == 'filed'
        assert case.timeline[2]['status'] == 'in_progress'

    def test_filed_at_auto_set_on_filed_status(self):
        case = _case()
        assert case.filed_at is None
        case.add_timeline_entry('filed')
        case.refresh_from_db()
        assert case.filed_at is not None

    def test_filed_at_not_overwritten_on_second_filed_entry(self):
        case = _case()
        case.add_timeline_entry('filed')
        first_filed_at = case.filed_at
        case.add_timeline_entry('filed', notes='Re-filed')
        assert case.filed_at == first_filed_at

    def test_closed_at_auto_set_on_closed(self):
        case = _case()
        assert case.closed_at is None
        case.add_timeline_entry('closed')
        case.refresh_from_db()
        assert case.closed_at is not None

    def test_closed_at_set_on_dismissed(self):
        case = _case()
        case.add_timeline_entry('dismissed', notes='No merit found')
        case.refresh_from_db()
        assert case.closed_at is not None

    def test_closed_at_set_on_archived(self):
        case = _case()
        case.add_timeline_entry('archived')
        case.refresh_from_db()
        assert case.closed_at is not None

    def test_closed_at_set_on_settled(self):
        case = _case()
        case.add_timeline_entry('settled', notes='Parties reached agreement')
        case.refresh_from_db()
        assert case.closed_at is not None

    def test_non_terminal_status_does_not_set_closed_at(self):
        case = _case()
        case.add_timeline_entry('in_progress')
        case.add_timeline_entry('hearing_scheduled')
        assert case.closed_at is None

    def test_entry_timestamp_is_iso_format(self):
        case = _case()
        case.add_timeline_entry('filed')
        # Should parse without error
        from django.utils.dateparse import parse_datetime
        ts = parse_datetime(case.timeline[-1]['timestamp'])
        assert ts is not None

    def test_status_choices_include_all_17(self):
        from apps.cases.models import Case
        status_values = [s for s, _ in Case.STATUS_CHOICES]
        assert len(status_values) == 17
        for expected in ALL_STATUSES:
            assert expected in status_values, f"Missing status: {expected}"


# ── 2. CaseStatusUpdateView tests ─────────────────────────────────────────────

@pytest.mark.django_db
class TestCaseStatusUpdateView:

    def setup_method(self):
        self.client = APIClient()

    def _post(self, case_id, payload, token):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return self.client.post(
            f'/api/v1/cases/{case_id}/status/',
            data=payload,
            format='json',
        )

    def test_assigned_lawyer_can_update_status(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        token = make_token(user_id=lawyer_id, role='lawyer')

        resp = self._post(case.id, {'status': 'under_review', 'note': 'Reviewing docs'}, token)

        assert resp.status_code == 200
        data = resp.json()
        assert data['status'] == 'under_review'

    def test_timeline_contains_new_entry_after_update(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        token = make_token(user_id=lawyer_id, role='lawyer')

        self._post(case.id, {'status': 'evidence_collection', 'note': 'Gathering witness statements'}, token)

        case.refresh_from_db()
        last = case.timeline[-1]
        assert last['status'] == 'evidence_collection'
        assert last['notes'] == 'Gathering witness statements'

    def test_updated_by_is_lawyer_uuid_in_timeline(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        token = make_token(user_id=lawyer_id, role='lawyer')

        self._post(case.id, {'status': 'hearing_scheduled', 'note': ''}, token)

        case.refresh_from_db()
        assert case.timeline[-1]['updated_by'] == str(lawyer_id)

    def test_partner_role_can_update_status(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        token = make_token(user_id=lawyer_id, role='partner')

        resp = self._post(case.id, {'status': 'mediation'}, token)
        assert resp.status_code == 200

    def test_firm_admin_role_can_update_status(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        token = make_token(user_id=lawyer_id, role='firm_admin')

        resp = self._post(case.id, {'status': 'verdict'}, token)
        assert resp.status_code == 200

    def test_client_role_is_forbidden(self, make_token):
        client_id = uuid.uuid4()
        case = _case(client_id=client_id)
        token = make_token(user_id=client_id, role='client')

        resp = self._post(case.id, {'status': 'closed'}, token)
        assert resp.status_code == 403
        assert 'error' in resp.json()

    def test_invalid_status_returns_400(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        token = make_token(user_id=lawyer_id, role='lawyer')

        resp = self._post(case.id, {'status': 'nonexistent_status'}, token)
        assert resp.status_code == 400
        body = resp.json()
        assert 'error' in body
        # Error should mention valid values
        assert 'Invalid status' in body['error']

    def test_empty_status_returns_400(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        token = make_token(user_id=lawyer_id, role='lawyer')

        resp = self._post(case.id, {'status': ''}, token)
        assert resp.status_code == 400

    def test_missing_status_field_returns_400(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        token = make_token(user_id=lawyer_id, role='lawyer')

        resp = self._post(case.id, {}, token)
        assert resp.status_code == 400

    def test_nonexistent_case_returns_404(self, make_token):
        token = make_token(role='lawyer')
        resp = self._post(uuid.uuid4(), {'status': 'filed'}, token)
        assert resp.status_code == 404

    def test_filing_sets_filed_at(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        assert case.filed_at is None
        token = make_token(user_id=lawyer_id, role='lawyer')

        resp = self._post(case.id, {'status': 'filed', 'note': 'Filed'}, token)

        assert resp.status_code == 200
        case.refresh_from_db()
        assert case.filed_at is not None

    def test_closing_sets_closed_at(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        token = make_token(user_id=lawyer_id, role='lawyer')

        resp = self._post(case.id, {'status': 'closed', 'note': 'Resolved'}, token)

        assert resp.status_code == 200
        case.refresh_from_db()
        assert case.closed_at is not None

    def test_filed_at_returned_in_response(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        token = make_token(user_id=lawyer_id, role='lawyer')

        resp = self._post(case.id, {'status': 'filed'}, token)
        data = resp.json()
        assert data['filed_at'] is not None

    def test_response_includes_full_timeline(self, make_token):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        token = make_token(user_id=lawyer_id, role='lawyer')

        self._post(case.id, {'status': 'filed'}, token)
        self._post(case.id, {'status': 'under_review', 'note': 'Docs received'}, token)

        resp = self._post(case.id, {'status': 'in_progress', 'note': 'Active'}, token)
        timeline = resp.json()['timeline']
        assert len(timeline) == 3
        statuses = [e['status'] for e in timeline]
        assert statuses == ['filed', 'under_review', 'in_progress']

    def test_all_17_statuses_accepted_by_api(self, make_token):
        lawyer_id = uuid.uuid4()
        token = make_token(user_id=lawyer_id, role='lawyer')
        errors = []
        for s in ALL_STATUSES:
            case = _case(assigned_lawyer_id=lawyer_id)
            resp = self._post(case.id, {'status': s, 'note': f'Moving to {s}'}, token)
            if resp.status_code != 200:
                errors.append(f'{s}: HTTP {resp.status_code} — {resp.json()}')
        assert not errors, 'These statuses were rejected:\n' + '\n'.join(errors)

    def test_unauthenticated_request_is_rejected(self):
        case = _case()
        resp = self.client.post(
            f'/api/v1/cases/{case.id}/status/',
            data={'status': 'filed'},
            format='json',
        )
        assert resp.status_code in (401, 403)


# ── 3. Signal payload tests ────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCaseSignalPayload:
    """
    Verify that when a Case is saved the published Redis payload includes the
    fields the monitoring-service consumer expects.
    """

    def _published_payload(self, mock_redis_publish):
        """Parse the most recent call to redis_client.publish and return the data dict."""
        assert mock_redis_publish.publish.called, 'Expected redis.publish to have been called'
        call_args = mock_redis_publish.publish.call_args
        channel = call_args[0][0]
        raw = call_args[0][1]
        assert channel == 'case.updated'
        return json.loads(raw)

    def test_signal_publishes_to_correct_channel(self, mock_redis_publish):
        _case(title='Land Dispute')
        assert mock_redis_publish.publish.call_args[0][0] == 'case.updated'

    def test_payload_includes_case_id(self, mock_redis_publish):
        case = _case()
        payload = self._published_payload(mock_redis_publish)
        assert payload['case_id'] == str(case.id)

    def test_payload_includes_title(self, mock_redis_publish):
        _case(title='Inheritance Dispute')
        payload = self._published_payload(mock_redis_publish)
        assert payload['title'] == 'Inheritance Dispute'

    def test_payload_includes_status(self, mock_redis_publish):
        _case(title='Test')
        payload = self._published_payload(mock_redis_publish)
        assert payload['status'] == 'draft'

    def test_payload_includes_client_id(self, mock_redis_publish):
        client_id = uuid.uuid4()
        _case(client_id=client_id)
        payload = self._published_payload(mock_redis_publish)
        assert payload['client_id'] == str(client_id)

    def test_payload_includes_assigned_lawyer_id(self, mock_redis_publish):
        lawyer_id = uuid.uuid4()
        _case(assigned_lawyer_id=lawyer_id)
        payload = self._published_payload(mock_redis_publish)
        assert payload['assigned_lawyer_id'] == str(lawyer_id)

    def test_payload_assigned_lawyer_id_null_when_unassigned(self, mock_redis_publish):
        _case()
        payload = self._published_payload(mock_redis_publish)
        assert payload['assigned_lawyer_id'] is None

    def test_payload_includes_timeline_field(self, mock_redis_publish):
        _case()
        payload = self._published_payload(mock_redis_publish)
        assert 'timeline' in payload
        assert isinstance(payload['timeline'], list)

    def test_payload_timeline_contains_entries_after_update(self, mock_redis_publish):
        lawyer_id = uuid.uuid4()
        case = _case(assigned_lawyer_id=lawyer_id)
        case.add_timeline_entry('filed', notes='Filed today', updated_by=lawyer_id)
        # Last publish is for the add_timeline_entry save
        payload = self._published_payload(mock_redis_publish)
        assert len(payload['timeline']) >= 1
        last = payload['timeline'][-1]
        assert last['status'] == 'filed'
        assert last['notes'] == 'Filed today'
        assert last['updated_by'] == str(lawyer_id)

    def test_payload_timeline_capped_at_20_entries(self, mock_redis_publish):
        case = _case()
        for i in range(25):
            case.add_timeline_entry('in_progress', notes=f'Update {i}')
        payload = self._published_payload(mock_redis_publish)
        assert len(payload['timeline']) <= 20

    def test_payload_includes_timestamp(self, mock_redis_publish):
        _case()
        payload = self._published_payload(mock_redis_publish)
        assert 'timestamp' in payload
        from django.utils.dateparse import parse_datetime
        assert parse_datetime(payload['timestamp']) is not None

    def test_payload_is_valid_json(self, mock_redis_publish):
        _case()
        raw = mock_redis_publish.publish.call_args[0][1]
        parsed = json.loads(raw)
        assert isinstance(parsed, dict)


# ── 4. Booking lifecycle tests ─────────────────────────────────────────────────

@pytest.mark.django_db
class TestBookingLifecycle:

    def _lawyer_token(self, make_token, user_id=None):
        uid = user_id or uuid.uuid4()
        return uid, make_token(user_id=uid, role='lawyer')

    def test_booking_accept_sets_status(self, make_token):
        uid, token = self._lawyer_token(make_token)
        case = _case(booking_status='pending', assigned_lawyer_id=uid)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.post(f'/api/v1/cases/{case.id}/accept/')
        assert resp.status_code == 200
        case.refresh_from_db()
        assert case.booking_status == 'accepted'

    def test_booking_accept_by_non_staff_rejected(self, make_token):
        token = make_token(role='client')
        case = _case(booking_status='pending')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.post(f'/api/v1/cases/{case.id}/accept/')
        assert resp.status_code == 403

    def test_booking_accept_already_accepted_returns_409(self, make_token):
        uid, token = self._lawyer_token(make_token)
        case = _case(booking_status='accepted', assigned_lawyer_id=uid)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.post(f'/api/v1/cases/{case.id}/accept/')
        assert resp.status_code == 409

    def test_booking_decline_sets_status(self, make_token):
        uid, token = self._lawyer_token(make_token)
        case = _case(booking_status='pending', assigned_lawyer_id=uid)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.post(f'/api/v1/cases/{case.id}/decline/', {'reason': 'Conflict of interest'}, format='json')
        assert resp.status_code == 200
        case.refresh_from_db()
        assert case.booking_status == 'declined'

    def test_booking_decline_stores_reason(self, make_token):
        uid, token = self._lawyer_token(make_token)
        case = _case(booking_status='pending', assigned_lawyer_id=uid)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        client.post(f'/api/v1/cases/{case.id}/decline/', {'reason': 'Not my specialty'}, format='json')
        case.refresh_from_db()
        assert case.booking_metadata.get('decline_reason') == 'Not my specialty'


# ── 5. Authorization boundary tests ───────────────────────────────────────────

@pytest.mark.django_db
class TestAuthorizationBoundaries:

    def test_case_assign_by_non_admin_rejected(self, make_token):
        """CaseAssignView: regular lawyer must get 403."""
        token = make_token(role='lawyer')
        case = _case()
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.post(f'/api/v1/cases/{case.id}/assign/', {'lawyer_id': str(uuid.uuid4())}, format='json')
        assert resp.status_code == 403

    def test_case_assign_by_firm_admin_allowed(self, make_token):
        """CaseAssignView: firm_admin must get through the role check (may still fail on business logic)."""
        token = make_token(role='firm_admin')
        case = _case()
        target_lawyer = uuid.uuid4()
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.post(f'/api/v1/cases/{case.id}/assign/', {'lawyer_id': str(target_lawyer)}, format='json')
        # 200 (assigned) or 400 (conflict check failed) — not 403
        assert resp.status_code != 403

    def test_case_list_client_sees_own_cases(self, make_token):
        uid = uuid.uuid4()
        _case(client_id=uid)
        _case(client_id=uuid.uuid4())  # other client's case
        token = make_token(user_id=uid, role='client')
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        resp = client.get('/api/v1/cases/')
        assert resp.status_code == 200
        results = resp.data.get('results', [])
        assert all(str(r['client_id']) == str(uid) for r in results)

    def test_unauthenticated_case_list_rejected(self):
        client = APIClient()
        resp = client.get('/api/v1/cases/')
        assert resp.status_code in (401, 403)
