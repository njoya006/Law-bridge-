'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getInterviews, getFirms, saveInterview, generateId, syncInterviewsFromApi, syncFirmsFromApi, Interview, OutreachFirm } from '../../../../lib/outreachStore'

function fmtDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}

type StatusFilter = 'all' | Interview['status']

const STATUS_CHIP: Record<Interview['status'], string> = {
  scheduled: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  completed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  cancelled: 'border-red-500/40 bg-red-500/10 text-red-400',
  rescheduled: 'border-blue-500/40 bg-blue-500/10 text-blue-400',
}

function AddInterviewModal({ firms, prefirmId, onClose, onSave }: {
  firms: OutreachFirm[]
  prefirmId?: string
  onClose: () => void
  onSave: (iv: Interview) => void
}) {
  const [form, setForm] = useState({
    firmId: prefirmId ?? '',
    contactName: '',
    date: new Date().toISOString().slice(0, 10),
    time: '10:00',
    type: 'in_person' as Interview['type'],
    location: '',
    interviewerName: '',
    status: 'scheduled' as Interview['status'],
  })

  const selectedFirm = firms.find(f => f.id === form.firmId)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firmId || !selectedFirm) return
    onSave({
      id: generateId(),
      firmId: form.firmId,
      firmName: selectedFirm.firmName,
      contactName: form.contactName || undefined,
      date: form.date,
      time: form.time || undefined,
      type: form.type,
      location: form.location || undefined,
      status: form.status,
      interviewerName: form.interviewerName || undefined,
      takeaways: [],
      nextSteps: [],
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-primary-800 border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-neutral-50">Log Interview</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label-xs">Law Firm *</label>
            <select required className="field mt-1 w-full" value={form.firmId} onChange={e => setForm(p => ({ ...p, firmId: e.target.value }))}>
              <option value="">Select firm…</option>
              {firms.map(f => <option key={f.id} value={f.id}>{f.firmName}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label-xs">Contact Name</label>
            <input className="field mt-1 w-full" value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} placeholder="Maître Jean Keussa" />
          </div>
          <div>
            <label className="label-xs">Date *</label>
            <input required type="date" className="field mt-1 w-full" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>
          <div>
            <label className="label-xs">Time</label>
            <input type="time" className="field mt-1 w-full" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
          </div>
          <div>
            <label className="label-xs">Type</label>
            <select className="field mt-1 w-full" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Interview['type'] }))}>
              <option value="in_person">In Person</option>
              <option value="virtual">Virtual</option>
              <option value="phone">Phone</option>
            </select>
          </div>
          <div>
            <label className="label-xs">Status</label>
            <select className="field mt-1 w-full" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Interview['status'] }))}>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
          <div>
            <label className="label-xs">Location / Link</label>
            <input className="field mt-1 w-full" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Office address or Meet link" />
          </div>
          <div>
            <label className="label-xs">Interviewer</label>
            <input className="field mt-1 w-full" value={form.interviewerName} onChange={e => setForm(p => ({ ...p, interviewerName: e.target.value }))} placeholder="Your name" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
          <button type="submit" className="rounded-xl bg-gold-500 px-5 py-2 text-sm font-semibold text-primary-900 hover:bg-gold-400">Log Interview</button>
        </div>
      </form>
    </div>
  )
}

function InterviewsContent() {
  const sp = useSearchParams()
  const prefirmId = sp?.get('firmId') ?? undefined
  const router = useRouter()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [firms, setFirms] = useState<OutreachFirm[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setInterviews(getInterviews())
    setFirms(getFirms())
    if (prefirmId) setShowModal(true)
    Promise.all([syncInterviewsFromApi(), syncFirmsFromApi()]).then(([iv, f]) => {
      if (iv) setInterviews(iv)
      if (f) setFirms(f)
    })
  }, [prefirmId])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return interviews.filter(iv => {
      const matchStatus = statusFilter === 'all' || iv.status === statusFilter
      const matchSearch = !q || iv.firmName.toLowerCase().includes(q) || (iv.contactName ?? '').toLowerCase().includes(q)
      return matchStatus && matchSearch
    }).sort((a, b) => b.date.localeCompare(a.date))
  }, [interviews, search, statusFilter])

  function handleSave(iv: Interview) {
    saveInterview(iv)
    setInterviews(getInterviews())
    setShowModal(false)
  }

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: interviews.length }
    interviews.forEach(i => { c[i.status] = (c[i.status] ?? 0) + 1 })
    return c
  }, [interviews])

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-500 mb-1">
            <Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link> › Interviews
          </div>
          <h1 className="font-display text-2xl font-bold text-neutral-50">Interviews</h1>
          <p className="text-sm text-neutral-500 mt-1">{interviews.length} interviews logged</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-primary-900 hover:bg-gold-400 transition-colors">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Log Interview
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by firm or contact…" className="w-full rounded-xl border border-white/10 bg-primary-900/60 py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-gold-500/40" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'scheduled', 'completed', 'rescheduled', 'cancelled'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all capitalize ${statusFilter === s ? 'bg-gold-500/15 border-gold-500/30 text-gold-300' : 'bg-primary-800/40 border-white/8 text-neutral-400 hover:text-neutral-200'}`}>
              {s === 'all' ? `All (${statusCounts.all ?? 0})` : `${s} (${statusCounts[s] ?? 0})`}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/8 bg-primary-900/40">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Firm</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Contact</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Date</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden sm:table-cell">Type</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden md:table-cell">Interest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-16 text-center text-neutral-500 text-sm">No interviews found</td></tr>
            ) : filtered.map(iv => (
              <tr
                key={iv.id}
                className="hover:bg-white/3 transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/outreach/interviews/${iv.id}`)}
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-neutral-100 group-hover:text-gold-400">{iv.firmName}</span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-400">{iv.contactName ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-neutral-400">{fmtDate(iv.date)}</td>
                <td className="px-4 py-3 text-sm text-neutral-400 capitalize hidden sm:table-cell">{iv.type.replace('_', ' ')}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${STATUS_CHIP[iv.status]}`}>{iv.status}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {iv.overallInterestLevel != null
                    ? <span className="text-sm font-semibold text-emerald-400">{iv.overallInterestLevel}%</span>
                    : <span className="text-neutral-600 text-sm">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-600">{filtered.length} of {interviews.length} interviews shown</p>

      {showModal && (
        <AddInterviewModal
          firms={firms}
          prefirmId={prefirmId}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

export default function InterviewsPage() {
  return (
    <Suspense fallback={null}>
      <InterviewsContent />
    </Suspense>
  )
}
