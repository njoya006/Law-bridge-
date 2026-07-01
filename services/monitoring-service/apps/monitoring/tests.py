"""
Integration tests for the monitoring-service.

Covers:
  1. CaseProgressSnapshot model  — CRUD and field validation
  2. _refresh_lawyer_stats        — aggregation from snapshots
  3. Event processing logic       — simulating a case.updated message end-to-end
  4. _push_to_websocket           — channel layer is called with correct payload
  5. CaseTimelineConsumer         — WebSocket connect sends snapshot;
                                    group_send pushes case_update to client
"""
import json
import uuid
from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from asgiref.sync import async_to_sync
from django.utils import timezone


# ── helpers ────────────────────────────────────────────────────────────────────

def _now():
    return timezone.now()


def _snapshot(**kwargs):
    """Create a CaseProgressSnapshot with minimal defaults."""
    from apps.monitoring.models import CaseProgressSnapshot
    defaults = dict(
        case_id=str(uuid.uuid4()),
        title='Test Matter',
        client_id=str(uuid.uuid4()),
        case_type='civil',
        status='draft',
        timeline_entries=[],
        created_at=_now(),
        updated_at=_now(),
    )
    defaults.update(kwargs)
    return CaseProgressSnapshot.objects.create(**defaults)


def _make_event(case_id=None, status='filed', lawyer_id=None, timeline=None, title='Test'):
    """Build the dict that signals.py would publish to Redis."""
    return {
        'case_id': str(case_id or uuid.uuid4()),
        'title': title,
        'client_id': str(uuid.uuid4()),
        'case_type': 'civil',
        'status': status,
        'timestamp': _now().isoformat(),
        'assigned_lawyer_id': str(lawyer_id) if lawyer_id else None,
        'timeline': timeline or [],
    }


def _process_event(event: dict):
    """
    Apply the same logic the management command's for-loop body applies to a
    decoded message dict, then return (snapshot, created).
    """
    from django.utils.dateparse import parse_datetime
    from apps.monitoring.models import CaseProgressSnapshot

    ts = parse_datetime(event.get('timestamp', '')) or _now()
    case_id = event['case_id']

    snapshot, created = CaseProgressSnapshot.objects.update_or_create(
        case_id=case_id,
        defaults={
            'title': event.get('title', ''),
            'client_id': event.get('client_id', ''),
            'assigned_lawyer_id': event.get('assigned_lawyer_id'),
            'case_type': event.get('case_type', ''),
            'status': event.get('status', ''),
            'timeline_entries': event.get('timeline', []),
            'created_at': ts,
            'updated_at': ts,
        },
    )
    return snapshot, created


# ── 1. CaseProgressSnapshot model ──────────────────────────────────────────────

@pytest.mark.django_db
class TestCaseProgressSnapshot:

    def test_create_snapshot(self):
        from apps.monitoring.models import CaseProgressSnapshot
        snap = _snapshot(status='in_progress')
        assert snap.id is not None
        assert snap.status == 'in_progress'

    def test_case_id_is_unique(self):
        from django.db import IntegrityError
        cid = str(uuid.uuid4())
        _snapshot(case_id=cid, status='draft')
        with pytest.raises(IntegrityError):
            _snapshot(case_id=cid, status='filed')

    def test_timeline_entries_default_empty(self):
        snap = _snapshot()
        assert snap.timeline_entries == []

    def test_title_stored(self):
        snap = _snapshot(title='Land Encroachment Case')
        assert snap.title == 'Land Encroachment Case'

    def test_assigned_lawyer_id_nullable(self):
        snap = _snapshot(assigned_lawyer_id=None)
        assert snap.assigned_lawyer_id is None


# ── 2. _refresh_lawyer_stats ───────────────────────────────────────────────────

@pytest.mark.django_db
class TestRefreshLawyerStats:

    def setup_method(self):
        from apps.monitoring.management.commands.consume_case_events import _refresh_lawyer_stats
        self._refresh = _refresh_lawyer_stats

    def test_counts_active_cases(self):
        lawyer_id = str(uuid.uuid4())
        _snapshot(assigned_lawyer_id=lawyer_id, status='in_progress')
        _snapshot(assigned_lawyer_id=lawyer_id, status='hearing_scheduled')
        _snapshot(assigned_lawyer_id=lawyer_id, status='under_review')

        stats = self._refresh(lawyer_id)
        assert stats.active_cases == 3

    def test_counts_closed_cases(self):
        lawyer_id = str(uuid.uuid4())
        _snapshot(assigned_lawyer_id=lawyer_id, status='closed')
        _snapshot(assigned_lawyer_id=lawyer_id, status='dismissed')
        _snapshot(assigned_lawyer_id=lawyer_id, status='archived')
        _snapshot(assigned_lawyer_id=lawyer_id, status='settled')
        _snapshot(assigned_lawyer_id=lawyer_id, status='verdict')

        stats = self._refresh(lawyer_id)
        assert stats.closed_cases_count == 5

    def test_counts_cases_this_month(self):
        lawyer_id = str(uuid.uuid4())
        now = _now()
        _snapshot(assigned_lawyer_id=lawyer_id, status='in_progress', updated_at=now)
        _snapshot(assigned_lawyer_id=lawyer_id, status='closed', updated_at=now)
        # One from last month — should not count
        _snapshot(
            assigned_lawyer_id=lawyer_id,
            status='closed',
            updated_at=now - timedelta(days=40),
        )

        stats = self._refresh(lawyer_id)
        assert stats.cases_this_month == 2

    def test_unrelated_lawyer_not_counted(self):
        target = str(uuid.uuid4())
        other = str(uuid.uuid4())
        _snapshot(assigned_lawyer_id=target, status='in_progress')
        _snapshot(assigned_lawyer_id=other, status='in_progress')
        _snapshot(assigned_lawyer_id=other, status='in_progress')

        stats = self._refresh(target)
        assert stats.active_cases == 1

    def test_stats_updated_when_case_moves_to_terminal(self):
        lawyer_id = str(uuid.uuid4())
        case_id = str(uuid.uuid4())
        _snapshot(case_id=case_id, assigned_lawyer_id=lawyer_id, status='in_progress')

        stats = self._refresh(lawyer_id)
        assert stats.active_cases == 1
        assert stats.closed_cases_count == 0

        # Simulate case closing: update snapshot status
        from apps.monitoring.models import CaseProgressSnapshot
        CaseProgressSnapshot.objects.filter(case_id=case_id).update(status='closed')

        stats = self._refresh(lawyer_id)
        assert stats.active_cases == 0
        assert stats.closed_cases_count == 1

    def test_creates_stats_row_if_not_exists(self):
        from apps.monitoring.models import LawyerStats
        lawyer_id = str(uuid.uuid4())
        assert not LawyerStats.objects.filter(lawyer_id=lawyer_id).exists()
        self._refresh(lawyer_id)
        assert LawyerStats.objects.filter(lawyer_id=lawyer_id).exists()

    def test_updates_existing_stats_row(self):
        lawyer_id = str(uuid.uuid4())
        _snapshot(assigned_lawyer_id=lawyer_id, status='in_progress')
        self._refresh(lawyer_id)

        # Add another case, refresh again
        _snapshot(assigned_lawyer_id=lawyer_id, status='closed')
        stats = self._refresh(lawyer_id)

        assert stats.active_cases == 1
        assert stats.closed_cases_count == 1


# ── 3. Event processing logic (end-to-end within monitoring-service) ───────────

@pytest.mark.django_db
class TestEventProcessingLogic:
    """
    Simulate the body of consume_case_events' for-loop without needing Redis.
    Verifies that the contract between case-service signal payload and
    monitoring-service storage is correct.
    """

    def test_first_event_creates_snapshot(self):
        from apps.monitoring.models import CaseProgressSnapshot
        event = _make_event(status='filed', title='Property Dispute')

        snap, created = _process_event(event)

        assert created is True
        assert CaseProgressSnapshot.objects.filter(case_id=event['case_id']).exists()
        assert snap.status == 'filed'
        assert snap.title == 'Property Dispute'

    def test_second_event_updates_snapshot(self):
        case_id = str(uuid.uuid4())
        _process_event(_make_event(case_id=case_id, status='filed'))
        snap, created = _process_event(_make_event(case_id=case_id, status='in_progress'))

        assert created is False
        assert snap.status == 'in_progress'

    def test_timeline_entries_stored_from_event(self):
        lawyer_id = uuid.uuid4()
        timeline = [
            {'timestamp': _now().isoformat(), 'status': 'filed', 'notes': 'Filed', 'updated_by': None},
            {'timestamp': _now().isoformat(), 'status': 'under_review', 'notes': 'Review started', 'updated_by': str(lawyer_id)},
        ]
        event = _make_event(timeline=timeline)
        snap, _ = _process_event(event)

        assert len(snap.timeline_entries) == 2
        assert snap.timeline_entries[1]['status'] == 'under_review'
        assert snap.timeline_entries[1]['updated_by'] == str(lawyer_id)

    def test_assigned_lawyer_id_stored(self):
        lawyer_id = uuid.uuid4()
        event = _make_event(lawyer_id=lawyer_id, status='assigned')
        snap, _ = _process_event(event)
        assert snap.assigned_lawyer_id == str(lawyer_id)

    def test_unassigned_case_has_null_lawyer_id(self):
        event = _make_event()  # no lawyer_id
        snap, _ = _process_event(event)
        assert snap.assigned_lawyer_id is None

    def test_lawyer_stats_populated_after_event_with_lawyer(self):
        from apps.monitoring.management.commands.consume_case_events import _refresh_lawyer_stats
        from apps.monitoring.models import LawyerStats

        lawyer_id = str(uuid.uuid4())
        event = _make_event(lawyer_id=lawyer_id, status='in_progress')
        snap, _ = _process_event(event)
        _refresh_lawyer_stats(lawyer_id)

        stats = LawyerStats.objects.get(lawyer_id=lawyer_id)
        assert stats.active_cases == 1

    def test_full_pipeline_two_cases_one_lawyer(self):
        from apps.monitoring.management.commands.consume_case_events import _refresh_lawyer_stats
        from apps.monitoring.models import LawyerStats

        lawyer_id = str(uuid.uuid4())

        # Two active cases
        _process_event(_make_event(lawyer_id=lawyer_id, status='hearing_scheduled'))
        _process_event(_make_event(lawyer_id=lawyer_id, status='evidence_collection'))
        # One closed case
        _process_event(_make_event(lawyer_id=lawyer_id, status='closed'))

        _refresh_lawyer_stats(lawyer_id)
        stats = LawyerStats.objects.get(lawyer_id=lawyer_id)
        assert stats.active_cases == 2
        assert stats.closed_cases_count == 1

    def test_status_transition_flow(self):
        """
        Simulate a realistic flow: draft → filed → assigned → in_progress → verdict.
        Each status update should overwrite the snapshot's status field.
        """
        case_id = str(uuid.uuid4())
        lawyer_id = str(uuid.uuid4())
        flow = ['draft', 'filed', 'assigned', 'under_review', 'in_progress', 'verdict']

        for status in flow:
            _process_event(_make_event(case_id=case_id, lawyer_id=lawyer_id, status=status))

        from apps.monitoring.models import CaseProgressSnapshot
        snap = CaseProgressSnapshot.objects.get(case_id=case_id)
        assert snap.status == 'verdict'  # final state wins


# ── 4. _push_to_websocket ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestPushToWebSocket:

    def test_calls_group_send_with_correct_group_name(self):
        case_id = str(uuid.uuid4())
        snap = _snapshot(case_id=case_id, status='in_progress')

        mock_layer = MagicMock()
        with patch('apps.monitoring.management.commands.consume_case_events.get_channel_layer', return_value=mock_layer):
            with patch('apps.monitoring.management.commands.consume_case_events.async_to_sync') as mock_a2s:
                from apps.monitoring.management.commands.consume_case_events import _push_to_websocket
                _push_to_websocket(case_id, snap)

        mock_a2s.assert_called_once_with(mock_layer.group_send)

    def test_push_payload_includes_status(self):
        case_id = str(uuid.uuid4())
        snap = _snapshot(case_id=case_id, status='hearing_scheduled')
        captured = {}

        def fake_async_to_sync(fn):
            def wrapper(group, payload):
                captured['group'] = group
                captured['payload'] = payload
            return wrapper

        mock_layer = MagicMock()
        with patch('apps.monitoring.management.commands.consume_case_events.get_channel_layer', return_value=mock_layer):
            with patch('apps.monitoring.management.commands.consume_case_events.async_to_sync', side_effect=fake_async_to_sync):
                from importlib import reload
                from apps.monitoring.management.commands import consume_case_events as cmd_module
                cmd_module._push_to_websocket(case_id, snap)

        assert captured.get('group') == f'case_{case_id}'
        payload = captured.get('payload', {})
        assert payload.get('type') == 'case_update'
        assert payload['data']['status'] == 'hearing_scheduled'

    def test_push_payload_includes_last_5_timeline_entries(self):
        case_id = str(uuid.uuid4())
        entries = [
            {'timestamp': _now().isoformat(), 'status': f's{i}', 'notes': '', 'updated_by': None}
            for i in range(10)
        ]
        snap = _snapshot(case_id=case_id, timeline_entries=entries)
        captured = {}

        def fake_async_to_sync(fn):
            def wrapper(group, payload):
                captured['payload'] = payload
            return wrapper

        mock_layer = MagicMock()
        with patch('apps.monitoring.management.commands.consume_case_events.get_channel_layer', return_value=mock_layer):
            with patch('apps.monitoring.management.commands.consume_case_events.async_to_sync', side_effect=fake_async_to_sync):
                from apps.monitoring.management.commands.consume_case_events import _push_to_websocket
                _push_to_websocket(case_id, snap)

        sent_entries = captured['payload']['data']['timeline_entries']
        assert len(sent_entries) == 5
        assert sent_entries[-1]['status'] == 's9'

    def test_push_does_not_raise_when_channel_layer_is_none(self):
        """If channel layer is not configured, _push_to_websocket should log and continue."""
        snap = _snapshot()
        with patch('apps.monitoring.management.commands.consume_case_events.get_channel_layer', return_value=None):
            from apps.monitoring.management.commands.consume_case_events import _push_to_websocket
            # Should not raise
            _push_to_websocket(snap.case_id, snap)


# ── 5. CaseTimelineConsumer (WebSocket) ────────────────────────────────────────

@pytest.mark.django_db(transaction=True)
class TestCaseTimelineConsumer:
    """
    Uses Django Channels' WebsocketCommunicator to drive the consumer
    without a real Redis channel layer (InMemoryChannelLayer from conftest).
    """

    def _make_application(self):
        from channels.routing import URLRouter
        from django.urls import re_path
        from apps.monitoring.consumers import CaseTimelineConsumer
        return URLRouter([
            re_path(r'^ws/monitoring/cases/(?P<case_id>[^/]+)/timeline/$', CaseTimelineConsumer.as_asgi()),
        ])

    @staticmethod
    def _communicator(app, path):
        # Import directly from the submodule to avoid channels.testing.__init__
        # pulling in ChannelsLiveServerTestCase which requires daphne.
        from channels.testing.websocket import WebsocketCommunicator
        return WebsocketCommunicator(app, path)

    @pytest.mark.asyncio
    async def test_connect_without_snapshot_does_not_send(self):
        app = self._make_application()
        case_id = str(uuid.uuid4())

        communicator = self._communicator(app, f'/ws/monitoring/cases/{case_id}/timeline/')
        connected, _ = await communicator.connect()
        assert connected

        # No snapshot exists → consumer should not send anything on connect
        response = await communicator.receive_nothing(timeout=0.1)
        assert response is True
        await communicator.disconnect()

    @pytest.mark.asyncio
    async def test_connect_with_snapshot_sends_case_snapshot(self):
        from channels.db import database_sync_to_async

        app = self._make_application()
        case_id = str(uuid.uuid4())

        @database_sync_to_async
        def create_snap():
            return _snapshot(case_id=case_id, status='in_progress', title='Divorce Proceedings')

        await create_snap()

        communicator = self._communicator(app, f'/ws/monitoring/cases/{case_id}/timeline/')
        connected, _ = await communicator.connect()
        assert connected

        response = await communicator.receive_json_from(timeout=1)
        assert response['type'] == 'case_snapshot'
        assert response['data']['case_id'] == case_id
        assert response['data']['status'] == 'in_progress'

        await communicator.disconnect()

    @pytest.mark.asyncio
    async def test_case_update_event_relayed_to_connected_client(self):
        from channels.layers import get_channel_layer
        from channels.db import database_sync_to_async

        app = self._make_application()
        case_id = str(uuid.uuid4())

        @database_sync_to_async
        def create_snap():
            return _snapshot(case_id=case_id, status='filed')

        await create_snap()

        communicator = self._communicator(app, f'/ws/monitoring/cases/{case_id}/timeline/')
        connected, _ = await communicator.connect()
        assert connected

        # Consume the initial snapshot message
        await communicator.receive_json_from(timeout=1)

        # Simulate what consume_case_events.py does after updating the snapshot
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f'case_{case_id}',
            {
                'type': 'case_update',
                'data': {
                    'case_id': case_id,
                    'title': 'Test Matter',
                    'status': 'hearing_scheduled',
                    'assigned_lawyer_id': None,
                    'updated_at': timezone.now().isoformat(),
                    'timeline_entries': [
                        {'timestamp': timezone.now().isoformat(), 'status': 'hearing_scheduled', 'notes': 'Next hearing set', 'updated_by': None}
                    ],
                },
            }
        )

        pushed = await communicator.receive_json_from(timeout=1)
        assert pushed['type'] == 'case_update'
        assert pushed['data']['status'] == 'hearing_scheduled'
        assert pushed['data']['case_id'] == case_id

        await communicator.disconnect()

    @pytest.mark.asyncio
    async def test_disconnect_leaves_group(self):
        """Disconnecting should not crash — group_discard must succeed silently."""
        app = self._make_application()
        case_id = str(uuid.uuid4())

        communicator = self._communicator(app, f'/ws/monitoring/cases/{case_id}/timeline/')
        connected, _ = await communicator.connect()
        assert connected

        # Should not raise
        await communicator.disconnect()
