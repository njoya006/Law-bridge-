'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  getCaseDetail, updateCaseStatus, addCaseNote,
  STATUS_LABELS, STATUS_ORDER, TERMINAL_STATUSES,
  getReassignmentRequest, initiateReassignment, confirmReassignment,
  cancelReassignment, selectReplacementLawyer,
  REASSIGNMENT_REASONS,
  type CaseItem, type ReassignmentRequest, type ConflictFlags,
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

// ── Reassignment Wizard ───────────────────────────────────────────────────────

type WizardStep = 'rate' | 'conflicts' | 'mediation' | 'search' | 'done'

const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'rate',      label: 'Evaluate'  },
  { key: 'conflicts', label: 'Analysis'  },
  { key: 'mediation', label: 'Mediation' },
  { key: 'search',    label: 'Replace'   },
  { key: 'done',      label: 'Complete'  },
]

const STEP_INDEX: Record<WizardStep, number> = { rate: 0, conflicts: 1, mediation: 2, search: 3, done: 4 }

const RATING_LABELS: Record<number, string> = {
  1: 'Very poor — unacceptable',
  2: 'Below expectations',
  3: 'Unsatisfactory',
  4: 'Disappointing but manageable',
  5: 'Adequate — personal reasons',
}

const REASON_ICONS: Record<string, string> = {
  unresponsive:     '📵',
  slow_progress:    '🐢',
  unprofessional:   '⚠️',
  lack_expertise:   '📚',
  breach_agreement: '📋',
  communication:    '💬',
  personal_reasons: '🔒',
  other:            '•••',
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function WizardStepNav({ step }: { step: WizardStep }) {
  const current = STEP_INDEX[step]
  return (
    <div className="flex items-center gap-0 px-6 pt-5 pb-1">
      {WIZARD_STEPS.map(({ key, label }, i) => {
        const done    = current > i
        const active  = current === i
        const pending = current < i
        return (
          <React.Fragment key={key}>
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                ${done    ? 'bg-gold-500 text-black'           : ''}
                ${active  ? 'bg-gold-500/20 border-2 border-gold-400 text-gold-300' : ''}
                ${pending ? 'bg-neutral-800 border border-neutral-700 text-neutral-600' : ''}
              `}>
                {done ? (
                  <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wide hidden sm:block transition-colors
                ${done ? 'text-gold-400' : active ? 'text-neutral-200' : 'text-neutral-600'}
              `}>
                {label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-4 transition-colors ${current > i ? 'bg-gold-500/60' : 'bg-neutral-800'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className="group relative focus:outline-none"
          >
            <span className={`text-3xl transition-all duration-150 select-none
              ${display >= n
                ? 'text-gold-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]'
                : 'text-neutral-800 group-hover:text-neutral-600'
              }`}
            >★</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-neutral-500 h-4 transition-all">
        {RATING_LABELS[display] || ''}
      </p>
    </div>
  )
}

type ConflictCheck = { key: string; label: string; detail: string; state: 'ok' | 'warn' | 'block' }

function buildConflictChecks(flags: ConflictFlags): ConflictCheck[] {
  return [
    {
      key: 'lawyer',
      label: 'Lawyer assignment',
      detail: flags.has_lawyer ? 'A lawyer is currently assigned to this case' : 'No lawyer assigned',
      state: flags.has_lawyer ? 'ok' : 'block',
    },
    {
      key: 'terminal',
      label: 'Case status',
      detail: flags.is_terminal ? 'Case is in a terminal state — reassignment not possible' : 'Case is active and eligible for reassignment',
      state: flags.is_terminal ? 'block' : 'ok',
    },
    {
      key: 'appeal',
      label: 'Active appeal',
      detail: flags.active_appeal ? 'An appeal is in progress — reassignment blocked during proceedings' : 'No active appeal',
      state: flags.active_appeal ? 'block' : 'ok',
    },
    {
      key: 'payment',
      label: 'Payment on record',
      detail: flags.payment_made
        ? `${flags.payment_amount} ${flags.payment_currency} on record — refund subject to platform policy`
        : 'No payment on record — clean transfer possible',
      state: flags.payment_made ? 'warn' : 'ok',
    },
    {
      key: 'court',
      label: 'Court date proximity',
      detail: flags.court_date_imminent
        ? 'A hearing or court date is imminent — transfer is high-risk at this stage'
        : 'No imminent court dates detected',
      state: flags.court_date_imminent ? 'warn' : 'ok',
    },
    {
      key: 'progress',
      label: 'Work progress',
      detail: `Estimated ${flags.work_progress_pct}% of case work completed${flags.work_progress_pct >= 70 ? ' — substantial work done, a new lawyer will need a briefing period' : ''}`,
      state: flags.work_progress_pct >= 90 ? 'block' : flags.work_progress_pct >= 60 ? 'warn' : 'ok',
    },
    {
      key: 'activity',
      label: 'Recent activity',
      detail: flags.recent_activity_count > 0
        ? `${flags.recent_activity_count} case update${flags.recent_activity_count !== 1 ? 's' : ''} in the last 7 days — active work is in progress`
        : 'No activity in the last 7 days',
      state: flags.recent_activity_count >= 3 ? 'warn' : 'ok',
    },
  ]
}

function ConflictReport({ flags }: { flags: ConflictFlags }) {
  const checks = buildConflictChecks(flags)
  const verdict = flags.recommendation
  return (
    <div className="space-y-3">
      {/* Verdict banner */}
      <div className={`flex items-start gap-3 rounded-xl border p-4
        ${verdict === 'blocked' ? 'border-crimson-500/40 bg-crimson-900/15'
          : verdict === 'caution' ? 'border-amber-500/30 bg-amber-900/10'
          : 'border-emerald-600/25 bg-emerald-900/10'}`}
      >
        <div className={`mt-0.5 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold
          ${verdict === 'blocked' ? 'bg-crimson-500/20 text-crimson-300'
            : verdict === 'caution' ? 'bg-amber-500/20 text-amber-300'
            : 'bg-emerald-500/20 text-emerald-300'}`}
        >
          {verdict === 'blocked' ? '✕' : verdict === 'caution' ? '!' : '✓'}
        </div>
        <div>
          <p className={`text-sm font-semibold
            ${verdict === 'blocked' ? 'text-crimson-200' : verdict === 'caution' ? 'text-amber-200' : 'text-emerald-200'}`}
          >
            {verdict === 'blocked' ? 'Reassignment Blocked'
              : verdict === 'caution' ? 'Caution — Review Required'
              : 'Clear to Proceed'}
          </p>
          <p className={`text-xs mt-0.5
            ${verdict === 'blocked' ? 'text-crimson-400' : verdict === 'caution' ? 'text-amber-400' : 'text-emerald-400'}`}
          >
            {verdict === 'blocked'
              ? (flags.block_reason || 'This case cannot be reassigned at this time.')
              : verdict === 'caution'
                ? 'Some factors require your attention. By confirming, you acknowledge the risks.'
                : 'No blocking factors detected. You may proceed with the 48-hour mediation window.'}
          </p>
        </div>
      </div>

      {/* Individual checks */}
      <div className="space-y-1.5">
        {checks.map(c => (
          <div key={c.key} className={`flex items-start gap-3 rounded-lg border px-3.5 py-3
            ${c.state === 'block' ? 'border-crimson-500/25 bg-crimson-900/10'
              : c.state === 'warn' ? 'border-amber-500/20 bg-amber-900/10'
              : 'border-neutral-700/25 bg-primary-900/30'}`}
          >
            <div className={`mt-px flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold
              ${c.state === 'block' ? 'bg-crimson-500/25 text-crimson-300'
                : c.state === 'warn' ? 'bg-amber-500/20 text-amber-300'
                : 'bg-emerald-500/15 text-emerald-400'}`}
            >
              {c.state === 'block' ? '✕' : c.state === 'warn' ? '!' : '✓'}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold
                ${c.state === 'block' ? 'text-crimson-300' : c.state === 'warn' ? 'text-amber-300' : 'text-neutral-300'}`}
              >
                {c.label}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{c.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MediationClock({ deadline }: { deadline: string }) {
  const [diff, setDiff] = useState(0)
  useEffect(() => {
    const update = () => setDiff(Math.max(0, new Date(deadline).getTime() - Date.now()))
    update()
    const id = setInterval(update, 10000)
    return () => clearInterval(id)
  }, [deadline])

  const totalMs = 48 * 3600000
  const pct = Math.max(0, Math.min(100, (diff / totalMs) * 100))
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const expired = diff === 0
  const urgent = pct < 25

  // SVG ring
  const r = 54, cx = 64, cy = 64
  const circumference = 2 * Math.PI * r
  const strokeDash = (pct / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="8" className="stroke-neutral-800" />
          <circle
            cx={cx} cy={cy} r={r} fill="none" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            className={`transition-all duration-1000 ${urgent ? 'stroke-crimson-400' : 'stroke-amber-400'}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {expired ? (
            <span className="text-xs font-semibold text-neutral-400">Expired</span>
          ) : (
            <>
              <span className={`text-xl font-bold font-mono tabular-nums ${urgent ? 'text-crimson-300' : 'text-amber-300'}`}>
                {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5">remaining</span>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-neutral-500 text-center max-w-xs leading-relaxed">
        Your lawyer has <span className="text-neutral-300 font-medium">48 hours</span> to respond to your concerns.
        You may proceed to find a replacement at any time — the window simply gives them a fair chance to address the issue.
      </p>
    </div>
  )
}

// ── Main wizard ────────────────────────────────────────────────────────────────

function ReassignmentWizard({ caseItem, onComplete }: { caseItem: CaseItem; onComplete: () => void }) {
  const [open, setOpen]               = useState(false)
  const [step, setStep]               = useState<WizardStep>('rate')
  const [existing, setExisting]       = useState<ReassignmentRequest | null>(null)
  const [loadingExisting, setLoading] = useState(true)

  const [rating, setRating]           = useState(3)
  const [reasonCode, setReasonCode]   = useState('')
  const [reasonDetail, setReasonDetail] = useState('')
  const [selectedLawyerId, setSelectedLawyerId] = useState('')

  const [working, setWorking] = useState(false)
  const [err, setErr]         = useState('')

  const access = typeof window !== 'undefined' ? localStorage.getItem('access') : null

  const loadExisting = useCallback(async () => {
    if (!access) return
    setLoading(true)
    try {
      const res = await getReassignmentRequest(caseItem.id, access)
      if (res.active) {
        const req = res as ReassignmentRequest
        setExisting(req)
        const s = req.status
        if (s === 'pending_review')                            setStep('conflicts')
        else if (s === 'mediation_window')                     setStep('mediation')
        else if (s === 'approved' || s === 'searching')        setStep('search')
        else if (s === 'completed')                            setStep('done')
        else                                                   setStep('rate')
      }
    } catch { /* no active request */ }
    finally { setLoading(false) }
  }, [caseItem.id, access])

  useEffect(() => { if (open) void loadExisting() }, [open, loadExisting])

  const handleOpen  = () => { setOpen(true); setErr(''); setStep('rate') }
  const handleClose = () => { setOpen(false); setErr('') }

  const handleSubmitRating = async () => {
    if (!access) return
    if (!reasonCode) { setErr('Please select a reason.'); return }
    if (reasonDetail.trim().length < 20) { setErr('Please describe the issue (at least 20 characters).'); return }
    setWorking(true); setErr('')
    try {
      const req = await initiateReassignment(
        caseItem.id,
        { reason_code: reasonCode, reason_detail: reasonDetail.trim(), performance_rating: rating },
        access,
      )
      setExisting(req)
      setStep('conflicts')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to submit')
    } finally { setWorking(false) }
  }

  const handleConfirm = async () => {
    if (!access || !existing) return
    setWorking(true); setErr('')
    try {
      const req = await confirmReassignment(caseItem.id, access)
      setExisting(req)
      setStep('mediation')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to confirm')
    } finally { setWorking(false) }
  }

  const handleSelectLawyer = async () => {
    if (!access || !selectedLawyerId.trim()) return
    setWorking(true); setErr('')
    try {
      const req = await selectReplacementLawyer(caseItem.id, selectedLawyerId.trim(), access)
      setExisting(req)
      setStep('done')
      onComplete()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Transfer failed')
    } finally { setWorking(false) }
  }

  const handleCancel = async () => {
    if (!access) return
    setWorking(true)
    try {
      await cancelReassignment(caseItem.id, access)
      setExisting(null); setStep('rate'); setOpen(false)
    } catch { /* ignore */ }
    finally { setWorking(false) }
  }

  if (TERMINAL_STATUSES.has(caseItem.status) || !caseItem.assigned_lawyer_id) return null

  return (
    <>
      {/* ── Trigger ─────────────────────────────────────────────────────────── */}
      <button
        onClick={handleOpen}
        className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl
          border border-amber-500/40 bg-gradient-to-r from-amber-950/60 to-amber-900/30
          px-4 py-2.5 text-sm font-medium text-amber-300 shadow-sm transition-all
          hover:border-amber-400/70 hover:from-amber-900/70 hover:to-amber-800/40 hover:text-amber-100 hover:shadow-amber-900/30 hover:shadow-md
          active:scale-[0.97]"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0 opacity-80">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Request Lawyer Change
        <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
      </button>

      {/* ── Overlay ─────────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="relative w-full sm:max-w-[540px] rounded-t-3xl sm:rounded-2xl
            border border-neutral-700/40 bg-[#0a0d1a] shadow-2xl shadow-black/60
            flex flex-col max-h-[92dvh]"
          >
            {/* Header */}
            <div className="relative flex items-center gap-3 px-6 pt-5 pb-4 border-b border-neutral-800/50 flex-shrink-0">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-amber-400">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold text-neutral-50 leading-tight">Request Lawyer Change</p>
                <p className="text-xs text-neutral-500 truncate mt-0.5">{caseItem.title}</p>
              </div>
              <button
                onClick={handleClose}
                className="flex-shrink-0 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Step nav */}
            <div className="flex-shrink-0 border-b border-neutral-800/40 bg-neutral-900/30">
              <WizardStepNav step={step} />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {loadingExisting ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-gold-400/40 border-t-gold-400 animate-spin" />
                  <p className="text-xs text-neutral-500">Checking for existing requests…</p>
                </div>
              ) : (
                <>
                  {/* ── STEP 1: Rate & Reason ──────────────────────────────── */}
                  {step === 'rate' && (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-neutral-700/30 bg-neutral-900/40 px-4 py-3.5">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide font-semibold mb-0.5">Step 1 of 4</p>
                        <p className="text-sm font-semibold text-neutral-100">Evaluate Your Lawyer</p>
                        <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                          Your rating is recorded and protects your rights during the transfer process.
                          It also helps improve lawyer quality on the platform.
                        </p>
                      </div>

                      {/* Star rating */}
                      <div className="rounded-xl border border-neutral-700/30 bg-neutral-900/30 p-4 space-y-3">
                        <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold">
                          Overall performance rating
                        </label>
                        <StarPicker value={rating} onChange={setRating} />
                      </div>

                      {/* Reason */}
                      <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block">
                          Primary reason for change
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {REASSIGNMENT_REASONS.map(r => (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => setReasonCode(r.value)}
                              className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left transition-all
                                ${reasonCode === r.value
                                  ? 'border-gold-400/60 bg-gold-500/10 shadow-[0_0_12px_rgba(234,179,8,0.08)]'
                                  : 'border-neutral-700/40 bg-neutral-900/40 hover:border-neutral-600/60 hover:bg-neutral-800/40'
                                }`}
                            >
                              <span className="text-base flex-shrink-0 w-5 text-center">{REASON_ICONS[r.value]}</span>
                              <span className={`text-xs font-medium leading-tight ${reasonCode === r.value ? 'text-gold-300' : 'text-neutral-400'}`}>
                                {r.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold">
                            Describe the issue
                          </label>
                          <span className={`text-xs tabular-nums ${reasonDetail.length >= 20 ? 'text-emerald-400' : 'text-neutral-600'}`}>
                            {reasonDetail.length}/20+
                          </span>
                        </div>
                        <textarea
                          value={reasonDetail}
                          onChange={e => setReasonDetail(e.target.value)}
                          placeholder="Describe specific behaviour or incidents that led to this request. The more detail you provide, the better we can protect your interests and assist with the transfer."
                          rows={4}
                          className="w-full rounded-xl px-4 py-3 bg-neutral-900/60 text-neutral-100 border border-neutral-700/40
                            focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 text-sm resize-none
                            placeholder:text-neutral-700 leading-relaxed transition-colors"
                        />
                      </div>

                      {err && (
                        <div className="flex items-center gap-2 rounded-lg border border-crimson-500/30 bg-crimson-900/15 px-3 py-2.5">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-crimson-400 flex-shrink-0">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs text-crimson-300">{err}</p>
                        </div>
                      )}

                      <button
                        onClick={handleSubmitRating}
                        disabled={working || !reasonCode || reasonDetail.trim().length < 20}
                        className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 active:bg-gold-600
                          text-black font-bold text-sm py-3 transition-all shadow-lg shadow-gold-900/20
                          disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {working ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-black/40 border-t-black animate-spin" />
                            Running conflict analysis…
                          </span>
                        ) : (
                          'Continue — Run Conflict Analysis'
                        )}
                      </button>
                    </div>
                  )}

                  {/* ── STEP 2: Conflict Report ────────────────────────────── */}
                  {step === 'conflicts' && existing && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-neutral-700/30 bg-neutral-900/40 px-4 py-3.5">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide font-semibold mb-0.5">Step 2 of 4</p>
                        <p className="text-sm font-semibold text-neutral-100">Conflict Intelligence Report</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          Our system has analysed 7 factors that could affect your transfer. Review each finding carefully.
                        </p>
                      </div>

                      <ConflictReport flags={existing.conflict_flags} />

                      {err && (
                        <div className="flex items-center gap-2 rounded-lg border border-crimson-500/30 bg-crimson-900/15 px-3 py-2.5">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-crimson-400 flex-shrink-0">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs text-crimson-300">{err}</p>
                        </div>
                      )}

                      <div className="flex gap-2.5">
                        <button
                          onClick={handleCancel}
                          disabled={working}
                          className="flex-1 rounded-xl border border-neutral-700/50 text-neutral-400 text-sm py-3
                            hover:border-neutral-600 hover:text-neutral-200 hover:bg-neutral-800/30 transition-all disabled:opacity-40"
                        >
                          Withdraw
                        </button>
                        {existing.conflict_flags.recommendation !== 'blocked' && (
                          <button
                            onClick={handleConfirm}
                            disabled={working}
                            className="flex-[2] rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold text-sm py-3
                              transition-all shadow-lg shadow-gold-900/20 disabled:opacity-35"
                          >
                            {working ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="h-3.5 w-3.5 rounded-full border-2 border-black/40 border-t-black animate-spin" />
                                Notifying lawyer…
                              </span>
                            ) : (
                              'Acknowledge & Notify Lawyer'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── STEP 3: Mediation Window ───────────────────────────── */}
                  {step === 'mediation' && existing && (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-neutral-700/30 bg-neutral-900/40 px-4 py-3.5">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide font-semibold mb-0.5">Step 3 of 4</p>
                        <p className="text-sm font-semibold text-neutral-100">Mediation Window</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          Your lawyer has been notified. The mediation window gives them a fair opportunity to address your concerns before transfer.
                        </p>
                      </div>

                      {/* Countdown clock */}
                      {existing.mediation_deadline && (
                        <MediationClock deadline={existing.mediation_deadline} />
                      )}

                      {/* Lawyer response (if any) */}
                      {existing.lawyer_response ? (
                        <div className="rounded-xl border border-blue-500/25 bg-blue-950/30 p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-blue-400">
                                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="text-xs font-semibold text-blue-300">Lawyer responded</p>
                            {existing.lawyer_responded_at && (
                              <span className="text-xs text-neutral-600">{fmtDate(existing.lawyer_responded_at)}</span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-300 leading-relaxed pl-7">{existing.lawyer_response}</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-neutral-700/20 bg-neutral-900/30 p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                            <p className="text-xs text-neutral-400">Awaiting lawyer response…</p>
                          </div>
                        </div>
                      )}

                      {/* Request receipt */}
                      <div className="rounded-xl border border-neutral-700/25 bg-neutral-900/30 divide-y divide-neutral-800/60">
                        <div className="px-4 py-2.5">
                          <p className="text-xs uppercase tracking-wide font-semibold text-neutral-500">Request Receipt</p>
                        </div>
                        {[
                          ['Reason', REASSIGNMENT_REASONS.find(r => r.value === existing.reason_code)?.label || existing.reason_code],
                          ['Rating', `${'★'.repeat(existing.performance_rating)}${'☆'.repeat(5 - existing.performance_rating)}`],
                          ['Filed', fmtDate(existing.created_at)],
                          ['Status', 'Mediation window open'],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-xs text-neutral-500">{k}</span>
                            <span className="text-xs font-medium text-neutral-300">{v}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          onClick={handleCancel}
                          disabled={working}
                          className="flex-1 rounded-xl border border-neutral-700/50 text-neutral-400 text-sm py-3
                            hover:border-neutral-600 hover:text-neutral-200 hover:bg-neutral-800/30 transition-all disabled:opacity-40"
                        >
                          Cancel Request
                        </button>
                        <button
                          onClick={() => setStep('search')}
                          disabled={working}
                          className="flex-[2] rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold text-sm py-3
                            transition-all shadow-lg shadow-gold-900/20 disabled:opacity-35"
                        >
                          Find Replacement Lawyer →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 4: Select Replacement ────────────────────────── */}
                  {step === 'search' && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-neutral-700/30 bg-neutral-900/40 px-4 py-3.5">
                        <p className="text-xs text-neutral-500 uppercase tracking-wide font-semibold mb-0.5">Step 4 of 4</p>
                        <p className="text-sm font-semibold text-neutral-100">Select Replacement Lawyer</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          Find a qualified lawyer on the{' '}
                          <Link href="/discover" target="_blank" className="text-gold-400 hover:text-gold-300 underline underline-offset-2">
                            Discover page
                          </Link>{' '}
                          and paste their ID below.
                        </p>
                      </div>

                      {/* Case requirements */}
                      <div className="rounded-xl border border-gold-400/20 bg-gold-500/5 p-4 space-y-2.5">
                        <p className="text-xs uppercase tracking-wide font-semibold text-gold-400">Case Requirements</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            caseItem.case_type,
                            caseItem.legal_tradition === 'common_law' ? 'Common Law' : 'Civil Law',
                            caseItem.circuit === 'anglophone' ? 'Anglophone' : 'Francophone',
                            caseItem.language === 'en' ? 'English' : 'Français',
                          ].map(tag => (
                            <span key={tag} className="inline-flex items-center rounded-full border border-gold-400/30 bg-gold-500/10 px-2.5 py-1 text-xs font-medium text-gold-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-neutral-500">
                          Look for lawyers matching these attributes to ensure continuity.
                        </p>
                      </div>

                      {/* UUID input */}
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wide font-semibold text-neutral-400 block">
                          Replacement Lawyer ID
                        </label>
                        <input
                          type="text"
                          value={selectedLawyerId}
                          onChange={e => setSelectedLawyerId(e.target.value.trim())}
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          className="w-full rounded-xl px-4 py-3 bg-neutral-900/60 text-neutral-100 border border-neutral-700/40 font-mono text-sm
                            focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50
                            placeholder:text-neutral-700 transition-colors"
                        />
                      </div>

                      {/* Transfer policy */}
                      <div className="rounded-xl border border-neutral-700/25 bg-neutral-900/30 divide-y divide-neutral-800/50">
                        <div className="px-4 py-2.5">
                          <p className="text-xs uppercase tracking-wide font-semibold text-neutral-500">Transfer Policy</p>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          <p className="text-xs font-medium text-neutral-300">Transfers with the case:</p>
                          {['Full timeline & status history', 'All public case notes', 'Jurisdiction settings'].map(item => (
                            <div key={item} className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-2.5 w-2.5 text-emerald-400">
                                  <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                              <span className="text-xs text-neutral-400">{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          <p className="text-xs font-medium text-neutral-300">Does NOT transfer:</p>
                          {['Private lawyer notes', 'Previous fee payments (see policy)'].map(item => (
                            <div key={item} className="flex items-center gap-2">
                              <div className="h-4 w-4 rounded-full bg-neutral-700/40 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-2.5 w-2.5 text-neutral-500">
                                  <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
                                </svg>
                              </div>
                              <span className="text-xs text-neutral-500">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {err && (
                        <div className="flex items-center gap-2 rounded-lg border border-crimson-500/30 bg-crimson-900/15 px-3 py-2.5">
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-crimson-400 flex-shrink-0">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs text-crimson-300">{err}</p>
                        </div>
                      )}

                      <div className="flex gap-2.5">
                        <button
                          onClick={handleCancel}
                          disabled={working}
                          className="flex-1 rounded-xl border border-neutral-700/50 text-neutral-400 text-sm py-3
                            hover:border-neutral-600 hover:text-neutral-200 hover:bg-neutral-800/30 transition-all disabled:opacity-40"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSelectLawyer}
                          disabled={working || !selectedLawyerId.trim()}
                          className="flex-[2] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3
                            transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-35 disabled:cursor-not-allowed"
                        >
                          {working ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                              Transferring case…
                            </span>
                          ) : (
                            'Confirm Transfer'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── DONE ──────────────────────────────────────────────── */}
                  {step === 'done' && existing && (
                    <div className="space-y-5 py-2">
                      {/* Success graphic */}
                      <div className="flex flex-col items-center gap-3 pt-2">
                        <div className="relative h-20 w-20">
                          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                          <div className="relative h-20 w-20 rounded-full border-2 border-emerald-500/40 bg-emerald-900/20 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-9 w-9 text-emerald-400">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="font-heading text-lg font-bold text-neutral-50">Transfer Complete</p>
                          <p className="text-sm text-neutral-400 mt-1">
                            Your case has been successfully transferred to the new lawyer.
                          </p>
                        </div>
                      </div>

                      {/* Receipt */}
                      {existing.handoff_summary && (
                        <div className="rounded-xl border border-neutral-700/25 bg-neutral-900/30 divide-y divide-neutral-800/50">
                          <div className="px-4 py-2.5">
                            <p className="text-xs uppercase tracking-wide font-semibold text-neutral-500">Transfer Record</p>
                          </div>
                          <div className="px-4 py-3">
                            <p className="text-xs text-neutral-400 leading-relaxed">{existing.handoff_summary}</p>
                          </div>
                          <div className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-xs text-neutral-500">Completed</span>
                            <span className="text-xs font-medium text-emerald-400">
                              {existing.completed_at ? fmtDate(existing.completed_at) : 'Just now'}
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => { handleClose(); onComplete() }}
                        className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold text-sm py-3
                          transition-all shadow-lg shadow-gold-900/20"
                      >
                        View Updated Case
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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
        <div className="flex flex-shrink-0 items-center gap-2">
          {!isLawyer && (
            <ReassignmentWizard caseItem={item} onComplete={load} />
          )}
          <Link
            href="/cases"
            className="px-4 py-2 rounded-lg border border-neutral-700/50 text-neutral-400
              hover:text-neutral-200 hover:border-neutral-600 text-sm transition-colors"
          >
            ← All matters
          </Link>
        </div>
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
