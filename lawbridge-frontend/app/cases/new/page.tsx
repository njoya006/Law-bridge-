'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCase } from '../../../lib/casesApi'
import { CollapseIcon } from '../../../components/icons/Icons'

const CASE_TYPES = [
  { value: 'criminal',              label: 'Criminal Law' },
  { value: 'family',                label: 'Family Law' },
  { value: 'corporate',             label: 'Corporate Law' },
  { value: 'real_estate',           label: 'Real Estate / Property' },
  { value: 'immigration',           label: 'Immigration Law' },
  { value: 'labor',                 label: 'Labour Law' },
  { value: 'intellectual_property', label: 'Intellectual Property' },
  { value: 'civil_litigation',      label: 'Civil Litigation' },
  { value: 'tax',                   label: 'Tax Law' },
  { value: 'constitutional',        label: 'Constitutional Law' },
  { value: 'commercial',            label: 'Commercial Law' },
  { value: 'other',                 label: 'Other' },
]

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-1.5">
        {label}{required && <span className="text-crimson-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-lg bg-primary-900/60 border border-neutral-700/50 text-neutral-100 placeholder-neutral-600 px-3 py-2.5 text-sm focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/30 transition-colors'
const selectCls = inputCls + ' appearance-none'

export default function NewCasePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    title: '',
    description: '',
    case_type: '',
    legal_tradition: '',
    circuit: '',
    language: 'en',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const canSubmit = form.title.trim().length >= 5 && form.description.trim().length >= 20 && !!form.case_type && !!form.legal_tradition && !!form.circuit

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) {
      setError('Please fill in all required fields. Title must be at least 5 characters and description at least 20.')
      return
    }
    const access = localStorage.getItem('access')
    if (!access) { router.push('/auth/login'); return }

    setSubmitting(true)
    setError('')
    try {
      const result = await createCase(form, access)
      router.push(`/cases/${result.id}`)
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err)
      const clean = raw.replace(/^\d{3}[^:]*:\s*/, '')
      setError(clean.length > 5 ? clean.slice(0, 300) : 'Could not file your case. Please check your connection and try again. If the problem persists, contact support.')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <CollapseIcon width={14} height={14} className="w-3.5 h-3.5" />
          Back
        </button>
        <p className="text-xs text-portal uppercase tracking-[0.2em] font-semibold mb-1">New Matter</p>
        <h1 className="font-display text-display-md text-neutral-50">File a Case</h1>
        <p className="mt-1 text-sm text-neutral-400">Describe your legal matter. A lawyer will be assigned or you can search for one after filing.</p>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-neutral-700/40 bg-gradient-to-b from-primary-800/60 to-primary-800/30 p-6 space-y-5">

        <Field label="Case Title" required>
          <input
            className={inputCls}
            placeholder="e.g. Wrongful Termination — Appeal"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            maxLength={255}
          />
          {form.title.trim().length > 0 && form.title.trim().length < 5 && (
            <p className="mt-1 text-xs text-amber-400">Must be at least 5 characters ({5 - form.title.trim().length} more needed)</p>
          )}
        </Field>

        <Field label="Description" required>
          <textarea
            className={inputCls + ' resize-none min-h-[120px]'}
            placeholder="Describe the facts of your case, what happened, and what outcome you are seeking…"
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={5}
            maxLength={5000}
          />
          <div className="mt-1 flex items-center justify-between">
            {form.description.trim().length > 0 && form.description.trim().length < 20 && (
              <p className="text-xs text-amber-400">Add at least {20 - form.description.trim().length} more characters for a good description</p>
            )}
            {form.description.trim().length >= 20 && <span />}
            <span className="text-[10px] text-neutral-600 ml-auto">{form.description.length}/5000</span>
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Case Type" required>
            <select className={selectCls} value={form.case_type} onChange={e => set('case_type', e.target.value)}>
              <option value="">Select type…</option>
              {CASE_TYPES.map(ct => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Language">
            <select className={selectCls} value={form.language} onChange={e => set('language', e.target.value)}>
              <option value="en">English</option>
              <option value="fr">French</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Legal Tradition" required>
            <select className={selectCls} value={form.legal_tradition} onChange={e => set('legal_tradition', e.target.value)}>
              <option value="">Select…</option>
              <option value="common_law">Common Law</option>
              <option value="civil_law">Civil Law</option>
            </select>
          </Field>

          <Field label="Circuit" required>
            <select className={selectCls} value={form.circuit} onChange={e => set('circuit', e.target.value)}>
              <option value="">Select…</option>
              <option value="anglophone">Anglophone</option>
              <option value="francophone">Francophone</option>
            </select>
          </Field>
        </div>

        {error && (
          <div className="rounded-lg border border-crimson-500/30 bg-crimson-900/10 px-4 py-3 text-sm text-crimson-300">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-semibold transition-colors"
          >
            {submitting ? 'Filing…' : 'File Case'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/discover')}
            className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Or find a lawyer first →
          </button>
        </div>
      </form>

      {/* Info note */}
      <div className="rounded-xl border border-neutral-700/30 bg-primary-900/20 px-5 py-4 text-sm text-neutral-400">
        <p className="font-semibold text-neutral-300 mb-1">What happens next?</p>
        <p>Your case will be filed as a draft. You can then search for a lawyer on the <button onClick={() => router.push('/discover')} className="text-gold-400 hover:text-gold-300 underline underline-offset-2">Discover</button> page and book a consultation, or wait for a lawyer to apply to your open case.</p>
      </div>

    </div>
  )
}
