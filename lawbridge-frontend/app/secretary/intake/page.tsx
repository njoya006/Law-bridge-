'use client'

import React, { useState } from 'react'
import { generateIntakeForm, type IntakeField } from '../../../lib/aiApi'
import { saveIntakeForm } from '../../../lib/casesApi'

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
            {field.required && (
              <span className="text-xs text-red-400">*</span>
            )}
          </div>
          {field.placeholder && (
            <p className="mt-1 text-xs text-neutral-500 italic">{field.placeholder}</p>
          )}
          {field.options && field.options.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {field.options.map((opt, i) => (
                <span key={i} className="rounded-full border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400">
                  {opt}
                </span>
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

export default function SecretaryIntakePage() {
  const [caseType, setCaseType] = useState('')
  const [customType, setCustomType] = useState('')
  const [circuit, setCircuit] = useState('Anglophone')
  const [language, setLanguage] = useState('en')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState<IntakeField[] | null>(null)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [error, setError] = useState('')

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

  function copyLink() {
    if (shareLink) navigator.clipboard.writeText(shareLink).catch(() => undefined)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="font-display text-2xl text-neutral-100">Client Intake Form</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Generate a bespoke questionnaire for any case type. Share the link directly with your client — no account required.
        </p>
      </div>

      {/* Configuration card */}
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

      {/* Form preview */}
      {fields && fields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-300">
                Preview — {fields.length} questions
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {effectiveCaseType} · {circuit} Circuit · {language === 'fr' ? 'French' : 'English'}
              </p>
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
            {fields.map((field, i) => (
              <FieldPreviewCard key={i} field={field} index={i} />
            ))}
          </div>

          {/* Share link banner */}
          {shareLink && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-emerald-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <p className="text-sm font-semibold text-emerald-300">Intake form ready — share this link with your client</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 rounded-lg border border-neutral-700 bg-primary-900/60 px-3 py-2 text-xs text-neutral-200 truncate">
                  {shareLink}
                </code>
                <button
                  onClick={copyLink}
                  className="flex-shrink-0 rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-300 hover:bg-white/5 transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-neutral-500">
                The client can open this link without signing in and submit their information directly.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setFields(null); setShareLink(null); setCaseType(''); setCustomType('') }}
                  className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:bg-white/5"
                >
                  Create another
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
