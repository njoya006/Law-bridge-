"use client"

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { getLawyerStats, getCaseRisks, type CaseRiskResponse } from '../../../lib/monitoringApi'
import { listCalendarEvents, type CalendarEvent } from '../../../lib/calendarApi'
import { getMyCases, type CaseItem } from '../../../lib/casesApi'
import { unreadNotificationCount } from '../../../lib/notificationsApi'
import { api } from '../../../lib/api'
import { SERVICE_URLS } from '../../../lib/serviceUrls'
import { useCountUp } from '../../../lib/useCountUp'
import { SkeletonStat, SkeletonTable } from '../../../components/ui/Skeleton'
import { EmptyState } from '../../../components/ui/EmptyState'

// ── Types ─────────────────────────────────────────────────────────────────────

type LawyerProfile = {
  id: string
  bijural_flag: string
  availability_status: string
  consultation_fee: string
  bar_number: string
  years_of_experience: number
  verified_at: string | null
}

// ── Availability ──────────────────────────────────────────────────────────────

const AVAIL_OPTIONS = [
  { value: 'available',  label: 'Available',  color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30',   dot: 'bg-emerald-400' },
  { value: 'busy',       label: 'Busy',       color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30',       dot: 'bg-amber-400' },
  { value: 'in_court',   label: 'In Court',   color: 'text-primary-100', bg: 'bg-primary-400/15 border-primary-400/30',   dot: 'bg-primary-400' },
  { value: 'on_leave',   label: 'On Leave',   color: 'text-neutral-400', bg: 'bg-neutral-700/30 border-neutral-600/30',   dot: 'bg-neutral-500' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function getHonorific(bijuralFlag: string): string {
  if (bijuralFlag === 'civil_law') return 'Maître'
  if (bijuralFlag === 'common_law') return 'Barr.'
  if (bijuralFlag === 'both') return 'Maître'
  return ''
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function statusColor(status: string): string {
  if (['in_progress', 'hearing_scheduled'].includes(status)) return 'bg-primary-400/20 text-primary-100 border-primary-400/30'
  if (['awaiting_court_date', 'evidence_collection'].includes(status)) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  if (['closed', 'dismissed', 'archived'].includes(status)) return 'bg-neutral-700/40 text-neutral-400 border-neutral-600/30'
  if (['verdict', 'settled'].includes(status)) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (status === 'assigned') return 'bg-gold-500/15 text-gold-300 border-gold-500/25'
  return 'bg-gold-500/10 text-gold-300 border-gold-500/20'
}

function formatEarnings(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return n === 0 ? '0' : n.toLocaleString()
}

// ── Case Risk Widget ──────────────────────────────────────────────────────────

function CaseRiskWidget({ token }: { token: string }) {
  const [data, setData] = useState<CaseRiskResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCaseRisks(token).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  if (loading) return (
    <div className="bg-primary-800/30 border border-white/8 rounded-2xl p-6 animate-pulse">
      <div className="h-5 w-40 bg-white/8 rounded mb-4" />
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg" />)}
      </div>
    </div>
  )
  if (!data || data.cases.length === 0) return null

  const { counts, cases } = data
  const atRisk = cases.filter(c => c.risk_level !== 'healthy').slice(0, 4)

  return (
    <div className="bg-primary-800/30 border border-white/8 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-semibold text-neutral-100">Case Risk Monitor</h3>
          <p className="text-xs text-neutral-500 mt-0.5">AI-powered early warning</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {counts.critical > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-crimson-500/15 text-crimson-400 border border-crimson-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson-400 inline-block" />{counts.critical} Critical
            </span>
          )}
          {counts.watch > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />{counts.watch} Watch
            </span>
          )}
          {counts.healthy > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />{counts.healthy} Healthy
            </span>
          )}
        </div>
      </div>

      {atRisk.length === 0 ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          All active cases are healthy.
        </div>
      ) : (
        <div className="space-y-2">
          {atRisk.map(c => {
            const isRed = c.risk_level === 'critical'
            return (
              <Link key={c.case_id} href={`/cases/${c.case_id}`} className="block group">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/40 hover:bg-neutral-800/70 transition-colors border border-transparent hover:border-white/5">
                  <div className="flex-shrink-0 w-10 text-center">
                    <div className={`text-sm font-bold ${isRed ? 'text-crimson-400' : 'text-amber-400'}`}>{c.risk_score}</div>
                    <div className={`h-1 rounded-full mt-1 ${isRed ? 'bg-crimson-500' : 'bg-amber-400'}`} style={{ width: `${c.risk_score}%`, minWidth: '4px' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-100 truncate group-hover:text-gold-300 transition-colors">{c.title}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.risk_factors.slice(0, 3).map(f => (
                        <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-700/60 text-neutral-400">{f}</span>
                      ))}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-neutral-600 flex-shrink-0 group-hover:text-neutral-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
            )
          })}
          <Link href="/admin/risks" className="block text-xs text-gold-400 hover:text-gold-300 text-center pt-1 transition-colors">
            View all risk cases →
          </Link>
        </div>
      )}
    </div>
  )
}

// ── Today's Schedule ──────────────────────────────────────────────────────────

function TodaySchedule({ events }: { events: CalendarEvent[] }) {
  const today = todayISO()
  const todayEvents = events
    .filter(e => e.date === today && e.status !== 'cancelled' && e.status !== 'rejected')
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  if (todayEvents.length === 0) return null

  const typeColor = (t: string) =>
    t === 'hearing'  ? 'bg-primary-400/15 text-primary-300 border-primary-400/25' :
    t === 'verdict'  ? 'bg-crimson-500/15 text-crimson-400 border-crimson-500/25' :
                       'bg-gold-500/15 text-gold-300 border-gold-400/25'

  return (
    <div className="rounded-2xl border border-gold-400/20 bg-gold-500/[0.03] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
          <p className="text-xs font-semibold text-gold-400 uppercase tracking-wider">Today&apos;s Schedule</p>
        </div>
        <Link href="/lawyer/calendar" className="text-xs text-neutral-500 hover:text-gold-400 transition-colors">Full calendar →</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {todayEvents.map(ev => (
          <div key={ev.id} className="flex-shrink-0 min-w-[155px] rounded-xl border border-white/8 bg-primary-900/50 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${typeColor(ev.event_type)}`}>{ev.event_type}</span>
              {ev.status === 'confirmed' || ev.status === 'approved' ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-sm font-bold text-gold-300 tabular-nums">{ev.time || '—'}</p>
            <p className="text-xs text-neutral-400 mt-0.5 truncate">{ev.location || (ev.virtual_link ? 'Virtual' : 'TBD')}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Upcoming Hearings ─────────────────────────────────────────────────────────

function UpcomingHearings({ events }: { events: CalendarEvent[] }) {
  const today = todayISO()
  const upcoming = events
    .filter(e => e.date > today && e.status !== 'cancelled' && e.status !== 'rejected')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  if (upcoming.length === 0) return null

  const daysUntil = (d: string) => {
    const days = Math.round((new Date(d + 'T12:00:00').getTime() - new Date().getTime()) / 86400000)
    if (days <= 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    if (days <= 7) return `In ${days}d`
    return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  const urgencyColor = (d: string) => {
    const days = Math.round((new Date(d + 'T12:00:00').getTime() - new Date().getTime()) / 86400000)
    if (days <= 2) return 'text-crimson-400 font-bold'
    if (days <= 7) return 'text-amber-400 font-semibold'
    return 'text-neutral-500'
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-100">Upcoming Hearings</h3>
        <Link href="/lawyer/calendar" className="text-xs text-gold-400 hover:text-gold-300 transition-colors">View all →</Link>
      </div>
      <div className="space-y-2">
        {upcoming.map(ev => (
          <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-800/30 border border-white/5">
            <div className="flex-shrink-0 text-center w-9">
              <p className="text-xs font-bold text-neutral-100">
                {new Date(ev.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric' })}
              </p>
              <p className="text-[9px] text-neutral-500 uppercase">
                {new Date(ev.date + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short' })}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-200 capitalize">
                {ev.event_type}{ev.time ? ` · ${ev.time}` : ''}
              </p>
              <p className="text-[10px] text-neutral-500 truncate">{ev.location || 'Location TBD'}</p>
            </div>
            <span className={`text-[10px] flex-shrink-0 ${urgencyColor(ev.date)}`}>{daysUntil(ev.date)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Recent Activity ───────────────────────────────────────────────────────────

function RecentActivity({ events, cases }: { events: CalendarEvent[]; cases: CaseItem[] }) {
  const items = [
    ...events.slice(0, 5).map(e => ({
      id: 'ev-' + e.id,
      label: `${e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1)} ${e.status === 'pending' ? 'requested' : e.status}`,
      sub: e.location || (e.virtual_link ? 'Virtual session' : e.event_type),
      time: e.created_at,
      dot: 'bg-primary-400',
    })),
    ...cases.slice(0, 5).map(c => ({
      id: 'cs-' + c.id,
      label: c.title,
      sub: c.case_type.replace(/_/g, ' ') + ' · ' + c.status.replace(/_/g, ' '),
      time: c.created_at || '',
      dot: 'bg-gold-400',
    })),
  ]
    .filter(i => i.time)
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 7)

  if (items.length === 0) return null

  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-5">
      <h3 className="text-sm font-semibold text-neutral-100 mb-4">Recent Activity</h3>
      <div className="relative space-y-0">
        {items.map((item, i) => (
          <div key={item.id} className="flex items-start gap-3 pb-3">
            <div className="flex flex-col items-center flex-shrink-0 mt-1">
              <span className={`w-2 h-2 rounded-full ${item.dot}`} />
              {i < items.length - 1 && <div className="w-px flex-1 bg-white/5 mt-1" style={{ minHeight: '16px' }} />}
            </div>
            <div className="flex-1 min-w-0 pb-0">
              <p className="text-xs font-medium text-neutral-200 truncate">{item.label}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-neutral-600 truncate">{item.sub}</p>
                <span className="text-[10px] text-neutral-700 flex-shrink-0">{formatRelative(item.time)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function LawyerDashboardPage() {
  const [token, setToken] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [lawyerId, setLawyerId] = useState('')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<LawyerProfile | null>(null)
  const [availUpdating, setAvailUpdating] = useState(false)
  const [showAvailMenu, setShowAvailMenu] = useState(false)
  const [stats, setStats] = useState({ active_cases: 0, closed_cases_count: 0, cases_this_month: 0 })
  const [cases, setCases] = useState<CaseItem[]>([])
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([])
  const [unread, setUnread] = useState(0)
  const [bookingCount, setBookingCount] = useState(0)
  const [earnings, setEarnings] = useState<number | null>(null)

  useEffect(() => {
    const access = localStorage.getItem('access')
    const lid = localStorage.getItem('authUserId') || localStorage.getItem('lawyerId') || ''
    const stored = localStorage.getItem('fullName') || localStorage.getItem('userEmail') || ''
    if (!access) { setLoading(false); return }
    setToken(access)
    setLawyerId(lid)
    setName(stored.split('@')[0] || stored)

    const run = async () => {
      try {
        const [statsRes, casesRes, unreadRes, eventsRes, profileRes] = await Promise.allSettled([
          getLawyerStats(lid, access),
          getMyCases(access),
          unreadNotificationCount(access),
          listCalendarEvents(access),
          api.get<LawyerProfile>('lawyer', '/lawyers/me/', access),
        ])

        if (statsRes.status === 'fulfilled') setStats(statsRes.value)
        if (casesRes.status === 'fulfilled') setCases(casesRes.value.results ?? [])
        if (unreadRes.status === 'fulfilled') {
          const v = unreadRes.value
          setUnread((v as { unread_count?: number }).unread_count ?? (v as { unread?: number }).unread ?? 0)
        }
        if (eventsRes.status === 'fulfilled') {
          const evs = Array.isArray(eventsRes.value)
            ? eventsRes.value
            : (eventsRes.value as { results?: CalendarEvent[] }).results ?? []
          setCalEvents(evs)
          setBookingCount(evs.filter(e => e.status === 'pending').length)
        }
        if (profileRes.status === 'fulfilled') setProfile(profileRes.value)

        // Earnings — fire-and-forget, non-critical
        try {
          const invRes = await fetch(`${SERVICE_URLS.payment}/invoices/`, {
            headers: { Authorization: `Bearer ${access}` },
          })
          if (invRes.ok) {
            const invData = await invRes.json()
            const invs: { amount: number; status?: string; due_date?: string; created_at?: string }[] =
              Array.isArray(invData) ? invData : (invData.results ?? [])
            const now = new Date()
            const monthEarnings = invs
              .filter(inv => {
                if ((inv.status || '').toLowerCase() !== 'paid') return false
                const d = new Date(inv.due_date || inv.created_at || '')
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
              })
              .reduce((sum, inv) => sum + (inv.amount ?? 0), 0)
            setEarnings(monthEarnings)
          }
        } catch { /* billing service unavailable */ }
      } catch { /* partial data is fine */ }
      finally { setLoading(false) }
    }
    void run()
  }, [])

  const changeAvailability = useCallback(async (newStatus: string) => {
    const access = localStorage.getItem('access')
    if (!access || availUpdating) return
    setAvailUpdating(true)
    setShowAvailMenu(false)
    try {
      await api.patch('lawyer', '/lawyers/me/', { availability_status: newStatus }, access)
      setProfile(prev => prev ? { ...prev, availability_status: newStatus } : prev)
    } catch { /* silent */ }
    finally { setAvailUpdating(false) }
  }, [availUpdating])

  const animActiveCases = useCountUp(stats.active_cases)
  const animBookingCount = useCountUp(bookingCount)
  const animCasesThisMonth = useCountUp(stats.cases_this_month)
  const animUnread = useCountUp(unread)

  const honorific = profile ? getHonorific(profile.bijural_flag) : ''
  const firstName = name.split(' ')[0]
  const lastName = name.includes(' ') ? name.split(' ').slice(1).join(' ') : name

  const activeCases = cases.filter(c => !['closed', 'dismissed', 'archived', 'settled'].includes(c.status))
  const recentCases = activeCases.slice(0, 6)
  const todayLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  const currentAvail = AVAIL_OPTIONS.find(o => o.value === (profile?.availability_status || 'available')) ?? AVAIL_OPTIONS[0]

  return (
    <div className="space-y-5 max-w-full" onClick={() => showAvailMenu && setShowAvailMenu(false)}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-primary-800/25 px-6 py-5">
        <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-gold-500 opacity-[0.06] blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-32 w-64 bg-gradient-to-tl from-gold-500/5 to-transparent rounded-2xl" />

        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-600 mb-1">{todayLabel}</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-50 leading-tight">
              {honorific && lastName ? (
                <>
                  <span className="text-neutral-400 font-medium text-xl sm:text-2xl">{honorific}</span>{' '}
                  <span className="text-gold-300">{lastName}</span>
                </>
              ) : firstName ? (
                <>Welcome back, <span className="text-gold-300">{firstName}</span></>
              ) : 'Firm Dashboard'}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">Here is what requires your attention today.</p>

            {/* Availability pill */}
            {profile && (
              <div className="relative mt-3 inline-block" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setShowAvailMenu(v => !v)}
                  disabled={availUpdating}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${currentAvail.bg} ${currentAvail.color}`}
                >
                  {availUpdating
                    ? <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />
                    : <span className={`w-2 h-2 rounded-full ${currentAvail.dot}`} />
                  }
                  {currentAvail.label}
                  <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showAvailMenu && (
                  <div className="absolute top-full left-0 mt-1.5 z-30 min-w-[160px] rounded-xl border border-white/10 bg-primary-900 shadow-2xl overflow-hidden">
                    {AVAIL_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => void changeAvailability(opt.value)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors hover:bg-white/5 ${opt.value === profile.availability_status ? 'bg-white/5' : ''}`}
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${opt.dot}`} />
                        <span className={opt.color}>{opt.label}</span>
                        {opt.value === profile.availability_status && (
                          <svg className="w-3 h-3 ml-auto text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap flex-shrink-0 items-start">
            <Link href="/lawyer/matters">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 text-black text-sm font-bold shadow-[0_2px_12px_rgba(212,168,67,0.35)] hover:shadow-[0_4px_20px_rgba(212,168,67,0.5)] hover:from-gold-300 hover:to-gold-500 transition-all active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Matters
              </button>
            </Link>
            <Link href="/lawyer/bookings">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/15 text-neutral-200 text-sm font-medium transition-all active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Bookings
                {bookingCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-black">
                    {bookingCount > 9 ? '9+' : bookingCount}
                  </span>
                )}
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Quick-action rail ───────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1">
        {[
          { label: 'New Matter',  href: '/lawyer/matters',   gold: true,  d: 'M12 4v16m8-8H4' },
          { label: 'Upload Doc',  href: '/lawyer/documents', gold: false, d: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
          { label: 'Message',     href: '/messages',         gold: false, d: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
          { label: 'Calendar',    href: '/lawyer/calendar',  gold: false, d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { label: 'AI Review',   href: '/lawyer/ai',        gold: false, d: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { label: 'Case Triage', href: '/lawyer/triage',    gold: false, d: 'M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z' },
          { label: 'My Clients',  href: '/lawyer/clients',   gold: false, d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
        ].map(({ label, href, gold, d }) => (
          <Link key={href} href={href} className="flex-shrink-0">
            <button className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
              gold
                ? 'bg-gold-500/20 border border-gold-400/30 text-gold-300 hover:bg-gold-500/30'
                : 'border border-white/8 bg-white/[0.03] text-neutral-400 hover:border-white/15 hover:text-neutral-200 hover:bg-white/[0.06]'
            }`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={d} />
              </svg>
              {label}
            </button>
          </Link>
        ))}
      </div>

      {/* ── Today's Schedule ────────────────────────────────────────────────── */}
      {!loading && <TodaySchedule events={calEvents} />}

      {/* ── KPI Tiles ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <SkeletonStat key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: 'Active Matters',
              value: animActiveCases,
              sub: `${cases.length} total matters`,
              href: '/lawyer/matters',
              color: 'text-gold-400',
              d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
            },
            {
              label: 'Pending Bookings',
              value: animBookingCount,
              sub: 'awaiting response',
              href: '/lawyer/bookings',
              color: bookingCount > 0 ? 'text-amber-400' : 'text-neutral-400',
              d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            },
            {
              label: 'Cases This Month',
              value: animCasesThisMonth,
              sub: 'newly opened',
              href: '/lawyer/matters',
              color: 'text-primary-400',
              d: 'M22 12h-4l-3 9L9 3l-3 9H2',
            },
            {
              label: earnings !== null ? 'Earnings (Month)' : 'Billing',
              value: earnings !== null ? formatEarnings(earnings) : '—',
              sub: 'XAF collected',
              href: '/lawyer/billing',
              color: earnings !== null && earnings > 0 ? 'text-emerald-400' : 'text-neutral-500',
              d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            },
            {
              label: 'Unread Updates',
              value: animUnread,
              sub: 'notifications',
              href: '/notifications',
              color: unread > 0 ? 'text-crimson-400' : 'text-neutral-400',
              d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
            },
          ].map(({ label, value, sub, href, color, d }, i) => (
            <Link key={label} href={href} className="block stagger-child" style={{ '--i': i } as React.CSSProperties}>
              <div className="bg-primary-800/30 border border-white/8 rounded-2xl p-5 hover:border-white/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-white/5 ${color} group-hover:bg-white/8 transition-colors`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
                    </svg>
                  </div>
                </div>
                <p className={`text-3xl stat-num ${color}`}>{value}</p>
                <p className="text-sm text-neutral-200 mt-1 font-medium">{label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Active Matters */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">Active Matters</h3>
            <Link href="/lawyer/matters" className="text-xs text-gold-400 hover:text-gold-300 transition-colors">View all →</Link>
          </div>

          {loading ? (
            <SkeletonTable rows={4} />
          ) : recentCases.length === 0 ? (
            <EmptyState
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              title="No active matters yet"
              body="Cases assigned to you will appear here."
              action={{ label: 'View all matters', href: '/lawyer/matters' }}
            />
          ) : (
            <div className="space-y-2">
              {recentCases.map(c => (
                <Link key={c.id} href={`/cases/${c.id}`} className="block group">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/6 bg-primary-800/20 hover:border-white/12 hover:bg-primary-800/40 transition-all">
                    <div className={`flex-shrink-0 w-1.5 h-10 rounded-full ${
                      c.status === 'in_progress' ? 'bg-primary-400' :
                      c.status === 'assigned' ? 'bg-gold-500' :
                      c.status.includes('hearing') ? 'bg-amber-400' :
                      'bg-gold-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-100 truncate group-hover:text-gold-300 transition-colors">{c.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase text-neutral-600 font-medium tracking-wide">{c.case_type}</span>
                        <span className="text-[10px] text-neutral-600">· #{c.id.slice(0, 8)}</span>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full border capitalize ${statusColor(c.status)}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                    <svg className="w-4 h-4 text-neutral-600 flex-shrink-0 group-hover:text-neutral-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Portfolio overview */}
          {!loading && cases.length > 0 && (
            <div className="rounded-2xl border border-white/6 bg-primary-800/20 p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Portfolio Overview</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Active',      value: stats.active_cases,      color: 'text-gold-400' },
                  { label: 'Closed',      value: stats.closed_cases_count, color: 'text-neutral-400' },
                  { label: 'This Month',  value: stats.cases_this_month,  color: 'text-primary-400' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className={`text-2xl stat-num ${color}`}>{value}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden">
                <div className="bg-gold-400/70 rounded-full transition-all" style={{ width: `${Math.round((stats.active_cases / Math.max(cases.length, 1)) * 100)}%` }} />
                <div className="bg-neutral-600/50 rounded-full transition-all" style={{ width: `${Math.round((stats.closed_cases_count / Math.max(cases.length, 1)) * 100)}%` }} />
                <div className="bg-primary-400/50 flex-1 rounded-full" />
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {token && <CaseRiskWidget token={token} />}
          {!loading && <UpcomingHearings events={calEvents} />}
          {!loading && <RecentActivity events={calEvents} cases={cases} />}
        </div>
      </div>
    </div>
  )
}
