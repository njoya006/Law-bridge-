'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useCountUp } from '../../lib/useCountUp'
import {
  getFirms, getTasks, getInterviews, syncFirmsFromApi, syncTasksFromApi,
  syncInterviewsFromApi, OutreachFirm, Task, Interview,
} from '../../lib/outreachStore'
import { Badge } from '../../components/ui/Badge'
import {
  HandshakeIcon, CalendarIcon, ChatIcon, BuildingIcon, ClipboardIcon, CheckCircleIcon,
} from '../../components/icons/Icons'

// ── Types ──────────────────────────────────────────────────────────────────
type PlatformData = {
  userCount: number
  activeCases: number
  openTickets: number
  escalated: number
  critical: number
  watch: number
}
type SupportThread = {
  id: number
  escalated_to_human: boolean
  updated_at: string
  participants: Array<{ display_name: string; role: string }>
  last_message?: { content: string }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function today() { return new Date().toISOString().slice(0, 10) }
function isOverdue(date?: string) { return !!date && date < today() }
function isDueToday(date?: string) { return !!date && date === today() }
function isDueSoon(date?: string) {
  if (!date) return false
  const d = new Date(date); const t = new Date(); t.setDate(t.getDate() + 3)
  return d >= new Date(today()) && d <= t
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Sub-components ─────────────────────────────────────────────────────────
function KpiCard({ label, value, color, href, sub, staggerIndex }: { label: string; value: string | number; color: string; href?: string; sub?: string; staggerIndex?: number }) {
  const animated = useCountUp(typeof value === 'number' ? value : 0)
  const display: string | number = typeof value === 'number' ? animated : value
  const inner = (
    <div className={`rounded-2xl border ${color} bg-primary-800/30 p-4 stagger-child`} style={{ '--i': staggerIndex ?? 0 } as React.CSSProperties}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1.5 font-display font-bold text-2xl stat-num text-neutral-100">{display}</p>
      {sub && <p className="text-[11px] text-neutral-500 mt-0.5">{sub}</p>}
    </div>
  )
  return href ? <Link href={href} className="block hover:opacity-90 transition-opacity">{inner}</Link> : inner
}

function AlertBadge({ count, level, label, href }: { count: number; level: 'critical' | 'warn' | 'info'; label: string; href: string }) {
  if (count === 0) return null
  const styles = {
    critical: 'border-crimson-500/30 bg-crimson-500/10 text-crimson-400',
    warn: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    info: 'border-portal bg-portal-soft text-portal',
  }
  return (
    <Link href={href} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all hover:opacity-80 ${styles[level]}`}>
      <span className="font-bold font-display text-lg">{count}</span>
      <span className="text-xs">{label}</span>
    </Link>
  )
}

function TaskRow({ task, firms }: { task: Task; firms: OutreachFirm[] }) {
  const firm = firms.find(f => f.id === task.firmId)
  const overdue = isOverdue(task.dueDate)
  const dueToday = isDueToday(task.dueDate)
  return (
    <Link href="/admin/outreach/tasks" className="flex items-center gap-3 rounded-xl border border-white/6 bg-primary-800/20 px-3 py-2.5 hover:bg-primary-700/30 transition-all group">
      <span className={`flex h-2 w-2 flex-shrink-0 rounded-full ${overdue ? 'bg-crimson-400' : dueToday ? 'bg-amber-400' : 'bg-emerald-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-200 truncate group-hover:text-neutral-100">{task.title}</p>
        {firm && <p className="text-[11px] text-neutral-600">{firm.firmName}</p>}
      </div>
      <div className="flex-shrink-0 text-right">
        {task.dueDate && (
          <p className={`text-[11px] font-medium ${overdue ? 'text-crimson-400' : dueToday ? 'text-amber-400' : 'text-neutral-500'}`}>
            {overdue ? 'Overdue' : dueToday ? 'Today' : fmtDate(task.dueDate)}
          </p>
        )}
        <p className={`text-[10px] capitalize ${task.priority === 'high' ? 'text-crimson-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-neutral-600'}`}>{task.priority}</p>
      </div>
    </Link>
  )
}

const PIPELINE_STAGES = [
  { key: 'not_contacted', label: 'Not Contacted', color: 'bg-neutral-600' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { key: 'meeting_scheduled', label: 'Scheduled', color: 'bg-amber-500' },
  { key: 'interview_completed', label: 'Interviewed', color: 'bg-emerald-500' },
  { key: 'interested', label: 'Interested', color: 'bg-purple-500' },
  { key: 'joined_founding_network', label: 'Network', color: 'bg-teal-500' },
  { key: 'founding_council_member', label: 'Council', color: 'bg-gold-500' },
  { key: 'pilot_partner', label: 'Pilot', color: 'bg-cyan-500' },
  { key: 'active_partner', label: 'Partner', color: 'bg-emerald-600' },
]

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [platform, setPlatform] = useState<PlatformData>({ userCount: 0, activeCases: 0, openTickets: 0, escalated: 0, critical: 0, watch: 0 })
  const [threads, setThreads] = useState<SupportThread[]>([])
  const [firms, setFirms] = useState<OutreachFirm[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [platformLoaded, setPlatformLoaded] = useState(false)
  const [outreachLoaded, setOutreachLoaded] = useState(false)
  const [adminName, setAdminName] = useState('')

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Load admin name from JWT
  useEffect(() => {
    try {
      const token = localStorage.getItem('access') ?? ''
      const payload = JSON.parse(atob(token.split('.')[1]))
      setAdminName(payload.full_name ?? payload.name ?? payload.email?.split('@')[0] ?? 'Admin')
    } catch { setAdminName('Admin') }
  }, [])

  // Load platform data
  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) return
    const h = { Authorization: `Bearer ${token}` }
    void Promise.allSettled([
      fetch('/api/v1/messages/admin/threads/', { headers: h }),
      fetch('/api/v1/auth/admin/users/', { headers: h }),
      fetch('/api/v1/monitoring/case-risks/', { headers: h }),
    ]).then(async ([threadsR, usersR, risksR]) => {
      const pd: PlatformData = { userCount: 0, activeCases: 0, openTickets: 0, escalated: 0, critical: 0, watch: 0 }
      if (threadsR.status === 'fulfilled' && threadsR.value.ok) {
        const data: SupportThread[] = await threadsR.value.json()
        setThreads(data.slice(0, 6))
        pd.openTickets = data.filter(t => !t.escalated_to_human).length
        pd.escalated = data.filter(t => t.escalated_to_human).length
      }
      if (usersR.status === 'fulfilled' && usersR.value.ok) {
        const data = await usersR.value.json()
        pd.userCount = data.count ?? (Array.isArray(data) ? data.length : data.results?.length ?? 0)
      }
      if (risksR.status === 'fulfilled' && risksR.value.ok) {
        const data = await risksR.value.json()
        pd.activeCases = (data.counts?.critical ?? 0) + (data.counts?.watch ?? 0) + (data.counts?.healthy ?? 0)
        pd.critical = data.counts?.critical ?? 0
        pd.watch = data.counts?.watch ?? 0
      }
      setPlatform(pd)
      setPlatformLoaded(true)
    })
  }, [])

  // Load outreach data from localStorage then sync from API
  useEffect(() => {
    setFirms(getFirms()); setTasks(getTasks()); setInterviews(getInterviews())
    setOutreachLoaded(true)
    void Promise.all([syncFirmsFromApi(), syncTasksFromApi(), syncInterviewsFromApi()]).then(([f, t, i]) => {
      if (f) setFirms(f); if (t) setTasks(t); if (i) setInterviews(i)
    })
  }, [])

  // Computed outreach stats
  const pendingTasks = useMemo(() => tasks.filter(t => t.status !== 'done'), [tasks])
  const overdueTasks = useMemo(() => pendingTasks.filter(t => isOverdue(t.dueDate)), [pendingTasks])
  const todayTasks = useMemo(() => pendingTasks.filter(t => isDueToday(t.dueDate)), [pendingTasks])
  const soonTasks = useMemo(() => pendingTasks.filter(t => isDueSoon(t.dueDate) && !isDueToday(t.dueDate)), [pendingTasks])
  const urgentTasks = useMemo(() => [...overdueTasks, ...todayTasks].slice(0, 6), [overdueTasks, todayTasks])

  const todayInterviews = useMemo(() => interviews.filter(i => i.date === today() && i.status === 'scheduled'), [interviews])
  const upcomingInterviews = useMemo(() => {
    const threeDays = new Date(); threeDays.setDate(threeDays.getDate() + 3)
    return interviews.filter(i => {
      const d = new Date(i.date)
      return i.status === 'scheduled' && d > new Date(today()) && d <= threeDays
    }).slice(0, 3)
  }, [interviews])

  const pipelineCounts = useMemo(() => {
    const c: Record<string, number> = {}
    firms.forEach(f => { c[f.status] = (c[f.status] ?? 0) + 1 })
    return c
  }, [firms])

  const totalFirmsReached = useMemo(() => firms.filter(f => f.status !== 'not_contacted').length, [firms])
  const councilCount = useMemo(() => firms.filter(f => f.status === 'founding_council_member').length, [firms])
  const pilotCount = useMemo(() => firms.filter(f => f.status === 'pilot_partner' || f.status === 'active_partner').length, [firms])

  const recentFirms = useMemo(() => [...firms].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4), [firms])

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-neutral-600">{dateStr}</p>
          <h1 className="font-display text-2xl font-bold text-neutral-50 mt-0.5">{greeting()}, {adminName}</h1>
          <p className="text-sm text-neutral-500 mt-1">Here&apos;s what needs your attention today.</p>
        </div>
        <Link href="/admin/outreach" className="flex-shrink-0 hidden sm:inline-flex items-center gap-2 rounded-xl border border-portal bg-portal-soft px-4 py-2 text-sm font-medium text-portal hover:opacity-90 transition-all">
          <HandshakeIcon width={14} height={14} />
          Outreach CRM
        </Link>
      </div>

      {/* Alert row */}
      {(platform.critical > 0 || platform.escalated > 0 || overdueTasks.length > 0) && (
        <div className="flex flex-wrap gap-2">
          <AlertBadge count={platform.critical} level="critical" label="Critical Cases" href="/admin/risks" />
          <AlertBadge count={platform.escalated} level="warn" label="Escalated Tickets" href="/admin/support" />
          <AlertBadge count={overdueTasks.length} level="warn" label="Overdue Tasks" href="/admin/outreach/tasks" />
          {todayInterviews.length > 0 && (
            <Link href="/admin/outreach/interviews" className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400 hover:opacity-80 transition-all">
              <span className="font-bold font-display text-lg">{todayInterviews.length}</span>
              <span className="text-xs">Interview{todayInterviews.length > 1 ? 's' : ''} Today</span>
            </Link>
          )}
        </div>
      )}

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard label="Total Users" value={platformLoaded ? platform.userCount : '…'} color="border-blue-500/20" href="/admin/users" staggerIndex={0} />
        <KpiCard label="Active Cases" value={platformLoaded ? platform.activeCases : '…'} color="border-emerald-500/20" href="/admin/risks" staggerIndex={1} />
        <KpiCard label="Support Queue" value={platformLoaded ? platform.openTickets : '…'} sub="AI-handled" color="border-gold-500/20" href="/admin/support" staggerIndex={2} />
        <KpiCard label="Firms Reached" value={outreachLoaded ? totalFirmsReached : '…'} sub={`of ${firms.length} firms`} color="border-purple-500/20" href="/admin/outreach/firms" staggerIndex={3} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left column (2/3 width) ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Today's tasks */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <CalendarIcon width={14} height={14} className="text-portal" />
                <h2 className="text-sm font-semibold text-neutral-200">Tasks Needing Attention</h2>
              </div>
              <div className="flex items-center gap-3">
                {overdueTasks.length > 0 && <span className="text-[11px] font-semibold text-crimson-400">{overdueTasks.length} overdue</span>}
                {todayTasks.length > 0 && <span className="text-[11px] font-semibold text-amber-400">{todayTasks.length} due today</span>}
                <Link href="/admin/outreach/tasks" className="text-[11px] text-portal hover:opacity-80">View all</Link>
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              {urgentTasks.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-neutral-500">No urgent tasks — you&apos;re on top of things.</p>
                  <Link href="/admin/outreach/tasks" className="mt-2 inline-block text-xs text-portal hover:opacity-80">View all tasks</Link>
                </div>
              ) : urgentTasks.map(t => <TaskRow key={t.id} task={t} firms={firms} />)}
              {soonTasks.length > 0 && (
                <p className="text-[11px] text-neutral-600 pt-1 px-1">{soonTasks.length} more task{soonTasks.length > 1 ? 's' : ''} due in the next 3 days</p>
              )}
            </div>
          </div>

          {/* Today's interviews */}
          {(todayInterviews.length > 0 || upcomingInterviews.length > 0) && (
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/15">
                <div className="flex items-center gap-2">
                  <HandshakeIcon width={14} height={14} className="text-emerald-400" />
                  <h2 className="text-sm font-semibold text-emerald-200">Interviews</h2>
                </div>
                <Link href="/admin/outreach/interviews" className="text-[11px] text-emerald-400 hover:text-emerald-300">View all</Link>
              </div>
              <div className="p-3 space-y-1.5">
                {todayInterviews.map(iv => (
                  <Link key={iv.id} href={`/admin/outreach/interviews/${iv.id}`} className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/8 px-3 py-2.5 hover:bg-emerald-500/15 transition-all">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-200">{iv.firmName}</p>
                      <p className="text-[11px] text-emerald-500">{iv.time ? `Today at ${iv.time}` : 'Today'} · {iv.type.replace('_', ' ')}</p>
                    </div>
                    {iv.interviewerName && <p className="text-[11px] text-neutral-500 flex-shrink-0">{iv.interviewerName}</p>}
                  </Link>
                ))}
                {upcomingInterviews.map(iv => (
                  <Link key={iv.id} href={`/admin/outreach/interviews/${iv.id}`} className="flex items-center gap-3 rounded-xl border border-white/5 bg-primary-800/20 px-3 py-2 hover:bg-primary-700/30 transition-all">
                    <span className="flex h-2 w-2 rounded-full bg-neutral-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-300">{iv.firmName}</p>
                      <p className="text-[11px] text-neutral-600">{fmtDate(iv.date)}{iv.time ? ` at ${iv.time}` : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Support threads */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <ChatIcon width={14} height={14} className="text-portal" />
                <h2 className="text-sm font-semibold text-neutral-200">Support Queue</h2>
              </div>
              <Link href="/admin/support" className="text-[11px] text-portal hover:opacity-80">View all</Link>
            </div>
            {!platformLoaded ? (
              <div className="p-4 space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl skeleton" />)}
              </div>
            ) : threads.length === 0 ? (
              <div className="py-10 text-center text-neutral-500 text-sm">No support threads yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {threads.map(t => {
                  const client = t.participants?.find(p => p.role === 'client')
                  return (
                    <Link key={t.id} href={`/admin/support?thread=${t.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors group">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-portal-soft text-portal text-xs font-bold">
                        {(client?.display_name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-neutral-200 truncate">{client?.display_name ?? 'Unknown'}</p>
                          {t.escalated_to_human && <Badge variant="warning">Human</Badge>}
                        </div>
                        {t.last_message && <p className="text-xs text-neutral-500 truncate">{t.last_message.content}</p>}
                      </div>
                      <span className="text-xs text-neutral-600 flex-shrink-0">{timeAgo(t.updated_at)}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column (1/3 width) ── */}
        <div className="space-y-5">

          {/* Outreach KPIs */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-200">Outreach Summary</h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total Firms', value: firms.length, href: '/admin/outreach/firms' },
                { label: 'Council', value: councilCount, href: '/admin/outreach/founding-council' },
                { label: 'Pilots', value: pilotCount, href: '/admin/outreach/pilot-partners' },
              ].map(({ label, value, href }) => (
                <Link key={label} href={href} className="rounded-xl border border-white/6 bg-primary-900/40 p-3 text-center hover:border-portal transition-all group">
                  <p className="font-display font-bold text-xl text-neutral-100 group-hover:text-portal transition-colors">{value}</p>
                  <p className="text-[10px] text-neutral-600 mt-0.5">{label}</p>
                </Link>
              ))}
            </div>
            <div className="space-y-1 pt-1">
              {[
                { label: 'Pending tasks', value: pendingTasks.length, href: '/admin/outreach/tasks', warn: pendingTasks.length > 10 },
                { label: 'Interviews scheduled', value: interviews.filter(i => i.status === 'scheduled').length, href: '/admin/outreach/interviews', warn: false },
                { label: 'Follow-up needed', value: firms.filter(f => f.status === 'follow_up_needed').length, href: '/admin/outreach/firms', warn: firms.filter(f => f.status === 'follow_up_needed').length > 0 },
              ].map(({ label, value, href, warn }) => (
                <Link key={label} href={href} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/3 transition-colors group">
                  <span className="text-xs text-neutral-500 group-hover:text-neutral-400">{label}</span>
                  <span className={`text-xs font-semibold ${warn && value > 0 ? 'text-amber-400' : 'text-neutral-300'}`}>{value}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Pipeline */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-200">Pipeline</h2>
              <Link href="/admin/outreach/analytics" className="text-[11px] text-portal hover:opacity-80">Details</Link>
            </div>
            <div className="space-y-2">
              {PIPELINE_STAGES.filter(s => (pipelineCounts[s.key] ?? 0) > 0).map(stage => {
                const count = pipelineCounts[stage.key] ?? 0
                const max = Math.max(...Object.values(pipelineCounts), 1)
                return (
                  <div key={stage.key} className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-500 w-24 truncate flex-shrink-0">{stage.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-400 w-5 text-right flex-shrink-0">{count}</span>
                  </div>
                )
              })}
              {firms.length === 0 && <p className="text-xs text-neutral-600 py-4 text-center">No firms added yet</p>}
            </div>
          </div>

          {/* Risk summary */}
          {platformLoaded && (platform.critical > 0 || platform.watch > 0) && (
            <div className="rounded-2xl border border-crimson-500/15 bg-crimson-500/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-crimson-300">Case Risks</h2>
                <Link href="/admin/risks" className="text-[11px] text-crimson-400 hover:text-crimson-300">View all</Link>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl bg-crimson-500/10 border border-crimson-500/20 p-3 text-center">
                  <p className="font-display font-bold text-2xl text-crimson-400">{platform.critical}</p>
                  <p className="text-[10px] text-neutral-600">Critical</p>
                </div>
                <div className="flex-1 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                  <p className="font-display font-bold text-2xl text-amber-400">{platform.watch}</p>
                  <p className="text-[10px] text-neutral-600">Watch</p>
                </div>
              </div>
            </div>
          )}

          {/* Recently added firms */}
          {recentFirms.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-neutral-200">Recently Added</h2>
                <Link href="/admin/outreach/firms" className="text-[11px] text-portal hover:opacity-80">All firms</Link>
              </div>
              <div className="space-y-2">
                {recentFirms.map(f => (
                  <Link key={f.id} href={`/admin/outreach/firms/${f.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/4 transition-colors group">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-portal-soft text-[11px] font-bold text-portal">
                      {f.firmName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-300 truncate group-hover:text-neutral-100">{f.firmName}</p>
                      <p className="text-[10px] text-neutral-600">{f.city}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-4">
            <h2 className="text-sm font-semibold text-neutral-200 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Add Firm', href: '/admin/outreach/firms', Icon: BuildingIcon },
                { label: 'Log Interview', href: '/admin/outreach/interviews', Icon: ClipboardIcon },
                { label: 'Create Task', href: '/admin/outreach/tasks', Icon: CheckCircleIcon },
                { label: 'Support', href: '/admin/support', Icon: ChatIcon },
              ].map(({ label, href, Icon }) => (
                <Link key={label} href={href} className="flex items-center gap-2 rounded-xl border border-white/6 bg-primary-900/40 px-3 py-2.5 text-xs font-medium text-neutral-300 hover:border-portal hover:text-portal transition-all">
                  <Icon width={14} height={14} />{label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
