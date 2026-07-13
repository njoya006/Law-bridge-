'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  getFirms, saveFirm, deleteFirm, generateId,
  OutreachFirm, RelationshipStatus, STATUS_LABELS, STATUS_COLORS,
} from '../../../../lib/outreachStore'

const PRACTICE_AREAS = ['Corporate', 'OHADA', 'Criminal', 'Civil', 'Family', 'Property', 'Commercial', 'Maritime', 'Administrative', 'Tax', 'Common Law', 'Arbitration', 'Labour']
const STATUSES: RelationshipStatus[] = ['not_contacted', 'contacted', 'meeting_requested', 'meeting_scheduled', 'interview_completed', 'interested', 'follow_up_needed', 'joined_founding_network', 'founding_council_member', 'pilot_partner', 'active_partner']
const SIZES = ['1-5', '6-25', '26-100', '100+']
const SOURCES = ['referral', 'linkedin', 'bar_association', 'cold', 'event', 'website']

function StatusBadge({ status }: { status: RelationshipStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

type ModalProps = {
  onClose: () => void
  onSave: (firm: OutreachFirm) => void
  initial?: OutreachFirm
}

function FirmModal({ onClose, onSave, initial }: ModalProps) {
  const [form, setForm] = useState<Partial<OutreachFirm>>(initial ?? {
    country: 'Cameroon', status: 'not_contacted', practiceAreas: [], tags: [],
  })
  const [pa, setPa] = useState<string[]>(initial?.practiceAreas ?? [])
  const [tagInput, setTagInput] = useState((initial?.tags ?? []).join(', '))

  function set(k: keyof OutreachFirm, v: unknown) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firmName?.trim() || !form.city?.trim()) return
    const now = new Date().toISOString()
    onSave({
      id: initial?.id ?? generateId(),
      firmName: form.firmName.trim(),
      city: form.city.trim(),
      country: form.country ?? 'Cameroon',
      address: form.address,
      website: form.website,
      phone: form.phone,
      email: form.email,
      practiceAreas: pa,
      firmSize: form.firmSize,
      status: form.status ?? 'not_contacted',
      source: form.source,
      tags: tagInput.split(',').map(t => t.trim()).filter(Boolean),
      assignedTo: form.assignedTo,
      lastContact: form.lastContact,
      nextFollowup: form.nextFollowup,
      notes: form.notes,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    })
  }

  function togglePa(area: string) {
    setPa(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-primary-800 border border-white/10 p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-neutral-50">{initial ? 'Edit Firm' : 'Add Law Firm'}</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label-xs">Firm Name *</label>
            <input required className="field mt-1" value={form.firmName ?? ''} onChange={e => set('firmName', e.target.value)} placeholder="e.g. Cabinet Atangana & Associés" />
          </div>
          <div>
            <label className="label-xs">City *</label>
            <input required className="field mt-1" value={form.city ?? ''} onChange={e => set('city', e.target.value)} placeholder="Yaoundé" />
          </div>
          <div>
            <label className="label-xs">Country</label>
            <input className="field mt-1" value={form.country ?? ''} onChange={e => set('country', e.target.value)} placeholder="Cameroon" />
          </div>
          <div>
            <label className="label-xs">Phone</label>
            <input className="field mt-1" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+237 6XX XXX XXX" />
          </div>
          <div>
            <label className="label-xs">Email</label>
            <input type="email" className="field mt-1" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="contact@firm.cm" />
          </div>
          <div>
            <label className="label-xs">Website</label>
            <input className="field mt-1" value={form.website ?? ''} onChange={e => set('website', e.target.value)} placeholder="www.firm.cm" />
          </div>
          <div>
            <label className="label-xs">Address</label>
            <input className="field mt-1" value={form.address ?? ''} onChange={e => set('address', e.target.value)} placeholder="Street, Neighbourhood" />
          </div>
          <div>
            <label className="label-xs">Firm Size</label>
            <select className="field mt-1" value={form.firmSize ?? ''} onChange={e => set('firmSize', e.target.value)}>
              <option value="">Select…</option>
              {SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label-xs">Relationship Status</label>
            <select className="field mt-1" value={form.status ?? 'not_contacted'} onChange={e => set('status', e.target.value as RelationshipStatus)}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="label-xs">Source</label>
            <select className="field mt-1" value={form.source ?? ''} onChange={e => set('source', e.target.value)}>
              <option value="">Select…</option>
              {SOURCES.map(s => <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label-xs">Assigned To</label>
            <input className="field mt-1" value={form.assignedTo ?? ''} onChange={e => set('assignedTo', e.target.value)} placeholder="Team member name" />
          </div>
          <div>
            <label className="label-xs">Last Contact</label>
            <input type="date" className="field mt-1" value={form.lastContact ?? ''} onChange={e => set('lastContact', e.target.value)} />
          </div>
          <div>
            <label className="label-xs">Next Follow-up</label>
            <input type="date" className="field mt-1" value={form.nextFollowup ?? ''} onChange={e => set('nextFollowup', e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <label className="label-xs mb-2 block">Practice Areas</label>
            <div className="flex flex-wrap gap-1.5">
              {PRACTICE_AREAS.map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => togglePa(area)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium border transition-colors ${
                    pa.includes(area)
                      ? 'bg-gold-500/15 border-gold-500/30 text-gold-300'
                      : 'bg-primary-900/40 border-white/8 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="label-xs">Tags (comma-separated)</label>
            <input className="field mt-1" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Priority, Anglophone, Maritime…" />
          </div>

          <div className="sm:col-span-2">
            <label className="label-xs">Notes</label>
            <textarea className="field mt-1 resize-none" rows={3} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Internal notes about this firm…" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
          <button type="submit" className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-semibold text-primary-900 hover:bg-gold-400">
            {initial ? 'Save Changes' : 'Add Firm'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function FirmsPage() {
  const [firms, setFirms] = useState<OutreachFirm[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<OutreachFirm | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => { setFirms(getFirms()) }, [])

  const cities = useMemo(() => ['all', ...Array.from(new Set(firms.map(f => f.city))).sort()], [firms])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return firms.filter(f => {
      const matchStatus = statusFilter === 'all' || f.status === statusFilter
      const matchCity = cityFilter === 'all' || f.city === cityFilter
      const matchSearch = !q || f.firmName.toLowerCase().includes(q) || f.city.toLowerCase().includes(q) || f.practiceAreas.some(pa => pa.toLowerCase().includes(q))
      return matchStatus && matchCity && matchSearch
    })
  }, [firms, search, statusFilter, cityFilter])

  function handleSave(firm: OutreachFirm) {
    saveFirm(firm)
    setFirms(getFirms())
    setShowModal(false)
    setEditing(undefined)
  }

  function handleDelete(id: string) {
    deleteFirm(id)
    setFirms(getFirms())
    setDeleteId(null)
  }

  const quickStatuses: (RelationshipStatus | 'all')[] = ['all', 'not_contacted', 'contacted', 'meeting_scheduled', 'interview_completed', 'interested', 'founding_council_member', 'pilot_partner']

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-500 mb-1">
            <Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link> › Firms
          </div>
          <h1 className="font-display text-2xl font-bold text-neutral-50">Law Firms CRM</h1>
          <p className="text-sm text-neutral-500 mt-1">{firms.length} firms in pipeline</p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setShowModal(true) }}
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-primary-900 hover:bg-gold-400 transition-colors"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Firm
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search firms, cities, practice areas…"
              className="w-full rounded-xl border border-white/10 bg-primary-900/60 py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-gold-500/40 transition-all"
            />
          </div>
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-primary-900/60 py-2 px-3 text-sm text-neutral-200 outline-none focus:border-gold-500/40"
          >
            {cities.map(c => <option key={c} value={c}>{c === 'all' ? 'All Cities' : c}</option>)}
          </select>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {quickStatuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                statusFilter === s
                  ? 'bg-gold-500/15 border-gold-500/30 text-gold-300'
                  : 'bg-primary-800/40 border-white/8 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {s === 'all' ? `All (${firms.length})` : STATUS_LABELS[s as RelationshipStatus]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/8 bg-primary-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Firm</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">City</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden md:table-cell">Practice Areas</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden lg:table-cell">Assigned</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden lg:table-cell">Last Contact</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-neutral-500 text-sm">No firms found</td></tr>
              ) : filtered.map(f => (
                <tr key={f.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/outreach/firms/${f.id}`} className="text-sm font-semibold text-neutral-100 hover:text-gold-400 transition-colors">
                      {f.firmName}
                    </Link>
                    {f.tags.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {f.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-500">{t}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400">{f.city}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {f.practiceAreas.slice(0, 3).map(pa => (
                        <span key={pa} className="text-[10px] px-1.5 py-0.5 rounded bg-primary-900/60 border border-white/8 text-neutral-400">{pa}</span>
                      ))}
                      {f.practiceAreas.length > 3 && <span className="text-[10px] text-neutral-600">+{f.practiceAreas.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 text-sm text-neutral-500 hidden lg:table-cell">{f.assignedTo ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500 hidden lg:table-cell">{fmtDate(f.lastContact)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Link href={`/admin/outreach/firms/${f.id}`} className="rounded-lg p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-colors" title="View">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </Link>
                      <button onClick={() => { setEditing(f); setShowModal(true) }} className="rounded-lg p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-colors" title="Edit">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => setDeleteId(f.id)} className="rounded-lg p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-neutral-600">{filtered.length} of {firms.length} firms shown</p>

      {(showModal || editing) && (
        <FirmModal
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(undefined) }}
          onSave={handleSave}
        />
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
          <div className="rounded-2xl bg-primary-800 border border-white/10 p-6 space-y-4 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-neutral-50">Delete firm?</h3>
            <p className="text-sm text-neutral-400">This will permanently remove the firm and all associated data from your local records.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
