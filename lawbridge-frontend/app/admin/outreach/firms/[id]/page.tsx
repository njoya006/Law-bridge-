'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  getFirmById, saveFirm, getInterviewsByFirm, getFeatureRequestsByFirm,
  getTasksByFirm, getContactsByFirm, saveContact, deleteContact,
  saveFeatureRequest, saveTask, generateId,
  OutreachFirm, Interview, FeatureRequest, Task, Contact,
  RelationshipStatus, STATUS_LABELS, STATUS_COLORS,
} from '../../../../../lib/outreachStore'

const STATUSES: RelationshipStatus[] = [
  'not_contacted', 'contacted', 'meeting_requested', 'meeting_scheduled',
  'interview_completed', 'interested', 'follow_up_needed',
  'joined_founding_network', 'founding_council_member', 'pilot_partner', 'active_partner',
]

function fmtDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}

function StatusBadge({ status }: { status: RelationshipStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
}

function PriorityDot({ p }: { p: FeatureRequest['priority'] }) {
  const c = p === 'high' ? 'bg-red-500' : p === 'medium' ? 'bg-amber-500' : 'bg-neutral-600'
  return <span className={`inline-block h-2 w-2 rounded-full ${c}`} />
}

type Tab = 'overview' | 'interviews' | 'notes' | 'contacts' | 'features' | 'tasks'

export default function FirmDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [firm, setFirm] = useState<OutreachFirm | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [features, setFeatures] = useState<FeatureRequest[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [editingStatus, setEditingStatus] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesVal, setNotesVal] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState<Partial<Contact>>({})

  useEffect(() => {
    const f = getFirmById(id)
    if (!f) { router.replace('/admin/outreach/firms'); return }
    setFirm(f)
    setNotesVal(f.notes ?? '')
    setInterviews(getInterviewsByFirm(id))
    setFeatures(getFeatureRequestsByFirm(id))
    setTasks(getTasksByFirm(id))
    setContacts(getContactsByFirm(id))
  }, [id, router])

  function refresh() {
    const f = getFirmById(id)
    if (f) { setFirm(f); setNotesVal(f.notes ?? '') }
    setInterviews(getInterviewsByFirm(id))
    setFeatures(getFeatureRequestsByFirm(id))
    setTasks(getTasksByFirm(id))
    setContacts(getContactsByFirm(id))
  }

  function updateStatus(status: RelationshipStatus) {
    if (!firm) return
    const updated = { ...firm, status, updatedAt: new Date().toISOString() }
    saveFirm(updated)
    setFirm(updated)
    setEditingStatus(false)
  }

  function saveNotes() {
    if (!firm) return
    const updated = { ...firm, notes: notesVal, updatedAt: new Date().toISOString() }
    saveFirm(updated)
    setFirm(updated)
    setEditingNotes(false)
  }

  function addContact() {
    if (!firm || !newContact.name?.trim()) return
    const contact: Contact = {
      id: generateId(),
      firmId: firm.id,
      firmName: firm.firmName,
      name: newContact.name!.trim(),
      position: newContact.position ?? '',
      email: newContact.email,
      phone: newContact.phone,
      whatsapp: newContact.whatsapp,
      linkedin: newContact.linkedin,
      isPrimary: contacts.length === 0,
    }
    saveContact(contact)
    setShowAddContact(false)
    setNewContact({})
    refresh()
  }

  function removeContact(cid: string) {
    deleteContact(cid)
    refresh()
  }

  if (!firm) return null

  const primaryContact = contacts.find(c => c.isPrimary) ?? contacts[0]
  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'interviews', label: 'Interviews', count: interviews.length },
    { key: 'notes', label: 'Notes & Docs' },
    { key: 'contacts', label: 'Contacts', count: contacts.length },
    { key: 'features', label: 'Feature Requests', count: features.length },
    { key: 'tasks', label: 'Tasks', count: tasks.filter(t => t.status !== 'done').length },
  ]

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Breadcrumb */}
      <div className="text-xs text-neutral-500">
        <Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link>
        {' › '}
        <Link href="/admin/outreach/firms" className="hover:text-neutral-300">Firms</Link>
        {' › '}
        <span className="text-neutral-300">{firm.firmName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-50">{firm.firmName}</h1>
          <p className="text-sm text-neutral-500 mt-1">{firm.city}, {firm.country} · {firm.firmSize ? `${firm.firmSize} lawyers` : 'Size unknown'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {editingStatus ? (
            <select
              autoFocus
              className="rounded-xl border border-white/10 bg-primary-800 text-sm text-neutral-200 px-3 py-1.5 outline-none"
              defaultValue={firm.status}
              onChange={e => updateStatus(e.target.value as RelationshipStatus)}
              onBlur={() => setEditingStatus(false)}
            >
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          ) : (
            <button onClick={() => setEditingStatus(true)} title="Change status">
              <StatusBadge status={firm.status} />
            </button>
          )}
          <Link href={`/admin/outreach/interviews?firmId=${firm.id}`} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5 transition-colors">
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Log Interview
          </Link>
        </div>
      </div>

      {/* Tags */}
      {firm.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {firm.tags.map(t => (
            <span key={t} className="rounded-full bg-white/5 border border-white/8 px-3 py-0.5 text-xs text-neutral-400">{t}</span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-white/8 overflow-x-auto -mx-1 px-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-200'
            }`}
          >
            {t.label}
            {t.count != null && t.count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab === t.key ? 'bg-gold-500/20 text-gold-400' : 'bg-white/8 text-neutral-500'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Firm info */}
          <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-primary-800/30 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-neutral-200">Firm Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Phone', firm.phone],
                ['Email', firm.email],
                ['Website', firm.website],
                ['Address', firm.address],
                ['Firm Size', firm.firmSize ? `${firm.firmSize} lawyers` : undefined],
                ['Source', firm.source?.replace('_', ' ')],
                ['Assigned To', firm.assignedTo],
                ['Last Contact', fmtDate(firm.lastContact)],
                ['Next Follow-up', fmtDate(firm.nextFollowup)],
              ].map(([k, v]) => v ? (
                <div key={k as string}>
                  <p className="text-neutral-500 text-xs uppercase tracking-wider mb-0.5">{k}</p>
                  <p className="text-neutral-200">{v}</p>
                </div>
              ) : null)}
            </div>
            {firm.practiceAreas.length > 0 && (
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wider mb-2">Practice Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {firm.practiceAreas.map(pa => (
                    <span key={pa} className="rounded-lg bg-primary-900/60 border border-white/8 px-2.5 py-1 text-xs text-neutral-300">{pa}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side column */}
          <div className="space-y-4">
            {/* Primary contact card */}
            {primaryContact ? (
              <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-4">
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Primary Contact</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold-400/20 to-gold-500/20 text-sm font-bold text-gold-400">
                    {primaryContact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-neutral-100">{primaryContact.name}</p>
                    <p className="text-xs text-neutral-500">{primaryContact.position}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-neutral-400">
                  {primaryContact.phone && <p>📞 {primaryContact.phone}</p>}
                  {primaryContact.email && <p>✉ {primaryContact.email}</p>}
                  {primaryContact.whatsapp && (
                    <a href={`https://wa.me/${primaryContact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300">
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-4">
                <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Primary Contact</p>
                <button onClick={() => { setTab('contacts'); setShowAddContact(true) }} className="text-xs text-gold-400 hover:text-gold-300">+ Add contact →</button>
              </div>
            )}

            {/* Quick stats */}
            <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-neutral-500">Activity</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Interviews', interviews.length],
                  ['Completed', interviews.filter(i => i.status === 'completed').length],
                  ['Features', features.length],
                  ['Open Tasks', tasks.filter(t => t.status !== 'done').length],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-primary-900/40 rounded-xl p-2.5 text-center">
                    <p className="font-bold text-lg text-neutral-100">{v}</p>
                    <p className="text-[10px] text-neutral-500">{k}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'interviews' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-neutral-400">{interviews.length} interview{interviews.length !== 1 ? 's' : ''}</p>
            <Link href={`/admin/outreach/interviews?firmId=${firm.id}`} className="text-xs text-gold-400 hover:text-gold-300">+ Log Interview</Link>
          </div>
          {interviews.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-primary-800/20 py-12 text-center text-neutral-500 text-sm">No interviews yet</div>
          ) : interviews.map(iv => (
            <Link key={iv.id} href={`/admin/outreach/interviews/${iv.id}`} className="block rounded-2xl border border-white/8 bg-primary-800/30 p-4 hover:bg-primary-800/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${iv.status === 'completed' ? 'bg-emerald-500' : iv.status === 'scheduled' ? 'bg-amber-500' : 'bg-neutral-600'}`} />
                    <span className="text-sm font-semibold text-neutral-100 capitalize">{iv.status} · {iv.type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-neutral-500">{fmtDate(iv.date)}{iv.time ? ` at ${iv.time}` : ''}{iv.interviewerName ? ` · with ${iv.interviewerName}` : ''}</p>
                  {iv.summary && <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{iv.summary}</p>}
                </div>
                {iv.overallInterestLevel != null && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-emerald-400">{iv.overallInterestLevel}%</p>
                    <p className="text-[10px] text-neutral-500">interest</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {tab === 'notes' && (
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200">Internal Notes</h3>
            {!editingNotes && (
              <button onClick={() => setEditingNotes(true)} className="text-xs text-gold-400 hover:text-gold-300">Edit</button>
            )}
          </div>
          {editingNotes ? (
            <div className="space-y-3">
              <textarea
                className="field w-full resize-none"
                rows={8}
                value={notesVal}
                onChange={e => setNotesVal(e.target.value)}
                placeholder="Add internal notes about this firm…"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingNotes(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
                <button onClick={saveNotes} className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-primary-900 hover:bg-gold-400">Save</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed">
              {firm.notes ?? <span className="text-neutral-600 italic">No notes yet. Click Edit to add.</span>}
            </p>
          )}
        </div>
      )}

      {tab === 'contacts' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-neutral-400">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setShowAddContact(true)} className="text-xs text-gold-400 hover:text-gold-300">+ Add Contact</button>
          </div>
          {contacts.length === 0 && !showAddContact && (
            <div className="rounded-2xl border border-white/8 bg-primary-800/20 py-12 text-center text-neutral-500 text-sm">No contacts yet</div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map(c => (
              <div key={c.id} className="rounded-2xl border border-white/8 bg-primary-800/30 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-800 text-xs font-bold text-neutral-300 ring-1 ring-white/10">
                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-100">{c.name}</p>
                      <p className="text-xs text-neutral-500">{c.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {c.isPrimary && <span className="text-[10px] rounded-full bg-gold-500/15 text-gold-400 px-2 py-0.5">Primary</span>}
                    <button onClick={() => removeContact(c.id)} className="text-neutral-600 hover:text-red-400 p-1">
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-neutral-400">
                  {c.phone && <p>📞 {c.phone}</p>}
                  {c.email && <p>✉ {c.email}</p>}
                  {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="block text-emerald-400 hover:text-emerald-300">💬 WhatsApp</a>}
                  {c.linkedin && <p>🔗 {c.linkedin}</p>}
                </div>
              </div>
            ))}
          </div>

          {showAddContact && (
            <div className="rounded-2xl border border-gold-500/30 bg-primary-800/30 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-neutral-200">New Contact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className="label-xs">Name *</label><input className="field mt-1 w-full" value={newContact.name ?? ''} onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label className="label-xs">Position</label><input className="field mt-1 w-full" value={newContact.position ?? ''} onChange={e => setNewContact(p => ({ ...p, position: e.target.value }))} /></div>
                <div><label className="label-xs">Phone</label><input className="field mt-1 w-full" value={newContact.phone ?? ''} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} /></div>
                <div><label className="label-xs">Email</label><input type="email" className="field mt-1 w-full" value={newContact.email ?? ''} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} /></div>
                <div><label className="label-xs">WhatsApp</label><input className="field mt-1 w-full" value={newContact.whatsapp ?? ''} onChange={e => setNewContact(p => ({ ...p, whatsapp: e.target.value }))} /></div>
                <div><label className="label-xs">LinkedIn</label><input className="field mt-1 w-full" value={newContact.linkedin ?? ''} onChange={e => setNewContact(p => ({ ...p, linkedin: e.target.value }))} /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddContact(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
                <button onClick={addContact} className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-primary-900 hover:bg-gold-400">Add Contact</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'features' && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-400">{features.length} feature request{features.length !== 1 ? 's' : ''}</p>
          {features.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-primary-800/20 py-12 text-center text-neutral-500 text-sm">No feature requests from this firm yet</div>
          ) : (
            <div className="rounded-2xl border border-white/8 overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-white/8 bg-primary-900/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Feature</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Priority</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Requested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {features.map(fr => (
                    <tr key={fr.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3 text-sm text-neutral-200">{fr.title}</td>
                      <td className="px-4 py-3"><PriorityDot p={fr.priority} /></td>
                      <td className="px-4 py-3 text-xs text-neutral-400 capitalize">{fr.status.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-xs text-neutral-500">{fmtDate(fr.requestedOn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'tasks' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-neutral-400">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
          </div>
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-primary-800/20 py-12 text-center text-neutral-500 text-sm">No tasks for this firm</div>
          ) : tasks.map(t => (
            <div key={t.id} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-primary-800/30 p-4">
              <button
                onClick={() => {
                  const next = t.status === 'done' ? 'pending' : 'done'
                  saveTask({ ...t, status: next })
                  setTasks(getTasksByFirm(id))
                }}
                className={`mt-0.5 h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center ${t.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-white/40'}`}
              >
                {t.status === 'done' && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
              <div className={t.status === 'done' ? 'opacity-50' : ''}>
                <p className="text-sm text-neutral-200">{t.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{t.assignedTo ?? '—'}{t.dueDate ? ` · Due ${fmtDate(t.dueDate)}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
