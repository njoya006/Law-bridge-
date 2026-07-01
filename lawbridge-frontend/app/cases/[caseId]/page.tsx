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
  type CaseItem, type ReassignmentRequest, type ConflictFlags, type WorkflowStatusMsg,
} from '../../../lib/casesApi'
import { sendChatMessage, type ChatMessage } from '../../../lib/aiApi'
import { buildWorkflow, LAWYER_ACTIONS } from '../../../lib/workflow'
import { ClientCard, LawyerCard } from '../../../components/IdentityCards'
import { useCaseWebSocket } from '../../../lib/useCaseWebSocket'
import { SERVICE_URLS } from '../../../lib/serviceUrls'

// ── helpers ────────────────────────────────────────────────────────────────────

function getPortalRole(): 'lawyer' | 'client' {
  if (typeof window === 'undefined') return 'client'
  try { return localStorage.getItem('portalRole') === 'lawyer' ? 'lawyer' : 'client' } catch { return 'client' }
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

// ── Client: Case Progress stepper ─────────────────────────────────────────────

function CaseProgressCard({ caseItem }: { caseItem: CaseItem }) {
  const wf = caseItem.workflow ?? buildWorkflow(caseItem.case_type, caseItem.status)

  const stages = wf.stages
  const currentIdx = stages.indexOf(caseItem.status)
  const lang = caseItem.language === 'fr' ? 'fr' : 'en'
  const msg: WorkflowStatusMsg = lang === 'fr' ? wf.current_message.fr : wf.current_message.en
  const isOffPipeline = currentIdx === -1

  return (
    <div className="rounded-2xl border border-gold-500/20 bg-gradient-to-b from-gold-950/20 via-transparent to-transparent p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse flex-shrink-0" />
          <p className="font-heading text-sm font-semibold text-gold-300">Case Progress</p>
        </div>
        {isOffPipeline && (
          <StatusBadge status={caseItem.status} size="sm" />
        )}
      </div>

      {/* Desktop horizontal stepper */}
      <div className="hidden sm:block">
        <div className="relative px-2 pt-1 pb-6">
          <div className="absolute top-4.5 left-6 right-6 h-px bg-neutral-800/80" />
          {!isOffPipeline && currentIdx > 0 && (
            <div
              className="absolute top-4.5 left-6 h-px bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-700"
              style={{ width: `calc(${(currentIdx / Math.max(stages.length - 1, 1)) * 100}% - 0.75rem)` }}
            />
          )}
          <div className="relative flex justify-between gap-1">
            {stages.map((stage, idx) => {
              const done    = !isOffPipeline && idx < currentIdx
              const active  = !isOffPipeline && idx === currentIdx
              const label   = STATUS_LABELS[stage] ?? stage
              return (
                <div key={stage} className="flex flex-col items-center gap-2" style={{ flex: '1 1 0', minWidth: 0 }}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 border transition-all duration-300
                    ${done   ? 'bg-gold-500 border-gold-400/80 text-black shadow-[0_0_10px_rgba(234,179,8,0.25)]' : ''}
                    ${active ? 'bg-gold-500/20 border-gold-400 text-gold-200 shadow-[0_0_14px_rgba(234,179,8,0.35)]' : ''}
                    ${!done && !active ? 'bg-primary-900/80 border-neutral-700/40 text-neutral-600' : ''}
                  `}>
                    {done ? (
                      <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : active ? (
                      <div className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-neutral-700/80" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight transition-colors px-0.5
                    ${done ? 'text-gold-500/80' : active ? 'text-neutral-200' : 'text-neutral-600'}
                  `} style={{ maxWidth: '72px' }}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile vertical stepper */}
      <div className="sm:hidden space-y-0.5">
        {stages.map((stage, idx) => {
          const done   = !isOffPipeline && idx < currentIdx
          const active = !isOffPipeline && idx === currentIdx
          if (!done && !active && currentIdx >= 0 && idx > currentIdx + 1) return null
          if (isOffPipeline && idx > 1) return null
          const label = STATUS_LABELS[stage] ?? stage
          return (
            <div key={stage} className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors
              ${active ? 'bg-gold-500/10' : ''}
            `}>
              <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border
                ${done   ? 'bg-gold-500 border-gold-400 text-black' : ''}
                ${active ? 'bg-gold-500/15 border-gold-400 text-gold-300' : ''}
                ${!done && !active ? 'bg-primary-900 border-neutral-700/40 text-neutral-600' : ''}
              `}>
                {done ? (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : idx + 1}
              </div>
              <span className={`text-xs font-medium flex-1
                ${done ? 'text-gold-500/80' : active ? 'text-neutral-200' : 'text-neutral-600'}
              `}>{label}</span>
              {active && <span className="text-[10px] font-semibold text-gold-400 flex-shrink-0">Current</span>}
            </div>
          )
        })}
      </div>

      {/* What this means */}
      <div className="rounded-xl border border-neutral-700/30 bg-primary-900/50 p-4 space-y-3">
        <p className="font-heading text-sm font-semibold text-neutral-100 leading-snug">{msg.headline}</p>
        <p className="text-sm text-neutral-400 leading-relaxed">{msg.detail}</p>
        {msg.next && (
          <div className="flex gap-2.5 pt-2 border-t border-neutral-800/60">
            <div className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full bg-gold-500/15 border border-gold-400/30 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-gold-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-neutral-500 uppercase tracking-wide font-semibold mb-0.5">
                {lang === 'fr' ? 'Prochaine étape' : 'What happens next'}
              </p>
              <p className="text-xs text-neutral-300 leading-relaxed">{msg.next}</p>
            </div>
          </div>
        )}
        {msg.estimate && (
          <p className="text-[11px] text-neutral-600 italic pt-1 border-t border-neutral-800/40">{msg.estimate}</p>
        )}
      </div>

      {/* Bilingual secondary view (shown when case language is EN, shows FR below as courtesy) */}
      {lang === 'en' && wf.current_message.fr.headline !== wf.current_message.en.headline && (
        <details className="group">
          <summary className="text-xs text-neutral-600 hover:text-neutral-400 cursor-pointer select-none transition-colors">
            Voir en français ↓
          </summary>
          <div className="mt-2 rounded-xl border border-neutral-800/50 bg-primary-900/30 p-3 space-y-2">
            <p className="text-xs font-semibold text-neutral-300">{wf.current_message.fr.headline}</p>
            <p className="text-xs text-neutral-500 leading-relaxed">{wf.current_message.fr.detail}</p>
          </div>
        </details>
      )}
    </div>
  )
}

// ── Lawyer: Smart status update panel ─────────────────────────────────────────

function StatusUpdatePanel({ caseItem, onUpdated }: { caseItem: CaseItem; onUpdated: (updated: CaseItem) => void }) {
  const wf = caseItem.workflow ?? buildWorkflow(caseItem.case_type, caseItem.status)
  const nextStatus      = wf.next_status ?? null
  const allowedList     = wf.allowed_transitions?.length
    ? wf.allowed_transitions
    : STATUS_ORDER.filter(s => s !== caseItem.status)
  const previews        = wf.transition_previews ?? {}

  const [chosenStatus, setChosenStatus] = useState<string>(nextStatus ?? allowedList[0] ?? '')
  const [showAdvanced, setShowAdvanced]  = useState(!nextStatus)
  const [note, setNote]                  = useState('')
  const [saving, setSaving]              = useState(false)
  const [error, setError]                = useState('')
  const [success, setSuccess]            = useState<string | null>(null)

  const isTerminal = TERMINAL_STATUSES.has(caseItem.status)

  const handleSave = async (statusToSave: string) => {
    if (!statusToSave || statusToSave === caseItem.status) return
    const access = localStorage.getItem('access')
    if (!access) return
    setSaving(true); setError(''); setSuccess(null)
    try {
      const updated = await updateCaseStatus(caseItem.id, statusToSave, note, access)
      setNote('')
      setChosenStatus(updated.workflow?.next_status ?? allowedList[0] ?? '')
      setShowAdvanced(false)
      setSuccess(STATUS_LABELS[statusToSave] ?? statusToSave)
      setTimeout(() => setSuccess(null), 6000)
      onUpdated(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const preview: WorkflowStatusMsg | null = chosenStatus ? (previews[chosenStatus] ?? null) : null

  return (
    <div className="rounded-2xl border border-gold-400/20 bg-gradient-to-b from-gold-950/20 to-transparent p-5 space-y-4">
      {/* Panel header */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse flex-shrink-0" />
            <p className="font-heading text-sm font-semibold text-gold-300">Advance Case</p>
          </div>
          <span className="text-xs font-semibold text-neutral-200 bg-primary-800/60 border border-neutral-700/40 rounded-full px-2.5 py-0.5">
            {STATUS_LABELS[caseItem.status] ?? caseItem.status}
          </span>
        </div>
        {LAWYER_ACTIONS[caseItem.status] && (
          <p className="text-xs text-neutral-500 leading-relaxed pl-4">{LAWYER_ACTIONS[caseItem.status]}</p>
        )}
      </div>

      {isTerminal && (
        <div className="rounded-lg border border-neutral-700/40 bg-neutral-800/20 px-3 py-2">
          <p className="text-xs text-neutral-500">
            This case has reached a terminal state. You can still record a correction if needed.
          </p>
        </div>
      )}

      {/* Smart next-step button */}
      {nextStatus && !isTerminal && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold">
            Suggested next step
          </p>
          <button
            onClick={() => { setChosenStatus(nextStatus); handleSave(nextStatus) }}
            disabled={saving}
            className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-xl
              bg-gradient-to-r from-gold-600/90 to-gold-500/80 hover:from-gold-500 hover:to-gold-400
              text-black font-bold text-sm transition-all shadow-lg shadow-gold-900/20
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <span className="flex items-center gap-2">
              {saving && chosenStatus === nextStatus ? (
                <span className="h-4 w-4 rounded-full border-2 border-black/20 border-t-black animate-spin flex-shrink-0" />
              ) : (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0 opacity-70">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              )}
              Move to: {STATUS_LABELS[nextStatus] ?? nextStatus}
            </span>
            <span className="text-[10px] font-medium opacity-60 flex-shrink-0">Client notified automatically</span>
          </button>
        </div>
      )}

      {/* Advanced: choose different outcome */}
      <div>
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1"
        >
          <svg
            viewBox="0 0 20 20" fill="currentColor"
            className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          {nextStatus ? 'Choose a different outcome' : 'Select status to apply'}
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3">
            <select
              value={chosenStatus}
              onChange={e => setChosenStatus(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 bg-primary-800/60 text-neutral-50 border border-neutral-700/50
                focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-400 text-sm"
            >
              <option value="" disabled className="bg-primary-900 text-neutral-500">— select status —</option>
              {allowedList.map(s => (
                <option key={s} value={s} className="bg-primary-900">
                  {STATUS_LABELS[s] ?? s}
                </option>
              ))}
            </select>

            {/* Notification preview for the chosen status */}
            {preview && chosenStatus !== caseItem.status && (
              <div className="rounded-xl border border-neutral-700/40 bg-primary-900/40 p-3.5 space-y-1.5">
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold flex items-center gap-1.5">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-gold-400">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-2.83-2h5.66A3 3 0 0110 18z" />
                  </svg>
                  Client will receive
                </p>
                <p className="text-xs font-semibold text-neutral-200">{preview.headline}</p>
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{preview.detail}</p>
              </div>
            )}

            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-1.5">
                Note <span className="text-neutral-600 normal-case font-normal">(optional, appended to client notification)</span>
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add context for the client: what happened, what they need to do…"
                rows={2}
                className="w-full rounded-lg px-3 py-2.5 bg-primary-800/60 text-neutral-50 border border-neutral-700/50
                  focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-400 text-sm resize-none
                  placeholder:text-neutral-600"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSave(chosenStatus)}
                disabled={saving || !chosenStatus || chosenStatus === caseItem.status}
                className="px-5 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm
                  transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Apply Update'}
              </button>
              {error && <span className="text-sm text-crimson-300">{error}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Note field when using smart button */}
      {!showAdvanced && nextStatus && (
        <div>
          <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-1.5">
            Add a note <span className="text-neutral-600 normal-case font-normal">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Any details for the client about this update…"
            rows={2}
            className="w-full rounded-lg px-3 py-2.5 bg-primary-800/60 text-neutral-50 border border-neutral-700/50
              focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-400 text-sm resize-none
              placeholder:text-neutral-600"
          />
        </div>
      )}

      {/* Success confirmation */}
      {success && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-900/20 px-4 py-3">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-emerald-400 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-emerald-300">Updated to: {success}</p>
            <p className="text-xs text-emerald-500">Client notified in-app and by email.</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Meeting Notes → Action Items (lawyers only) ───────────────────────────────

import {
  streamMeetingSummary,
  type MeetingResult,
} from '../../../lib/aiApi'

function MeetingNotesPanel({ caseId, caseType, clientName, onNoteSaved }: {
  caseId: string
  caseType: string
  clientName: string
  onNoteSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [rawNotes, setRawNotes] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [result, setResult] = useState<MeetingResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'email' | 'actions' | null>(null)

  async function generate() {
    if (!rawNotes.trim() || streaming) return
    const token = localStorage.getItem('access') ?? ''
    setStreaming(true)
    setStreamText('')
    setResult(null)
    setError('')
    await streamMeetingSummary(
      { raw_notes: rawNotes, case_id: caseId, case_type: caseType, client_name: clientName },
      token,
      {
        onToken: t => setStreamText(prev => prev + t),
        onDone: res => { setResult(res); setStreaming(false); setStreamText('') },
        onError: msg => { setError(msg); setStreaming(false) },
      },
    )
  }

  async function saveNote() {
    if (!result?.case_note_text) return
    const token = localStorage.getItem('access') ?? ''
    try {
      await fetch(`/api/v1/cases/${caseId}/notes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: result.case_note_text, is_private: true }),
      })
      onNoteSaved()
      setOpen(false)
    } catch {
      setError('Failed to save note.')
    }
  }

  function copyEmail() {
    navigator.clipboard.writeText(result?.draft_client_email ?? '').then(() => {
      setCopied('email'); setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }

  function copyActions() {
    const text = (result?.action_items ?? [])
      .map(a => `[ ] ${a.item} (${a.assignee}${a.suggested_due_date ? ` — by ${a.suggested_due_date}` : ''})`)
      .join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied('actions'); setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gold-500/30 bg-gold-500/10 text-gold-400 text-sm font-medium hover:bg-gold-500/15 hover:border-gold-500/50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        Summarize Meeting
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-700/40 bg-primary-900 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/30">
              <div>
                <h3 className="font-heading text-body-lg text-neutral-50">AI Meeting Notes</h3>
                <p className="text-xs text-neutral-500 mt-0.5">Summarise + extract action items + draft client email</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-neutral-300 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-6 space-y-4">
              {!result && (
                <>
                  <div>
                    <label className="block text-neutral-400 text-xs mb-1">
                      Paste raw meeting notes <span className="text-crimson-400">*</span>
                    </label>
                    <textarea
                      value={rawNotes}
                      onChange={e => setRawNotes(e.target.value)}
                      placeholder="Write or paste your meeting notes here — dates discussed, what was agreed, who is responsible for what…"
                      rows={8}
                      className="w-full rounded-lg bg-primary-800/50 border border-neutral-700/40 px-3 py-2.5 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50 resize-none"
                    />
                  </div>
                  {error && <p className="text-crimson-400 text-xs">{error}</p>}
                  <button
                    onClick={() => void generate()}
                    disabled={streaming || !rawNotes.trim()}
                    className="px-5 py-2.5 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {streaming ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Generating…
                      </>
                    ) : 'Generate Summary'}
                  </button>
                  {streaming && streamText && (
                    <div className="rounded-lg bg-primary-800/40 border border-neutral-700/30 p-4">
                      <p className="text-sm text-neutral-200 whitespace-pre-wrap">{streamText}<span className="animate-pulse">▍</span></p>
                    </div>
                  )}
                </>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-4">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Summary</p>
                    <p className="text-sm text-neutral-200">{result.summary}</p>
                  </div>

                  {/* Action Items */}
                  {result.action_items.length > 0 && (
                    <div className="rounded-xl border border-gold-500/20 bg-gold-900/10 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Action Items</p>
                        <button onClick={copyActions} className="text-xs text-neutral-500 hover:text-gold-400 transition-colors">
                          {copied === 'actions' ? '✓ Copied' : 'Copy all'}
                        </button>
                      </div>
                      {result.action_items.map((a, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-gold-500 mt-0.5 flex-shrink-0">→</span>
                          <div>
                            <span className="text-neutral-200">{a.item}</span>
                            <span className="ml-2 text-xs text-neutral-500 capitalize">({a.assignee})</span>
                            {a.suggested_due_date && (
                              <span className="ml-2 text-xs text-neutral-600">by {a.suggested_due_date}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Draft Email */}
                  {result.draft_client_email && (
                    <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Draft Client Email</p>
                        <button onClick={copyEmail} className="text-xs text-neutral-500 hover:text-gold-400 transition-colors">
                          {copied === 'email' ? '✓ Copied' : 'Copy email'}
                        </button>
                      </div>
                      <p className="text-sm text-neutral-200 whitespace-pre-wrap font-mono text-xs leading-relaxed">{result.draft_client_email}</p>
                    </div>
                  )}

                  {error && <p className="text-crimson-400 text-xs">{error}</p>}

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => void saveNote()}
                      className="px-4 py-2 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 transition-colors"
                    >
                      Save as Case Note
                    </button>
                    <button
                      onClick={() => { setResult(null); setRawNotes('') }}
                      className="px-4 py-2 rounded-lg border border-neutral-700/40 text-neutral-400 text-sm hover:text-neutral-200 transition-colors"
                    >
                      New Notes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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

// ── Court session logger (lawyers only, active cases) ─────────────────────────

function CourtSessionPanel({ caseId, currentStatus, onLogged }: { caseId: string; currentStatus: string; onLogged: () => void }) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleLog = async () => {
    if (!notes.trim()) return
    const access = localStorage.getItem('access')
    if (!access) return
    setSaving(true); setError(''); setSuccess(false)
    try {
      await updateCaseStatus(caseId, currentStatus, `[Court Session] ${notes.trim()}`, access)
      setNotes(''); setSuccess(true); setOpen(false)
      onLogged()
      setTimeout(() => setSuccess(false), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to log session')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-orange-500/30 bg-orange-900/10 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
          <p className="text-xs uppercase tracking-wide text-orange-300 font-semibold">Log Court Session</p>
        </div>
        {success && (
          <span className="text-xs text-emerald-400 font-medium">Logged · Client notified ✓</span>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-medium"
        >
          {open ? 'Cancel' : 'Add update'}
        </button>
      </div>
      {!open && (
        <p className="text-xs text-neutral-500">Record what happened in today's court session. The client will be notified by email.</p>
      )}
      {open && (
        <>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe what happened in court today: proceedings, outcome, next steps, adjournment details…"
            rows={4}
            className="w-full rounded-lg px-3 py-2.5 bg-primary-800/60 text-neutral-50 border border-orange-500/30
              focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-400 text-sm resize-none
              placeholder:text-neutral-600"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500">Client will be notified by email with this update.</p>
            <div className="flex items-center gap-3">
              {error && <span className="text-xs text-crimson-300">{error}</span>}
              <button
                onClick={handleLog}
                disabled={saving || !notes.trim()}
                className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm
                  font-medium transition-colors disabled:opacity-40"
              >
                {saving ? 'Logging…' : 'Log Session'}
              </button>
            </div>
          </div>
        </>
      )}
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
      detail: flags.has_lawyer ? 'A lawyer is currently assigned — you can request a change' : 'No lawyer assigned yet — you can request a specific lawyer',
      state: 'ok',
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

  if (TERMINAL_STATUSES.has(caseItem.status)) return null

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

// ── AI Case Intelligence Card ─────────────────────────────────────────────────

type AIAnalysis = {
  strength_score: number
  risk_flags: string[]
  recommended_next_steps: string[]
  summary: string
}

function AICaseIntelligenceCard({ caseItem }: { caseItem: CaseItem }) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const analyze = async () => {
    const access = localStorage.getItem('access')
    if (!access) return
    setLoading(true); setError(''); setText(''); setAnalysis(null)

    const aiBase = (SERVICE_URLS.ai as string).replace(/\/$/, '')
    const payload = {
      session_id: null,
      message: `Analyse this legal case and respond ONLY with JSON in this format: {"strength_score": 0-100, "risk_flags": ["..."], "recommended_next_steps": ["..."], "summary": "..."}. Case title: ${caseItem.title}. Type: ${caseItem.case_type}. Status: ${caseItem.status}. Tradition: ${caseItem.legal_tradition}. Timeline events: ${caseItem.timeline.length}. Latest status: ${caseItem.timeline[0]?.status ?? 'none'}.`,
      language: caseItem.language ?? 'en',
    }

    try {
      const res = await fetch(`${aiBase}/ai/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access}`, Accept: 'text/event-stream' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { setError('AI service is unavailable. Try again later.'); setLoading(false); return }
      const reader = res.body?.getReader()
      if (!reader) { setError('No response.'); setLoading(false); return }

      const decoder = new TextDecoder()
      let buf = ''
      let fullText = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            const parsed = JSON.parse(raw) as { token?: string; done?: boolean; error?: string }
            if (parsed.error) { setError(parsed.error); break }
            if (parsed.token) { fullText += parsed.token; setText(fullText) }
          } catch { /* skip */ }
        }
      }
      // Parse the accumulated JSON
      const jsonMatch = fullText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as AIAnalysis
        setAnalysis(parsed)
      } else {
        setError('Unable to parse AI response.')
      }
    } catch {
      setError('AI service is unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-950/20 to-transparent p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-purple-400 text-base">✦</span>
          <p className="font-heading text-sm font-semibold text-purple-300">AI Case Intelligence</p>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-purple-500/30 text-purple-500 font-medium">Beta</span>
        </div>
        {!analysis && !loading && (
          <button
            onClick={analyze}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors"
          >
            Get AI Analysis →
          </button>
        )}
      </div>

      {!analysis && !loading && !error && (
        <p className="text-xs text-neutral-500 leading-relaxed">
          Let AI analyse this case and suggest risk flags, next steps, and a strength score based on current status and timeline.
        </p>
      )}

      {loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-purple-400 text-xs">
            <span className="animate-spin h-3 w-3 border border-purple-400 border-t-transparent rounded-full" />
            Analysing case…
          </div>
          {text && <p className="text-xs text-neutral-500 font-mono leading-relaxed opacity-60">{text}</p>}
        </div>
      )}

      {error && (
        <p className="text-xs text-neutral-500 italic">{error}</p>
      )}

      {analysis && (
        <div className="space-y-4">
          {/* Strength score */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-neutral-400 font-medium">Case Strength</p>
              <p className={`text-sm font-bold tabular-nums ${analysis.strength_score >= 70 ? 'text-emerald-400' : analysis.strength_score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                {analysis.strength_score}/100
              </p>
            </div>
            <div className="h-2 rounded-full bg-neutral-800/60 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${analysis.strength_score >= 70 ? 'bg-emerald-500/70' : analysis.strength_score >= 40 ? 'bg-amber-500/70' : 'bg-red-500/70'}`}
                style={{ width: `${analysis.strength_score}%` }}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-neutral-700/30 bg-primary-900/40 p-3.5">
            <p className="text-xs leading-relaxed text-neutral-300">{analysis.summary}</p>
          </div>

          {/* Risk flags */}
          {analysis.risk_flags.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide text-red-400 font-semibold">Risk Flags</p>
              {analysis.risk_flags.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 flex-shrink-0 text-xs">▲</span>
                  <p className="text-xs text-neutral-400">{f}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recommended steps */}
          {analysis.recommended_next_steps.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide text-emerald-400 font-semibold">Recommended Next Steps</p>
              {analysis.recommended_next_steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0 text-xs">✓</span>
                  <p className="text-xs text-neutral-400">{s}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => { setAnalysis(null); setText('') }}
            className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            Clear analysis
          </button>
        </div>
      )}
    </div>
  )
}

// ── Client Case Bot (AI-5) ────────────────────────────────────────────────────

function ClientCaseBot({ caseId, caseTitle }: { caseId: string; caseTitle: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [sessionId, setSessionId] = useState<string | undefined>()
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const send = async () => {
    const msg = input.trim()
    if (!msg || streaming) return
    const access = localStorage.getItem('access')
    if (!access) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date().toISOString() }])
    setStreaming(true)
    setStreamingText('')
    let full = ''
    await sendChatMessage(msg, access, {
      onSessionId: id => setSessionId(id),
      onToken: t => { full += t; setStreamingText(full) },
      onDone: () => {
        setMessages(prev => [...prev, { role: 'assistant', content: full, timestamp: new Date().toISOString() }])
        setStreamingText('')
        setStreaming(false)
      },
      onError: err => {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err}`, timestamp: new Date().toISOString() }])
        setStreamingText('')
        setStreaming(false)
      },
    }, sessionId, caseId)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-gold-500 to-gold-400 text-primary-900 font-bold text-sm shadow-xl shadow-gold-900/30 hover:scale-105 active:scale-95 transition-all"
        title="Ask AI about this case"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Ask AI
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 rounded-2xl border border-gold-400/20 bg-primary-900 shadow-2xl shadow-black/40 flex flex-col overflow-hidden" style={{ maxHeight: '70vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gold-500/10 to-transparent border-b border-gold-400/10">
            <div>
              <p className="text-sm font-semibold text-gold-300">Case AI Assistant</p>
              <p className="text-[10px] text-neutral-500 truncate max-w-[220px]">{caseTitle}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-neutral-500 hover:text-neutral-200 text-lg leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.length === 0 && !streaming && (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-neutral-400">Ask anything about your case</p>
                {[
                  "What's the current status?",
                  "What happens next?",
                  "How long will this take?",
                ].map(q => (
                  <button key={q} onClick={() => { setInput(q); setTimeout(() => send(), 0) }}
                    className="block w-full text-left text-xs text-gold-400 bg-gold-500/5 border border-gold-500/15 rounded-lg px-3 py-2 hover:bg-gold-500/10 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${m.role === 'user' ? 'bg-gold-500/20 text-gold-100 border border-gold-400/20' : 'bg-primary-800/60 text-neutral-200 border border-neutral-700/40'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {streaming && streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed bg-primary-800/60 text-neutral-200 border border-neutral-700/40">
                  {streamingText}
                  <span className="inline-block w-1 h-3 bg-gold-400 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-neutral-700/30 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about your case..."
              disabled={streaming}
              className="flex-1 bg-white/5 border border-neutral-700/40 rounded-xl px-3 py-2 text-xs text-neutral-50 placeholder-neutral-600 focus:outline-none focus:border-gold-400/40 disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={streaming || !input.trim()}
              className="flex-shrink-0 h-9 w-9 rounded-xl bg-gold-500/20 border border-gold-400/30 text-gold-300 hover:bg-gold-500/30 disabled:opacity-40 flex items-center justify-center transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
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
  const [role, setRole] = useState<'lawyer' | 'client'>('client')

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
    setRole(getPortalRole())
    void load()
  }, [load])

  const isLawyer = role === 'lawyer'
  const chronological = item ? [...item.timeline].reverse() : []

  useCaseWebSocket(caseId ?? '', (data) => {
    setItem(prev => {
      if (!prev) return prev
      return {
        ...prev,
        ...(data.status ? { status: data.status as string } : {}),
        timeline: data.timeline ? (data.timeline as CaseItem['timeline']) : prev.timeline,
      }
    })
  })

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

      {/* Booking Request card — shown when case originated as a consultation booking */}
      {item.booking_status && (() => {
        const meta = item.booking_metadata ?? {}
        const bs = item.booking_status
        const isPending  = bs === 'pending'
        const isAccepted = bs === 'accepted'
        const bannerCls = isPending  ? 'border-amber-500/30 bg-amber-500/5' :
                          isAccepted ? 'border-emerald-500/30 bg-emerald-500/5' :
                                       'border-crimson-500/30 bg-crimson-500/5'
        const badgeCls  = isPending  ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                          isAccepted ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                                       'border-crimson-500/30 bg-crimson-500/10 text-crimson-400'
        const badgeText = isPending ? 'Awaiting Response' : isAccepted ? 'Accepted' : 'Declined'
        return (
          <div className={`rounded-xl border p-5 space-y-4 ${bannerCls}`}>
            <div className="flex items-center justify-between">
              <p className="font-heading text-sm font-semibold text-neutral-100">Booking Request</p>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${badgeCls}`}>{badgeText}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {meta.target_name && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Booked with</p>
                  <p className="text-neutral-100 font-medium">{meta.target_name}</p>
                </div>
              )}
              {meta.consultation_type && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Consultation type</p>
                  <p className="text-neutral-200 capitalize">{meta.consultation_type.replace('_', ' ')}</p>
                </div>
              )}
              {meta.preferred_date && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Requested date</p>
                  <p className="text-neutral-200">{meta.preferred_date}{meta.preferred_time ? ` at ${meta.preferred_time}` : ''}</p>
                </div>
              )}
              {meta.location && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Location</p>
                  <p className="text-neutral-200">{meta.location}</p>
                </div>
              )}
              {meta.booking_fee && parseFloat(meta.booking_fee) > 0 && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Booking fee</p>
                  <p className="text-gold-400 font-semibold">{parseFloat(meta.booking_fee).toLocaleString()} XAF</p>
                </div>
              )}
              {meta.urgency && (
                <div>
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-0.5">Priority</p>
                  <p className={`capitalize font-medium ${meta.urgency === 'urgent' ? 'text-crimson-400' : 'text-neutral-300'}`}>{meta.urgency}</p>
                </div>
              )}
            </div>
            {bs === 'declined' && meta.decline_reason && (
              <div className="pt-3 border-t border-crimson-500/20 text-sm text-neutral-400">
                <span className="text-crimson-300 font-medium">Decline reason: </span>{meta.decline_reason}
              </div>
            )}
            <Link href={`/bookings/${item.id}`} className="inline-block text-xs text-gold-400 hover:text-gold-300 font-medium transition-colors">
              View full booking details →
            </Link>
          </div>
        )
      })()}

      {/* Case progress stepper — clients only */}
      {!isLawyer && <CaseProgressCard caseItem={item} />}

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
        {item.client_id && isLawyer && (
          <div className="p-2">
            <ClientCard clientId={item.client_id} clientEmail={item.booking_metadata?.client_email} />
          </div>
        )}
        {item.assigned_lawyer_id && !isLawyer && (
          <div className="p-2">
            <LawyerCard lawyerUserId={item.assigned_lawyer_id} fallbackName={item.booking_metadata?.target_name} />
          </div>
        )}
      </div>

      {/* Court session logger — shown to lawyers when case is active in court */}
      {isLawyer && ['in_progress', 'hearing_scheduled', 'hearing_adjourned', 'awaiting_court_date'].includes(item.status) && (
        <CourtSessionPanel caseId={item.id} currentStatus={item.status} onLogged={load} />
      )}

      {/* AI Case Intelligence — lawyers only */}
      {isLawyer && <AICaseIntelligenceCard caseItem={item} />}

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
          <div className="space-y-3">
            <AddNotePanel caseId={item.id} onAdded={load} />
            <MeetingNotesPanel
              caseId={item.id}
              caseType={item.case_type}
              clientName={item.booking_metadata?.target_name ?? item.client_id ?? 'Client'}
              onNoteSaved={load}
            />
          </div>
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

      {/* AI Case Bot — shown for clients to ask about their case in natural language */}
      {!isLawyer && (
        <ClientCaseBot caseId={item.id} caseTitle={item.title} />
      )}
    </div>
  )
}
