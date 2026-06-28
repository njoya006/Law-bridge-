'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  getCaseDetail, updateCaseStatus, addCaseNote,
  STATUS_LABELS, STATUS_ORDER, TERMINAL_STATUSES,
  type CaseItem,
} from '../../../lib/casesApi'

// ── helpers ────────────────────────────────────────────────────────────────────

const LAWYER_ROLES = new Set(['lawyer', 'firm_admin', 'firm-admin', 'partner', 'associate', 'managing_partner', 'secretary'])

function getRole(): string {
  if (typeof window === 'undefined') return 'client'
  try {
    const access = localStorage.getItem('access') ?? ''
    return JSON.parse(atob(access.split('.')[1])).role ?? 'client'
  } catch { return 'client' }
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Status badge ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft:               'bg-neutral-700/40 text-neutral-300 border-neutral-600/30',
  filed:               'bg-blue-500/15 text-blue-300 border-blue-400/25',
  assigned:            'bg-indigo-500/15 text-indigo-300 border-indigo-400/25',
  under_review:        'bg-purple-500/15 text-purple-300 border-purple-400/25',
  evidence_collection: 'bg-violet-500/15 text-violet-300 border-violet-400/25',
  awaiting_court_date: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
  in_progress:         'bg-gold-500/15 text-gold-300 border-gold-400/25',
  hearing_scheduled:   'bg-orange-500/15 text-orange-300 border-orange-400/25',
  hearing_adjourned:   'bg-yellow-500/15 text-yellow-300 border-yellow-400/25',
  mediation:           'bg-teal-500/15 text-teal-300 border-teal-400/25',
  verdict:             'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  settled:             'bg-emerald-500/15 text-emerald-300 border-emerald-400/25',
  appeal_filed:        'bg-red-500/15 text-red-300 border-red-400/25',
  appeal_in_progress:  'bg-crimson-500/15 text-crimson-300 border-crimson-400/25',
  closed:              'bg-neutral-600/30 text-neutral-400 border-neutral-500/30',
  dismissed:           'bg-neutral-600/30 text-neutral-400 border-neutral-500/30',
  archived:            'bg-neutral-700/30 text-neutral-500 border-neutral-600/20',
}

function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'lg' }) {
  const cls = STATUS_COLORS[status] ?? 'bg-neutral-700/40 text-neutral-300 border-neutral-600/30'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-medium
      ${size === 'lg' ? 'text-sm px-4 py-1' : 'text-xs'} ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ── Timeline entry ─────────────────────────────────────────────────────────────

function TimelineEntry({
  entry, index, total,
}: {
  entry: CaseItem['timeline'][number]
  index: number
  total: number
}) {
  const isLast = index === total - 1
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border text-xs font-bold
          ${isLast ? 'border-gold-400/60 bg-gold-500/15 text-gold-300' : 'border-neutral-600/40 bg-primary-800/60 text-neutral-400'}`}>
          {total - index}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-neutral-700/40" />}
      </div>
      <div className={`pb-6 flex-1 ${isLast ? '' : ''}`}>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <StatusBadge status={entry.status} />
          <span className="text-xs text-neutral-500">{fmt(entry.timestamp)}</span>
        </div>
        {entry.notes && (
          <p className="text-sm text-neutral-300 mt-1 leading-relaxed">{entry.notes}</p>
        )}
        {entry.updated_by && (
          <p className="text-xs text-neutral-600 mt-1">Updated by {entry.updated_by.slice(0, 8)}…</p>
        )}
      </div>
    </div>
  )
}

// ── Status update panel (lawyers only) ────────────────────────────────────────

function StatusUpdatePanel({ caseItem, onUpdated }: { caseItem: CaseItem; onUpdated: (updated: CaseItem) => void }) {
  const [newStatus, setNewStatus] = useState(caseItem.status)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isTerminal = TERMINAL_STATUSES.has(caseItem.status)
  const unchanged = newStatus === caseItem.status

  const handleSave = async () => {
    if (unchanged) return
    const access = localStorage.getItem('access')
    if (!access) return
    setSaving(true); setError(''); setSuccess(false)
    try {
      const updated = await updateCaseStatus(caseItem.id, newStatus, note, access)
      setNote('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gold-400/20 bg-gold-500/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
        <p className="font-heading text-sm font-semibold text-gold-300">Update Case Status</p>
      </div>

      {isTerminal && (
        <p className="text-xs text-neutral-500 italic">
          This case is in a terminal state ({STATUS_LABELS[caseItem.status]}). You can still update it if needed.
        </p>
      )}

      <div>
        <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-1.5">
          New Status
        </label>
        <select
          value={newStatus}
          onChange={e => setNewStatus(e.target.value)}
          className="w-full rounded-lg px-3 py-2.5 bg-primary-800/60 text-neutral-50 border border-neutral-700/50
            focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-400 text-sm"
        >
          {STATUS_ORDER.map(s => (
            <option key={s} value={s} className="bg-primary-900">{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-1.5">
          Update Note <span className="text-neutral-600 normal-case">(visible to client)</span>
        </label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What happened? What's the next step? Add any relevant details for the client…"
          rows={3}
          className="w-full rounded-lg px-3 py-2.5 bg-primary-800/60 text-neutral-50 border border-neutral-700/50
            focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-400 text-sm resize-none
            placeholder:text-neutral-600"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || unchanged}
          className="px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm
            transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Push Update'}
        </button>
        {unchanged && !saving && (
          <span className="text-xs text-neutral-600">Select a different status to push an update</span>
        )}
        {success && <span className="text-sm text-emerald-400">Status updated.</span>}
        {error && <span className="text-sm text-crimson-300">{error}</span>}
      </div>
    </div>
  )
}

// ── Add note panel (lawyers only) ─────────────────────────────────────────────

function AddNotePanel({ caseId, onAdded }: { caseId: string; onAdded: () => void }) {
  const [content, setContent] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleAdd = async () => {
    if (!content.trim()) return
    const access = localStorage.getItem('access')
    if (!access) return
    setSaving(true); setError('')
    try {
      await addCaseNote(caseId, content.trim(), isPrivate, access)
      setContent('')
      onAdded()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-4 space-y-3">
      <p className="text-xs uppercase tracking-wide text-neutral-400 font-semibold">Add Note</p>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Research findings, strategy notes, client instructions…"
        rows={3}
        className="w-full rounded-lg px-3 py-2.5 bg-primary-800/60 text-neutral-50 border border-neutral-700/50
          focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-400 text-sm resize-none
          placeholder:text-neutral-600"
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={e => setIsPrivate(e.target.checked)}
            className="rounded border-neutral-600 accent-gold-500"
          />
          Private (lawyer-only)
        </label>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-crimson-300">{error}</span>}
          <button
            onClick={handleAdd}
            disabled={saving || !content.trim()}
            className="px-4 py-1.5 rounded-lg bg-primary-700 hover:bg-primary-600 text-neutral-100 text-sm
              font-medium transition-colors disabled:opacity-40"
          >
            {saving ? 'Adding…' : 'Add Note'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const params = useParams()
  const caseId = params?.caseId as string | undefined
  const router = useRouter()
  const [item, setItem] = useState<CaseItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [role, setRole] = useState('client')

  const load = useCallback(async () => {
    const access = localStorage.getItem('access')
    if (!access) { setError('Sign in to view matter details.'); setLoading(false); return }
    if (!caseId) { setError('Unable to resolve case identifier.'); setLoading(false); return }
    try {
      const response = await getCaseDetail(caseId, access)
      setItem(response)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load matter details')
    } finally {
      setLoading(false)
    }
  }, [caseId])

  useEffect(() => {
    setRole(getRole())
    void load()
  }, [load])

  const isLawyer = LAWYER_ROLES.has(role)
  const chronological = item ? [...item.timeline].reverse() : []

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-primary-800/30 animate-pulse" />)}
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="max-w-3xl rounded-2xl border border-crimson-500/30 bg-crimson-900/10 p-8 text-center space-y-4">
        <p className="text-crimson-200">{error || 'Unable to find this matter.'}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg bg-primary-700 text-sm text-white hover:bg-primary-600 transition-colors"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-neutral-500 mb-1">Matter</p>
          <h1 className="font-display text-display-md text-neutral-50 leading-tight">{item.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={item.status} size="lg" />
            <span className="text-xs text-neutral-500">{item.case_type}</span>
            <span className="text-xs text-neutral-600">·</span>
            <span className="text-xs text-neutral-500">Filed {fmtDate(item.created_at)}</span>
          </div>
        </div>
        <Link
          href="/cases"
          className="flex-shrink-0 px-4 py-2 rounded-lg border border-neutral-700/50 text-neutral-400
            hover:text-neutral-200 hover:border-neutral-600 text-sm transition-colors"
        >
          ← All matters
        </Link>
      </div>

      {/* Status update panel — lawyers only */}
      {isLawyer && (
        <StatusUpdatePanel caseItem={item} onUpdated={setItem} />
      )}

      {/* Case details */}
      <div className="rounded-2xl border border-neutral-700/30 bg-primary-800/20 divide-y divide-neutral-700/20">
        <div className="px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold mb-2">Description</p>
          <p className="text-sm text-neutral-300 leading-relaxed">{item.description || 'No description.'}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-neutral-700/20">
          {[
            ['Type', item.case_type],
            ['Tradition', item.legal_tradition === 'common_law' ? 'Common Law' : item.legal_tradition === 'civil_law' ? 'Civil Law' : item.legal_tradition],
            ['Circuit', item.circuit === 'anglophone' ? 'Anglophone' : 'Francophone'],
            ['Language', item.language === 'en' ? 'English' : 'Français'],
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-3">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
              <p className="text-sm text-neutral-200 mt-0.5 font-medium">{value || '—'}</p>
            </div>
          ))}
        </div>
        {item.assigned_lawyer_id && (
          <div className="px-5 py-3">
            <p className="text-xs text-neutral-500 uppercase tracking-wide">Assigned Lawyer</p>
            <p className="text-sm text-neutral-200 mt-0.5 font-mono">{item.assigned_lawyer_id}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-neutral-700/30 bg-primary-800/20 p-5">
        <div className="flex items-center justify-between mb-5">
          <p className="font-heading text-sm font-semibold text-neutral-100">Case Timeline</p>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary-700/50 text-neutral-400 border border-neutral-700/30">
            {item.timeline.length} update{item.timeline.length !== 1 ? 's' : ''}
          </span>
        </div>
        {chronological.length > 0 ? (
          <div>
            {chronological.map((entry, i) => (
              <TimelineEntry key={`${entry.timestamp}-${i}`} entry={entry} index={i} total={chronological.length} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500 text-center py-4">No timeline entries yet.</p>
        )}
      </div>

      {/* Case notes */}
      <div className="rounded-2xl border border-neutral-700/30 bg-primary-800/20 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-heading text-sm font-semibold text-neutral-100">Case Notes</p>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary-700/50 text-neutral-400 border border-neutral-700/30">
            {(item.notes ?? []).length} note{(item.notes ?? []).length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLawyer && (
          <AddNotePanel caseId={item.id} onAdded={load} />
        )}

        {(item.notes ?? []).length > 0 ? (
          <div className="space-y-3">
            {(item.notes ?? []).map(note => (
              <div
                key={note.id}
                className={`rounded-xl border p-4 ${note.is_private
                  ? 'border-purple-500/20 bg-purple-500/5'
                  : 'border-neutral-700/30 bg-primary-900/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {note.is_private && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-purple-400/30 bg-purple-500/10 text-purple-300">
                      Private
                    </span>
                  )}
                  <span className="text-xs text-neutral-500">{fmt(note.created_at)}</span>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500 text-center py-4">
            {isLawyer ? 'Add the first note using the form above.' : 'No notes have been shared yet.'}
          </p>
        )}
      </div>
    </div>
  )
}
