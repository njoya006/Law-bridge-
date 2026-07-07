import { api } from './api'

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface VerificationRequest {
  id: string
  lawyer_name: string
  bar_number: string
  bar_council: string
  year_called: number
  notes: string
  status: VerificationStatus
  rejection_reason: string
  created_at: string
  updated_at: string
}

export interface VerificationStatusResponse {
  is_verified: boolean
  request: VerificationRequest | null
}

export function getMyVerificationStatus(token: string) {
  return api.get<VerificationStatusResponse>('lawyer', '/verification/', token)
}

export function submitVerificationRequest(
  data: { bar_number: string; bar_council: string; year_called: number; notes?: string },
  token: string,
) {
  return api.post<VerificationRequest>('lawyer', '/verification/', data, token)
}

export function getVerificationQueue(token: string, status = 'pending') {
  return api.get<{ count: number; results: VerificationRequest[] }>('lawyer', `/verification/queue/?status=${status}`, token)
}

export function approveVerification(id: string, token: string) {
  return api.post<{ detail: string; request: VerificationRequest }>('lawyer', `/verification/${id}/approve/`, {}, token)
}

export function rejectVerification(id: string, reason: string, token: string) {
  return api.post<{ detail: string; request: VerificationRequest }>('lawyer', `/verification/${id}/reject/`, { reason }, token)
}
