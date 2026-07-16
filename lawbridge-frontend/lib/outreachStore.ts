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
  follow_up_needed: 'Follow-up Needed',
  joined_founding_network: 'Founding Network',
  founding_council_member: 'Founding Council',
  pilot_partner: 'Pilot Partner',
  active_partner: 'Active Partner',
}

export const STATUS_COLORS: Record<RelationshipStatus, string> = {
  not_contacted: 'bg-neutral-600/30 text-neutral-400 border-neutral-600/20',
  contacted: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  meeting_requested: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  meeting_scheduled: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  interview_completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  interested: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  follow_up_needed: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  joined_founding_network: 'bg-teal-500/15 text-teal-300 border-teal-500/20',
  founding_council_member: 'bg-gold-500/15 text-gold-300 border-gold-500/20',
  pilot_partner: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
  active_partner: 'bg-emerald-600/20 text-emerald-200 border-emerald-600/30',
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
  nextSteps: { id: string; text: string; dueDate?: string; status: 'pending' | 'done' }[]
  overallInterestLevel?: number
  notes?: string
  createdAt: string
}

export type FeatureRequest = {
  id: string
  title: string
  requestedBy?: string | null
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

const KEY = 'lawbridge_outreach'

function load(): OutreachStore {
  if (typeof window === 'undefined') return { firms: [], interviews: [], featureRequests: [], tasks: [], contacts: [] }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed()
    return JSON.parse(raw) as OutreachStore
  } catch {
    return seed()
  }
}

function save(store: OutreachStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(store))
}

function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function seed(): OutreachStore {
  const now = new Date().toISOString()
  const firms: OutreachFirm[] = [
    { id: 'f1', firmName: 'KEUSSA Law Firm', city: 'Yaoundé', country: 'Cameroon', phone: '+237 222 000 111', email: 'info@keussa.cm', practiceAreas: ['Corporate Law', 'OHADA'], firmSize: '6-25', status: 'interview_completed', source: 'referral', tags: ['High Priority', 'OHADA Expert'], assignedTo: 'Medin', lastContact: now, createdAt: now, updatedAt: now },
    { id: 'f2', firmName: 'Mbarga & Associates', city: 'Douala', country: 'Cameroon', phone: '+237 233 000 222', email: 'contact@mbarga-law.cm', practiceAreas: ['Criminal Law', 'Labour Law'], firmSize: '1-5', status: 'interested', source: 'linkedin', tags: ['Douala Circuit', 'Potential Partner'], assignedTo: 'Medin', lastContact: now, createdAt: now, updatedAt: now },
    { id: 'f3', firmName: 'Nkoumazok Legal Group', city: 'Douala', country: 'Cameroon', practiceAreas: ['Commercial Law', 'Banking & Finance'], firmSize: '26-100', status: 'founding_council_member', source: 'bar_association', tags: ['Founding Council', 'Verified'], assignedTo: 'Medin', lastContact: now, createdAt: now, updatedAt: now },
    { id: 'f4', firmName: 'Fang & Fang Chambers', city: 'Bamenda', country: 'Cameroon', practiceAreas: ['Land Law', 'Family Law'], firmSize: '1-5', status: 'contacted', source: 'cold', tags: ['Northwest Circuit'], createdAt: now, updatedAt: now },
    { id: 'f5', firmName: 'Cabinet Essomba', city: 'Bafoussam', country: 'Cameroon', practiceAreas: ['Civil Law', 'Administrative Law'], firmSize: '6-25', status: 'meeting_scheduled', source: 'referral', tags: ['West Region'], assignedTo: 'Medin', createdAt: now, updatedAt: now },
    { id: 'f6', firmName: 'Afrique Juridique Partners', city: 'Abidjan', country: 'Ivory Coast', practiceAreas: ['OHADA', 'Corporate Law'], firmSize: '26-100', status: 'interested', source: 'linkedin', tags: ['International', 'OHADA'], createdAt: now, updatedAt: now },
  ]

  const interviews: Interview[] = [
    { id: 'i1', firmId: 'f1', firmName: 'KEUSSA Law Firm', contactName: 'Me. Anicet Keussa', date: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), time: '10:00', duration: 60, type: 'in_person', location: 'KEUSSA offices, Yaoundé', status: 'completed', interviewerName: 'Medin', summary: 'Very positive meeting. Firm is interested in the platform, especially the case management and AI research features. Main concern is data security and OHADA compliance.', takeaways: ['Strong interest in AI research feature', 'Concerned about data security', 'Wants bilingual support confirmed', 'Ready to pilot with 3 lawyers'], nextSteps: [{ id: 'ns1', text: 'Send security documentation and OHADA compliance report', dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), status: 'pending' }, { id: 'ns2', text: 'Schedule platform demo with senior partners', dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), status: 'pending' }], overallInterestLevel: 82, createdAt: now },
    { id: 'i2', firmId: 'f2', firmName: 'Mbarga & Associates', contactName: 'Maître Mbarga', date: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10), time: '14:00', duration: 45, type: 'virtual', status: 'completed', interviewerName: 'Medin', summary: 'Good initial conversation. Smaller firm, mainly doing criminal and labour cases. Interested in the client discovery feature.', takeaways: ['Interested in client acquisition features', 'Uses paper-based case tracking currently', 'Budget-conscious — needs affordable pricing'], nextSteps: [{ id: 'ns3', text: 'Share pricing plans and ROI calculator', dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), status: 'pending' }], overallInterestLevel: 65, createdAt: now },
    { id: 'i3', firmId: 'f5', firmName: 'Cabinet Essomba', date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), time: '11:00', duration: 60, type: 'in_person', location: 'Cabinet Essomba, Bafoussam', status: 'scheduled', interviewerName: 'Medin', takeaways: [], nextSteps: [], createdAt: now },
  ]

  const featureRequests: FeatureRequest[] = [
    { id: 'fr1', title: 'Offline mode for case notes', requestedBy: 'KEUSSA Law Firm', firmId: 'f1', priority: 'high', status: 'under_review', source: 'interview', description: 'Need ability to add case notes when internet is unavailable, sync when back online.', requestedOn: now, interviewId: 'i1' },
    { id: 'fr2', title: 'WhatsApp integration for client updates', requestedBy: 'Mbarga & Associates', firmId: 'f2', priority: 'medium', status: 'planned', source: 'interview', description: 'Automatic case status updates sent to clients via WhatsApp.', requestedOn: now, interviewId: 'i2' },
    { id: 'fr3', title: 'Bulk document import from existing system', requestedBy: 'Nkoumazok Legal Group', firmId: 'f3', priority: 'high', status: 'in_development', source: 'firm', description: 'One-time bulk import of existing case documents from their current system.', requestedOn: now },
    { id: 'fr4', title: 'OHADA treaty cross-reference tool', requestedBy: 'Afrique Juridique Partners', firmId: 'f6', priority: 'high', status: 'approved', source: 'interview', description: 'Interactive tool to cross-reference OHADA uniform acts with national legislation.', requestedOn: now },
    { id: 'fr5', title: 'Court date calendar sync', requestedBy: null, priority: 'medium', status: 'under_review', source: 'internal', description: 'Sync court dates and deadlines with Google/Outlook calendar.', requestedOn: now },
  ]

  const tasks: Task[] = [
    { id: 't1', title: 'Send security docs to KEUSSA', assignedTo: 'Medin', firmId: 'f1', firmName: 'KEUSSA Law Firm', dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), status: 'pending', priority: 'high', createdAt: now },
    { id: 't2', title: 'Follow up with Mbarga on pricing', assignedTo: 'Medin', firmId: 'f2', firmName: 'Mbarga & Associates', dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), status: 'pending', priority: 'medium', createdAt: now },
    { id: 't3', title: 'Prepare demo materials for Essomba interview', assignedTo: 'Medin', firmId: 'f5', firmName: 'Cabinet Essomba', dueDate: new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10), status: 'in_progress', priority: 'high', createdAt: now },
    { id: 't4', title: 'Onboard Nkoumazok to Founding Council', assignedTo: 'Medin', firmId: 'f3', firmName: 'Nkoumazok Legal Group', dueDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), status: 'done', priority: 'high', createdAt: now },
    { id: 't5', title: 'Send outreach email to Fang & Fang', firmId: 'f4', firmName: 'Fang & Fang Chambers', dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), status: 'pending', priority: 'low', createdAt: now },
  ]

  const contacts: Contact[] = [
    { id: 'c1', firmId: 'f1', firmName: 'KEUSSA Law Firm', name: 'Me. Anicet Keussa', position: 'Managing Partner', email: 'a.keussa@keussa.cm', phone: '+237 677 111 222', whatsapp: '+237 677 111 222', isPrimary: true },
    { id: 'c2', firmId: 'f2', firmName: 'Mbarga & Associates', name: 'Maître Alain Mbarga', position: 'Founding Partner', email: 'a.mbarga@mbarga-law.cm', phone: '+237 699 333 444', isPrimary: true },
    { id: 'c3', firmId: 'f3', firmName: 'Nkoumazok Legal Group', name: 'Maître Sophie Nkoumazok', position: 'Managing Partner', email: 's.nkoumazok@nlg.cm', phone: '+237 655 555 666', isPrimary: true },
    { id: 'c4', firmId: 'f3', firmName: 'Nkoumazok Legal Group', name: 'Me. Jean-Paul Fouda', position: 'Senior Associate', email: 'jp.fouda@nlg.cm', isPrimary: false },
  ]

  const store: OutreachStore = { firms, interviews, featureRequests, tasks, contacts }
  save(store)
  return store
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getFirms(): OutreachFirm[] { return load().firms }
export function getFirm(id: string): OutreachFirm | undefined { return load().firms.find(f => f.id === id) }
export function saveFirm(firm: Omit<OutreachFirm, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): OutreachFirm {
  const store = load()
  const now = new Date().toISOString()
  if (firm.id) {
    const idx = store.firms.findIndex(f => f.id === firm.id)
    const existing = store.firms[idx] ?? {} as OutreachFirm
    const updated: OutreachFirm = { ...existing, ...firm, id: firm.id, updatedAt: now, createdAt: existing.createdAt ?? now }
    if (idx >= 0) store.firms[idx] = updated; else store.firms.unshift(updated)
    save(store); return updated
  }
  const created: OutreachFirm = { ...firm, id: uuid(), createdAt: now, updatedAt: now }
  store.firms.unshift(created); save(store); return created
}
export function deleteFirm(id: string): void { const s = load(); s.firms = s.firms.filter(f => f.id !== id); save(s) }

export function getInterviews(): Interview[] { return load().interviews }
export function getInterview(id: string): Interview | undefined { return load().interviews.find(i => i.id === id) }
export function saveInterview(interview: Omit<Interview, 'id' | 'createdAt'> & { id?: string }): Interview {
  const store = load()
  const now = new Date().toISOString()
  if (interview.id) {
    const idx = store.interviews.findIndex(i => i.id === interview.id)
    const existing = store.interviews[idx] ?? {} as Interview
    const updated: Interview = { ...existing, ...interview, id: interview.id, createdAt: existing.createdAt ?? now }
    if (idx >= 0) store.interviews[idx] = updated; else store.interviews.unshift(updated)
    save(store); return updated
  }
  const created: Interview = { ...interview, id: uuid(), createdAt: now }
  store.interviews.unshift(created); save(store); return created
}
export function deleteInterview(id: string): void { const s = load(); s.interviews = s.interviews.filter(i => i.id !== id); save(s) }

export function getFeatureRequests(): FeatureRequest[] { return load().featureRequests }
export function saveFeatureRequest(fr: Omit<FeatureRequest, 'id'> & { id?: string }): FeatureRequest {
  const store = load()
  if (fr.id) {
    const idx = store.featureRequests.findIndex(f => f.id === fr.id)
    const existing = store.featureRequests[idx] ?? {} as FeatureRequest
    const updated: FeatureRequest = { ...existing, ...fr, id: fr.id }
    if (idx >= 0) store.featureRequests[idx] = updated; else store.featureRequests.unshift(updated)
    save(store); return updated
  }
  const created: FeatureRequest = { ...fr, id: uuid() }
  store.featureRequests.unshift(created); save(store); return created
}
export function deleteFeatureRequest(id: string): void { const s = load(); s.featureRequests = s.featureRequests.filter(f => f.id !== id); save(s) }

export function getTasks(): Task[] { return load().tasks }
export function saveTask(task: Omit<Task, 'id' | 'createdAt'> & { id?: string }): Task {
  const store = load()
  const now = new Date().toISOString()
  if (task.id) {
    const idx = store.tasks.findIndex(t => t.id === task.id)
    const existing = store.tasks[idx] ?? {} as Task
    const updated: Task = { ...existing, ...task, id: task.id, createdAt: existing.createdAt ?? now }
    if (idx >= 0) store.tasks[idx] = updated; else store.tasks.unshift(updated)
    save(store); return updated
  }
  const created: Task = { ...task, id: uuid(), createdAt: now }
  store.tasks.unshift(created); save(store); return created
}
export function deleteTask(id: string): void { const s = load(); s.tasks = s.tasks.filter(t => t.id !== id); save(s) }

export function getContacts(): Contact[] { return load().contacts }
export function getContactsForFirm(firmId: string): Contact[] { return load().contacts.filter(c => c.firmId === firmId) }
export function saveContact(contact: Omit<Contact, 'id'> & { id?: string }): Contact {
  const store = load()
  if (contact.id) {
    const idx = store.contacts.findIndex(c => c.id === contact.id)
    const existing = store.contacts[idx] ?? {} as Contact
    const updated: Contact = { ...existing, ...contact, id: contact.id }
    if (idx >= 0) store.contacts[idx] = updated; else store.contacts.unshift(updated)
    save(store); return updated
  }
  const created: Contact = { ...contact, id: uuid() }
  store.contacts.unshift(created); save(store); return created
}
export function deleteContact(id: string): void { const s = load(); s.contacts = s.contacts.filter(c => c.id !== id); save(s) }

// ── Aliases & convenience exports used by pages ───────────────────────────────

export type NextStep = Interview['nextSteps'][number]

export function generateId(): string { return uuid() }

export function getFirmById(id: string): OutreachFirm | undefined { return getFirm(id) }
export function getInterviewById(id: string): Interview | undefined { return getInterview(id) }
export function getInterviewsByFirm(firmId: string): Interview[] { return load().interviews.filter(i => i.firmId === firmId) }
export function getContactsByFirm(firmId: string): Contact[] { return getContactsForFirm(firmId) }
export function getFeatureRequestsByFirm(firmId: string): FeatureRequest[] { return load().featureRequests.filter(f => f.firmId === firmId) }
export function getTasksByFirm(firmId: string): Task[] { return load().tasks.filter(t => t.firmId === firmId) }

// Sync stubs — returns local data; can be upgraded to real API calls later
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function syncFirmsFromApi(_firmId?: string): Promise<OutreachFirm[] | null> { return getFirms() }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function syncInterviewsFromApi(_firmId?: string): Promise<Interview[] | null> { return getInterviews() }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function syncFeatureRequestsFromApi(_firmId?: string): Promise<FeatureRequest[] | null> { return getFeatureRequests() }
export async function syncTasksFromApi(): Promise<Task[] | null> { return getTasks() }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function syncContactsFromApi(_firmId?: string): Promise<Contact[] | null> { return getContacts() }
export async function syncAllFromApi(): Promise<{ firms: OutreachFirm[]; interviews: Interview[]; featureRequests: FeatureRequest[]; tasks: Task[] } | null> {
  return { firms: getFirms(), interviews: getInterviews(), featureRequests: getFeatureRequests(), tasks: getTasks() }
}
