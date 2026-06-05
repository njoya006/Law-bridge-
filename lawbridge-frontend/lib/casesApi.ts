import { api } from './api'

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
  assigned_lawyer_id?: string | null
  timeline: Array<{ timestamp: string; status: string; notes: string }>
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
