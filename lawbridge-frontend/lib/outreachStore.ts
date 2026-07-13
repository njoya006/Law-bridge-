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

const SEED: OutreachStore = {
  firms: [
    {
      id: 'f1',
      firmName: 'KEUSSA Law Firm',
      city: 'Yaoundé',
      country: 'Cameroon',
      address: 'Avenue Kennedy, Plateau, Yaoundé',
      website: 'www.keussa-law.cm',
      phone: '+237 222 234 567',
      email: 'contact@keussa-law.cm',
      practiceAreas: ['Corporate', 'OHADA', 'Commercial'],
      firmSize: '6-25',
      status: 'founding_council_member',
      source: 'referral',
      tags: ['Founding Council', 'Priority'],
      assignedTo: 'Praise Njoya',
      lastContact: '2026-07-10',
      nextFollowup: '2026-07-20',
      notes: 'Very interested. Senior partner Maître Keussa agreed to join the founding council.',
      createdAt: '2026-05-15T10:00:00Z',
      updatedAt: '2026-07-10T14:30:00Z',
    },
    {
      id: 'f2',
      firmName: 'Cabinet Atangana & Associés',
      city: 'Yaoundé',
      country: 'Cameroon',
      address: 'Rue de la Cathédrale, Messa',
      phone: '+237 222 345 678',
      email: 'atangana.cabinet@gmail.com',
      practiceAreas: ['Civil', 'Family', 'Property'],
      firmSize: '1-5',
      status: 'interview_completed',
      source: 'bar_association',
      tags: ['Francophone'],
      assignedTo: 'PR Team',
      lastContact: '2026-07-05',
      nextFollowup: '2026-07-18',
      notes: 'Good interview. Interested in the client referral and case management features.',
      createdAt: '2026-06-01T09:00:00Z',
      updatedAt: '2026-07-05T11:00:00Z',
    },
    {
      id: 'f3',
      firmName: 'Bamenda Legal Group',
      city: 'Bamenda',
      country: 'Cameroon',
      address: 'Commercial Avenue, Bamenda',
      phone: '+237 233 456 789',
      email: 'info@bamendagal.com',
      practiceAreas: ['Common Law', 'Criminal', 'Property'],
      firmSize: '6-25',
      status: 'interested',
      source: 'linkedin',
      tags: ['Anglophone', 'NW Region'],
      assignedTo: 'Praise Njoya',
      lastContact: '2026-07-08',
      nextFollowup: '2026-07-22',
      notes: 'Very interested in Anglophone-specific features. Willing to be a pilot partner.',
      createdAt: '2026-06-10T08:00:00Z',
      updatedAt: '2026-07-08T16:00:00Z',
    },
    {
      id: 'f4',
      firmName: 'Foning Law Chambers',
      city: 'Douala',
      country: 'Cameroon',
      address: 'Rue de la Bourse, Akwa, Douala',
      phone: '+237 233 567 890',
      email: 'chambers@foning-law.cm',
      practiceAreas: ['Maritime', 'Commercial', 'OHADA'],
      firmSize: '6-25',
      status: 'meeting_scheduled',
      source: 'referral',
      tags: ['Maritime', 'Douala'],
      assignedTo: 'PR Team',
      lastContact: '2026-07-11',
      nextFollowup: '2026-07-15',
      notes: 'Meeting scheduled for July 15. Interested in document management and e-filing.',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-07-11T09:00:00Z',
    },
    {
      id: 'f5',
      firmName: 'Ngono & Partners',
      city: 'Douala',
      country: 'Cameroon',
      address: 'Boulevard de la République, Bonanjo',
      phone: '+237 233 678 901',
      email: 'ngono.partners@gmail.com',
      practiceAreas: ['Criminal', 'Administrative', 'Civil'],
      firmSize: '1-5',
      status: 'contacted',
      source: 'cold',
      tags: ['Solo/Small'],
      assignedTo: 'PR Team',
      lastContact: '2026-07-03',
      nextFollowup: '2026-07-17',
      notes: 'Initial contact made by email. Awaiting response.',
      createdAt: '2026-07-01T11:00:00Z',
      updatedAt: '2026-07-03T14:00:00Z',
    },
    {
      id: 'f6',
      firmName: 'Buea Legal Partners',
      city: 'Buea',
      country: 'Cameroon',
      practiceAreas: ['Property', 'Family', 'Common Law'],
      firmSize: '1-5',
      status: 'pilot_partner',
      source: 'referral',
      tags: ['Pilot', 'SW Region', 'Anglophone'],
      assignedTo: 'Praise Njoya',
      lastContact: '2026-07-12',
      notes: 'Enrolled as pilot partner. Currently testing case management and lawyer dashboard.',
      createdAt: '2026-05-01T08:00:00Z',
      updatedAt: '2026-07-12T10:00:00Z',
    },
    {
      id: 'f7',
      firmName: 'Cabinet Mbarga & Fils',
      city: 'Yaoundé',
      country: 'Cameroon',
      address: 'Quartier Bastos, Yaoundé',
      phone: '+237 222 789 012',
      email: 'mbarga@cabinetmbarga.cm',
      practiceAreas: ['Tax', 'Corporate', 'OHADA'],
      firmSize: '1-5',
      status: 'founding_council_member',
      source: 'bar_association',
      tags: ['Founding Council', 'Tax Specialist'],
      assignedTo: 'Praise Njoya',
      lastContact: '2026-07-09',
      notes: 'Full council member. Provides expert input on tax and corporate law features.',
      createdAt: '2026-05-20T09:00:00Z',
      updatedAt: '2026-07-09T15:00:00Z',
    },
    {
      id: 'f8',
      firmName: 'OHADA Legal Consultants',
      city: 'Yaoundé',
      country: 'Cameroon',
      address: 'Centre des Affaires, Yaoundé',
      phone: '+237 222 890 123',
      email: 'info@ohada-legal.cm',
      practiceAreas: ['OHADA', 'Corporate', 'Arbitration'],
      firmSize: '6-25',
      status: 'joined_founding_network',
      source: 'linkedin',
      tags: ['OHADA Specialist', 'Founding Network'],
      assignedTo: 'PR Team',
      lastContact: '2026-07-07',
      nextFollowup: '2026-07-21',
      notes: 'Joined founding network. May upgrade to council member after pilot review.',
      createdAt: '2026-06-05T10:00:00Z',
      updatedAt: '2026-07-07T13:00:00Z',
    },
  ],
  interviews: [
    {
      id: 'i1',
      firmId: 'f1',
      firmName: 'KEUSSA Law Firm',
      contactName: 'Maître Jean Keussa',
      date: '2026-06-28',
      time: '10:00',
      duration: 90,
      type: 'in_person',
      location: 'KEUSSA Law Firm offices, Yaoundé',
      status: 'completed',
      interviewerName: 'Praise Njoya',
      summary: 'Comprehensive discussion about LawBridge features. Maître Keussa was particularly excited about the OHADA compliance module and digital case filing. He expressed strong interest in becoming a founding council member and helping shape the platform.',
      takeaways: [
        'OHADA compliance tracking is a top priority for their corporate clients',
        'Digital document signing would save them significant time',
        'They handle 30+ active cases at any time — scheduling is a major pain point',
        'Interested in client-facing portal so clients can track case progress',
        'Would pay XAF 150,000/month for a full firm subscription',
      ],
      nextSteps: [
        { id: 'ns1', text: 'Send product demo recording by July 5', dueDate: '2026-07-05', status: 'done' },
        { id: 'ns2', text: 'Send founding council agreement by July 15', dueDate: '2026-07-15', status: 'done' },
        { id: 'ns3', text: 'Schedule follow-up call with full team for August', dueDate: '2026-08-05', status: 'pending' },
      ],
      overallInterestLevel: 92,
      notes: 'Very positive meeting. Maître Keussa referred us to Cabinet Mbarga & Fils.',
      createdAt: '2026-06-28T12:00:00Z',
    },
    {
      id: 'i2',
      firmId: 'f2',
      firmName: 'Cabinet Atangana & Associés',
      contactName: 'Maître Sophie Atangana',
      date: '2026-07-05',
      time: '14:00',
      duration: 60,
      type: 'virtual',
      location: 'Google Meet',
      status: 'completed',
      interviewerName: 'PR Team',
      summary: 'Interview focused on family law and civil case management. Maître Atangana highlighted the challenges of tracking client communications across multiple channels.',
      takeaways: [
        'Main challenge: clients contact via WhatsApp, email, phone — no central inbox',
        'Would benefit heavily from client portal with message history',
        'Interested in appointment scheduling module',
        'Concerned about data privacy — asked about where data is hosted',
        'Would prefer bilingual interface (French primary)',
      ],
      nextSteps: [
        { id: 'ns4', text: 'Send data privacy documentation', dueDate: '2026-07-12', status: 'done' },
        { id: 'ns5', text: 'Schedule demo of client portal', dueDate: '2026-07-20', status: 'pending' },
      ],
      overallInterestLevel: 75,
      notes: 'Good fit. Privacy concerns must be addressed clearly in next meeting.',
      createdAt: '2026-07-05T15:30:00Z',
    },
    {
      id: 'i3',
      firmId: 'f3',
      firmName: 'Bamenda Legal Group',
      contactName: 'Mr. Emmanuel Nkwa',
      date: '2026-07-08',
      time: '11:00',
      duration: 75,
      type: 'in_person',
      location: 'Bamenda Legal Group offices, Commercial Avenue',
      status: 'completed',
      interviewerName: 'Praise Njoya',
      summary: 'Meeting with Managing Partner Emmanuel Nkwa and two associates. Discussion centered on the needs of Anglophone firms and Common Law practice management.',
      takeaways: [
        'Common Law precedent tracking is a major gap in current tools',
        'English-language interface is non-negotiable for their team',
        'Would love integration with court hearing schedules',
        'Interested in being a pilot partner for Anglophone region',
        'Practice areas: Property and Criminal are most active',
      ],
      nextSteps: [
        { id: 'ns6', text: 'Share Anglophone feature roadmap', dueDate: '2026-07-15', status: 'done' },
        { id: 'ns7', text: 'Onboard as pilot partner', dueDate: '2026-07-25', status: 'pending' },
      ],
      overallInterestLevel: 85,
      createdAt: '2026-07-08T13:00:00Z',
    },
    {
      id: 'i4',
      firmId: 'f4',
      firmName: 'Foning Law Chambers',
      date: '2026-07-15',
      time: '10:00',
      duration: 60,
      type: 'in_person',
      location: 'Foning Law Chambers, Akwa, Douala',
      status: 'scheduled',
      interviewerName: 'PR Team',
      takeaways: [],
      nextSteps: [],
      createdAt: '2026-07-11T09:00:00Z',
    },
  ],
  featureRequests: [
    {
      id: 'fr1',
      title: 'OHADA Compliance Tracking Dashboard',
      requestedBy: 'Maître Jean Keussa',
      firmId: 'f1',
      firmName: 'KEUSSA Law Firm',
      priority: 'high',
      status: 'approved',
      source: 'interview',
      description: 'A dedicated dashboard showing OHADA compliance deadlines, filing requirements, and alerts for corporate clients. Should include SYSCOHADA accounting period tracking.',
      requestedOn: '2026-06-28',
      interviewId: 'i1',
    },
    {
      id: 'fr2',
      title: 'Client Communication Central Inbox',
      requestedBy: 'Maître Sophie Atangana',
      firmId: 'f2',
      firmName: 'Cabinet Atangana & Associés',
      priority: 'high',
      status: 'in_development',
      source: 'interview',
      description: 'Aggregate all client messages (WhatsApp, email, SMS, phone log) into a single threaded view per client and case. Lawyers should never need to check multiple apps.',
      requestedOn: '2026-07-05',
      interviewId: 'i2',
    },
    {
      id: 'fr3',
      title: 'Common Law Precedent Search & Library',
      requestedBy: 'Emmanuel Nkwa',
      firmId: 'f3',
      firmName: 'Bamenda Legal Group',
      priority: 'high',
      status: 'planned',
      source: 'interview',
      description: 'Searchable database of Anglophone Cameroon court decisions with citation support. Integration with existing Library module to link cases to relevant precedents.',
      requestedOn: '2026-07-08',
      interviewId: 'i3',
    },
    {
      id: 'fr4',
      title: 'Bilingual Document Templates (FR/EN)',
      requestedBy: 'Multiple firms',
      priority: 'medium',
      status: 'approved',
      source: 'interview',
      description: 'A template library with pre-built legal document templates in both French and English, following Cameroonian legal standards. Cover standard contracts, motions, and court filings.',
      requestedOn: '2026-06-15',
    },
    {
      id: 'fr5',
      title: 'Court Hearing Calendar Integration',
      requestedBy: 'Emmanuel Nkwa',
      firmId: 'f3',
      firmName: 'Bamenda Legal Group',
      priority: 'medium',
      status: 'under_review',
      source: 'interview',
      description: 'Sync with Cameroon court schedules to automatically pull hearing dates for active cases. Send reminders 48hr and 1hr before each hearing.',
      requestedOn: '2026-07-08',
      interviewId: 'i3',
    },
    {
      id: 'fr6',
      title: 'Digital Document Signing (e-Signature)',
      requestedBy: 'Maître Jean Keussa',
      firmId: 'f1',
      firmName: 'KEUSSA Law Firm',
      priority: 'medium',
      status: 'planned',
      source: 'interview',
      description: 'Enable lawyers and clients to sign documents digitally within the platform. Must comply with Cameroonian digital signature laws.',
      requestedOn: '2026-06-28',
      interviewId: 'i1',
    },
    {
      id: 'fr7',
      title: 'Mobile App for Lawyers',
      requestedBy: 'Multiple firms',
      priority: 'high',
      status: 'in_development',
      source: 'interview',
      description: 'Native mobile app (iOS + Android) for lawyers to manage cases, communicate with clients, and access documents on the go.',
      requestedOn: '2026-06-01',
    },
    {
      id: 'fr8',
      title: 'Client Self-Service Portal',
      requestedBy: 'Multiple firms',
      priority: 'high',
      status: 'released',
      source: 'interview',
      description: 'Web and mobile portal where clients can track case progress, upload documents, pay fees, and communicate with their lawyer.',
      requestedOn: '2026-05-15',
    },
  ],
  tasks: [
    {
      id: 't1',
      title: 'Follow up with Foning Law Chambers before scheduled meeting',
      assignedTo: 'PR Team',
      firmId: 'f4',
      firmName: 'Foning Law Chambers',
      dueDate: '2026-07-14',
      status: 'pending',
      priority: 'high',
      notes: 'Confirm meeting time and send agenda',
      createdAt: '2026-07-11T09:00:00Z',
    },
    {
      id: 't2',
      title: 'Send founding council agreement to Cabinet Mbarga & Fils',
      assignedTo: 'Praise Njoya',
      firmId: 'f7',
      firmName: 'Cabinet Mbarga & Fils',
      dueDate: '2026-07-16',
      status: 'pending',
      priority: 'high',
      createdAt: '2026-07-09T15:00:00Z',
    },
    {
      id: 't3',
      title: 'Schedule pilot onboarding session with Bamenda Legal Group',
      assignedTo: 'Praise Njoya',
      firmId: 'f3',
      firmName: 'Bamenda Legal Group',
      dueDate: '2026-07-25',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '2026-07-08T13:00:00Z',
    },
    {
      id: 't4',
      title: 'Send privacy documentation to Cabinet Atangana',
      assignedTo: 'PR Team',
      firmId: 'f2',
      firmName: 'Cabinet Atangana & Associés',
      dueDate: '2026-07-12',
      status: 'done',
      priority: 'medium',
      createdAt: '2026-07-05T15:00:00Z',
    },
    {
      id: 't5',
      title: 'Compile feedback report from all completed interviews',
      assignedTo: 'PR Team',
      dueDate: '2026-07-20',
      status: 'pending',
      priority: 'medium',
      notes: 'Summarize feature requests and interest scores for product team',
      createdAt: '2026-07-10T10:00:00Z',
    },
  ],
  contacts: [
    {
      id: 'c1',
      firmId: 'f1',
      firmName: 'KEUSSA Law Firm',
      name: 'Maître Jean Keussa',
      position: 'Senior Partner',
      email: 'j.keussa@keussa-law.cm',
      phone: '+237 677 123 456',
      whatsapp: '+237 677 123 456',
      linkedin: 'linkedin.com/in/jeankeussa',
      isPrimary: true,
    },
    {
      id: 'c2',
      firmId: 'f2',
      firmName: 'Cabinet Atangana & Associés',
      name: 'Maître Sophie Atangana',
      position: 'Managing Partner',
      email: 'satangana@cabinetata.cm',
      phone: '+237 699 234 567',
      whatsapp: '+237 699 234 567',
      isPrimary: true,
    },
    {
      id: 'c3',
      firmId: 'f3',
      firmName: 'Bamenda Legal Group',
      name: 'Mr. Emmanuel Nkwa',
      position: 'Managing Partner',
      email: 'enkwa@bamendagal.com',
      phone: '+237 677 345 678',
      whatsapp: '+237 677 345 678',
      isPrimary: true,
    },
    {
      id: 'c4',
      firmId: 'f7',
      firmName: 'Cabinet Mbarga & Fils',
      name: 'Maître Paul Mbarga',
      position: 'Founding Partner',
      email: 'p.mbarga@cabinetmbarga.cm',
      phone: '+237 699 456 789',
      isPrimary: true,
    },
  ],
}

const STORAGE_KEY = 'lawbridge_outreach'

export function getOutreachStore(): OutreachStore {
  if (typeof window === 'undefined') return structuredClone(SEED)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED))
      return structuredClone(SEED)
    }
    return JSON.parse(raw) as OutreachStore
  } catch {
    return structuredClone(SEED)
  }
}

export function saveOutreachStore(store: OutreachStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function uuid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export function generateId(): string {
  return uuid()
}

export function getFirms(): OutreachFirm[] {
  return getOutreachStore().firms
}

export function getFirmById(id: string): OutreachFirm | undefined {
  return getOutreachStore().firms.find(f => f.id === id)
}

export function saveFirm(firm: OutreachFirm): void {
  const store = getOutreachStore()
  const idx = store.firms.findIndex(f => f.id === firm.id)
  if (idx >= 0) store.firms[idx] = firm
  else store.firms.unshift(firm)
  saveOutreachStore(store)
}

export function deleteFirm(id: string): void {
  const store = getOutreachStore()
  store.firms = store.firms.filter(f => f.id !== id)
  saveOutreachStore(store)
}

export function getInterviews(): Interview[] {
  return getOutreachStore().interviews
}

export function getInterviewsByFirm(firmId: string): Interview[] {
  return getOutreachStore().interviews.filter(i => i.firmId === firmId)
}

export function getInterviewById(id: string): Interview | undefined {
  return getOutreachStore().interviews.find(i => i.id === id)
}

export function saveInterview(interview: Interview): void {
  const store = getOutreachStore()
  const idx = store.interviews.findIndex(i => i.id === interview.id)
  if (idx >= 0) store.interviews[idx] = interview
  else store.interviews.unshift(interview)
  saveOutreachStore(store)
}

export function getFeatureRequests(): FeatureRequest[] {
  return getOutreachStore().featureRequests
}

export function getFeatureRequestsByFirm(firmId: string): FeatureRequest[] {
  return getOutreachStore().featureRequests.filter(f => f.firmId === firmId)
}

export function saveFeatureRequest(fr: FeatureRequest): void {
  const store = getOutreachStore()
  const idx = store.featureRequests.findIndex(f => f.id === fr.id)
  if (idx >= 0) store.featureRequests[idx] = fr
  else store.featureRequests.unshift(fr)
  saveOutreachStore(store)
}

export function getTasks(): Task[] {
  return getOutreachStore().tasks
}

export function getTasksByFirm(firmId: string): Task[] {
  return getOutreachStore().tasks.filter(t => t.firmId === firmId)
}

export function saveTask(task: Task): void {
  const store = getOutreachStore()
  const idx = store.tasks.findIndex(t => t.id === task.id)
  if (idx >= 0) store.tasks[idx] = task
  else store.tasks.unshift(task)
  saveOutreachStore(store)
}

export function getContacts(): Contact[] {
  return getOutreachStore().contacts
}

export function getContactsByFirm(firmId: string): Contact[] {
  return getOutreachStore().contacts.filter(c => c.firmId === firmId)
}

export function saveContact(contact: Contact): void {
  const store = getOutreachStore()
  const idx = store.contacts.findIndex(c => c.id === contact.id)
  if (idx >= 0) store.contacts[idx] = contact
  else store.contacts.unshift(contact)
  saveOutreachStore(store)
}

export function deleteContact(id: string): void {
  const store = getOutreachStore()
  store.contacts = store.contacts.filter(c => c.id !== id)
  saveOutreachStore(store)
}
