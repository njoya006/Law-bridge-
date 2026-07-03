"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getMyCases, type CaseItem } from '../../lib/casesApi'
import { getCaseProgress } from '../../lib/monitoringApi'

function BotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path strokeLinecap="round" d="M12 2v4M9 11V8a3 3 0 016 0v3" />
      <circle cx="9" cy="16" r="1" fill="currentColor" />
      <circle cx="15" cy="16" r="1" fill="currentColor" />
    </svg>
  )
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  label: string
  dot: string
  badge: string
  bar: string
  border: string
}> = {
  pending:   { label: 'Pending',   dot: 'bg-amber-400',   badge: 'bg-amber-500/10 border-amber-500/30 text-amber-300',     bar: 'bg-amber-400',   border: 'border-l-amber-400/60' },
  open:      { label: 'Open',      dot: 'bg-gold-400',    badge: 'bg-gold-500/10 border-gold-500/30 text-gold-300',       bar: 'bg-gold-400',    border: 'border-l-gold-400/60' },
  active:    { label: 'Active',    dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', bar: 'bg-emerald-400', border: 'border-l-emerald-400/60' },
  in_review: { label: 'In Review', dot: 'bg-blue-400',    badge: 'bg-blue-500/10 border-blue-500/30 text-blue-300',       bar: 'bg-blue-400',    border: 'border-l-blue-400/60' },
  closed:    { label: 'Closed',    dot: 'bg-neutral-500', badge: 'bg-neutral-700/30 border-neutral-600/30 text-neutral-400', bar: 'bg-neutral-500', border: 'border-l-neutral-500/40' },
  resolved:  { label: 'Resolved',  dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', bar: 'bg-emerald-400', border: 'border-l-emerald-400/60' },
  declined:  { label: 'Declined',  dot: 'bg-red-400',     badge: 'bg-red-500/10 border-red-500/30 text-red-300',          bar: 'bg-red-400',     border: 'border-l-red-400/60' },
}

function statusCfg(s: string) {
  return STATUS_CONFIG[s?.toLowerCase()] ?? {
    label: s || 'Unknown',
    dot: 'bg-neutral-500',
    badge: 'bg-neutral-700/30 border-neutral-600/30 text-neutral-400',
    bar: 'bg-neutral-400',
    border: 'border-l-neutral-500/40',
  }
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

function timeAgo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const d = Math.floor(diff / 86400000)
    if (d === 0) return 'Today'
    if (d === 1) return 'Yesterday'
    if (d < 30) return `${d}d ago`
    const mo = Math.floor(d / 30)
    return mo === 1 ? '1 mo ago' : `${mo} mo ago`
  } catch { return '—' }
}

// ── Case type label ───────────────────────────────────────────────────────────

function caseTypeLabel(type: string) {
  return (type || 'General').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const STATUS_PROGRESS: Record<string, number> = {
  pending: 15, open: 35, active: 60, in_review: 80, resolved: 100, closed: 100, declined: 0,
}

// ── Matter card ───────────────────────────────────────────────────────────────

function MatterCard({ item, monitoring, monitoringUpdatedAt }: {
  item: CaseItem
  monitoring?: string
  monitoringUpdatedAt?: string
}) {
  const cfg = statusCfg(item.status)
  const progress = STATUS_PROGRESS[item.status?.toLowerCase()] ?? 25
  const lastTimeline = item.timeline?.[item.timeline.length - 1]
  const caseRef = item.id.slice(0, 8).toUpperCase()
  const router = useRouter()
  const caseTitle = encodeURIComponent(item.title || `${item.case_type} case`)

  return (
    <div
      className="group cursor-pointer"
      onClick={() => router.push(`/cases/${item.id}`)}
    >
      <div className={`rounded-2xl border border-neutral-700/40 border-l-4 ${cfg.border} bg-primary-800/40 transition-all duration-200 group-hover:border-gold-500/30 group-hover:bg-primary-800/60 group-hover:-translate-y-0.5 group-hover:shadow-[0_4px_24px_rgba(0,0,0,0.25)]`}>

        {/* Card body */}
        <div className="p-4 sm:p-5 space-y-4">

          {/* Top row: case ref + type | status badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-mono text-neutral-500 tracking-widest uppercase">#{caseRef}</p>
              <p className="text-xs text-neutral-400 mt-0.5 font-medium">{caseTypeLabel(item.case_type)}</p>
            </div>
            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Title + description */}
          <div>
            <h3 className="font-display text-base sm:text-lg text-neutral-50 leading-snug line-clamp-2 group-hover:text-gold-300 transition-colors duration-150">
              {item.title || 'Untitled Matter'}
            </h3>
            {item.description && (
              <p className="text-neutral-400 text-sm leading-relaxed line-clamp-2 mt-1">
                {item.description}
              </p>
            )}
          </div>

          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">Progress</span>
              <span className="text-[10px] text-neutral-400 font-bold tabular-nums">{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-primary-900/80">
              <div
                className={`h-1.5 rounded-full transition-all duration-700 ${cfg.bar}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Meta row: filed date + lawyer status */}
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-700/20">
            <span>Filed {fmtDate(item.created_at)}</span>
            {item.assigned_lawyer_id ? (
              <span className="flex items-center gap-1 text-emerald-400/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Lawyer assigned
              </span>
            ) : (
              <span className="text-amber-400/70 italic">Awaiting assignment</span>
            )}
          </div>

          {/* Activity / monitoring strip */}
          {monitoring ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">Live</p>
                <p className="text-xs text-neutral-300 truncate">{monitoring}</p>
              </div>
              {monitoringUpdatedAt && (
                <span className="text-[10px] text-neutral-500 flex-shrink-0">{timeAgo(monitoringUpdatedAt)}</span>
              )}
            </div>
          ) : lastTimeline ? (
            <div className="flex items-center gap-2 rounded-xl bg-primary-900/40 border border-neutral-700/20 px-3 py-2.5">
              <svg className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-xs text-neutral-400 truncate flex-1">{lastTimeline.notes || lastTimeline.status}</p>
              <span className="text-[10px] text-neutral-500 flex-shrink-0">{timeAgo(lastTimeline.timestamp)}</span>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-neutral-700/20 flex items-center justify-between">
          <Link
            href={`/chat?case_id=${item.id}&case_title=${caseTitle}`}
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-gold-300 transition-colors border border-neutral-700/40 hover:border-gold-500/30 rounded-lg px-2.5 py-1.5 hover:bg-gold-500/5 active:scale-95"
          >
            <BotIcon />
            Ask AI
          </Link>
          <span className="flex items-center gap-1 text-xs text-neutral-500 group-hover:text-gold-400 transition-colors">
            View
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gold-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l9-3 9 3M3 6v14l9 3 9-3V6M12 3v17"/>
        </svg>
      </div>
      <h3 className="font-display text-display-xs text-neutral-300 mb-2">No matters yet</h3>
      <p className="text-neutral-500 text-sm max-w-xs">When you open a case or book a consultation, your matters will appear here.</p>
      <Link
        href="/discover"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm hover:bg-gold-500/20 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        Find a Lawyer
      </Link>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CasesPage() {
  const router = useRouter()
  const [items, setItems] = useState<CaseItem[]>([])
  const [monitoringMap, setMonitoringMap] = useState<Record<string, string>>({})
  const [monitoringUpdatedAt, setMonitoringUpdatedAt] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const sessionExpired = /session expired|token has expired|token_not_valid/i.test(error)

  useEffect(() => {
    if (sessionExpired) router.replace('/auth/login?reason=session-expired')
  }, [router, sessionExpired])

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { setError('Sign in to see your matters.'); setLoading(false); return }

      const [casesResult, progressResult] = await Promise.allSettled([
        getMyCases(access),
        getCaseProgress(access),
      ])

      if (casesResult.status === 'fulfilled') {
        setItems(casesResult.value.results)
      } else {
        const raw = casesResult.reason instanceof Error ? casesResult.reason.message : String(casesResult.reason)
        if (/invalid token|token_not_valid|token has expired/i.test(raw)) setError('Session expired. Please sign in again.')
        else if (raw.includes('<!DOCTYPE') || raw.includes('<html')) setError('The matters service is temporarily unavailable.')
        else setError(raw.slice(0, 200))
      }

      if (progressResult.status === 'fulfilled') {
        const statusMap: Record<string, string> = {}
        const updatedMap: Record<string, string> = {}
        for (const p of progressResult.value.results ?? []) {
          if (p.case_id) { statusMap[p.case_id] = p.status; updatedMap[p.case_id] = p.updated_at }
        }
        setMonitoringMap(statusMap)
        setMonitoringUpdatedAt(updatedMap)
      }
      setLoading(false)
    }
    void run()
  }, [])

  const active = items.filter(i => ['open', 'active', 'pending', 'in_review'].includes(i.status?.toLowerCase())).length
  const resolved = items.filter(i => ['resolved', 'closed'].includes(i.status?.toLowerCase())).length

  return (
    <div className="space-y-6 pb-4">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] text-gold-400/70 uppercase tracking-[0.2em] font-semibold mb-0.5">Client Portal</p>
          <h1 className="font-display text-display-md text-neutral-50">My Matters</h1>
          <p className="mt-1 text-sm text-neutral-400">Track your active legal proceedings and case history.</p>
        </div>
        {items.length > 0 && (
          <div className="flex items-stretch gap-2 flex-shrink-0">
            {[
              { value: active,        label: 'Active',   color: 'text-gold-400' },
              { value: resolved,      label: 'Resolved', color: 'text-emerald-400' },
              { value: items.length,  label: 'Total',    color: 'text-neutral-200' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-neutral-700/30 bg-primary-800/30 px-4 py-2 text-center min-w-[56px]">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-neutral-500 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error / session banners */}
      {error && !sessionExpired && (
        <div className="rounded-xl border border-red-500/30 bg-red-900/10 px-4 py-3 text-red-300 text-sm">{error}</div>
      )}
      {sessionExpired && (
        <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-gold-100 text-sm">Your session has expired. Please sign in again.</p>
          <Link href="/auth/login" className="inline-flex w-fit rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black hover:bg-gold-400 transition-colors">
            Sign In
          </Link>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-neutral-700/30 bg-primary-800/30 h-64" />
          ))}
        </div>
      )}

      {/* Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.length === 0 && !error && <EmptyState />}
          {items.map(item => (
            <MatterCard
              key={item.id}
              item={item}
              monitoring={monitoringMap[item.id]}
              monitoringUpdatedAt={monitoringUpdatedAt[item.id]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
