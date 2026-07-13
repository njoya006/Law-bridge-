'use client'

export type RelationshipStatus =
  | 'not_contacted'
  | 'contacted'
  | 'meeting_requested'
  | 'meeting_scheduled'
  | 'interview_completed'
  | 'interested'
  | 'follow_up_needed'
  | 'joined_founding_network'
  | 'founding_council_member'
  | 'pilot_partner'
  | 'active_partner'

export const STATUS_LABELS: Record<RelationshipStatus, string> = {
  not_contacted: 'Not Contacted',
  contacted: 'Contacted',
  meeting_requested: 'Meeting Requested',
  meeting_scheduled: 'Meeting Scheduled',
  interview_completed: 'Interview Completed',
  interested: 'Interested',
  follow_up_needed: 'Follow-Up Needed',
  joined_founding_network: 'Founding Network',
  founding_council_member: 'Founding Council',
  pilot_partner: 'Pilot Partner',
  active_partner: 'Active Partner',
}

export const STATUS_COLORS: Record<RelationshipStatus, string> = {
  not_contacted: 'border-neutral-600/40 bg-neutral-600/10 text-neutral-400',
  contacted: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  meeting_requested: 'border-sky-500/40 bg-sky-500/10 text-sky-400',
  meeting_scheduled: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  interview_completed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  interested: 'border-purple-500/40 bg-purple-500/10 text-purple-400',
  follow_up_needed: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  joined_founding_network: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
  founding_council_member: 'border-gold-500/40 bg-gold-500/10 text-gold-400',
  pilot_partner: 'border-teal-500/40 bg-teal-500/10 text-teal-400',
  active_partner: 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300',
}

export type OutreachFirm = {
  id: string
  firmName: string
  city: string
  country: string
  address?: string
  website?: string
  phone?: string
  email?: string
  practiceAreas: string[]
  firmSize?: string
  status: RelationshipStatus
  source?: string
  tags: string[]
  assignedTo?: string
  lastContact?: string
  nextFollowup?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type NextStep = {
  id: string
  text: string
  dueDate?: string
  status: 'pending' | 'done'
}

export type Interview = {
  id: string
  firmId: string
  firmName: string
  contactId?: string
  contactName?: string
  date: string
  time?: string
  duration?: number
  type: 'in_person' | 'virtual' | 'phone'
  location?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  interviewerName?: string
  summary?: string
  takeaways: string[]
  nextSteps: NextStep[]
  overallInterestLevel?: number
  notes?: string
  createdAt: string
}

export type FeatureRequest = {
  id: string
  title: string
  requestedBy?: string
  firmId?: string
  firmName?: string
  priority: 'low' | 'medium' | 'high'
  status: 'under_review' | 'approved' | 'planned' | 'in_development' | 'released' | 'declined'
  source: 'interview' | 'firm' | 'internal' | 'email'
  description?: string
  requestedOn: string
  interviewId?: string
}

export type Task = {
  id: string
  title: string
  assignedTo?: string
  firmId?: string
  firmName?: string
  dueDate?: string
  status: 'pending' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  notes?: string
  createdAt: string
}

export type Contact = {
  id: string
  firmId: string
  firmName: string
  name: string
  position: string
  email?: string
  phone?: string
  whatsapp?: string
  linkedin?: string
  isPrimary: boolean
}

type OutreachStore = {
  firms: OutreachFirm[]
  interviews: Interview[]
  featureRequests: FeatureRequest[]
  tasks: Task[]
  contacts: Contact[]
}

// ── API layer ──────────────────────────────────────────────────────────────────

const API = (typeof window !== 'undefined' && (window as any).__API_GATEWAY__)
  || process.env.NEXT_PUBLIC_API_GATEWAY_URL
  || ''

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { ...opts, headers: authHeaders() })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}

// ── localStorage cache (instant reads, fallback when offline) ─────────────────

const STORAGE_KEY = 'lawbridge_outreach'

const EMPTY: OutreachStore = { firms: [], interviews: [], featureRequests: [], tasks: [], contacts: [] }

function getCache(): OutreachStore {
  if (typeof window === 'undefined') return { ...EMPTY }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as OutreachStore) : { ...EMPTY }
  } catch {
    return { ...EMPTY }
  }
}

function setCache(store: OutreachStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

// ── Public API — sync reads (from cache), async writes (cache + API) ──────────

export function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

// FIRMS
export function getFirms(): OutreachFirm[] { return getCache().firms }
export function getFirmById(id: string): OutreachFirm | undefined { return getCache().firms.find(f => f.id === id) }

export function saveFirm(firm: OutreachFirm): void {
  const store = getCache()
  const idx = store.firms.findIndex(f => f.id === firm.id)
  if (idx >= 0) store.firms[idx] = firm
  else store.firms.unshift(firm)
  setCache(store)

  const isNew = idx < 0
  if (isNew) {
    apiFetch(`/api/v1/outreach/firms/`, { method: 'POST', body: JSON.stringify(firm) })
  } else {
    apiFetch(`/api/v1/outreach/firms/${firm.id}/`, { method: 'PATCH', body: JSON.stringify(firm) })
  }
}

export function deleteFirm(id: string): void {
  const store = getCache()
  store.firms = store.firms.filter(f => f.id !== id)
  setCache(store)
  apiFetch(`/api/v1/outreach/firms/${id}/`, { method: 'DELETE' })
}

// INTERVIEWS
export function getInterviews(): Interview[] { return getCache().interviews }
export function getInterviewsByFirm(firmId: string): Interview[] { return getCache().interviews.filter(i => i.firmId === firmId) }
export function getInterviewById(id: string): Interview | undefined { return getCache().interviews.find(i => i.id === id) }

export function saveInterview(interview: Interview): void {
  const store = getCache()
  const idx = store.interviews.findIndex(i => i.id === interview.id)
  if (idx >= 0) store.interviews[idx] = interview
  else store.interviews.unshift(interview)
  setCache(store)

  const isNew = idx < 0
  if (isNew) {
    apiFetch(`/api/v1/outreach/interviews/`, { method: 'POST', body: JSON.stringify(interview) })
  } else {
    apiFetch(`/api/v1/outreach/interviews/${interview.id}/`, { method: 'PATCH', body: JSON.stringify(interview) })
  }
}

// CONTACTS
export function getContacts(): Contact[] { return getCache().contacts }
export function getContactsByFirm(firmId: string): Contact[] { return getCache().contacts.filter(c => c.firmId === firmId) }

export function saveContact(contact: Contact): void {
  const store = getCache()
  const idx = store.contacts.findIndex(c => c.id === contact.id)
  if (idx >= 0) store.contacts[idx] = contact
  else store.contacts.unshift(contact)
  setCache(store)

  const isNew = idx < 0
  if (isNew) {
    apiFetch(`/api/v1/outreach/contacts/`, { method: 'POST', body: JSON.stringify(contact) })
  } else {
    apiFetch(`/api/v1/outreach/contacts/${contact.id}/`, { method: 'PATCH', body: JSON.stringify(contact) })
  }
}

export function deleteContact(id: string): void {
  const store = getCache()
  store.contacts = store.contacts.filter(c => c.id !== id)
  setCache(store)
  apiFetch(`/api/v1/outreach/contacts/${id}/`, { method: 'DELETE' })
}

// TASKS
export function getTasks(): Task[] { return getCache().tasks }
export function getTasksByFirm(firmId: string): Task[] { return getCache().tasks.filter(t => t.firmId === firmId) }

export function saveTask(task: Task): void {
  const store = getCache()
  const idx = store.tasks.findIndex(t => t.id === task.id)
  if (idx >= 0) store.tasks[idx] = task
  else store.tasks.unshift(task)
  setCache(store)

  const isNew = idx < 0
  if (isNew) {
    apiFetch(`/api/v1/outreach/tasks/`, { method: 'POST', body: JSON.stringify(task) })
  } else {
    apiFetch(`/api/v1/outreach/tasks/${task.id}/`, { method: 'PATCH', body: JSON.stringify(task) })
  }
}

// FEATURE REQUESTS
export function getFeatureRequests(): FeatureRequest[] { return getCache().featureRequests }
export function getFeatureRequestsByFirm(firmId: string): FeatureRequest[] { return getCache().featureRequests.filter(f => f.firmId === firmId) }

export function saveFeatureRequest(fr: FeatureRequest): void {
  const store = getCache()
  const idx = store.featureRequests.findIndex(f => f.id === fr.id)
  if (idx >= 0) store.featureRequests[idx] = fr
  else store.featureRequests.unshift(fr)
  setCache(store)

  const isNew = idx < 0
  if (isNew) {
    apiFetch(`/api/v1/outreach/feature-requests/`, { method: 'POST', body: JSON.stringify(fr) })
  } else {
    apiFetch(`/api/v1/outreach/feature-requests/${fr.id}/`, { method: 'PATCH', body: JSON.stringify(fr) })
  }
}

// ── Sync from API — call on page mount to pull latest data from the real DB ───

type ApiSyncResult = {
  firms?: OutreachFirm[]
  interviews?: OutreachFirm[]
  contacts?: Contact[]
  tasks?: Task[]
  featureRequests?: FeatureRequest[]
}

export async function syncAllFromApi(): Promise<OutreachStore | null> {
  const [firms, interviews, contacts, tasks, featureRequests] = await Promise.all([
    apiFetch<OutreachFirm[]>('/api/v1/outreach/firms/'),
    apiFetch<Interview[]>('/api/v1/outreach/interviews/'),
    apiFetch<Contact[]>('/api/v1/outreach/contacts/'),
    apiFetch<Task[]>('/api/v1/outreach/tasks/'),
    apiFetch<FeatureRequest[]>('/api/v1/outreach/feature-requests/'),
  ])

  if (!firms && !interviews) return null // API unreachable — stay on cache

  const store: OutreachStore = {
    firms: firms ?? getCache().firms,
    interviews: interviews ?? getCache().interviews,
    contacts: contacts ?? getCache().contacts,
    tasks: tasks ?? getCache().tasks,
    featureRequests: featureRequests ?? getCache().featureRequests,
  }
  setCache(store)
  return store
}

export async function syncFirmsFromApi(): Promise<OutreachFirm[] | null> {
  const data = await apiFetch<OutreachFirm[]>('/api/v1/outreach/firms/')
  if (!data) return null
  const store = getCache()
  store.firms = data
  setCache(store)
  return data
}

export async function syncInterviewsFromApi(firmId?: string): Promise<Interview[] | null> {
  const url = firmId
    ? `/api/v1/outreach/interviews/?firmId=${firmId}`
    : '/api/v1/outreach/interviews/'
  const data = await apiFetch<Interview[]>(url)
  if (!data) return null
  const store = getCache()
  if (firmId) {
    store.interviews = [...store.interviews.filter(i => i.firmId !== firmId), ...data]
  } else {
    store.interviews = data
  }
  setCache(store)
  return firmId ? data : store.interviews
}

export async function syncContactsFromApi(firmId?: string): Promise<Contact[] | null> {
  const url = firmId
    ? `/api/v1/outreach/contacts/?firmId=${firmId}`
    : '/api/v1/outreach/contacts/'
  const data = await apiFetch<Contact[]>(url)
  if (!data) return null
  const store = getCache()
  if (firmId) {
    store.contacts = [...store.contacts.filter(c => c.firmId !== firmId), ...data]
  } else {
    store.contacts = data
  }
  setCache(store)
  return firmId ? data : store.contacts
}

export async function syncTasksFromApi(): Promise<Task[] | null> {
  const data = await apiFetch<Task[]>('/api/v1/outreach/tasks/')
  if (!data) return null
  const store = getCache()
  store.tasks = data
  setCache(store)
  return data
}

export async function syncFeatureRequestsFromApi(): Promise<FeatureRequest[] | null> {
  const data = await apiFetch<FeatureRequest[]>('/api/v1/outreach/feature-requests/')
  if (!data) return null
  const store = getCache()
  store.featureRequests = data
  setCache(store)
  return data
}
