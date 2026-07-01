'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { generateIntakeForm, type IntakeField } from '../../../lib/aiApi'
import { saveIntakeForm, getMyIntakeForms, getIntakeFormDetail, type IntakeFormSummary } from '../../../lib/casesApi'

const CASE_TYPES = [
  'Criminal Defence',
  'Civil Litigation',
  'Family Law (Divorce)',
  'Family Law (Custody)',
  'Land / Property Dispute',
  'Labour & Employment',
  'Corporate / Commercial',
  'Immigration',
  'Debt Recovery',
  'Human Rights',
  'Administrative Law',
  'Succession & Estate',
]

const CIRCUITS = ['Anglophone', 'Francophone']
const LANGUAGES = [{ value: 'en', label: 'English' }, { value: 'fr', label: 'French' }]

// ── Response Drawer ────────────────────────────────────────────────────────────
type ResponseDrawerProps = {
  summary: IntakeFormSummary
  onClose: () => void
  accessToken: string
}

function ResponseDrawer({ summary, onClose, accessToken }: ResponseDrawerProps) {
  const [detail, setDetail] = useState<{ form_fields: IntakeField[]; responses: Record<string, string>; completed_at: string | null } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getIntakeFormDetail(summary.token, accessToken)
      .then(d => setDetail(d as { form_fields: IntakeField[]; responses: Record<string, string>; completed_at: string | null }))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [summary.token, accessToken])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const link = `${origin}/intake/${summary.token}`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-700/50 bg-primary-900 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-700/40 bg-primary-900/95 backdrop-blur-sm px-6 py-4">
          <div>
            <h2 className="font-semibold text-neutral-100">{summary.case_type}</h2>
            <p className="text-xs text-neutral-500 mt-0.5">{summary.circuit} Circuit · {new Date(summary.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${summary.completed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'}`}>
              {summary.completed ? 'Submitted' : 'Awaiting client'}
            </span>
            <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Share link */}
          <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-4">
            <p className="text-xs font-semibold text-neutral-400 mb-2">Client link</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 text-xs text-gold-300 truncate font-mono">{link}</code>
              <button
                onClick={() => navigator.clipboard.writeText(link).catch(() => undefined)}
                className="flex-shrink-0 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Responses */}
          {loading ? (
            <div className="flex items-center justify-center py-8 text-neutral-500 text-sm gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading responses…
            </div>
          ) : !detail ? (
            <p className="text-sm text-neutral-500 text-center py-4">Could not load responses.</p>
          ) : !summary.completed ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-900/10 p-5 text-center space-y-2">
              <div className="mx-auto w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-amber-300">Awaiting client submission</p>
              <p className="text-xs text-neutral-500">Share the link above — the client has not yet submitted their responses.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-neutral-700/40" />
                <span className="text-xs text-neutral-500 font-medium">Client Responses</span>
                <div className="h-px flex-1 bg-neutral-700/40" />
              </div>
              {detail.form_fields.map((field, i) => (
                <div key={i} className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-4">
                  <p className="text-xs font-semibold text-neutral-400 mb-1.5">{field.label}{field.required && <span className="text-red-400 ml-1">*</span>}</p>
                  <p className="text-sm text-neutral-100 leading-relaxed">
                    {detail.responses[field.label] || <span className="text-neutral-600 italic">No response</span>}
                  </p>
                </div>
              ))}
              {detail.completed_at && (
                <p className="text-xs text-neutral-600 text-right pt-1">
                  Submitted {new Date(detail.completed_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Field Preview Card ─────────────────────────────────────────────────────────
function FieldPreviewCard({ field, index }: { field: IntakeField; index: number }) {
  const typeLabel: Record<string, string> = {
    text: 'Short text', textarea: 'Long text', select: 'Multiple choice',
    date: 'Date picker', email: 'Email', phone: 'Phone',
  }
  return (
    <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-500">{index + 1}.</span>
            <p className="text-sm font-medium text-neutral-100">{field.label}</p>
            {field.required && <span className="text-xs text-red-400">*</span>}
          </div>
          {field.placeholder && <p className="mt-1 text-xs text-neutral-500 italic">{field.placeholder}</p>}
          {field.options && field.options.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {field.options.map((opt, i) => (
                <span key={i} className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">{opt}</span>
              ))}
            </div>
          )}
        </div>
        <span className="flex-shrink-0 rounded-md bg-primary-900/60 border border-neutral-700/40 px-2 py-0.5 text-xs text-neutral-400">
          {typeLabel[field.type] ?? field.type}
        </span>
      </div>
    </div>
  )
}

// ── Intake Card ────────────────────────────────────────────────────────────────
function IntakeCard({ form, onOpen }: { form: IntakeFormSummary; onOpen: () => void }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const link = `${origin}/intake/${form.token}`
  const date = new Date(form.created_at)
  const relativeTime = () => {
    const diff = Date.now() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <div
      onClick={onOpen}
      className="group relative rounded-2xl border border-neutral-700/40 bg-primary-800/20 hover:bg-primary-800/40 hover:border-gold-500/20 transition-all cursor-pointer p-5"
    >
      {/* Status strip */}
      <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${form.completed ? 'bg-emerald-500' : 'bg-amber-500'}`} />

      <div className="pl-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-100 text-sm group-hover:text-gold-300 transition-colors truncate">{form.case_type}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{form.circuit} Circuit</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${form.completed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
              {form.completed ? 'Submitted' : 'Pending'}
            </span>
            <span className="text-xs text-neutral-600">{relativeTime()}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
          <span>{form.response_count} field{form.response_count !== 1 ? 's' : ''}</span>
          {form.completed && form.response_count > 0 && (
            <span className="text-emerald-500">· {form.response_count} answered</span>
          )}
        </div>

        {/* Link preview */}
        <div className="mt-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <code className="flex-1 min-w-0 text-xs text-neutral-600 truncate font-mono">{link}</code>
          <button
            onClick={() => navigator.clipboard.writeText(link).catch(() => undefined)}
            className="flex-shrink-0 rounded-lg border border-neutral-700/60 px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function SecretaryIntakePage() {
  const [tab, setTab] = useState<'new' | 'history'>('new')

  // New form state
  const [caseType, setCaseType] = useState('')
  const [customType, setCustomType] = useState('')
  const [circuit, setCircuit] = useState('Anglophone')
  const [language, setLanguage] = useState('en')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState<IntakeField[] | null>(null)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [error, setError] = useState('')

  // History state
  const [intakes, setIntakes] = useState<IntakeFormSummary[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [openDrawer, setOpenDrawer] = useState<IntakeFormSummary | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'submitted'>('all')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAccessToken(localStorage.getItem('access') || '')
    }
  }, [])

  const loadHistory = useCallback((token: string) => {
    if (!token) return
    setHistoryLoading(true)
    getMyIntakeForms(token)
      .then(setIntakes)
      .catch(() => setIntakes([]))
      .finally(() => setHistoryLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'history' && accessToken) loadHistory(accessToken)
  }, [tab, accessToken, loadHistory])

  const effectiveCaseType = caseType === '__custom__' ? customType.trim() : caseType

  async function generate() {
    if (!effectiveCaseType) { setError('Please select or enter a case type'); return }
    const token = localStorage.getItem('access') || ''
    setGenerating(true); setError(''); setFields(null); setShareLink(null)
    try {
      const result = await generateIntakeForm({ case_type: effectiveCaseType, circuit, language }, token)
      setFields(result)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function saveAndShare() {
    if (!fields || !effectiveCaseType) return
    const token = localStorage.getItem('access') || ''
    setSaving(true); setError('')
    try {
      const form = await saveIntakeForm({ case_type: effectiveCaseType, circuit, form_fields: fields }, token)
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      setShareLink(`${origin}/intake/${form.token}`)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'Failed to save form.')
    } finally {
      setSaving(false)
    }
  }

  function resetNew() {
    setFields(null); setShareLink(null); setCaseType(''); setCustomType(''); setError('')
  }

  const filteredIntakes = intakes.filter(f => {
    if (historyFilter === 'pending') return !f.completed
    if (historyFilter === 'submitted') return f.completed
    return true
  })

  const pendingCount = intakes.filter(f => !f.completed).length
  const submittedCount = intakes.filter(f => f.completed).length

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl text-neutral-100">Client Intake Forms</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Generate bespoke questionnaires and review client responses — all in one place.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-primary-800/40 border border-neutral-700/40 mb-6 w-fit">
        <button
          onClick={() => setTab('new')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'new' ? 'bg-gold-500 text-black shadow-sm' : 'text-neutral-400 hover:text-neutral-100'}`}
        >
          New Form
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'history' ? 'bg-gold-500 text-black shadow-sm' : 'text-neutral-400 hover:text-neutral-100'}`}
        >
          Past Intakes
          {pendingCount > 0 && tab !== 'history' && (
            <span className="rounded-full bg-amber-500 text-black text-xs font-bold w-4 h-4 flex items-center justify-center">{pendingCount}</span>
          )}
        </button>
      </div>

      {/* ── NEW FORM TAB ─────────────────────────────────────────────── */}
      {tab === 'new' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-700/40 bg-primary-800/20 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-neutral-300">Form Settings</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-neutral-400 block mb-1.5">Case Type</label>
                <select
                  value={caseType}
                  onChange={e => setCaseType(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-primary-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-gold-500/50"
                >
                  <option value="">— Select case type —</option>
                  {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  <option value="__custom__">Other (type below)</option>
                </select>
                {caseType === '__custom__' && (
                  <input
                    type="text"
                    value={customType}
                    onChange={e => setCustomType(e.target.value)}
                    placeholder="e.g. Insurance Dispute"
                    className="mt-2 w-full rounded-lg border border-neutral-700 bg-primary-900/50 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-500/50"
                  />
                )}
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1.5">Circuit</label>
                <select
                  value={circuit}
                  onChange={e => setCircuit(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-primary-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-gold-500/50"
                >
                  {CIRCUITS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1.5">Form Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-primary-900/50 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-gold-500/50"
                >
                  {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={generating || !effectiveCaseType}
              className="flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50 hover:bg-gold-400 transition-colors"
            >
              {generating ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a7 7 0 100 14A7 7 0 0010 3zm1 4a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
                  </svg>
                  Generate Intake Form
                </>
              )}
            </button>

            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          {/* Field preview */}
          {fields && fields.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-300">Preview — {fields.length} questions</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">{effectiveCaseType} · {circuit} Circuit</p>
                </div>
                {!shareLink && (
                  <button
                    onClick={saveAndShare}
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving…' : 'Save & Get Link'}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {fields.map((field, i) => <FieldPreviewCard key={i} field={field} index={i} />)}
              </div>

              {shareLink && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-emerald-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-sm font-semibold text-emerald-300">Form saved — share this link with your client</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 min-w-0 rounded-lg border border-neutral-700 bg-primary-900/60 px-3 py-2 text-xs text-neutral-200 truncate">{shareLink}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(shareLink).catch(() => undefined)}
                      className="flex-shrink-0 rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-300 hover:bg-white/5 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { resetNew(); setTab('history'); }}
                      className="rounded-lg bg-primary-800/60 border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5"
                    >
                      View in Past Intakes →
                    </button>
                    <button onClick={resetNew} className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:bg-white/5">
                      Create another
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ──────────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="space-y-5">
          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-4 text-center">
              <div className="text-2xl font-bold text-neutral-100">{intakes.length}</div>
              <div className="text-xs text-neutral-500 mt-0.5">Total</div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-900/10 p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
              <div className="text-xs text-amber-600 mt-0.5">Awaiting</div>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{submittedCount}</div>
              <div className="text-xs text-emerald-600 mt-0.5">Submitted</div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'submitted'] as const).map(f => (
              <button
                key={f}
                onClick={() => setHistoryFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${historyFilter === f ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30' : 'border border-neutral-700/60 text-neutral-500 hover:text-neutral-300'}`}
              >
                {f === 'all' ? 'All' : f === 'pending' ? 'Awaiting client' : 'Submitted'}
              </button>
            ))}
            <button
              onClick={() => loadHistory(accessToken)}
              className="ml-auto rounded-full border border-neutral-700/60 px-3 py-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* List */}
          {historyLoading ? (
            <div className="flex items-center justify-center py-12 text-neutral-500 text-sm gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading…
            </div>
          ) : filteredIntakes.length === 0 ? (
            <div className="rounded-2xl border border-neutral-700/30 bg-primary-800/10 p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-neutral-800/60 border border-neutral-700/40 flex items-center justify-center">
                <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-neutral-500">{historyFilter === 'all' ? 'No intake forms yet. Create one from the New Form tab.' : `No ${historyFilter} intakes.`}</p>
              {historyFilter === 'all' && (
                <button onClick={() => setTab('new')} className="rounded-xl bg-gold-500/10 border border-gold-500/20 px-4 py-2 text-xs text-gold-400 hover:bg-gold-500/20 transition-colors">
                  Create your first intake form →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIntakes.map(form => (
                <IntakeCard key={form.id} form={form} onOpen={() => setOpenDrawer(form)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Response drawer */}
      {openDrawer && (
        <ResponseDrawer
          summary={openDrawer}
          accessToken={accessToken}
          onClose={() => setOpenDrawer(null)}
        />
      )}
    </div>
  )
}
