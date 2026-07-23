import { api } from './api'

// ═══════════════════════════════════════════════════════════════════════════════
// Case File 2.0 — typed client for court identity, parties, adjournments,
// deadlines, disbursements, hearing outcomes, detention, conciliation, procedures.
// All endpoints live under case-service /cases/{id}/...
// ═══════════════════════════════════════════════════════════════════════════════

const base = (caseId: string) => `/cases/${caseId}`

// ── Court identity ────────────────────────────────────────────────────────────

export type CourtInfo = {
  court_level: string
  court_name: string
  court_location: string
  chamber: string
  judge_name: string
  suit_number: string
  relation_type: string
  parent_case: string | null
}

export const COURT_LEVELS: { value: string; label: string }[] = [
  { value: 'customary_court', label: 'Customary Court' },
  { value: 'first_instance', label: 'Court of First Instance (TPI)' },
  { value: 'high_court', label: 'High Court (TGI)' },
  { value: 'appeal_court', label: 'Court of Appeal' },
  { value: 'supreme_court', label: 'Supreme Court' },
  { value: 'administrative_court', label: 'Administrative Court' },
  { value: 'military_tribunal', label: 'Military Tribunal' },
  { value: 'labour_bench', label: 'Labour Bench' },
  { value: 'other', label: 'Other' },
]

export function updateCourtInfo(caseId: string, data: Partial<CourtInfo>, token: string) {
  return api.patch<CourtInfo>('case', `${base(caseId)}/court/`, data, token)
}

// ── Parties ───────────────────────────────────────────────────────────────────

export type CaseParty = {
  id: string
  role: string
  role_label: string
  name: string
  organization: string
  phone: string
  email: string
  notes: string
  created_at: string
}

export const PARTY_ROLES: { value: string; label: string }[] = [
  { value: 'plaintiff', label: 'Plaintiff / Demandeur' },
  { value: 'co_plaintiff', label: 'Co-Plaintiff' },
  { value: 'defendant', label: 'Defendant / Défendeur' },
  { value: 'co_defendant', label: 'Co-Defendant' },
  { value: 'opposing_counsel', label: 'Opposing Counsel' },
  { value: 'witness', label: 'Witness' },
  { value: 'expert', label: 'Expert' },
  { value: 'interested_party', label: 'Interested Party' },
  { value: 'bailiff', label: 'Bailiff / Huissier' },
]

export const getParties = (caseId: string, token: string) =>
  api.get<CaseParty[]>('case', `${base(caseId)}/parties/`, token)
export const addParty = (caseId: string, data: Partial<CaseParty>, token: string) =>
  api.post<CaseParty>('case', `${base(caseId)}/parties/`, data, token)
export const updateParty = (caseId: string, id: string, data: Partial<CaseParty>, token: string) =>
  api.patch<CaseParty>('case', `${base(caseId)}/parties/${id}/`, data, token)
export const deleteParty = (caseId: string, id: string, token: string) =>
  api.del('case', `${base(caseId)}/parties/${id}/`, token)

// ── Adjournments ──────────────────────────────────────────────────────────────

export type Adjournment = {
  id: string
  hearing_date: string
  reason: string
  reason_label: string
  reason_detail: string
  adjourned_to: string | null
  created_at: string
}

export const ADJOURNMENT_REASONS: { value: string; label: string }[] = [
  { value: 'judge_absent', label: 'Judge Absent' },
  { value: 'opposing_counsel_absent', label: 'Opposing Counsel Absent' },
  { value: 'counsel_request', label: 'Counsel Requested Adjournment' },
  { value: 'ruling_not_ready', label: 'Ruling / Judgment Not Ready' },
  { value: 'party_absent', label: 'Party Absent / Not Served' },
  { value: 'court_congestion', label: 'Court Congestion / List Not Reached' },
  { value: 'evidence_pending', label: 'Evidence / Expert Report Pending' },
  { value: 'settlement_talks', label: 'Settlement Negotiations Ongoing' },
  { value: 'strike_action', label: 'Court Staff / Bar Strike' },
  { value: 'other', label: 'Other' },
]

export const getAdjournments = (caseId: string, token: string) =>
  api.get<Adjournment[]>('case', `${base(caseId)}/adjournments/`, token)
export const addAdjournment = (caseId: string, data: Partial<Adjournment>, token: string) =>
  api.post<Adjournment>('case', `${base(caseId)}/adjournments/`, data, token)
export const deleteAdjournment = (caseId: string, id: string, token: string) =>
  api.del('case', `${base(caseId)}/adjournments/${id}/`, token)

// ── Deadlines ─────────────────────────────────────────────────────────────────

export type CaseDeadline = {
  id: string
  deadline_type: string
  type_label: string
  title: string
  description: string
  due_date: string
  status: 'pending' | 'met' | 'missed' | 'waived'
  source: string
  created_at: string
  completed_at: string | null
}

export const DEADLINE_TYPES: { value: string; label: string }[] = [
  { value: 'appeal_window', label: 'Appeal Window' },
  { value: 'prescription', label: 'Prescription / Limitation Period' },
  { value: 'conclusions_due', label: 'Conclusions / Submissions Due' },
  { value: 'service_deadline', label: 'Service of Process Deadline' },
  { value: 'opposition_window', label: 'Opposition Window (OHADA)' },
  { value: 'payment_deadline', label: 'Payment Deadline' },
  { value: 'detention_review', label: 'Detention Review' },
  { value: 'procedural_step', label: 'Procedural Step' },
  { value: 'custom', label: 'Custom' },
]

export const getDeadlines = (caseId: string, token: string) =>
  api.get<CaseDeadline[]>('case', `${base(caseId)}/deadlines/`, token)
export const addDeadline = (caseId: string, data: Partial<CaseDeadline>, token: string) =>
  api.post<CaseDeadline>('case', `${base(caseId)}/deadlines/`, data, token)
export const updateDeadline = (caseId: string, id: string, data: Partial<CaseDeadline>, token: string) =>
  api.patch<CaseDeadline>('case', `${base(caseId)}/deadlines/${id}/`, data, token)
export const deleteDeadline = (caseId: string, id: string, token: string) =>
  api.del('case', `${base(caseId)}/deadlines/${id}/`, token)

// ── Disbursements ─────────────────────────────────────────────────────────────

export type Disbursement = {
  id: string
  category: string
  category_label: string
  description: string
  amount: string
  incurred_on: string
  billable: boolean
  reimbursed: boolean
  receipt_reference: string
  created_at: string
}

export const DISBURSEMENT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'court_fees', label: 'Court / Filing Fees' },
  { value: 'stamp_duty', label: 'Stamp Duty (Timbres)' },
  { value: 'bailiff_fees', label: 'Bailiff / Huissier Fees' },
  { value: 'expert_fees', label: 'Expert Fees' },
  { value: 'registration_fees', label: 'Registration Fees' },
  { value: 'copies_certification', label: 'Copies & Certification' },
  { value: 'travel', label: 'Travel & Transport' },
  { value: 'other', label: 'Other' },
]

export const getDisbursements = (caseId: string, token: string) =>
  api.get<{ results: Disbursement[]; total_xaf: number }>('case', `${base(caseId)}/disbursements/`, token)
export const addDisbursement = (caseId: string, data: Partial<Disbursement>, token: string) =>
  api.post<Disbursement>('case', `${base(caseId)}/disbursements/`, data, token)
export const updateDisbursement = (caseId: string, id: string, data: Partial<Disbursement>, token: string) =>
  api.patch<Disbursement>('case', `${base(caseId)}/disbursements/${id}/`, data, token)
export const deleteDisbursement = (caseId: string, id: string, token: string) =>
  api.del('case', `${base(caseId)}/disbursements/${id}/`, token)

// ── Hearing outcomes ──────────────────────────────────────────────────────────

export type HearingOutcome = {
  id: string
  hearing_date: string
  outcome: string
  outcome_label: string
  summary: string
  next_hearing_date: string | null
  next_action: string
  adjournment_reason: string
  created_at: string
}

export const HEARING_OUTCOMES: { value: string; label: string }[] = [
  { value: 'held_proceeded', label: 'Hearing Held — Matter Proceeded' },
  { value: 'adjourned', label: 'Adjourned' },
  { value: 'ruling_delivered', label: 'Ruling Delivered' },
  { value: 'judgment_delivered', label: 'Judgment Delivered' },
  { value: 'struck_out', label: 'Struck Out' },
  { value: 'settled', label: 'Settled' },
  { value: 'other', label: 'Other' },
]

export const getHearingOutcomes = (caseId: string, token: string) =>
  api.get<HearingOutcome[]>('case', `${base(caseId)}/hearing-outcomes/`, token)
export const addHearingOutcome = (caseId: string, data: Partial<HearingOutcome>, token: string) =>
  api.post<HearingOutcome>('case', `${base(caseId)}/hearing-outcomes/`, data, token)
export const deleteHearingOutcome = (caseId: string, id: string, token: string) =>
  api.del('case', `${base(caseId)}/hearing-outcomes/${id}/`, token)

// ── Detention records ─────────────────────────────────────────────────────────

export type DetentionRecord = {
  id: string
  detention_type: string
  type_label: string
  person_name: string
  facility: string
  start_date: string
  statutory_limit_days: number
  extensions_days: number
  expiry_date: string
  days_remaining: number | null
  released: boolean
  released_on: string | null
  notes: string
  created_at: string
}

export const DETENTION_TYPES: { value: string; label: string; defaultDays: number }[] = [
  { value: 'garde_a_vue', label: 'Garde à Vue (Police Custody)', defaultDays: 2 },
  { value: 'detention_provisoire', label: 'Détention Provisoire (Remand)', defaultDays: 180 },
]

export const getDetentionRecords = (caseId: string, token: string) =>
  api.get<DetentionRecord[]>('case', `${base(caseId)}/detention/`, token)
export const addDetentionRecord = (caseId: string, data: Partial<DetentionRecord>, token: string) =>
  api.post<DetentionRecord>('case', `${base(caseId)}/detention/`, data, token)
export const updateDetentionRecord = (caseId: string, id: string, data: Partial<DetentionRecord>, token: string) =>
  api.patch<DetentionRecord>('case', `${base(caseId)}/detention/${id}/`, data, token)
export const deleteDetentionRecord = (caseId: string, id: string, token: string) =>
  api.del('case', `${base(caseId)}/detention/${id}/`, token)

// ── Conciliation ──────────────────────────────────────────────────────────────

export type ConciliationRecord = {
  id: string
  forum: string
  forum_label: string
  required: boolean
  status: string
  status_label: string
  scheduled_date: string | null
  completed_date: string | null
  outcome_summary: string
  pv_reference: string
  created_at: string
}

export const CONCILIATION_FORUMS: { value: string; label: string }[] = [
  { value: 'labour_inspector', label: 'Labour Inspector' },
  { value: 'family_conciliation', label: 'Family / Divorce Conciliation' },
  { value: 'customary_authority', label: 'Customary Authority' },
  { value: 'private_mediation', label: 'Private Mediation' },
  { value: 'other', label: 'Other' },
]

export const CONCILIATION_STATUSES: { value: string; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'successful', label: 'Successful — Dispute Resolved' },
  { value: 'failed', label: 'Failed — PV of Non-Conciliation Issued' },
]

export const getConciliation = (caseId: string, token: string) =>
  api.get<ConciliationRecord[]>('case', `${base(caseId)}/conciliation/`, token)
export const addConciliation = (caseId: string, data: Partial<ConciliationRecord>, token: string) =>
  api.post<ConciliationRecord>('case', `${base(caseId)}/conciliation/`, data, token)
export const updateConciliation = (caseId: string, id: string, data: Partial<ConciliationRecord>, token: string) =>
  api.patch<ConciliationRecord>('case', `${base(caseId)}/conciliation/${id}/`, data, token)
export const deleteConciliation = (caseId: string, id: string, token: string) =>
  api.del('case', `${base(caseId)}/conciliation/${id}/`, token)

// ── Procedure templates ───────────────────────────────────────────────────────

export type ProcedureTemplate = {
  key: string
  name: string
  name_fr: string
  description: string
  applicable_case_types: string[]
  step_count: number
}

export type ProcedureStep = {
  id: string
  template_key: string
  step_order: number
  title: string
  description: string
  due_date: string | null
  status: 'pending' | 'in_progress' | 'done' | 'skipped'
  completed_at: string | null
  created_at: string
}

export const getProcedureTemplates = (token: string) =>
  api.get<{ templates: ProcedureTemplate[] }>('case', `/cases/procedure-templates/`, token)
export const getProcedureSteps = (caseId: string, token: string) =>
  api.get<ProcedureStep[]>('case', `${base(caseId)}/procedure-steps/`, token)
export const applyProcedure = (caseId: string, templateKey: string, token: string) =>
  api.post<{ applied: string; steps: ProcedureStep[] }>('case', `${base(caseId)}/apply-procedure/`, { template_key: templateKey }, token)
export const updateProcedureStep = (caseId: string, id: string, data: Partial<ProcedureStep>, token: string) =>
  api.patch<ProcedureStep>('case', `${base(caseId)}/procedure-steps/${id}/`, data, token)

// ── Authorities (knowledge-in-context) ────────────────────────────────────────

export type CaseAuthority = {
  id: string
  source_type: string
  source_label: string
  title: string
  reference: string
  library_id: string
  url: string
  note: string
  created_at: string
}

export const AUTHORITY_SOURCES: { value: string; label: string }[] = [
  { value: 'library_book', label: 'CamLex Book' },
  { value: 'library_article', label: 'CamLex Article' },
  { value: 'statute', label: 'Statute / Code' },
  { value: 'ohada_act', label: 'OHADA Uniform Act' },
  { value: 'judgment', label: 'Judgment / Case Law' },
  { value: 'external', label: 'External Source' },
]

export const getAuthorities = (caseId: string, token: string) =>
  api.get<CaseAuthority[]>('case', `${base(caseId)}/authorities/`, token)
export const addAuthority = (caseId: string, data: Partial<CaseAuthority>, token: string) =>
  api.post<CaseAuthority>('case', `${base(caseId)}/authorities/`, data, token)
export const deleteAuthority = (caseId: string, id: string, token: string) =>
  api.del('case', `${base(caseId)}/authorities/${id}/`, token)

// ── Conflict check ────────────────────────────────────────────────────────────

export type ConflictResult = {
  case_id: string
  case_title: string
  case_status: string
  party_name: string
  party_role: string
  is_opposing: boolean
}

export const checkConflict = (name: string, token: string) =>
  api.get<{ query: string; match_count: number; has_opposing_match: boolean; results: ConflictResult[] }>(
    'case', `/cases/conflict-check/?name=${encodeURIComponent(name)}`, token)
