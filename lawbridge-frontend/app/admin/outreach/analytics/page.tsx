'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getFirms, getInterviews, getFeatureRequests, syncFirmsFromApi, syncInterviewsFromApi, syncFeatureRequestsFromApi, OutreachFirm, Interview, FeatureRequest, STATUS_LABELS } from '../../../../lib/outreachStore'

function HBar({ label, value, max, color = '#C9923A', sub }: { label: string; value: number; max: number; color?: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-neutral-400 w-36 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: max > 0 ? `${(value / max) * 100}%` : '0%', background: color }} />
      </div>
      <span className="text-xs font-semibold text-neutral-300 w-6 text-right flex-shrink-0">{value}</span>
      {sub && <span className="text-[10px] text-neutral-600 flex-shrink-0">{sub}</span>}
    </div>
  )
}

function StatCard({ label, value, color = 'text-neutral-100' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-4 text-center">
      <p className={`font-display font-bold text-2xl ${color}`}>{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{label}</p>
    </div>
  )
}

export default function OutreachAnalyticsPage() {
  const [firms, setFirms] = useState<OutreachFirm[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [frs, setFrs] = useState<FeatureRequest[]>([])

  useEffect(() => {
    setFirms(getFirms())
    setInterviews(getInterviews())
    setFrs(getFeatureRequests())
    Promise.all([syncFirmsFromApi(), syncInterviewsFromApi(), syncFeatureRequestsFromApi()]).then(([f, i, fr]) => {
      if (f) setFirms(f)
      if (i) setInterviews(i)
      if (fr) setFrs(fr)
    })
  }, [])

  const stats = useMemo(() => {
    const completed = interviews.filter(i => i.status === 'completed')
    const total = interviews.length
    const rate = total > 0 ? Math.round((completed.length / total) * 100) : 0
    const interests = completed.map(i => i.overallInterestLevel ?? 0).filter(n => n > 0)
    const avgInterest = interests.length ? Math.round(interests.reduce((a, b) => a + b, 0) / interests.length) : 0
    return { total, completed: completed.length, rate, avgInterest }
  }, [interviews])

  const byCity = useMemo(() => {
    const c: Record<string, number> = {}
    firms.filter(f => f.status !== 'not_contacted').forEach(f => { c[f.city] = (c[f.city] ?? 0) + 1 })
    return Object.entries(c).sort((a, b) => b[1] - a[1])
  }, [firms])

  const byStatus = useMemo(() => {
    const c: Record<string, number> = {}
    firms.forEach(f => { c[f.status] = (c[f.status] ?? 0) + 1 })
    return Object.entries(c).sort((a, b) => b[1] - a[1])
  }, [firms])

  const byPA = useMemo(() => {
    const c: Record<string, number> = {}
    firms.filter(f => f.status !== 'not_contacted').forEach(f => {
      f.practiceAreas.forEach(pa => { c[pa] = (c[pa] ?? 0) + 1 })
    })
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [firms])

  const topFeatures = useMemo(() => {
    const c: Record<string, number> = {}
    frs.forEach(fr => { c[fr.title] = (c[fr.title] ?? 0) + 1 })
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [frs])

  const byPriority = useMemo(() => {
    const c: Record<string, number> = { high: 0, medium: 0, low: 0 }
    frs.forEach(fr => { c[fr.priority] = (c[fr.priority] ?? 0) + 1 })
    return c
  }, [frs])

  const maxCity = Math.max(...byCity.map(([, v]) => v), 1)
  const maxStatus = Math.max(...byStatus.map(([, v]) => v), 1)
  const maxPA = Math.max(...byPA.map(([, v]) => v), 1)
  const maxFeat = Math.max(...topFeatures.map(([, v]) => v), 1)

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-neutral-500 mb-1"><Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link> › Analytics</div>
        <h1 className="font-display text-2xl font-bold text-neutral-50">Outreach Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">Comprehensive view of your law firm outreach performance</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Firms" value={firms.length} />
        <StatCard label="Firms Reached" value={firms.filter(f => f.status !== 'not_contacted').length} color="text-blue-400" />
        <StatCard label="Interview Completion" value={`${stats.rate}%`} color="text-emerald-400" />
        <StatCard label="Avg Interest Score" value={stats.avgInterest > 0 ? `${stats.avgInterest}%` : '—'} color="text-gold-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Firms by city */}
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
          <h3 className="text-sm font-semibold text-neutral-200 mb-4">Firms Reached by City</h3>
          {byCity.length === 0 ? <p className="text-xs text-neutral-600">No data</p> : (
            <div className="space-y-2.5">
              {byCity.map(([city, count]) => <HBar key={city} label={city} value={count} max={maxCity} />)}
            </div>
          )}
        </div>

        {/* Firms by status */}
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
          <h3 className="text-sm font-semibold text-neutral-200 mb-4">Pipeline Distribution</h3>
          <div className="space-y-2.5">
            {byStatus.map(([status, count]) => (
              <HBar
                key={status}
                label={STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}
                value={count}
                max={maxStatus}
                color={status === 'founding_council_member' ? '#C9923A' : status === 'pilot_partner' ? '#14b8a6' : status === 'interested' ? '#a855f7' : '#3b82f6'}
              />
            ))}
          </div>
        </div>

        {/* Practice areas */}
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
          <h3 className="text-sm font-semibold text-neutral-200 mb-4">Practice Areas Covered</h3>
          {byPA.length === 0 ? <p className="text-xs text-neutral-600">No data</p> : (
            <div className="space-y-2.5">
              {byPA.map(([pa, count]) => <HBar key={pa} label={pa} value={count} max={maxPA} color="#7c3aed" />)}
            </div>
          )}
        </div>

        {/* Top feature requests */}
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-200">Top Feature Requests</h3>
            <div className="flex gap-2 text-xs">
              <span className="text-crimson-400">High: {byPriority.high}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-amber-400">Med: {byPriority.medium}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400">Low: {byPriority.low}</span>
            </div>
          </div>
          {topFeatures.length === 0 ? <p className="text-xs text-neutral-600">No feature requests logged yet</p> : (
            <div className="space-y-2.5">
              {topFeatures.map(([title, count]) => (
                <HBar key={title} label={title.length > 32 ? title.slice(0, 30) + '…' : title} value={count} max={maxFeat} color="#14b8a6" sub={count > 1 ? `${count}x` : undefined} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interview analysis */}
      <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
        <h3 className="text-sm font-semibold text-neutral-200 mb-4">Interview Performance</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Interviews', value: stats.total },
            { label: 'Completed', value: stats.completed },
            { label: 'Scheduled', value: interviews.filter(i => i.status === 'scheduled').length },
            { label: 'Cancelled', value: interviews.filter(i => i.status === 'cancelled').length },
          ].map(({ label, value }, i) => (
            <div key={label} className="bg-primary-900/40 rounded-xl p-3 text-center stagger-child" style={{ '--i': i } as React.CSSProperties}>
              <p className="font-bold text-lg text-neutral-100">{value}</p>
              <p className="text-[11px] text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
