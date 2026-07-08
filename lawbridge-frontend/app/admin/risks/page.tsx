'use client'

import React, { useEffect, useState, useCallback } from 'react'

type RiskItem = {
  case_id: string
  title: string
  status: string
  risk_score: number
  risk_level: 'critical' | 'watch' | 'healthy'
  risk_factors: string[]
}
type RiskCounts = { critical: number; watch: number; healthy: number }
type RiskFilter = 'all' | 'critical' | 'watch' | 'healthy'

const RISK_CONFIG = {
  critical: { label: 'Critical', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', bar: 'bg-red-400', accent: 'border-l-red-400' },
  watch:    { label: 'Watch',    text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: 'bg-amber-400', accent: 'border-l-amber-400' },
  healthy:  { label: 'Healthy',  text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'bg-emerald-400', accent: 'border-l-emerald-400' },
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

function RiskCaseCard({ item }: { item: RiskItem }) {
  const cfg = RISK_CONFIG[item.risk_level]
  return (
    <div className={`rounded-2xl border border-white/8 bg-primary-800/30 p-4 border-l-4 ${cfg.accent} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-200 truncate">
            {item.title || `Case ${item.case_id.slice(0, 8)}`}
          </p>
          <span className="text-[11px] text-neutral-500 capitalize mt-0.5 block">
            {item.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.text} ${cfg.bg} ${cfg.border}`}>
            {cfg.label}
          </span>
          <span className={`text-2xl font-display font-bold ${cfg.text}`}>{item.risk_score}</span>
        </div>
      </div>

      {/* Score meter */}
      <div className="relative h-1.5 w-full rounded-full bg-white/5">
        <div className={`absolute h-1.5 rounded-full ${cfg.bar} opacity-80`} style={{ width: `${item.risk_score}%` }} />
      </div>

      {/* Risk factors */}
      {item.risk_factors.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {item.risk_factors.map((f, i) => (
            <span key={i} className="rounded-full border border-neutral-700/50 px-2 py-0.5 text-[11px] text-neutral-400">
              {f}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-neutral-600 italic">No risk factors detected</p>
      )}
    </div>
  )
}

export default function RisksPage() {
  const [cases, setCases] = useState<RiskItem[]>([])
  const [counts, setCounts] = useState<RiskCounts>({ critical: 0, watch: 0, healthy: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<RiskFilter>('all')
  const [lastRefreshed, setLastRefreshed] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch('/api/v1/monitoring/case-risks/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as { cases: RiskItem[]; counts: RiskCounts }
      setCases(json.cases ?? [])
      setCounts(json.counts ?? { critical: 0, watch: 0, healthy: 0 })
      setLastRefreshed(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load risk data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const t = setInterval(() => void load(), 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [load])

  const filtered = filter === 'all' ? cases : cases.filter(c => c.risk_level === filter)
  const minsAgo = lastRefreshed ? Math.floor((Date.now() - lastRefreshed) / 60000) : null

  const totalProblematic = counts.critical + counts.watch

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-neutral-50">Case Risk Monitor</h1>
          <p className="text-sm text-neutral-500 mt-1">Active cases ranked by algorithmic risk score (0–100)</p>
        </div>
        <div className="flex items-center gap-3">
          {minsAgo !== null && (
            <span className="text-xs text-neutral-600">Refreshed {minsAgo === 0 ? 'just now' : `${minsAgo}m ago`}</span>
          )}
          <button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-primary-800/40 px-4 py-2 text-sm text-neutral-300 hover:border-white/20 disabled:opacity-50 transition-all"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M1 4v6h6M23 20v-6h-6M3.5 15a9 9 0 1 0 .5-4" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'critical', 'watch', 'healthy'] as const).map(f => {
          const isActive = filter === f
          const cfg = f !== 'all' ? RISK_CONFIG[f] : null
          const count = f === 'all' ? cases.length : counts[f]
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? cfg
                    ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                    : 'bg-white/8 border-white/20 text-neutral-100'
                  : 'border-transparent text-neutral-400 hover:border-white/10 hover:text-neutral-300'
              }`}
            >
              <span className={`text-base font-bold ${cfg ? cfg.text : 'text-neutral-300'}`}>{count}</span>
              <span className="capitalize">{f === 'all' ? 'All Cases' : f}</span>
            </button>
          )
        })}
      </div>

      {/* Alert banner */}
      {!loading && totalProblematic > 0 && filter === 'all' && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/6 px-4 py-3">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" />
          </svg>
          <p className="text-sm text-red-400">
            <span className="font-semibold">{totalProblematic} case{totalProblematic !== 1 ? 's' : ''}</span> require attention
            {counts.critical > 0 && <span className="ml-1">({counts.critical} critical)</span>}
          </p>
        </div>
      )}

      {/* Cases grid */}
      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-10 text-center">
          <svg className="w-10 h-10 text-emerald-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
          <p className="text-sm text-emerald-400 font-semibold">All clear</p>
          <p className="text-xs text-neutral-500 mt-1">No {filter !== 'all' ? filter : ''} cases found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {filtered.map(c => <RiskCaseCard key={c.case_id} item={c} />)}
        </div>
      )}
    </div>
  )
}
