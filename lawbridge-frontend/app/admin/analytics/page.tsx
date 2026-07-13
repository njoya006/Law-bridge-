'use client'

import React, { useEffect, useState, useCallback } from 'react'

type UserRecord = { id: string; role: string; created_at?: string; date_joined?: string }
type PlatformStats = {
  total: number
  active: number
  closed: number
  new_last_30_days: number
  case_type_distribution: Record<string, number>
  status_distribution: Record<string, number>
}
type LawyerLoad = {
  lawyer_id: string
  active_cases: number
  closed_cases_count: number
  avg_resolution_days: number
  cases_this_month: number
}

type Tab = 'users' | 'cases' | 'lawyers'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-xl ${className}`} />
}

function DistributionTable({
  title,
  data,
  total,
}: {
  title: string
  data: Record<string, number>
  total: number
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return null
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/30 overflow-hidden">
      <div className="p-4 border-b border-white/8">
        <h3 className="text-sm font-semibold text-neutral-200">{title}</h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/6">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Label</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Count</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">%</th>
            <th className="px-4 py-2.5 w-32 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Bar</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([label, count], i) => {
            const pct = total > 0 ? (count / total) * 100 : 0
            return (
              <tr key={label} className={i % 2 === 0 ? '' : 'bg-white/[0.02]'}>
                <td className="px-4 py-2.5 text-sm text-neutral-300 capitalize">{label.replace(/_/g, ' ')}</td>
                <td className="px-4 py-2.5 text-right text-sm font-semibold text-neutral-200">{count}</td>
                <td className="px-4 py-2.5 text-right text-xs text-neutral-500">{pct.toFixed(1)}%</td>
                <td className="px-4 py-2.5">
                  <div className="h-1.5 w-full rounded-full bg-primary-700">
                    <div className="h-1.5 rounded-full bg-gold-500/50" style={{ width: `${pct}%` }} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function KpiRow({ items }: { items: { label: string; value: string | number; color: string }[] }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {items.map(({ label, value, color }) => (
        <div key={label} className={`rounded-2xl border ${color} bg-primary-800/40 p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-display font-bold text-neutral-100">{value}</p>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<UserRecord[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [lawyers, setLawyers] = useState<LawyerLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); setError('No auth token — please log in again'); return }
    const h = { Authorization: `Bearer ${token}` }
    const [usersRes, statsRes, intelRes] = await Promise.allSettled([
      fetch('/api/v1/auth/admin/users/', { headers: h }),
      fetch('/api/v1/monitoring/admin/platform-stats/', { headers: h }),
      fetch('/api/v1/monitoring/firm-intelligence/', { headers: h }),
    ])
    if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
      const ud = await usersRes.value.json()
      setUsers(Array.isArray(ud) ? ud : (ud.results ?? []))
    }
    if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
      setStats(await statsRes.value.json())
    }
    if (intelRes.status === 'fulfilled' && intelRes.value.ok) {
      const id = await intelRes.value.json()
      setLawyers(id.lawyer_loads ?? [])
    }
    const anyFailed = [usersRes, statsRes, intelRes].some(
      r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok)
    )
    if (anyFailed && users.length === 0 && !stats) {
      setError('Some data could not be loaded. Check your session or backend services.')
    }
    setLoading(false)
  }, [stats, users.length])

  useEffect(() => { void load() }, [load])

  // Users tab data
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    const r = u.role || 'unknown'
    acc[r] = (acc[r] ?? 0) + 1
    return acc
  }, {})
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const newUsers = users.filter(u => {
    const d = u.date_joined || u.created_at || ''
    return d && new Date(d).getTime() > thirtyDaysAgo
  }).length

  // Lawyers tab data — top performers = lowest avg days among >3 closed
  const sortedLawyers = [...lawyers].sort((a, b) => b.active_cases - a.active_cases)
  const eligibleForTop = lawyers.filter(l => l.closed_cases_count > 3)
  const topPerformerMinDays = eligibleForTop.length > 0
    ? Math.min(...eligibleForTop.map(l => l.avg_resolution_days))
    : -1

  const TABS: { id: Tab; label: string }[] = [
    { id: 'users', label: 'Users' },
    { id: 'cases', label: 'Cases' },
    { id: 'lawyers', label: 'Lawyers' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-neutral-50">Platform Analytics</h1>
          <p className="text-sm text-neutral-500 mt-1">Comprehensive platform metrics across users, cases, and legal teams</p>
        </div>
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

      {/* Tabs */}
      <div className="flex border-b border-white/8">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              tab === t.id
                ? 'border-gold-400 text-gold-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">{error}</div>
      ) : (
        <>
          {tab === 'users' && (
            <div className="space-y-4">
              <KpiRow items={[
                { label: 'Total Users', value: users.length, color: 'border-blue-500/20' },
                { label: 'New (30 days)', value: newUsers, color: 'border-emerald-500/20' },
                { label: 'Roles', value: Object.keys(roleCounts).length, color: 'border-gold-500/20' },
                { label: 'Clients', value: roleCounts['client'] ?? 0, color: 'border-purple-500/20' },
              ]} />
              <div className="rounded-2xl border border-white/8 bg-primary-800/30 overflow-hidden">
                <div className="p-4 border-b border-white/8">
                  <h3 className="text-sm font-semibold text-neutral-200">Role Breakdown</h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/6">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Count</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">% of total</th>
                      <th className="px-4 py-2.5 w-36 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Bar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).map(([role, count], i) => {
                      const pct = users.length > 0 ? (count / users.length) * 100 : 0
                      return (
                        <tr key={role} className={i % 2 === 0 ? '' : 'bg-white/[0.02]'}>
                          <td className="px-4 py-2.5 text-sm text-neutral-300 capitalize">{role}</td>
                          <td className="px-4 py-2.5 text-right text-sm font-semibold text-neutral-200">{count}</td>
                          <td className="px-4 py-2.5 text-right text-xs text-neutral-500">{pct.toFixed(1)}%</td>
                          <td className="px-4 py-2.5">
                            <div className="h-1.5 w-full rounded-full bg-primary-700">
                              <div className="h-1.5 rounded-full bg-blue-400/50" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'cases' && stats && (
            <div className="space-y-4">
              <KpiRow items={[
                { label: 'Total Cases', value: stats.total, color: 'border-blue-500/20' },
                { label: 'Active', value: stats.active, color: 'border-emerald-500/20' },
                { label: 'Closed', value: stats.closed, color: 'border-neutral-500/30' },
                { label: 'New (30 days)', value: stats.new_last_30_days, color: 'border-gold-500/20' },
              ]} />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <DistributionTable
                  title="Case Type Distribution"
                  data={stats.case_type_distribution}
                  total={stats.total}
                />
                <DistributionTable
                  title="Status Distribution"
                  data={stats.status_distribution}
                  total={stats.total}
                />
              </div>
            </div>
          )}

          {tab === 'cases' && !stats && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
              Case statistics unavailable — the monitoring service may be starting up.
            </div>
          )}

          {tab === 'lawyers' && (
            <div className="space-y-4">
              <KpiRow items={[
                { label: 'Active Lawyers', value: lawyers.length, color: 'border-blue-500/20' },
                { label: 'Total Active Cases', value: lawyers.reduce((s, l) => s + l.active_cases, 0), color: 'border-emerald-500/20' },
                { label: 'Total Closed', value: lawyers.reduce((s, l) => s + l.closed_cases_count, 0), color: 'border-neutral-500/30' },
                { label: 'Overloaded (>10)', value: lawyers.filter(l => l.active_cases > 10).length, color: 'border-amber-500/20' },
              ]} />
              <div className="rounded-2xl border border-white/8 bg-primary-800/30 overflow-hidden">
                <div className="p-4 border-b border-white/8">
                  <h3 className="text-sm font-semibold text-neutral-200">Lawyer Performance Leaderboard</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Ranked by active caseload</p>
                </div>
                {sortedLawyers.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500 text-sm">No lawyer data available yet</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/6">
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">#</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Lawyer</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Active</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Closed</th>
                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Avg Days</th>
                        <th className="px-4 py-2.5 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider" />
                      </tr>
                    </thead>
                    <tbody>
                      {sortedLawyers.map((l, i) => {
                        const isTop = topPerformerMinDays > 0 && l.avg_resolution_days === topPerformerMinDays && l.closed_cases_count > 3
                        const isOverloaded = l.active_cases > 10
                        return (
                          <tr key={l.lawyer_id} className={i % 2 === 0 ? '' : 'bg-white/[0.02]'}>
                            <td className="px-4 py-2.5 text-xs text-neutral-600 font-mono">{i + 1}</td>
                            <td className="px-4 py-2.5 text-xs font-mono text-neutral-400">{l.lawyer_id.slice(0, 8)}…</td>
                            <td className="px-4 py-2.5 text-right text-sm font-semibold text-neutral-200">{l.active_cases}</td>
                            <td className="px-4 py-2.5 text-right text-sm text-neutral-400">{l.closed_cases_count}</td>
                            <td className="px-4 py-2.5 text-right text-sm text-neutral-400">{l.avg_resolution_days.toFixed(0)}d</td>
                            <td className="px-4 py-2.5">
                              <div className="flex gap-1.5 justify-end">
                                {isTop && (
                                  <span className="rounded-full bg-gold-500/15 border border-gold-500/25 px-1.5 py-px text-[9px] font-bold text-gold-400">TOP</span>
                                )}
                                {isOverloaded && (
                                  <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-1.5 py-px text-[9px] font-bold text-amber-400">OVERLOADED</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
