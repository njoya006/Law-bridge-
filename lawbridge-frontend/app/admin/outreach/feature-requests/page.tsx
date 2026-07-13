'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getFeatureRequests, saveFeatureRequest, getFirms, generateId, syncFeatureRequestsFromApi, syncFirmsFromApi, FeatureRequest, OutreachFirm } from '../../../../lib/outreachStore'

const STATUS_PIPELINE: FeatureRequest['status'][] = ['under_review', 'approved', 'planned', 'in_development', 'released', 'declined']
const STATUS_LABELS: Record<FeatureRequest['status'], string> = {
  under_review: 'Under Review',
  approved: 'Approved',
  planned: 'Planned',
  in_development: 'In Development',
  released: 'Released',
  declined: 'Declined',
}
const STATUS_COLORS: Record<FeatureRequest['status'], string> = {
  under_review: 'border-neutral-600/40 bg-neutral-600/10 text-neutral-400',
  approved: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
  planned: 'border-sky-500/40 bg-sky-500/10 text-sky-400',
  in_development: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  released: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  declined: 'border-red-500/40 bg-red-500/10 text-red-400',
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}

function AddFRModal({ firms, onClose, onSave }: { firms: OutreachFirm[]; onClose: () => void; onSave: (fr: FeatureRequest) => void }) {
  const [form, setForm] = useState<Partial<FeatureRequest>>({ priority: 'medium', status: 'under_review', source: 'interview', requestedOn: new Date().toISOString().slice(0, 10) })
  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title?.trim()) return
    const firm = firms.find(f => f.id === form.firmId)
    onSave({
      id: generateId(),
      title: form.title!.trim(),
      requestedBy: form.requestedBy,
      firmId: form.firmId,
      firmName: firm?.firmName,
      priority: form.priority ?? 'medium',
      status: form.status ?? 'under_review',
      source: form.source ?? 'interview',
      description: form.description,
      requestedOn: form.requestedOn ?? new Date().toISOString().slice(0, 10),
    })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-primary-800 border border-white/10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-neutral-50">Log Feature Request</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-200"><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="space-y-3">
          <div><label className="label-xs">Feature Title *</label><input required className="field mt-1 w-full" value={form.title ?? ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. OHADA Compliance Dashboard" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Priority</label>
              <select className="field mt-1 w-full" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as FeatureRequest['priority'] }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label-xs">Source</label>
              <select className="field mt-1 w-full" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value as FeatureRequest['source'] }))}>
                <option value="interview">Interview</option>
                <option value="firm">Firm (direct)</option>
                <option value="internal">Internal</option>
                <option value="email">Email</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-xs">Requested By</label>
            <input className="field mt-1 w-full" value={form.requestedBy ?? ''} onChange={e => setForm(p => ({ ...p, requestedBy: e.target.value }))} placeholder="Person or firm name" />
          </div>
          <div>
            <label className="label-xs">Related Firm</label>
            <select className="field mt-1 w-full" value={form.firmId ?? ''} onChange={e => setForm(p => ({ ...p, firmId: e.target.value || undefined }))}>
              <option value="">None</option>
              {firms.map(f => <option key={f.id} value={f.id}>{f.firmName}</option>)}
            </select>
          </div>
          <div>
            <label className="label-xs">Date Requested</label>
            <input type="date" className="field mt-1 w-full" value={form.requestedOn ?? ''} onChange={e => setForm(p => ({ ...p, requestedOn: e.target.value }))} />
          </div>
          <div>
            <label className="label-xs">Description</label>
            <textarea className="field mt-1 w-full resize-none" rows={3} value={form.description ?? ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What exactly was requested and why?" />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
          <button type="submit" className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-semibold text-primary-900 hover:bg-gold-400">Save Request</button>
        </div>
      </form>
    </div>
  )
}

export default function FeatureRequestsPage() {
  const [frs, setFrs] = useState<FeatureRequest[]>([])
  const [firms, setFirms] = useState<OutreachFirm[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<FeatureRequest['status']>('under_review')

  useEffect(() => {
    setFrs(getFeatureRequests()); setFirms(getFirms())
    Promise.all([syncFeatureRequestsFromApi(), syncFirmsFromApi()]).then(([fr, f]) => {
      if (fr) setFrs(fr); if (f) setFirms(f)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return frs.filter(fr => {
      const matchStatus = statusFilter === 'all' || fr.status === statusFilter
      const matchPriority = priorityFilter === 'all' || fr.priority === priorityFilter
      const matchSearch = !q || fr.title.toLowerCase().includes(q) || (fr.requestedBy ?? '').toLowerCase().includes(q) || (fr.firmName ?? '').toLowerCase().includes(q)
      return matchStatus && matchPriority && matchSearch
    })
  }, [frs, search, statusFilter, priorityFilter])

  function handleSave(fr: FeatureRequest) {
    saveFeatureRequest(fr)
    setFrs(getFeatureRequests())
    setShowModal(false)
  }

  function updateStatus(id: string, status: FeatureRequest['status']) {
    const fr = frs.find(f => f.id === id)
    if (!fr) return
    saveFeatureRequest({ ...fr, status })
    setFrs(getFeatureRequests())
    setUpdatingId(null)
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: frs.length }
    frs.forEach(fr => { c[fr.status] = (c[fr.status] ?? 0) + 1 })
    return c
  }, [frs])

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-500 mb-1"><Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link> › Feature Requests</div>
          <h1 className="font-display text-2xl font-bold text-neutral-50">Feature Requests</h1>
          <p className="text-sm text-neutral-500 mt-1">{frs.length} requests tracked from interviews</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-primary-900 hover:bg-gold-400">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Log Request
        </button>
      </div>

      {/* Status pipeline */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ key: 'all', label: `All (${counts.all})` }, ...STATUS_PIPELINE.map(s => ({ key: s, label: `${STATUS_LABELS[s]} (${counts[s] ?? 0})` }))].map(item => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${statusFilter === item.key ? 'bg-gold-500/15 border-gold-500/30 text-gold-300' : 'bg-primary-800/40 border-white/8 text-neutral-400 hover:text-neutral-200'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search features, firms, requesters…" className="w-full rounded-xl border border-white/10 bg-primary-900/60 py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-gold-500/40" />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'high', 'medium', 'low'] as const).map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)} className={`rounded-lg px-3 py-1.5 text-xs font-medium border capitalize transition-all ${priorityFilter === p ? 'bg-gold-500/15 border-gold-500/30 text-gold-300' : 'bg-primary-800/40 border-white/8 text-neutral-400 hover:text-neutral-200'}`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/8 bg-primary-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Feature</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden sm:table-cell">Requested By</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Priority</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-neutral-500 text-sm">No feature requests found</td></tr>
              ) : filtered.map(fr => (
                <tr key={fr.id} className="hover:bg-white/3 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-neutral-200">{fr.title}</p>
                    {fr.description && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{fr.description}</p>}
                    {fr.firmName && <Link href={`/admin/outreach/firms/${fr.firmId}`} className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors">{fr.firmName}</Link>}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400 hidden sm:table-cell">{fr.requestedBy ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex h-2 w-2 rounded-full ${fr.priority === 'high' ? 'bg-red-500' : fr.priority === 'medium' ? 'bg-amber-500' : 'bg-neutral-600'}`} />
                    <span className="ml-1.5 text-xs text-neutral-500 capitalize">{fr.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    {updatingId === fr.id ? (
                      <select
                        autoFocus
                        className="rounded-lg border border-white/10 bg-primary-800 text-xs text-neutral-200 px-2 py-1 outline-none"
                        defaultValue={fr.status}
                        onChange={e => updateStatus(fr.id, e.target.value as FeatureRequest['status'])}
                        onBlur={() => setUpdatingId(null)}
                      >
                        {STATUS_PIPELINE.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => { setUpdatingId(fr.id); setUpdatingStatus(fr.status) }} title="Click to change status">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[fr.status]}`}>{STATUS_LABELS[fr.status]}</span>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500 hidden md:table-cell">{fmtDate(fr.requestedOn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-neutral-600">{filtered.length} of {frs.length} requests shown</p>

      {showModal && <AddFRModal firms={firms} onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}
