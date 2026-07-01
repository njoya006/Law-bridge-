'use client'

import React, { useEffect, useState } from 'react'
import { getIntakeForm, submitIntakeForm, type IntakeField, type IntakeForm } from '../../../lib/casesApi'

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: IntakeField
  value: string
  onChange: (v: string) => void
}) {
  const base = 'w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-gold-500/60 transition-colors'
  const border = 'border-neutral-700/60'

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={4}
        className={`${base} ${border} resize-none`}
        required={field.required}
      />
    )
  }

  if (field.type === 'select' && field.options?.length) {
    return (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`${base} ${border}`}
        required={field.required}
      >
        <option value="">— Select an option —</option>
        {field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
      </select>
    )
  }

  const inputType = field.type === 'phone' ? 'tel' : field.type
  return (
    <input
      type={inputType}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={`${base} ${border}`}
      required={field.required}
    />
  )
}

export default function ClientIntakePage({ params }: { params: { token: string } }) {
  const [form, setForm] = useState<IntakeForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getIntakeForm(params.token)
      .then(data => {
        setForm(data)
        if (data.completed) setSubmitted(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [params.token])

  const progress = form
    ? Math.round((Object.keys(responses).filter(k => responses[k]).length / form.form_fields.length) * 100)
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return

    // Validate required fields
    const missing = form.form_fields
      .filter(f => f.required && !responses[f.label]?.trim())
      .map(f => f.label)
    if (missing.length > 0) {
      setError(`Please fill in all required fields: ${missing.slice(0, 2).join(', ')}${missing.length > 2 ? '…' : ''}`)
      return
    }

    setSubmitting(true); setError('')
    try {
      await submitIntakeForm(params.token, responses)
      setSubmitted(true)
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm">Loading your intake form…</span>
        </div>
      </div>
    )
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !form) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-neutral-100">Form not found</h1>
          <p className="text-sm text-neutral-400">This intake form link is invalid or has expired. Please contact your law firm for a new link.</p>
        </div>
      </div>
    )
  }

  // ── Submitted ──────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg className="h-7 w-7 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-neutral-100">Thank you!</h1>
          <p className="text-sm text-neutral-400">
            Your information has been submitted successfully. A member of our team will review your intake and be in touch shortly.
          </p>
          <div className="rounded-xl border border-neutral-700/40 bg-primary-800/20 px-4 py-3 text-xs text-neutral-500">
            <span className="font-medium text-neutral-300">Case type:</span> {form.case_type}
            {form.circuit && <> &nbsp;·&nbsp; <span className="font-medium text-neutral-300">Circuit:</span> {form.circuit}</>}
          </div>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-primary-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-primary-900/60 px-4 py-4">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-gold-400 font-semibold tracking-wider uppercase">LawBridge</p>
            <h1 className="text-base font-semibold text-neutral-100 mt-0.5">Client Intake — {form.case_type}</h1>
          </div>
          {form.circuit && (
            <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400">
              {form.circuit} Circuit
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-800">
        <div
          className="h-1 bg-gold-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 pb-16">
        <p className="mb-6 text-sm text-neutral-400">
          Please answer all questions as completely as possible. Fields marked <span className="text-red-400">*</span> are required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {form.form_fields.map((field, i) => (
            <div key={i} className="space-y-2">
              <label className="block text-sm font-medium text-neutral-200">
                {field.label}
                {field.required && <span className="ml-1 text-red-400">*</span>}
              </label>
              <FieldInput
                field={field}
                value={responses[field.label] ?? ''}
                onChange={v => setResponses(prev => ({ ...prev, [field.label]: v }))}
              />
            </div>
          ))}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gold-500 py-3 text-sm font-semibold text-black disabled:opacity-50 hover:bg-gold-400 transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit Intake Information'}
            </button>
            <p className="mt-3 text-center text-xs text-neutral-600">
              Your information is submitted securely and confidentially.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
