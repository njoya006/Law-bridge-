type Lawyer = {
  id: string
  name: string
  firmId?: string | null
  email?: string
  role?: string
}

type Matter = {
  id: string
  title: string
  assignedTo?: string | null
  firmId?: string | null
}

export const lawyers: Lawyer[] = [
  { id: 'lawyer-1', name: 'Amina Mballa', firmId: 'firm-1', email: 'amina@lawbridge.test', role: 'Partner' },
  { id: 'lawyer-2', name: 'Desmond K.', firmId: 'firm-1', email: 'desmond@lawbridge.test', role: 'Associate' },
  { id: 'lawyer-3', name: 'Nora Solo', firmId: null, email: 'nora@solo.test', role: 'Independent' },
]

export const matters: Matter[] = [
  { id: 'matter-101', title: 'Commercial Contract Review', assignedTo: 'lawyer-1', firmId: 'firm-1' },
  { id: 'matter-102', title: 'Employment Dispute', assignedTo: 'lawyer-2', firmId: 'firm-1' },
  { id: 'matter-103', title: 'Property Transaction', assignedTo: null, firmId: 'firm-1' },
  { id: 'matter-201', title: 'Independent: Trademark Review', assignedTo: 'lawyer-3', firmId: null },
]

export function getLawyers() {
  return lawyers
}

export function getMatters() {
  return matters
}

export function getMattersForLawyer(lawyerId?: string | null) {
  if (!lawyerId) return []
  return matters.filter(m => m.assignedTo === lawyerId)
}

export function assignMatter(matterId: string, lawyerId: string | null) {
  const m = matters.find(x => x.id === matterId)
  if (m) m.assignedTo = lawyerId
  return m
}

export function getLawyerById(id: string) {
  return lawyers.find(l => l.id === id) || null
}

export function getLawyersByFirm(firmId?: string | null) {
  if (!firmId) return lawyers.filter(l => !l.firmId)
  return lawyers.filter(l => l.firmId === firmId)
}

export function updateLawyerRole(id: string, role: string) {
  const l = lawyers.find(x => x.id === id)
  if (l) l.role = role
  return l
}

export function addLawyer(l: { id: string; name: string; email?: string; firmId?: string | null; role?: string }) {
  const exists = lawyers.find(x => x.email === l.email || x.id === l.id)
  if (exists) return exists
  const nw = { id: l.id, name: l.name, email: l.email, firmId: l.firmId ?? null, role: l.role ?? 'Associate' }
  lawyers.push(nw)
  return nw
}

export function assignLawyerToFirm(id: string, firmId: string | null) {
  const l = lawyers.find(x => x.id === id)
  if (l) l.firmId = firmId
  return l
}

export function removeLawyer(id: string) {
  const idx = lawyers.findIndex(x => x.id === id)
  if (idx === -1) return false
  lawyers.splice(idx, 1)
  // also remove assignment from matters
  for (const m of matters) {
    if (m.assignedTo === id) m.assignedTo = null
  }
  return true
}
