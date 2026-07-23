"""
Sector Intelligence — anonymized court-performance analytics built from the
Case File 2.0 data the platform uniquely collects (adjournments, resolution
times, hearing outcomes). This is knowledge no one else in the Cameroonian
legal sector has: how a given court/circuit/case-type actually behaves.

All output is aggregate and anonymized — no client, lawyer, or case identifiers
leave the service — so it's safe to show any authenticated practitioner. Lawyers
use it to set realistic client expectations; the sector gains transparency.
"""
import logging
from collections import Counter, defaultdict

from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Case, Adjournment
from .views import extract_token_payload, STAFF_ROLES

logger = logging.getLogger(__name__)

COURT_LABELS = dict(Case.COURT_LEVEL)
REASON_LABELS = dict(Adjournment.REASON_CHOICES)


def _round(v, n=1):
    return round(v, n) if v else 0


class CaseStatsView(APIView):
    """GET /api/v1/cases/stats/ — case-volume metrics for the admin/investor view."""

    def get(self, request):
        payload = extract_token_payload(request)
        if payload.get('role', 'client') not in ('admin', 'support'):
            return Response({'detail': 'Admin only'}, status=status.HTTP_403_FORBIDDEN)
        from django.utils import timezone
        now = timezone.now()
        total = Case.objects.count()
        this_month = Case.objects.filter(created_at__year=now.year, created_at__month=now.month).count()
        closed = Case.objects.filter(status__in=Case.TERMINAL_STATUSES).count()
        active = total - closed
        with_lawyer = Case.objects.filter(assigned_lawyer_id__isnull=False).count()
        return Response({
            'total_cases': total,
            'cases_this_month': this_month,
            'active_cases': active,
            'closed_cases': closed,
            'assigned_cases': with_lawyer,
            'assignment_rate': round(100 * with_lawyer / total) if total else 0,
        })


class CourtAnalyticsView(APIView):
    """GET /api/v1/cases/intelligence/court-analytics/
    Aggregate, anonymized court-performance metrics for practitioners."""

    def get(self, request):
        payload = extract_token_payload(request)
        if payload.get('role', 'client') not in STAFF_ROLES:
            return Response({'detail': 'Staff only'}, status=status.HTTP_403_FORBIDDEN)

        cases = list(Case.objects.all().only(
            'id', 'case_type', 'court_level', 'circuit', 'legal_tradition',
            'status', 'filed_at', 'closed_at',
        ))
        total_cases = len(cases)

        # Adjournments joined to their case for court/type grouping
        adjournments = list(
            Adjournment.objects.select_related('case').only(
                'reason', 'case__court_level', 'case__case_type', 'case__circuit'
            )
        )
        total_adj = len(adjournments)

        # Per-case adjournment counts
        adj_by_case = Counter(a.case_id for a in adjournments)

        # ── Resolution time (filed → closed), days ──
        resolution_days = []
        for c in cases:
            if c.filed_at and c.closed_at and c.closed_at >= c.filed_at:
                resolution_days.append((c.closed_at - c.filed_at).total_seconds() / 86400.0)
        avg_resolution = sum(resolution_days) / len(resolution_days) if resolution_days else 0

        # ── Group helpers ──
        def group_stats(key_fn, label_map=None):
            buckets = defaultdict(lambda: {'cases': 0, 'adjournments': 0, 'res_days': []})
            for c in cases:
                k = key_fn(c) or 'unspecified'
                b = buckets[k]
                b['cases'] += 1
                b['adjournments'] += adj_by_case.get(c.id, 0)
                if c.filed_at and c.closed_at and c.closed_at >= c.filed_at:
                    b['res_days'].append((c.closed_at - c.filed_at).total_seconds() / 86400.0)
            out = []
            for k, b in buckets.items():
                out.append({
                    'key': k,
                    'label': (label_map or {}).get(k, k.replace('_', ' ').title() if k else 'Unspecified'),
                    'case_count': b['cases'],
                    'avg_adjournments': _round(b['adjournments'] / b['cases']) if b['cases'] else 0,
                    'avg_resolution_days': _round(sum(b['res_days']) / len(b['res_days'])) if b['res_days'] else None,
                })
            return sorted(out, key=lambda x: -x['case_count'])

        by_court = group_stats(lambda c: c.court_level, COURT_LABELS)
        by_case_type = group_stats(lambda c: c.case_type)
        by_circuit = group_stats(lambda c: c.circuit, {'anglophone': 'Anglophone', 'francophone': 'Francophone'})

        # ── Adjournment reason breakdown ──
        reason_counts = Counter(a.reason for a in adjournments)
        reasons = [
            {
                'reason': r,
                'label': REASON_LABELS.get(r, r.replace('_', ' ').title()),
                'count': n,
                'pct': _round(100 * n / total_adj) if total_adj else 0,
            }
            for r, n in reason_counts.most_common()
        ]

        return Response({
            'generated_at': timezone.now().isoformat(),
            'overview': {
                'total_cases': total_cases,
                'total_adjournments': total_adj,
                'avg_adjournments_per_case': _round(total_adj / total_cases) if total_cases else 0,
                'avg_resolution_days': _round(avg_resolution),
                'resolved_cases': len(resolution_days),
            },
            'by_court_level': by_court,
            'by_case_type': by_case_type[:10],
            'by_circuit': by_circuit,
            'adjournment_reasons': reasons,
        })
