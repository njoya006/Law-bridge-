'use client'

import React, { useEffect, useState } from 'react'
import { api } from '../../../../lib/api'
import { SkeletonStat, SkeletonCard } from '../../../../components/ui/Skeleton'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { BalanceIcon, ClockIcon, GavelIcon } from '../../../../components/icons/Icons'

type GroupStat = {
  key: string
  label: string
  case_count: number
  avg_adjournments: number
  avg_resolution_days: number | null
}
type Analytics = {
  overview: {
    total_cases: number
    total_adjournments: number
    avg_adjournments_per_case: number
    avg_resolution_days: number
    resolved_cases: number
  }
  by_court_level: GroupStat[]
  by_case_type: GroupStat[]
  by_circuit: GroupStat[]
  adjournment_reasons: { reason: string; label: string; count: number; pct: number }[]
}

function StatTile({ label, value, sub, Icon, accent }: { label: string; value: string | number; sub: string; Icon: React.ComponentType<{ width?: number; height?: number }>; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 mb-3 ${accent}`}><Icon width={18} height={18} /></div>
      <p className={`text-3xl stat-num ${accent}`}>{value}</p>
      <p className="text-sm font-medium text-neutral-200 mt-1">{label}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
    </div>
  )
}

function GroupTable({ title, rows, unit }: { title: string; rows: GroupStat[]; unit?: string }) {
  if (!rows.length) return null
  const max = Math.max(...rows.map(r => r.avg_adjournments), 1)
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">{title}</p>
      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.key} className="flex items-center gap-3">
            <span className="text-xs text-neutral-300 w-40 flex-shrink-0 truncate">{r.label}</span>
            <div className="flex-1 h-2 rounded-full bg-neutral-800/60 overflow-hidden">
              <div className="h-full rounded-full bg-portal-accent/70 transition-all" style={{ width: `${(r.avg_adjournments / max) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-neutral-200 w-12 text-right tabular-nums flex-shrink-0">{r.avg_adjournments}{unit}</span>
            <span className="text-[10px] text-neutral-600 w-16 text-right flex-shrink-0">{r.case_count} case{r.case_count !== 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CourtIntelPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }
    api.get<Analytics>('case', '/cases/intelligence/court-analytics/', token)
      .then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h2 className="font-display text-display-md">Court Intelligence</h2>
        <p className="mt-1 text-sm text-neutral-400">
          How Cameroonian courts actually behave — adjournment patterns and resolution times across the platform, anonymized. Use it to set realistic client expectations.
        </p>
      </header>

      {loading ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map(i => <SkeletonStat key={i} />)}</div>
          <SkeletonCard lines={4} />
        </>
      ) : !data || data.overview.total_cases === 0 ? (
        <EmptyState
          icon={<BalanceIcon width={24} height={24} />}
          title="Not enough data yet"
          body="Court intelligence builds as matters are filed and worked on the platform. Log hearings and adjournments in the Case File to feed it."
        />
      ) : (
        <>
          {/* Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile label="Matters Tracked" value={data.overview.total_cases} sub="platform-wide" Icon={BalanceIcon} accent="text-portal" />
            <StatTile label="Avg Adjournments" value={data.overview.avg_adjournments_per_case} sub="per matter" Icon={GavelIcon} accent="text-amber-400" />
            <StatTile label="Avg Resolution" value={data.overview.avg_resolution_days ? `${data.overview.avg_resolution_days}d` : '—'} sub={`${data.overview.resolved_cases} resolved`} Icon={ClockIcon} accent="text-emerald-400" />
            <StatTile label="Total Adjournments" value={data.overview.total_adjournments} sub="logged" Icon={GavelIcon} accent="text-crimson-400" />
          </div>

          {/* Adjournment reasons */}
          {data.adjournment_reasons.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">Why matters get adjourned</p>
              <div className="space-y-2.5">
                {data.adjournment_reasons.map(r => (
                  <div key={r.reason} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-300 w-48 flex-shrink-0 truncate">{r.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-neutral-800/60 overflow-hidden">
                      <div className="h-full rounded-full bg-amber-400/70" style={{ width: `${r.pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-neutral-200 w-10 text-right tabular-nums flex-shrink-0">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GroupTable title="Adjournments by Court Level" rows={data.by_court_level} />
            <GroupTable title="Adjournments by Case Type" rows={data.by_case_type} />
          </div>

          <p className="text-[11px] text-neutral-600 text-center">All figures are aggregate and anonymized. No client, lawyer, or matter identifiers are exposed.</p>
        </>
      )}
    </div>
  )
}
