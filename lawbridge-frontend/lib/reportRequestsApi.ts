import { api } from './api'

export type ReportRequest = {
  id: string
  firm_id: number
  requester_id: string
  requester_name: string
  report_type: 'financial' | 'case_summary' | 'activity' | 'all'
  period: 'current_month' | 'last_month' | 'ytd' | 'all_time'
  notes: string
  status: 'pending' | 'acknowledged' | 'generated' | 'delivered'
  created_at: string
  updated_at: string
}

export const REPORT_TYPE_LABELS: Record<string, string> = {
  financial: 'Financial Summary',
  case_summary: 'Case Summary',
  activity: 'Activity Report',
  all: 'Full Firm Report',
}

export const PERIOD_LABELS: Record<string, string> = {
  current_month: 'Current Month',
  last_month: 'Last Month',
  ytd: 'Year to Date',
  all_time: 'All Time',
}

export function createReportRequest(
  payload: { firm_id: number; requester_name: string; report_type: string; period: string; notes?: string },
  token: string,
) {
  return api.post<ReportRequest>('monitoring', '/monitoring/report-requests/', payload, token)
}

export function listReportRequests(firmId: number, token: string) {
  return api.get<{ count: number; results: ReportRequest[] }>(
    'monitoring', `/monitoring/report-requests/?firm_id=${firmId}`, token,
  )
}

export function updateReportRequestStatus(
  requestId: string,
  status: ReportRequest['status'],
  token: string,
) {
  return api.patch<ReportRequest>(
    'monitoring', `/monitoring/report-requests/${requestId}/update_status/`, { status }, token,
  )
}
