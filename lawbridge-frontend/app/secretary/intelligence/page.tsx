'use client'

import React, { useEffect, useState } from 'react'
import { getFirmIntelligence, type FirmIntelligence, type StalledCase } from '../../../lib/monitoringApi'

// ── Expandable Stalled Case Card ───────────────────────────────────────────────
function StalledCard({ c }: { c: StalledCase }) {
  const [open, setOpen] = useState(false)
  const urgency = c.days_stale > 30 ? 'critical' : c.days_stale > 21 ? 'high' : 'medium'
  const urgencyColor = urgency === 'critical' ? 'text-red-400' : urgency === 'high' ? 'text-amber-400' : 'text-amber-300'

  return (
    <div className="rounded-lg bg-amber-900/20 border border-amber-500/10 overflow-hidden transition-all">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-amber-900/30 transition-colors group"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-neutral-100 truncate group-hover:text-amber-300 transition-colors">
            {c.title}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5 capitalize">{c.status.replace(/_/g, ' ')}</div>
        </div>
        <span className={`text-xs font-semibold flex-shrink-0 ${urgencyColor}`}>{c.days_stale}d stalled</span>
        <svg
          className={`w-4 h-4 text-neutral-500 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-amber-500/10 px-4 py-3 bg-amber-900/10 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-neutral-500">Case ID</span>
              <p className="text-neutral-300 font-mono mt-0.5">{c.case_id.slice(0, 16)}…</p>
            </div>
            <div>
              <span className="text-neutral-500">Days without update</span>
              <p className={`font-semibold mt-0.5 ${urgencyColor}`}>{c.days_stale} days</p>
            </div>
            <div>
              <span className="text-neutral-500">Current status</span>
              <p className="text-neutral-300 capitalize mt-0.5">{c.status.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <span className="text-neutral-500">Urgency</span>
              <p className={`capitalize font-medium mt-0.5 ${urgencyColor}`}>{urgency}</p>
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-2">
            Action required: contact the assigned lawyer to get a case update.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function FirmIntelligencePage() {
  const [data, setData] = useState<FirmIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access') ?? ''
    if (!token) { setError('Not authenticated'); setLoading(false); return }
    getFirmIntelligence(token)
      .then(setData)
      .catch(() => setError('Could not load firm intelligence data.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="w-8 h-8 animate-spin text-gold-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-crimson-500/20 bg-crimson-900/10 p-6 text-crimson-400 text-sm">
        {error || 'No data available.'}
      </div>
    )
  }

  const maxLoad = Math.max(...data.lawyer_loads.map(l => l.active_cases), 1)

  return (
    <div className="space-y-6">
      {/* Header — shows firm name */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-display-md text-neutral-50">Firm Intelligence</h1>
          {data.firm_name && (
            <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-0.5 text-xs font-semibold text-gold-400">
              {data.firm_name}
            </span>
          )}
        </div>
        <p className="text-neutral-400 text-sm mt-1">
          {data.firm_name
            ? `Operational overview for ${data.firm_name} — case loads, bottlenecks, and AI insights.`
            : 'AI-powered operational overview — case loads, bottlenecks, and performance insights.'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-5">
          <div className="text-3xl font-bold text-neutral-50">{data.total_active_cases}</div>
          <div className="text-sm text-neutral-400 mt-1">Active Cases</div>
        </div>
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-5">
          <div className="text-3xl font-bold text-neutral-50">{data.total_cases_all_time}</div>
          <div className="text-sm text-neutral-400 mt-1">Total Cases</div>
        </div>
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-5">
          <div className="text-3xl font-bold text-neutral-50">{data.avg_resolution_days}</div>
          <div className="text-sm text-neutral-400 mt-1">Avg. Resolution Days</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-5">
          <div className="text-3xl font-bold text-amber-400">{data.stalled_cases.length}</div>
          <div className="text-sm text-amber-500 mt-1">Stalled Cases</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lawyer Load Distribution */}
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-5 space-y-4">
          <h2 className="font-heading text-body-lg text-neutral-50">Lawyer Load Distribution</h2>
          {data.lawyer_loads.length === 0 ? (
            <p className="text-sm text-neutral-500">No lawyer data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.lawyer_loads.map((lawyer) => {
                const pct = Math.round((lawyer.active_cases / maxLoad) * 100)
                const barColor = pct >= 80 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                return (
                  <div key={lawyer.lawyer_id} className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span className="font-mono">{lawyer.lawyer_id.slice(0, 8)}…</span>
                      <span>{lawyer.active_cases} active · {lawyer.closed_cases_count} closed</span>
                    </div>
                    <div className="h-2 bg-neutral-700/40 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-5 space-y-4">
          <h2 className="font-heading text-body-lg text-neutral-50">Case Status Breakdown</h2>
          {Object.keys(data.status_distribution).length === 0 ? (
            <p className="text-sm text-neutral-500">No status data yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(data.status_distribution)
                .sort(([, a], [, b]) => b - a)
                .map(([status, count]) => {
                  const total = data.total_active_cases || 1
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <span className="text-xs text-neutral-400 w-36 truncate capitalize">{status.replace(/_/g, ' ')}</span>
                      <div className="flex-1 h-2 bg-neutral-700/40 rounded-full overflow-hidden">
                        <div className="h-full bg-gold-500/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-neutral-500 w-8 text-right">{count}</span>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      </div>

      {/* Bottleneck Detector — expandable, no broken routing */}
      {data.stalled_cases.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-900/10 p-5 space-y-3">
          <h2 className="font-heading text-body-lg text-neutral-50 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Bottleneck Detector
            <span className="text-xs font-normal text-amber-500 ml-1">cases stalled &gt;14 days — click to expand</span>
          </h2>
          <div className="space-y-2">
            {data.stalled_cases.map((c) => <StalledCard key={c.case_id} c={c} />)}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {(data.ai_narrative || (data.ai_bullet_insights && data.ai_bullet_insights.length > 0)) && (
        <div className="rounded-xl border border-gold-500/20 bg-gold-900/10 p-5 space-y-3">
          <h2 className="font-heading text-body-lg text-neutral-50 flex items-center gap-2">
            <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            AI Insights
          </h2>
          {data.ai_narrative && (
            <p className="text-sm text-neutral-300 leading-relaxed">{data.ai_narrative}</p>
          )}
          {data.ai_bullet_insights && data.ai_bullet_insights.length > 0 && (
            <ul className="space-y-1.5 mt-2">
              {data.ai_bullet_insights.map((insight, i) => (
                <li key={i} className="flex gap-2 text-sm text-neutral-300">
                  <span className="text-gold-500 mt-0.5 flex-shrink-0">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
