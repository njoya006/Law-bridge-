import { api } from './api'

export type Firm = {
  id: number
  name: string
  created_at: string
}

export type CreateFirmPayload = {
  name: string
}

export type FirmDiscovery = Firm & {
  member_count?: number
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

export type FirmInvitePayload = {
  email: string
  role: 'firm_admin' | 'partner' | 'associate' | 'guest' | string
}

export function getMyFirmMemberships(token: string) {
  return api.get<FirmMembership[]>('firms', '/me/', token)
}

export function createFirm(payload: CreateFirmPayload, token: string) {
  return api.post<Firm>('firms', '/create/', payload, token)
}

export function browseFirms(token?: string | null, query?: string) {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : ''
  // Try the list endpoint first; if it fails (some deployments expose only search), fall back to the search endpoint.
  return api.get<{ count: number; results: FirmDiscovery[] }>('firms', `/${suffix}`, token).catch(async (err) => {
    try {
      const q = query ? encodeURIComponent(query) : ''
      return await api.get<{ count: number; results: FirmDiscovery[] }>('firms', `/search/?q=${q}`, token)
    } catch (inner) {
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
  return api.get<FirmMembership[]>(
    'firms',
    `/${firmId}/members/`,
    token,
  )
}

export function inviteFirmMember(firmId: number, payload: FirmInvitePayload, token: string) {
  return api.post<FirmMembership>(
    'firms',
    `/${firmId}/invites/`,
    payload,
    token,
  )
}

export function updateFirmMemberRole(memberId: number, role: string, token: string) {
  return api.patch<FirmMembership>(
    'firms',
    `/members/${memberId}/role/`,
    { role },
    token,
  )
}

export function unassignFirmMember(memberId: number, token: string) {
  return api.patch<void>('firms', `/members/${memberId}/firm/`, {}, token)
}

export function removeFirmMember(memberId: number, token: string) {
  return api.del<void>('firms', `/members/${memberId}/`, token)
}

export function acceptInvite(inviteToken: string, accessToken: string) {
  return api.post<FirmMembership>('firms', `/invites/${inviteToken}/accept/`, undefined, accessToken)
}
