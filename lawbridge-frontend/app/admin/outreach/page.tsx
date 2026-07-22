'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFirms, getInterviews, getFeatureRequests, getTasks, syncAllFromApi, OutreachFirm, Interview, FeatureRequest, Task, STATUS_LABELS } from '../../../lib/outreachStore'
import { PlusIcon } from '../../../components/icons/Icons'

function KpiTile({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-5 flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className={`font-display font-bold text-3xl ${color}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-500">{sub}</p>}
    </div>
  )
}

function DonutChart({ segments, size = 100 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const r = 38
  const cx = 50
  const cy = 50
  const circ = 2 * Math.PI * r
  const total = segments.reduce((a, b) => a + b.value, 0)
  if (total === 0) return <div style={{ width: size, height: size }} className="flex items-center justify-center text-neutral-600 text-xs">No data</div>
  let offset = 0
  const arcs = segments.map(seg => {
    const dash = (seg.value / total) * circ
    const gap = circ - dash
    const arc = { ...seg, dash, gap, offset }
    offset += dash
    return arc
  })
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth="12"
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-arc.offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      ))}
      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="700" fill="white">
        {total}
      </text>
    </svg>
  )
}

function HBarChart({ items }: { items: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...items.map(i => i.value), 1)
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-neutral-400 w-28 truncate flex-shrink-0">{item.label}</span>
          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(item.value / max) * 100}%`, background: item.color ?? '#C9923A' }}
            />
          </div>
          <span className="text-xs font-semibold text-neutral-300 w-5 text-right flex-shrink-0">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }
  catch { return iso }
}

export default function OutreachDashboardPage() {
  const [firms, setFirms] = useState<OutreachFirm[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [featureReqs, setFeatureReqs] = useState<FeatureRequest[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    setFirms(getFirms())
    setInterviews(getInterviews())
    setFeatureReqs(getFeatureRequests())
    setTasks(getTasks())
    syncAllFromApi().then(store => {
      if (!store) return
      setFirms(store.firms)
      setInterviews(store.interviews)
      setFeatureReqs(store.featureRequests)
      setTasks(store.tasks)
    })
  }, [])

  const kpi = {
    contacted: firms.filter(f => f.status !== 'not_contacted').length,
    scheduled: interviews.filter(i => i.status === 'scheduled').length,
    completed: interviews.filter(i => i.status === 'completed').length,
    interested: firms.filter(f => ['interested', 'follow_up_needed', 'joined_founding_network', 'founding_council_member', 'pilot_partner', 'active_partner'].includes(f.status)).length,
    council: firms.filter(f => f.status === 'founding_council_member').length,
    pilots: firms.filter(f => f.status === 'pilot_partner').length,
    international: firms.filter(f => f.country !== 'Cameroon').length,
  }

  // By status for donut
  const statusGroups: Record<string, number> = {}
  firms.forEach(f => { statusGroups[f.status] = (statusGroups[f.status] ?? 0) + 1 })
  const donutSegments = [
    { label: 'Not Contacted', value: statusGroups['not_contacted'] ?? 0, color: '#4b5563' },
    { label: 'In Progress', value: (statusGroups['contacted'] ?? 0) + (statusGroups['meeting_requested'] ?? 0) + (statusGroups['meeting_scheduled'] ?? 0), color: '#f59e0b' },
    { label: 'Interested', value: (statusGroups['interview_completed'] ?? 0) + (statusGroups['interested'] ?? 0), color: '#a855f7' },
    { label: 'Network/Council', value: (statusGroups['joined_founding_network'] ?? 0) + (statusGroups['founding_council_member'] ?? 0), color: '#C9923A' },
    { label: 'Partners', value: (statusGroups['pilot_partner'] ?? 0) + (statusGroups['active_partner'] ?? 0), color: '#14b8a6' },
  ].filter(s => s.value > 0)

  // By city
  const cityCount: Record<string, number> = {}
  interviews.filter(i => i.status === 'completed').forEach(i => {
    const firm = firms.find(f => f.id === i.firmId)
    if (firm) cityCount[firm.city] = (cityCount[firm.city] ?? 0) + 1
  })
  const cityItems = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }))

  // By practice area
  const paCount: Record<string, number> = {}
  firms.filter(f => f.status !== 'not_contacted').forEach(f => {
    f.practiceAreas.forEach(pa => { paCount[pa] = (paCount[pa] ?? 0) + 1 })
  })
  const paSegments = Object.entries(paCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value], i) => ({
    label,
    value,
    color: ['#C9923A', '#7c3aed', '#0ea5e9', '#14b8a6', '#f59e0b'][i],
  }))

  // Top requested features
  const frCount: Record<string, number> = {}
  featureReqs.forEach(fr => { frCount[fr.title] = (frCount[fr.title] ?? 0) + 1 })
  const topFeatures = featureReqs
    .sort((a, b) => (a.status === 'released' ? 1 : 0) - (b.status === 'released' ? 1 : 0))
    .slice(0, 5)
    .map(fr => ({ label: fr.title.length > 30 ? fr.title.slice(0, 28) + '…' : fr.title, value: 1 + featureReqs.filter(f => f.title === fr.title).length - 1 }))

  const recentInterviews = [...interviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  const pendingTasks = tasks.filter(t => t.status !== 'done').slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-500 mb-1">Admin › Outreach &amp; Partnerships</div>
          <h1 className="font-display text-2xl font-bold text-neutral-50">Outreach Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-1">Track law firm outreach, interviews, and founding council pipeline</p>
        </div>
        <Link
          href="/admin/outreach/firms"
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-portal-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <PlusIcon width={14} height={14} />
          Add Firm
        </Link>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
        <KpiTile label="Firms Contacted" value={kpi.contacted} sub={`of ${firms.length} total`} color="text-blue-400" />
        <KpiTile label="Interviews Scheduled" value={kpi.scheduled} color="text-amber-400" />
        <KpiTile label="Interviews Completed" value={kpi.completed} color="text-emerald-400" />
        <KpiTile label="Interested" value={kpi.interested} color="text-purple-400" />
        <KpiTile label="Founding Council" value={kpi.council} color="text-gold-400" />
        <KpiTile label="Pilot Partners" value={kpi.pilots} color="text-teal-400" />
        <KpiTile label="International" value={kpi.international} color="text-neutral-300" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Outreach progress donut */}
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
          <h3 className="text-sm font-semibold text-neutral-200 mb-4">Outreach Pipeline</h3>
          <div className="flex items-center gap-6">
            <DonutChart segments={donutSegments} size={90} />
            <div className="space-y-1.5 flex-1 min-w-0">
              {donutSegments.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-neutral-400 truncate">{s.label}</span>
                  <span className="ml-auto font-semibold text-neutral-200">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interviews by city */}
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
          <h3 className="text-sm font-semibold text-neutral-200 mb-4">Interviews by City</h3>
          {cityItems.length === 0
            ? <p className="text-xs text-neutral-600">No completed interviews yet</p>
            : <HBarChart items={cityItems} />
          }
        </div>

        {/* Practice areas */}
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
          <h3 className="text-sm font-semibold text-neutral-200 mb-4">Practice Areas Reached</h3>
          {paSegments.length === 0
            ? <p className="text-xs text-neutral-600">No data yet</p>
            : (
              <div className="space-y-3">
                <HBarChart items={paSegments} />
              </div>
            )
          }
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent interviews */}
        <div className="lg:col-span-1 rounded-2xl border border-white/8 bg-primary-800/30 overflow-hidden">
          <div className="p-4 border-b border-white/8 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200">Recent Interviews</h3>
            <Link href="/admin/outreach/interviews" className="text-xs text-portal hover:opacity-80">View all →</Link>
          </div>
          {recentInterviews.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-neutral-600">No interviews yet</p>
          ) : (
            <div className="divide-y divide-white/5">
              {recentInterviews.map((iv, i) => (
                <Link key={iv.id} href={`/admin/outreach/interviews/${iv.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors stagger-child" style={{ '--i': i } as React.CSSProperties}>
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${iv.status === 'completed' ? 'bg-emerald-500' : iv.status === 'scheduled' ? 'bg-amber-500' : 'bg-neutral-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-200 truncate">{iv.firmName}</p>
                    <p className="text-xs text-neutral-500">{iv.contactName ?? iv.type.replace('_', ' ')} · {fmtDate(iv.date)}</p>
                  </div>
                  {iv.overallInterestLevel != null && (
                    <span className="text-xs font-semibold text-emerald-400">{iv.overallInterestLevel}%</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top requested features */}
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-200">Top Requested Features</h3>
            <Link href="/admin/outreach/feature-requests" className="text-xs text-portal hover:opacity-80">View all →</Link>
          </div>
          <HBarChart items={topFeatures} />
        </div>

        {/* Pending tasks */}
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 overflow-hidden">
          <div className="p-4 border-b border-white/8 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200">Pending Tasks</h3>
            <Link href="/admin/outreach/tasks" className="text-xs text-portal hover:opacity-80">View all →</Link>
          </div>
          {pendingTasks.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-neutral-600">All tasks done!</p>
          ) : (
            <div className="divide-y divide-white/5">
              {pendingTasks.map((task, i) => (
                <div key={task.id} className="flex items-start gap-3 px-4 py-3 stagger-child" style={{ '--i': i } as React.CSSProperties}>
                  <span className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${task.priority === 'high' ? 'bg-crimson-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-neutral-600'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-200 truncate">{task.title}</p>
                    <p className="text-xs text-neutral-500">{task.assignedTo ?? '—'}{task.dueDate ? ` · Due ${fmtDate(task.dueDate)}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
