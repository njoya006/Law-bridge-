import { api } from './api'

export type BookingMeta = {
  target_type?: 'lawyer' | 'firm'
  target_name?: string
  consultation_type?: string
  booking_fee?: string
  payment_method?: string
  payment_reference?: string
  payment_status?: string
  preferred_date?: string
  preferred_time?: string
  location?: string
  urgency?: string
  client_email?: string
  decline_reason?: string
}

export type CaseItem = {
  id: string
  client_id: string
  title: string
  description: string
  case_type: string
  legal_tradition: string
  circuit: string
  language: string
  status: string
  booking_status?: 'pending' | 'accepted' | 'declined' | ''
  booking_metadata?: BookingMeta
  assigned_lawyer_id?: string | null
  timeline: Array<{ timestamp: string; status: string; notes: string; updated_by?: string | null }>
  notes?: Array<{ id: string; lawyer_id: string; content: string; is_private: boolean; created_at: string; updated_at: string }>
  created_at: string
  updated_at: string
}

export function getMyCases(token: string) {
  return api.get<{ count: number; results: CaseItem[] }>('case', '/cases/', token)
}

export function createCase(payload: { title: string; description: string; case_type: string; legal_tradition: string; circuit: string; language: string }, token: string) {
  return api.post<CaseItem>('case', '/cases/', payload, token)
}

export function getCaseDetail(caseId: string, token: string) {
  return api.get<CaseItem>('case', `/cases/${caseId}/`, token)
}

export function assignCase(caseId: string, lawyerId: string, token: string) {
  return api.post<CaseItem>('case', `/cases/${caseId}/assign/`, { lawyer_id: lawyerId }, token)
}

export function addCaseNote(caseId: string, content: string, isPrivate: boolean, token: string) {
  return api.post('case', `/cases/${caseId}/notes/`, { content, is_private: isPrivate }, token)
}

export function getIncomingBookings(token: string, statusFilter?: string) {
  const suffix = statusFilter ? `?status=${statusFilter}` : ''
  return api.get<{ count: number; results: CaseItem[] }>('case', `/cases/incoming-bookings/${suffix}`, token)
}

export function acceptBooking(caseId: string, token: string) {
  return api.post<CaseItem>('case', `/cases/${caseId}/accept/`, {}, token)
}

export function declineBooking(caseId: string, reason: string, token: string) {
  return api.post<CaseItem>('case', `/cases/${caseId}/decline/`, { reason }, token)
}

export function updateCaseStatus(caseId: string, status: string, note: string, token: string) {
  return api.post<CaseItem>('case', `/cases/${caseId}/status/`, { status, note }, token)
}

// Human-readable label for each status value
export const STATUS_LABELS: Record<string, string> = {
  draft:               'Draft',
  filed:               'Filed',
  assigned:            'Assigned to Lawyer',
  under_review:        'Under Review',
  evidence_collection: 'Evidence Collection',
  awaiting_court_date: 'Awaiting Court Date',
  in_progress:         'In Progress',
  hearing_scheduled:   'Hearing Scheduled',
  hearing_adjourned:   'Hearing Adjourned',
  mediation:           'Mediation',
  verdict:             'Verdict Rendered',
  settled:             'Settled Out of Court',
  appeal_filed:        'Appeal Filed',
  appeal_in_progress:  'Appeal in Progress',
  closed:              'Closed',
  dismissed:           'Dismissed',
  archived:            'Archived',
}

export const STATUS_ORDER = Object.keys(STATUS_LABELS)

export const TERMINAL_STATUSES = new Set(['closed', 'dismissed', 'archived', 'settled', 'verdict'])

export function getOpenCases(token: string) {
  return api.get<{ count: number; results: CaseItem[] }>('case', '/cases/open/', token)
}

export function applyForCase(caseId: string, message: string, token: string) {
  return api.post<{ id: string; case_id: string; status: string; created_at: string }>(
    'case',
    `/cases/${caseId}/apply/`,
    { message },
    token,
  )
}
