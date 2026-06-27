import { api } from './api'

export type Firm = {
  id: number
  name: string
  description?: string
  logo_url?: string | null
  created_at: string
}

export type CreateFirmPayload = {
  name: string
}

export type FirmDiscovery = Firm & {
  member_count?: number
  description?: string
  logo_url?: string | null
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
