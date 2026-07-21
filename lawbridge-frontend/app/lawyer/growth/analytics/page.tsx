'use client'

import React, { useEffect, useState } from 'react'
import { getLawyerStats } from '../../../../lib/monitoringApi'
import { useCountUp } from '../../../../lib/useCountUp'
import { SkeletonStat } from '../../../../components/ui/Skeleton'

type Stats = { active_cases: number; closed_cases_count: number; cases_this_month: number; avg_resolution_days?: number }

function StatTile({ label, value, sub, color }: { label: string; value: number | string; sub: string; color: string }) {
  const num = typeof value === 'number' ? value : parseFloat(value as string) || 0
  const anim = useCountUp(num)
  return (
    <div className="bg-primary-800/30 border border-white/8 rounded-2xl p-5">
      <p className={`text-3xl stat-num ${color}`}>{typeof value === 'number' ? anim : value}</p>
      <p className="text-sm font-medium text-neutral-200 mt-1">{label}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    const lid = localStorage.getItem('authUserId') || ''
    if (!token) { setLoading(false); return }
    getLawyerStats(lid, token)
      .then(s => setStats(s as Stats))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const successRate = stats
    ? Math.round((stats.closed_cases_count / Math.max(stats.closed_cases_count + stats.active_cases, 1)) * 100)
    : 0

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h2 className="font-display text-display-md">Growth Analytics</h2>
        <p className="mt-1 text-sm text-neutral-400">Your practice performance and trends</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonStat key={i}/>)}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatTile label="Active Matters"   value={stats.active_cases}        sub="currently open"    color="text-gold-400" />
            <StatTile label="Closed Matters"   value={stats.closed_cases_count}  sub="resolved"          color="text-emerald-400" />
            <StatTile label="This Month"       value={stats.cases_this_month}    sub="newly opened"      color="text-primary-400" />
            <StatTile label="Resolution Rate"  value={successRate}               sub="% cases closed"    color={successRate >= 70 ? 'text-emerald-400' : 'text-amber-400'} />
          </div>

          {/* Practice bar */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">Portfolio Breakdown</p>
            <div className="flex gap-1 h-3 rounded-full overflow-hidden mb-4">
              <div className="bg-gold-400/70 rounded-full transition-all" style={{ width: `${Math.round((stats.active_cases / Math.max(stats.active_cases + stats.closed_cases_count, 1)) * 100)}%` }} />
              <div className="bg-emerald-400/60 flex-1 rounded-full" />
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-400/70 flex-shrink-0" />
                <span className="text-xs text-neutral-400">Active ({stats.active_cases})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/60 flex-shrink-0" />
                <span className="text-xs text-neutral-400">Closed ({stats.closed_cases_count})</span>
              </div>
            </div>
          </div>

          {stats.avg_resolution_days != null && (
            <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Average Resolution Time</p>
              <p className="text-4xl stat-num text-primary-300">{Math.round(stats.avg_resolution_days)}</p>
              <p className="text-sm text-neutral-500 mt-1">days per case</p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-12 text-center">
          <p className="text-neutral-500 text-sm">No analytics data yet. Complete cases to see your performance metrics.</p>
        </div>
      )}
    </div>
  )
}
