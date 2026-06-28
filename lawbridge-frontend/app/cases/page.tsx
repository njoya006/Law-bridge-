"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getMyCases, type CaseItem } from '../../lib/casesApi'
import { getCaseProgress } from '../../lib/monitoringApi'

function isStaffPortal(): boolean {
  try { return localStorage.getItem('portalRole') === 'lawyer' } catch { return false }
}

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; bar: string }> = {
  pending:    { label: 'Pending',    dot: 'bg-amber-400',   badge: 'bg-amber-500/10 border-amber-500/30 text-amber-300',   bar: 'bg-amber-400' },
  open:       { label: 'Open',       dot: 'bg-gold-400',    badge: 'bg-gold-500/10 border-gold-500/30 text-gold-300',     bar: 'bg-gold-400' },
  active:     { label: 'Active',     dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', bar: 'bg-emerald-400' },
  in_review:  { label: 'In Review',  dot: 'bg-blue-400',    badge: 'bg-blue-500/10 border-blue-500/30 text-blue-300',     bar: 'bg-blue-400' },
  closed:     { label: 'Closed',     dot: 'bg-neutral-500', badge: 'bg-neutral-700/30 border-neutral-600/30 text-neutral-400', bar: 'bg-neutral-500' },
  resolved:   { label: 'Resolved',   dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', bar: 'bg-emerald-400' },
  declined:   { label: 'Declined',   dot: 'bg-crimson-400', badge: 'bg-crimson-500/10 border-crimson-500/30 text-crimson-300', bar: 'bg-crimson-400' },
}

function statusCfg(s: string) {
  return STATUS_CONFIG[s?.toLowerCase()] ?? { label: s || 'Unknown', dot: 'bg-neutral-500', badge: 'bg-neutral-700/30 border-neutral-600/30 text-neutral-400', bar: 'bg-neutral-400' }
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '—' }
}

function timeAgo(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const d = Math.floor(diff / 86400000)
    if (d === 0) return 'Today'
    if (d === 1) return 'Yesterday'
    if (d < 30) return `${d}d ago`
    const mo = Math.floor(d / 30)
    return mo === 1 ? '1 month ago' : `${mo} months ago`
  } catch { return '—' }
}

// ── Case type icons ───────────────────────────────────────────────────────────

function CaseIcon({ type }: { type: string }) {
  const t = type?.toLowerCase() ?? ''
  if (t.includes('criminal'))
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
  if (t.includes('civil') || t.includes('contract'))
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
  if (t.includes('family'))
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
  if (t.includes('property') || t.includes('land'))
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
  if (t.includes('commercial') || t.includes('business'))
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9"/></svg>
  // default: scales of justice
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l9-3 9 3M3 6v14l9 3 9-3V6M12 3v17"/></svg>
}

// ── Progress bar based on status ──────────────────────────────────────────────

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

  return (
    <Link href={`/cases/${item.id}`} className="group block focus:outline-none">
      <div className="relative rounded-2xl border border-neutral-700/40 bg-gradient-to-b from-primary-800/60 to-primary-800/30 overflow-hidden transition-all duration-300 group-hover:border-gold-500/30 group-hover:shadow-[0_0_32px_rgba(201,146,58,0.07)] group-hover:-translate-y-0.5">

        {/* Subtle top accent bar */}
        <div className={`h-0.5 w-full ${cfg.bar} opacity-60`} />

        {/* Card body */}
        <div className="p-5">

          {/* Header row: icon + ref + status badge */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
                <CaseIcon type={item.case_type} />
              </div>
              <div>
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">#{caseRef}</p>
                <p className="text-[11px] text-neutral-400 capitalize">{item.case_type?.replace(/_/g, ' ') || 'General'}</p>
              </div>
            </div>

            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display text-base text-neutral-50 leading-snug mb-2 line-clamp-2 group-hover:text-gold-300 transition-colors duration-200">
            {item.title || 'Untitled Matter'}
          </h3>

          {/* Description */}
          {item.description && (
            <p className="text-neutral-400 text-xs leading-relaxed line-clamp-2 mb-4">
              {item.description}
            </p>
          )}

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Progress</span>
              <span className="text-[10px] text-neutral-400 font-semibold">{progress}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-primary-900/60">
              <div
                className={`h-1 rounded-full transition-all duration-700 ${cfg.bar}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4 text-xs">
            <div>
              <p className="text-neutral-500 uppercase tracking-widest text-[10px] mb-0.5">Circuit</p>
              <p className="text-neutral-200 font-medium truncate">{item.circuit || '—'}</p>
            </div>
            <div>
              <p className="text-neutral-500 uppercase tracking-widest text-[10px] mb-0.5">Tradition</p>
              <p className="text-neutral-200 font-medium truncate capitalize">{item.legal_tradition?.replace(/_/g, ' ') || '—'}</p>
            </div>
            <div>
              <p className="text-neutral-500 uppercase tracking-widest text-[10px] mb-0.5">Language</p>
              <p className="text-neutral-200 font-medium">{item.language || '—'}</p>
            </div>
            <div>
              <p className="text-neutral-500 uppercase tracking-widest text-[10px] mb-0.5">Filed</p>
              <p className="text-neutral-200 font-medium">{fmtDate(item.created_at)}</p>
            </div>
          </div>

          {/* Lawyer assigned */}
          <div className="flex items-center gap-2 py-3 border-t border-neutral-700/30 mb-3">
            <svg className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            {item.assigned_lawyer_id ? (
              <span className="text-xs text-neutral-300 truncate">Lawyer assigned</span>
            ) : (
              <span className="text-xs text-amber-400/80 italic">Awaiting lawyer assignment</span>
            )}
            <span className="ml-auto text-[10px] text-neutral-500">{timeAgo(item.updated_at)}</span>
          </div>

          {/* Monitoring snapshot or last timeline event */}
          {monitoring ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold">Live Monitoring</p>
                <p className="text-xs text-neutral-300 truncate">{monitoring}</p>
              </div>
              {monitoringUpdatedAt && (
                <span className="text-[10px] text-neutral-500 flex-shrink-0">{timeAgo(monitoringUpdatedAt)}</span>
              )}
            </div>
          ) : lastTimeline ? (
            <div className="flex items-center gap-2 rounded-lg bg-primary-900/40 border border-neutral-700/20 px-3 py-2">
              <svg className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-xs text-neutral-400 truncate flex-1">{lastTimeline.notes || lastTimeline.status}</p>
              <span className="text-[10px] text-neutral-500 flex-shrink-0">{timeAgo(lastTimeline.timestamp)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-primary-900/30 border border-neutral-700/20 px-3 py-2">
              <svg className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <p className="text-xs text-neutral-600 italic">No updates yet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-primary-900/20 border-t border-neutral-700/20 flex items-center justify-between">
          <span className="text-xs text-neutral-500">View full matter</span>
          <svg className="w-4 h-4 text-gold-500/60 group-hover:text-gold-400 transition-colors group-hover:translate-x-0.5 duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
          </svg>
        </div>
      </div>
    </Link>
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
      <Link href="/discover" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm hover:bg-gold-500/20 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        Find a Lawyer
      </Link>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
        const isHtml = raw.includes('<!DOCTYPE') || raw.includes('<html')
        const isJwt = /invalid token|token_not_valid|token has expired/i.test(raw)
        if (isJwt) setError('Session expired. Please sign in again.')
        else if (isHtml) setError('The matters service is temporarily unavailable. Please try again shortly.')
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

  // Aggregate stats
  const open = items.filter(i => ['open', 'active', 'pending', 'in_review'].includes(i.status?.toLowerCase())).length
  const resolved = items.filter(i => ['resolved', 'closed'].includes(i.status?.toLowerCase())).length

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs text-gold-400/70 uppercase tracking-[0.2em] font-semibold mb-1">Client Portal</p>
          <h1 className="font-display text-display-md text-neutral-50">My Matters</h1>
          <p className="mt-1 text-sm text-neutral-400">Track your active legal proceedings and case history.</p>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="rounded-xl border border-neutral-700/30 bg-primary-800/30 px-4 py-2 text-center">
              <p className="text-lg font-bold text-gold-400">{open}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Active</p>
            </div>
            <div className="rounded-xl border border-neutral-700/30 bg-primary-800/30 px-4 py-2 text-center">
              <p className="text-lg font-bold text-emerald-400">{resolved}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Resolved</p>
            </div>
            <div className="rounded-xl border border-neutral-700/30 bg-primary-800/30 px-4 py-2 text-center">
              <p className="text-lg font-bold text-neutral-200">{items.length}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Total</p>
            </div>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && !sessionExpired && (
        <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 px-5 py-4 text-crimson-300 text-sm">
          {error}
        </div>
      )}
      {sessionExpired && (
        <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-gold-100 text-sm">Your session has expired. Please sign in again to reload your matters.</p>
          <Link href="/auth/login" className="inline-flex w-fit rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black hover:bg-gold-400 transition-colors">
            Sign In
          </Link>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-neutral-700/30 bg-primary-800/30 h-80" />
          ))}
        </div>
      )}

      {/* Cards grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
