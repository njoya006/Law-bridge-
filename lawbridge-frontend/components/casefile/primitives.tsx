'use client'

import React from 'react'

// ── Small shared primitives for the Case File workspace ───────────────────────

export function daysBetween(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00')
  return Math.round((d.getTime() - Date.now()) / 86400000)
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch { return iso }
}

export function fmtXAF(n: number | string): string {
  const v = typeof n === 'string' ? parseFloat(n) : n
  return `${(v || 0).toLocaleString()} XAF`
}

/** Countdown pill that colours by urgency — the visual heartbeat of deadlines/detention. */
export function Countdown({ days, overdueLabel = 'Overdue' }: { days: number | null; overdueLabel?: string }) {
  if (days === null) return <span className="text-xs text-neutral-500">—</span>
  if (days < 0) return <span className="text-xs font-bold text-crimson-400">{overdueLabel} · {Math.abs(days)}d</span>
  if (days === 0) return <span className="text-xs font-bold text-crimson-300">Today</span>
  if (days <= 3) return <span className="text-xs font-semibold text-crimson-300">In {days}d</span>
  if (days <= 7) return <span className="text-xs font-semibold text-amber-300">In {days}d</span>
  return <span className="text-xs text-neutral-400">In {days}d</span>
}

export function SectionHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h4 className="font-heading text-sm font-semibold text-neutral-100">{title}</h4>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyRow({ text }: { text: string }) {
  return <p className="text-xs text-neutral-500 py-6 text-center">{text}</p>
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-portal bg-portal-soft px-3 py-1.5 text-xs font-semibold text-portal hover:opacity-90 transition-opacity"
    >
      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      {label}
    </button>
  )
}

/** Compact labelled field for the add/edit forms. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">{label}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'w-full rounded-lg bg-primary-900/60 border border-white/10 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-portal-solid'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputCls} />
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={inputCls}>{children}</select>
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={inputCls} />
}

/** Inline expandable add form wrapper with Save / Cancel. */
export function InlineForm({ children, onSave, onCancel, saving, saveLabel = 'Save' }: {
  children: React.ReactNode; onSave: () => void; onCancel: () => void; saving?: boolean; saveLabel?: string
}) {
  return (
    <div className="rounded-xl border border-portal/30 bg-portal-soft/40 p-4 space-y-3 animate-fade-up">
      {children}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-lg bg-portal-accent px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Saving…' : saveLabel}
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg border border-white/10 px-4 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 text-neutral-600 hover:text-crimson-400 transition-colors p-1"
      title="Delete"
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></svg>
    </button>
  )
}
