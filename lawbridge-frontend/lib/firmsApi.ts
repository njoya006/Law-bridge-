import { api } from './api'

export type Firm = {
  id: number
  name: string
  description?: string
  logo_url?: string | null
  website?: string
  office_address?: string
  city?: string
  country?: string
  phone?: string
  contact_email?: string
  year_established?: number | null
  specializations?: string[]
  is_verified?: boolean
  created_at: string
  updated_at?: string
}

export type CreateFirmPayload = {
  name: string
}

export type FirmDiscovery = Firm & {
  member_count?: number
}

export type PartnershipPolicy = {
  id: number
  is_open: boolean
  min_years_experience: number
  requires_specialization_overlap: boolean
  revenue_share_percentage: string
  process_description: string
  additional_requirements: string
  created_at: string
  updated_at: string
}

export type PartnershipRequest = {
  id: number
  requesting_firm: number
  requesting_firm_name: string
  target_firm: number
  target_firm_name: string
  requested_by_id: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  message: string
  response_note: string
  responded_by_id: string
  created_at: string
  updated_at: string
}

export type FirmMembership = {
  id: number
  user: number
  user_email?: string | null
  user_full_name?: string | null
  firm: number
  role: 'owner' | 'firm_admin' | 'partner' | 'associate' | 'guest' | string
  invited_by?: number | null
  invited_email?: string | null
  invited_at?: string
  accepted_at?: string | null
  is_active?: boolean
}

export type FirmInvite = {
  token: string
  email: string
  firm: number
  role: string
  created_at: string
  expires_at?: string | null
  accepted_at?: string | null
}

export type FirmInvitePayload = {
  email: string
  role: 'firm_admin' | 'partner' | 'associate' | 'guest' | string
  note?: string
}

export type FirmActionLog = {
  id: number
  firm: number
  performed_by_id: string
  performed_by_email: string
  action: 'invite_sent' | 'invite_accepted' | 'member_removed' | 'role_changed'
  target_email: string
  old_role: string
  new_role: string
  reason: string
  created_at: string
}

export function getMyFirmMemberships(token: string) {
  return api.get<FirmMembership[]>('firms', '/me/', token)
}

export function createFirm(payload: CreateFirmPayload, token: string) {
  return api.post<Firm>('firms', '/create/', payload, token)
}

export function browseFirms(token?: string | null, query?: string) {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : ''
  return api.get<{ count: number; results: FirmDiscovery[] }>('firms', `/${suffix}`, token).catch(async (err) => {
    try {
      const q = query ? encodeURIComponent(query) : ''
      return await api.get<{ count: number; results: FirmDiscovery[] }>('firms', `/search/?q=${q}`, token)
    } catch {
      throw err
    }
  })
}

export function searchFirms(query: string, token?: string | null) {
  return api.get<{ count: number; results: FirmDiscovery[] }>('firms', `/search/?q=${encodeURIComponent(query)}`, token)
}

export function getFirmDetail(firmId: number, token?: string | null) {
  return api.get<FirmDiscovery>('firms', `/${firmId}/`, token)
}

export function getFirmMembers(firmId: number, token: string) {
  return api.get<FirmMembership[]>('firms', `/${firmId}/members/`, token)
}

export type FirmLawyer = {
  id: string
  name: string
  email?: string
  role?: string
  specialization?: string
  is_stub?: boolean
  consultation_fee?: string | null
  availability_status?: string
  accepted_case_types?: string
}

export function getFirmLawyers(firmId: number, token?: string | null) {
  return api.get<FirmLawyer[]>('firms', `/${firmId}/lawyers/`, token)
}

export function getFirmPendingInvites(firmId: number, token: string) {
  return api.get<FirmInvite[]>('firms', `/${firmId}/pending-invites/`, token)
}

export function getFirmActivity(firmId: number, token: string) {
  return api.get<FirmActionLog[]>('firms', `/${firmId}/activity/`, token)
}

export function inviteFirmMember(firmId: number, payload: FirmInvitePayload, token: string) {
  return api.post<FirmInvite>('firms', `/${firmId}/invites/`, payload, token)
}

export function updateFirmMemberRole(memberId: number, role: string, reason: string, token: string) {
  return api.patch<FirmMembership>('firms', `/members/${memberId}/role/`, { role, reason }, token)
}

export function unassignFirmMember(memberId: number, token: string) {
  return api.patch<void>('firms', `/members/${memberId}/firm/`, {}, token)
}

export function removeFirmMember(memberId: number, reason: string, token: string) {
  return api.request<void>('firms', `/members/${memberId}/`, {
    method: 'DELETE',
    token,
    body: { reason } as unknown as BodyInit,
  })
}

export function acceptInvite(inviteToken: string, accessToken: string) {
  return api.post<FirmMembership & { firm_name?: string }>('firms', `/invites/${inviteToken}/accept/`, undefined, accessToken)
}

export function cancelFirmInvite(firmId: number, inviteToken: string, accessToken: string) {
  return api.request<void>('firms', `/${firmId}/invites/${inviteToken}/`, { method: 'DELETE', token: accessToken })
}

// Partnership
export function getPartnershipPolicy(firmId: number, token: string) {
  return api.get<PartnershipPolicy>('firms', `/${firmId}/partnership-policy/`, token)
}

export function updatePartnershipPolicy(firmId: number, data: Partial<PartnershipPolicy>, token: string) {
  return api.request<PartnershipPolicy>('firms', `/${firmId}/partnership-policy/`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data) as unknown as BodyInit,
  })
}

export function sendPartnershipRequest(firmId: number, message: string, token: string) {
  return api.post<PartnershipRequest>('firms', `/${firmId}/partnership-request/`, { message }, token)
}

export function getPartnershipRequests(firmId: number, token: string) {
  return api.get<PartnershipRequest[]>('firms', `/${firmId}/partnership-requests/`, token)
}

export function respondToPartnershipRequest(
  requestId: number,
  status: 'under_review' | 'approved' | 'rejected',
  response_note: string,
  token: string,
) {
  return api.patch<PartnershipRequest>('firms', `/partnership-requests/${requestId}/`, { status, response_note }, token)
}

export function updateFirmProfile(firmId: number, data: Partial<Firm>, token: string) {
  return api.patch<Firm>('firms', `/${firmId}/`, data, token)
}

export type FirmGalleryImage = {
  id: number
  firm: number
  image_url: string
  caption: string
  order: number
  uploaded_at: string
}

export function getFirmGallery(firmId: number, token?: string | null) {
  return api.get<FirmGalleryImage[]>('firms', `/${firmId}/gallery/`, token)
}

export function deleteFirmGalleryImage(firmId: number, imageId: number, token: string) {
  return api.request<void>('firms', `/${firmId}/gallery/${imageId}/`, { method: 'DELETE', token })
}
