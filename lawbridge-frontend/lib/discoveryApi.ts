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
  reputation_score?: number
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
  avatar_url?: string | null
}

export interface LawyerBrowseFilters {
  specialization?: string
  circuit?: string            // anglophone / francophone
  practice_circuit?: string   // specific region: Centre, Littoral, etc.
  bijural?: string            // common_law / civil_law / both
  availability?: string       // available / busy / on_leave
  mode?: string               // in_person / virtual / both
  max_fee?: number
  min_rating?: number
  urgent?: boolean
  verified_only?: boolean
  sort?: 'reputation' | 'rating' | 'experience' | 'fee_asc' | 'fee_desc'
  q?: string
}

export function browseLawyers(token?: string | null, filters?: LawyerBrowseFilters) {
  const params = new URLSearchParams()
  if (filters?.specialization) params.set('specialization', filters.specialization)
  if (filters?.circuit) params.set('circuit', filters.circuit)
  if (filters?.practice_circuit) params.set('practice_circuit', filters.practice_circuit)
  if (filters?.bijural) params.set('bijural', filters.bijural)
  if (filters?.availability) params.set('availability', filters.availability)
  if (filters?.mode) params.set('mode', filters.mode)
  if (filters?.max_fee) params.set('max_fee', String(filters.max_fee))
  if (filters?.min_rating) params.set('min_rating', String(filters.min_rating))
  if (filters?.urgent) params.set('urgent', 'true')
  if (filters?.verified_only) params.set('verified_only', 'true')
  if (filters?.sort) params.set('sort', filters.sort)
  if (filters?.q) params.set('q', filters.q)
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

export function browseFirms(token?: string | null, query?: string, verifiedOnly?: boolean) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (verifiedOnly) params.set('verified_only', 'true')
  const suffix = params.toString() ? `?${params.toString()}` : ''
  return api.get<{ count: number; results: FirmDiscovery[] }>('firms', `/${suffix}`, token)
}

export function searchFirms(query: string, token?: string | null) {
  return api.get<{ count: number; results: FirmDiscovery[] }>('firms', `/search/?q=${encodeURIComponent(query)}`, token)
}

export function getFirmLawyers(firmId: number | string, token?: string | null) {
  return api.get<LawyerDiscovery[]>('firms', `/${firmId}/lawyers/`, token)
}
