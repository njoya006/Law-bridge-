"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getLawyerStats, getCaseProgress, getCaseRisks, type CaseRiskResponse } from '../../../lib/monitoringApi'
import { listBookings } from '../../../lib/bookingApi'
import { getMyCases, type CaseItem } from '../../../lib/casesApi'
import { unreadNotificationCount } from '../../../lib/notificationsApi'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function statusColor(status: string) {
  if (['in_progress', 'hearing_scheduled'].includes(status)) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  if (['awaiting_court_date', 'evidence_collection'].includes(status)) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  if (['closed', 'dismissed', 'archived'].includes(status)) return 'bg-neutral-700/40 text-neutral-400 border-neutral-600/30'
  if (['verdict', 'settled'].includes(status)) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (status === 'assigned') return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  return 'bg-gold-500/20 text-gold-300 border-gold-500/30'
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonTile() {
  return (
    <div className="bg-primary-800/30 border border-white/6 rounded-2xl p-5 animate-pulse">
      <div className="h-8 w-16 bg-white/8 rounded-lg mb-2" />
      <div className="h-4 w-24 bg-white/5 rounded" />
      <div className="h-3 w-16 bg-white/4 rounded mt-1" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/5 bg-primary-900/20 animate-pulse">
      <div className="h-4 w-4/5 bg-white/8 rounded" />
      <div className="h-5 w-20 bg-white/5 rounded-full ml-auto flex-shrink-0" />
    </div>
  )
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
        {[1,2,3].map(i => <div key={i} className="h-12 bg-white/5 rounded-lg" />)}
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
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              {counts.critical} Critical
            </span>
          )}
          {counts.watch > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              {counts.watch} Watch
            </span>
          )}
          {counts.healthy > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {counts.healthy} Healthy
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
                    <div className={`text-sm font-bold ${isRed ? 'text-red-400' : 'text-amber-400'}`}>{c.risk_score}</div>
                    <div className={`h-1 rounded-full mt-1 ${isRed ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${c.risk_score}%`, minWidth: '4px' }} />
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

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function LawyerDashboardPage() {
  const [token, setToken] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [lawyerId, setLawyerId] = useState('')
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({ active_cases: 0, closed_cases_count: 0, cases_this_month: 0 })
  const [cases, setCases] = useState<CaseItem[]>([])
  const [unread, setUnread] = useState(0)
  const [bookingCount, setBookingCount] = useState(0)

  useEffect(() => {
    const access = localStorage.getItem('access')
    const lid = localStorage.getItem('authUserId') || localStorage.getItem('lawyerId') || ''
    const stored = localStorage.getItem('fullName') || localStorage.getItem('userEmail') || ''
    if (!access) return
    setToken(access)
    setLawyerId(lid)
    setName(stored.split('@')[0] || stored)

    const run = async () => {
      try {
        const [statsRes, casesRes, unreadRes, bookingsRes] = await Promise.allSettled([
          getLawyerStats(lid, access),
          getMyCases(access),
          unreadNotificationCount(access),
          listBookings(access),
        ])

        if (statsRes.status === 'fulfilled') setStats(statsRes.value)
        if (casesRes.status === 'fulfilled') setCases(casesRes.value.results ?? [])
        if (unreadRes.status === 'fulfilled') {
          const v = unreadRes.value
          setUnread((v as {unread_count?: number}).unread_count ?? (v as {unread?: number}).unread ?? 0)
        }
        if (bookingsRes.status === 'fulfilled') {
          const bookings = Array.isArray(bookingsRes.value) ? bookingsRes.value : (bookingsRes.value as {results?: unknown[]}).results ?? []
          setBookingCount(bookings.filter((b: unknown) => (b as {status?: string}).status === 'pending').length)
        }
      } catch {
        // partial data is fine
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const activeCases = cases.filter(c => !['closed', 'dismissed', 'archived', 'settled'].includes(c.status))
  const recentCases = activeCases.slice(0, 6)

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-display-md text-neutral-50">
            {name ? `Welcome back, ${name.split(' ')[0]}` : 'Firm Dashboard'}
          </h2>
          <p className="mt-1 text-sm text-neutral-400">Here is what requires your attention today.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/lawyer/matters">
            <button className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors">
              View Matters
            </button>
          </Link>
          <Link href="/lawyer/bookings">
            <button className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200 text-sm font-medium transition-colors">
              Bookings
            </button>
          </Link>
        </div>
      </header>

      {/* KPI Tiles */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonTile key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Active Matters',
              value: stats.active_cases,
              sub: `${cases.length} total matters`,
              href: '/lawyer/matters',
              color: 'text-gold-400',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
            },
            {
              label: 'Pending Bookings',
              value: bookingCount,
              sub: 'awaiting your response',
              href: '/lawyer/bookings',
              color: bookingCount > 0 ? 'text-amber-400' : 'text-neutral-400',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              ),
            },
            {
              label: 'Cases This Month',
              value: stats.cases_this_month,
              sub: 'newly opened',
              href: '/lawyer/matters',
              color: 'text-blue-400',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
            },
            {
              label: 'Unread Updates',
              value: unread,
              sub: 'notifications',
              href: '/notifications',
              color: unread > 0 ? 'text-red-400' : 'text-neutral-400',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              ),
            },
          ].map(({ label, value, sub, href, color, icon }, i) => (
            <Link key={label} href={href} className="block" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="bg-primary-800/30 border border-white/8 rounded-2xl p-5 hover:border-white/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-white/5 ${color} group-hover:bg-white/8 transition-colors`}>{icon}</div>
                </div>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                <p className="text-sm text-neutral-200 mt-1 font-medium">{label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Active Matters list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">Active Matters</h3>
            <Link href="/lawyer/matters" className="text-xs text-gold-400 hover:text-gold-300 transition-colors">View all →</Link>
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <SkeletonRow key={i} />)}</div>
          ) : recentCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/6 bg-primary-800/20 py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary-700/40 flex items-center justify-center mb-3 text-neutral-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <p className="text-sm text-neutral-400">No active matters yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCases.map(c => (
                <Link key={c.id} href={`/cases/${c.id}`} className="block group">
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-white/6 bg-primary-800/20 hover:border-white/12 hover:bg-primary-800/40 transition-all">
                    <div className={`flex-shrink-0 w-1.5 h-10 rounded-full ${
                      c.status === 'in_progress' ? 'bg-blue-400' :
                      c.status === 'assigned' ? 'bg-purple-400' :
                      c.status.includes('hearing') ? 'bg-amber-400' :
                      'bg-gold-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-100 truncate group-hover:text-gold-300 transition-colors">{c.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase text-neutral-600 font-medium tracking-wide">{c.case_type}</span>
                        {c.case_ref && <span className="text-[10px] text-neutral-600">· {c.case_ref}</span>}
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full border capitalize ${statusColor(c.status)}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                    <svg className="w-4 h-4 text-neutral-600 flex-shrink-0 group-hover:text-neutral-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Status breakdown */}
          {!loading && cases.length > 0 && (
            <div className="rounded-2xl border border-white/6 bg-primary-800/20 p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Portfolio Overview</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Active', value: stats.active_cases, color: 'text-gold-400' },
                  { label: 'Closed', value: stats.closed_cases_count, color: 'text-neutral-400' },
                  { label: 'This Month', value: stats.cases_this_month, color: 'text-blue-400' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {cases.length > 0 && (
                <div className="mt-4 flex gap-1 h-2 rounded-full overflow-hidden">
                  <div className="bg-gold-400/70 rounded-full transition-all" style={{ width: `${Math.round((stats.active_cases / Math.max(cases.length, 1)) * 100)}%` }} />
                  <div className="bg-neutral-600/50 rounded-full transition-all" style={{ width: `${Math.round((stats.closed_cases_count / Math.max(cases.length, 1)) * 100)}%` }} />
                  <div className="bg-blue-400/50 flex-1 rounded-full" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Risk Monitor */}
          {token && <CaseRiskWidget token={token} />}

          {/* Quick Actions */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-5">
            <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                {
                  label: 'My Clients',
                  sub: 'View all assigned clients',
                  href: '/lawyer/clients',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ),
                },
                {
                  label: 'AI Case Triage',
                  sub: 'AI-powered case analysis',
                  href: '/lawyer/triage',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  ),
                },
                {
                  label: 'Documents',
                  sub: 'Case files and uploads',
                  href: '/lawyer/documents',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  ),
                },
                {
                  label: 'Messages',
                  sub: 'Client communications',
                  href: '/messages',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  ),
                },
                {
                  label: 'My Calendar',
                  sub: 'Schedule and appointments',
                  href: '/lawyer/calendar',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  ),
                },
                {
                  label: 'Settings',
                  sub: 'Profile and preferences',
                  href: '/lawyer/settings',
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><circle cx="12" cy="12" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
                  ),
                },
              ].map(({ label, sub, href, icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-white/8 hover:bg-white/4 transition-all group">
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary-700/40 flex items-center justify-center text-neutral-400 group-hover:text-gold-400 group-hover:bg-gold-500/10 transition-all">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-200 group-hover:text-neutral-100 transition-colors">{label}</p>
                    <p className="text-xs text-neutral-600">{sub}</p>
                  </div>
                  <svg className="w-4 h-4 text-neutral-700 flex-shrink-0 group-hover:text-neutral-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
