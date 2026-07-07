import { api } from './api'

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

// ── Lawyer verification ────────────────────────────────────────────────────────

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
  return api.get<VerificationStatusResponse>('lawyer', '/lawyers/verification/', token)
}

export function submitVerificationRequest(
  data: { bar_number: string; bar_council: string; year_called: number; notes?: string },
  token: string,
) {
  return api.post<VerificationRequest>('lawyer', '/lawyers/verification/', data, token)
}

export function getVerificationQueue(token: string, filterStatus = 'pending') {
  return api.get<{ count: number; results: VerificationRequest[] }>('lawyer', `/lawyers/verification/queue/?status=${filterStatus}`, token)
}

export function approveVerification(id: string, token: string) {
  return api.post<{ detail: string; request: VerificationRequest }>('lawyer', `/lawyers/verification/${id}/approve/`, {}, token)
}

export function rejectVerification(id: string, reason: string, token: string) {
  return api.post<{ detail: string; request: VerificationRequest }>('lawyer', `/lawyers/verification/${id}/reject/`, { reason }, token)
}

// ── Firm verification ──────────────────────────────────────────────────────────

export type FirmType = 'sole_practice' | 'partnership' | 'incorporated' | 'government' | 'ngo'

export const FIRM_TYPE_LABELS: Record<FirmType, string> = {
  sole_practice: 'Sole Practice',
  partnership: 'Partnership',
  incorporated: 'Incorporated Law Firm',
  government: 'Government / Public Sector',
  ngo: 'NGO / Non-profit',
}

export interface FirmVerificationRequest {
  id: string
  firm_name: string
  registration_number: string
  firm_type: FirmType
  founding_year: number
  number_of_partners: number
  notes: string
  status: VerificationStatus
  rejection_reason: string
  created_at: string
  updated_at: string
}

export interface FirmVerificationStatusResponse {
  is_verified: boolean
  request: FirmVerificationRequest | null
}

export function getMyFirmVerificationStatus(token: string) {
  return api.get<FirmVerificationStatusResponse>('lawyer', '/firms/verification/', token)
}

export function submitFirmVerificationRequest(
  data: {
    registration_number: string
    firm_type: FirmType
    founding_year: number
    number_of_partners: number
    notes?: string
  },
  token: string,
) {
  return api.post<FirmVerificationRequest>('lawyer', '/firms/verification/', data, token)
}

export function getFirmVerificationQueue(token: string, filterStatus = 'pending') {
  return api.get<{ count: number; results: FirmVerificationRequest[] }>('lawyer', `/firms/verification/queue/?status=${filterStatus}`, token)
}

export function approveFirmVerification(id: string, token: string) {
  return api.post<{ detail: string; request: FirmVerificationRequest }>('lawyer', `/firms/verification/${id}/approve/`, {}, token)
}

export function rejectFirmVerification(id: string, reason: string, token: string) {
  return api.post<{ detail: string; request: FirmVerificationRequest }>('lawyer', `/firms/verification/${id}/reject/`, { reason }, token)
}
