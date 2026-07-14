'use client'

import React, { useEffect, useState, useCallback } from 'react'

type StalledCase = { case_id: string; title: string; status: string; days_stale: number }
type LawyerLoad = {
  lawyer_id: string
  active_cases: number
  closed_cases_count: number
  avg_resolution_days: number
  cases_this_month: number
}
type IntelligenceData = {
  total_active_cases: number
  total_cases_all_time: number
  stalled_cases: StalledCase[]
  lawyer_loads: LawyerLoad[]
  status_distribution: Record<string, number>
  avg_resolution_days: number
  ai_narrative: string | string[]
  ai_bullet_insights: string[]
}

const STATUS_COLORS: Record<string, string> = {
  in_progress: 'bg-emerald-500',
  filed: 'bg-blue-500',
  assigned: 'bg-blue-400',
  under_review: 'bg-indigo-400',
  evidence_collection: 'bg-amber-500',
  awaiting_court_date: 'bg-orange-400',
  hearing_scheduled: 'bg-orange-500',
  hearing_adjourned: 'bg-red-400',
  mediation: 'bg-purple-500',
  appeal_filed: 'bg-pink-500',
  appeal_in_progress: 'bg-pink-400',
  closed: 'bg-neutral-500',
  settled: 'bg-emerald-700',
  archived: 'bg-neutral-600',
}

function getNarrative(data: IntelligenceData): string {
  if (typeof data.ai_narrative === 'string') return data.ai_narrative
  return ''
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

function KpiTile({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl border ${color} bg-primary-800/40 p-5`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-display font-bold text-neutral-100">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  )
}

function StatusDistributionBar({ dist }: { dist: Record<string, number> }) {
  const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return null
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
      <h3 className="text-sm font-semibold text-neutral-200 mb-4">Case Status Distribution</h3>
      <div className="space-y-2.5">
        {entries.map(([status, count]) => {
          const pct = (count / total) * 100
          const colorClass = STATUS_COLORS[status] ?? 'bg-neutral-500'
          return (
            <div key={status}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-400 capitalize">{status.replace(/_/g, ' ')}</span>
                <span className="text-xs text-neutral-500">{count} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-primary-700">
                <div className={`h-1.5 rounded-full ${colorClass} opacity-70`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StalledCasesTable({ cases }: { cases: StalledCase[] }) {
  const sorted = [...cases].sort((a, b) => b.days_stale - a.days_stale)
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/30 overflow-hidden">
      <div className="p-4 border-b border-white/8">
        <h3 className="text-sm font-semibold text-neutral-200">Stalled Cases</h3>
        <p className="text-xs text-neutral-500 mt-0.5">No activity in 14+ days</p>
      </div>
      {sorted.length === 0 ? (
        <div className="p-8 text-center text-neutral-500 text-sm">No stalled cases — all cases are active</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/6">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Case</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Days Stale</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 10).map((c, i) => (
              <tr key={c.case_id} className={i % 2 === 0 ? '' : 'bg-white/[0.02]'}>
                <td className="px-4 py-2.5 text-sm text-neutral-300 max-w-[160px] truncate">
                  {c.title || `Case ${c.case_id.slice(0, 8)}`}
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-[11px] text-neutral-500 capitalize">{c.status.replace(/_/g, ' ')}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`text-xs font-semibold ${c.days_stale > 30 ? 'text-red-400' : c.days_stale > 21 ? 'text-amber-400' : 'text-neutral-400'}`}>
                    {c.days_stale}d
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function LawyerWorkloadTable({ loads }: { loads: LawyerLoad[] }) {
  const sorted = [...loads].sort((a, b) => b.active_cases - a.active_cases).slice(0, 10)
  const maxActive = Math.max(...sorted.map(l => l.active_cases), 1)
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/30 overflow-hidden">
      <div className="p-4 border-b border-white/8">
        <h3 className="text-sm font-semibold text-neutral-200">Lawyer Workload</h3>
        <p className="text-xs text-neutral-500 mt-0.5">Top 10 by active cases</p>
      </div>
      {sorted.length === 0 ? (
        <div className="p-8 text-center text-neutral-500 text-sm">No lawyer data available yet</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/6">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Lawyer</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Active</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Closed</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Avg Days</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l, i) => (
              <tr key={l.lawyer_id} className={i % 2 === 0 ? '' : 'bg-white/[0.02]'}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-400">{l.lawyer_id.slice(0, 8)}…</span>
                    {l.active_cases > 10 && (
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-1.5 py-px text-[9px] font-bold text-amber-400">OVERLOADED</span>
                    )}
                  </div>
                  <div className="mt-1 h-1 w-24 rounded-full bg-primary-700">
                    <div className="h-1 rounded-full bg-gold-500/50" style={{ width: `${(l.active_cases / maxActive) * 100}%` }} />
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right text-sm font-semibold text-neutral-200">{l.active_cases}</td>
                <td className="px-4 py-2.5 text-right text-sm text-neutral-400">{l.closed_cases_count}</td>
                <td className="px-4 py-2.5 text-right text-sm text-neutral-400">{l.avg_resolution_days.toFixed(0)}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function IntelligencePage() {
  const [data, setData] = useState<IntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [showFullNarrative, setShowFullNarrative] = useState(false)

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch('/api/v1/monitoring/firm-intelligence/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json() as IntelligenceData
        setData(json)
        setLastFetched(new Date())
      }
    } catch {
      // Network error — leave data as-is, show empty state
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const narrative = data ? getNarrative(data) : ''
  const NARRATIVE_LIMIT = 400

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-neutral-50">AI Intelligence Hub</h1>
          <p className="text-sm text-neutral-500 mt-1">Platform-wide case intelligence and AI management insights</p>
        </div>
        <button
          onClick={() => void load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-primary-800/40 px-4 py-2 text-sm text-neutral-300 hover:border-white/20 hover:text-neutral-100 disabled:opacity-50 transition-all"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M1 4v6h6M23 20v-6h-6M3.5 15a9 9 0 1 0 .5-4" />
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-56" />
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 py-24 text-center">
          <svg className="w-10 h-10 text-neutral-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path d="M9 17v-2m3 2v-4m3 4v-6M5 20h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
          </svg>
          <p className="text-neutral-400 text-sm font-medium">No intelligence data yet</p>
          <p className="text-neutral-600 text-xs mt-1 max-w-xs mx-auto">
            Intelligence populates as lawyers manage cases on the platform. Check back once cases are active.
          </p>
          <button
            onClick={() => void load(true)}
            className="mt-5 rounded-xl border border-white/10 bg-primary-800/40 px-4 py-2 text-sm text-neutral-300 hover:border-white/20 hover:text-neutral-100 transition-all"
          >
            Try again
          </button>
        </div>
      ) : data ? (
        <>
          {/* Morning Briefing */}
          <div className="rounded-2xl border border-gold-400/20 bg-gradient-to-br from-gold-500/5 to-transparent p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" />
              </svg>
              <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider">AI Platform Briefing</span>
              {lastFetched && (
                <span className="ml-auto text-xs text-neutral-600">
                  {lastFetched.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              )}
            </div>
            {narrative ? (
              <>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {showFullNarrative || narrative.length <= NARRATIVE_LIMIT
                    ? narrative
                    : `${narrative.slice(0, NARRATIVE_LIMIT)}…`}
                </p>
                {narrative.length > NARRATIVE_LIMIT && (
                  <button
                    onClick={() => setShowFullNarrative(v => !v)}
                    className="mt-2 text-xs text-gold-400/60 hover:text-gold-400 transition-colors"
                  >
                    {showFullNarrative ? 'Show less' : 'Show more'}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-neutral-500 italic">
                AI narrative unavailable — the AI service may be starting up. Try refreshing in a moment.
              </p>
            )}
            {data.ai_bullet_insights?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {data.ai_bullet_insights.slice(0, 6).map((b, i) => (
                  <span key={i} className="rounded-full border border-gold-500/20 bg-gold-500/8 px-3 py-1 text-xs text-gold-300">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* KPI Tiles */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiTile label="Active Cases" value={data.total_active_cases} color="border-emerald-500/20" />
            <KpiTile label="All-Time Cases" value={data.total_cases_all_time} color="border-blue-500/20" />
            <KpiTile label="Avg Resolution" value={`${data.avg_resolution_days.toFixed(0)}d`} sub="average days to close" color="border-gold-500/20" />
            <KpiTile label="Stalled Cases" value={data.stalled_cases.length} sub="no activity 14+ days" color="border-amber-500/20" />
          </div>

          {/* Distribution + Stalled */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <StatusDistributionBar dist={data.status_distribution} />
            <StalledCasesTable cases={data.stalled_cases} />
          </div>

          {/* Lawyer Workload */}
          <LawyerWorkloadTable loads={data.lawyer_loads} />
        </>
      ) : null}
    </div>
  )
}
