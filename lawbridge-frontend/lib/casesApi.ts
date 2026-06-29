import { api } from './api'

export type BookingMeta = {
  target_type?: 'lawyer' | 'firm'
  target_name?: string
  consultation_type?: string
  /** Legacy single fee field — kept for backward compat */
  booking_fee?: string
  /** Compulsory court/filing procedural fees */
  procedural_fee?: string
  /** Compulsory lawyer consultation fee */
  consultation_fee?: string
  /** Negotiable professional/representation fee (discussed after acceptance) */
  professional_fee?: string
  payment_method?: string
  payment_reference?: string
  payment_status?: string
  preferred_date?: string
  preferred_time?: string
  location?: string
  virtual_link?: string
  urgency?: string
  client_email?: string
  decline_reason?: string
}

export type WorkflowStatusMsg = {
  headline: string
  detail: string
  next: string
  estimate: string
}

export type WorkflowData = {
  stages: string[]
  next_status: string | null
  allowed_transitions: string[]
  current_message: { en: WorkflowStatusMsg; fr: WorkflowStatusMsg }
  transition_previews: Record<string, WorkflowStatusMsg>
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
  workflow?: WorkflowData
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

// ── Identity / profile types ──────────────────────────────────────────────────

export type UserProfile = {
  id: string
  full_name: string
  email: string
  role: string
  avatar?: string | null
}

export type LawyerProfile = {
  id: string
  user_id: string
  full_name: string
  specialization: string
  qualifications?: string
  bio?: string
  bar_number: string
  years_of_experience: number
  bijural_flag: string
  consultation_fee: string
  availability_status: string
  practice_circuit?: string
  accepted_case_types?: string
  accepts_urgent_cases?: boolean
  consultation_mode?: string
  active_cases?: number
  total_cases?: number
  average_rating?: string
  rating_count?: number
  verified_at?: string | null
}

/** Fetch a user's basic profile by their UUID (requires auth). */
export function getUserById(userId: string, token: string) {
  return api.get<UserProfile>('auth', `/auth/users/${userId}/`, token)
}

/** Fetch a lawyer's full profile by their auth-service user UUID (public). */
export function getLawyerProfile(userUuid: string) {
  return api.get<LawyerProfile>('lawyer', `/lawyers/${userUuid}/`)
}

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

// ── Reassignment ──────────────────────────────────────────────────────────────

export type ConflictFlags = {
  payment_made: boolean
  payment_amount: string
  payment_currency: string
  court_date_imminent: boolean
  active_appeal: boolean
  is_terminal: boolean
  work_progress_pct: number
  recent_activity_count: number
  has_lawyer: boolean
  recommendation: 'proceed' | 'caution' | 'blocked'
  block_reason?: string
}

export type ReassignmentRequest = {
  id: string
  case: string
  client_id: string
  reason_code: string
  reason_detail: string
  performance_rating: number
  conflict_flags: ConflictFlags
  status: string
  mediation_deadline: string | null
  lawyer_response: string
  lawyer_responded_at: string | null
  selected_lawyer_id: string | null
  handoff_summary: string
  created_at: string
  updated_at: string
  completed_at: string | null
}

export type ReassignmentResponse = { active: false } | ({ active: true } & ReassignmentRequest)

export const REASSIGNMENT_REASONS: { value: string; label: string }[] = [
  { value: 'unresponsive',     label: 'Lawyer is unresponsive' },
  { value: 'slow_progress',    label: 'Case progress is too slow' },
  { value: 'unprofessional',   label: 'Unprofessional conduct' },
  { value: 'lack_expertise',   label: 'Lack of required expertise' },
  { value: 'breach_agreement', label: 'Breach of engagement agreement' },
  { value: 'communication',    label: 'Poor communication' },
  { value: 'personal_reasons', label: 'Personal / conflict of interest' },
  { value: 'other',            label: 'Other' },
]

export function getReassignmentRequest(caseId: string, token: string) {
  return api.get<ReassignmentResponse>('case', `/cases/${caseId}/reassignment/`, token)
}

export function initiateReassignment(
  caseId: string,
  payload: { reason_code: string; reason_detail: string; performance_rating: number },
  token: string,
) {
  return api.post<ReassignmentRequest>('case', `/cases/${caseId}/reassignment/`, payload, token)
}

export function confirmReassignment(caseId: string, token: string) {
  return api.post<ReassignmentRequest>('case', `/cases/${caseId}/reassignment/confirm/`, {}, token)
}

export function cancelReassignment(caseId: string, token: string) {
  return api.post<{ status: string }>('case', `/cases/${caseId}/reassignment/cancel/`, {}, token)
}

export function selectReplacementLawyer(caseId: string, lawyerId: string, token: string) {
  return api.post<ReassignmentRequest>(
    'case', `/cases/${caseId}/reassignment/select-lawyer/`, { lawyer_id: lawyerId }, token,
  )
}
