import { api } from './api'

type LoginResponse = {
  access: string
  refresh?: string
}

type RegisterPayload = {
  email: string
  full_name: string
  password: string
  role: string
}

type MeResponse = {
  id: string
  email: string
  full_name: string
  role: string
}

const allowedStaffRoles = new Set(['lawyer', 'owner', 'partner', 'associate', 'secretary', 'firm_admin', 'firm-admin', 'managing_partner'])

export function saveSession(access: string, refresh?: string) {
  localStorage.setItem('access', access)
  if (refresh) localStorage.setItem('refresh', refresh)
}

export function clearSession() {
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
  localStorage.removeItem('portalRole')
  localStorage.removeItem('userRole')
  localStorage.removeItem('lawyerId')
  localStorage.removeItem('authUserId')
  localStorage.removeItem('fullName')
  localStorage.removeItem('userEmail')
}

export async function loginWithEmail(email: string, password: string) {
  clearSession()
  const tokenResponse = await api.post<LoginResponse>('auth', '/auth/login/', { email, password })
  saveSession(tokenResponse.access, tokenResponse.refresh)

  const me = await api.get<MeResponse>('auth', '/auth/me/', tokenResponse.access)
  return { ...tokenResponse, me }
}

export async function registerClient(payload: Omit<RegisterPayload, 'role'>) {
  return api.post<MeResponse>('auth', '/auth/register/', { ...payload, role: 'client' })
}

export async function registerStaff(payload: RegisterPayload) {
  return api.post<MeResponse>('auth', '/auth/register/', payload)
}

export function applyRoleToSession(me: MeResponse, preferredPortalRole?: 'client' | 'lawyer') {
  const normalizedRole = (me.role || '').toLowerCase()
  const isClient = preferredPortalRole === 'client' || normalizedRole === 'client'
  const isStaff = preferredPortalRole === 'lawyer' || allowedStaffRoles.has(normalizedRole)

  localStorage.setItem('portalRole', isClient ? 'client' : 'lawyer')
  localStorage.setItem('userRole', me.role)
  localStorage.setItem('authUserId', me.id)
  if (me.full_name) localStorage.setItem('fullName', me.full_name)
  if (me.email) localStorage.setItem('userEmail', me.email)

  if (isStaff) {
    localStorage.setItem('lawyerId', me.id)
  } else {
    localStorage.removeItem('lawyerId')
  }
}
