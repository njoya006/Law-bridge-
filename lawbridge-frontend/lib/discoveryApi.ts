import { api } from './api'
import type { FirmDiscovery } from './firmsApi'

export type LawyerDiscovery = {
  id: string
  user_id: string
  name: string
  specialization: string
  bijural_flag: string
  average_rating: number
  rating_count: number
  active_cases: number
  total_cases: number
  years_of_experience: number
  bio: string
  qualifications: string
  bar_number: string
  consultation_fee: string | null
  procedural_fee?: string | null
  professional_fee?: string | null
  availability_status: 'available' | 'busy' | 'on_leave' | 'inactive'
  practice_circuit: string
  accepted_case_types: string
  accepts_urgent_cases: boolean
  consultation_mode: 'in_person' | 'virtual' | 'both'
  is_verified: boolean
  is_stub?: boolean
}

export function browseLawyers(token?: string | null, specialization?: string, circuit?: string) {
  const params = new URLSearchParams()
  if (specialization) params.set('specialization', specialization)
  if (circuit) params.set('circuit', circuit)
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return api.get<{ count: number; results: LawyerDiscovery[] }>('lawyer', `/lawyers/${suffix}`, token)
}

export function searchLawyers(query: string, token?: string | null) {
  return api.get<{ count: number; results: LawyerDiscovery[] }>('lawyer', `/lawyers/search/?q=${encodeURIComponent(query)}`, token)
}

export function getLawyerById(lawyerId: string, token?: string | null) {
  return api.get<LawyerDiscovery & { availability_slots?: AvailabilitySlot[] }>('lawyer', `/lawyers/${lawyerId}/`, token)
}

export type AvailabilitySlot = {
  id: string
  day_of_week: number
  day_name: string
  start_time: string
  end_time: string
  is_available: boolean
}

export function matchLawyers(payload: { case_type: string; circuit: string; language_preference: string; urgency: string }, token: string) {
  return api.post<{ matches: Array<{ lawyer: LawyerDiscovery; score: number; match_factors: Record<string, unknown> }>; count: number }>('lawyer', '/lawyers/match/', payload, token)
}

export function browseFirms(token?: string | null, query?: string) {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : ''
  return api.get<{ count: number; results: FirmDiscovery[] }>('firms', `/${suffix}`, token)
}

export function searchFirms(query: string, token?: string | null) {
  return api.get<{ count: number; results: FirmDiscovery[] }>('firms', `/search/?q=${encodeURIComponent(query)}`, token)
}

export function getFirmLawyers(firmId: number | string, token?: string | null) {
  return api.get<LawyerDiscovery[]>('firms', `/${firmId}/lawyers/`, token)
}
