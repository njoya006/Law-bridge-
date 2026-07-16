'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMyCases, type CaseItem } from '../../lib/casesApi'
import { unreadNotificationCount, listNotifications, type NotificationItem } from '../../lib/notificationsApi'
import { listDocuments } from '../../lib/documentsApi'

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function statusDot(status: string) {
  if (['in_progress', 'hearing_scheduled'].includes(status)) return 'bg-blue-400'
  if (['awaiting_court_date', 'evidence_collection', 'assigned'].includes(status)) return 'bg-amber-400'
  if (['closed', 'dismissed', 'archived'].includes(status)) return 'bg-neutral-500'
  if (['verdict', 'settled'].includes(status)) return 'bg-emerald-400'
  return 'bg-blue-400'
}

function statusBadge(status: string) {
  if (['in_progress', 'hearing_scheduled'].includes(status)) return 'bg-blue-500/15 text-blue-300 border-blue-500/20'
  if (['awaiting_court_date', 'evidence_collection', 'assigned', 'filed', 'under_review'].includes(status)) return 'bg-amber-500/15 text-amber-300 border-amber-500/20'
  if (['closed', 'dismissed', 'archived'].includes(status)) return 'bg-neutral-600/30 text-neutral-400 border-neutral-600/20'
  if (['verdict', 'settled'].includes(status)) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20'
  return 'bg-blue-500/15 text-blue-300 border-blue-500/20'
}

function SkeletonKpi() {
  return (
    <div className="rounded-2xl border border-neutral-700/30 bg-primary-900/40 p-5 animate-pulse">
      <div className="h-8 w-12 bg-neutral-700/50 rounded-lg mb-3" />
      <div className="h-4 w-24 bg-neutral-700/40 rounded mb-1.5" />
      <div className="h-3 w-16 bg-neutral-800/60 rounded" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-neutral-700/20 bg-primary-900/20 animate-pulse">
      <div className="h-3 w-3 rounded-full bg-neutral-700/60 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-4 w-3/4 bg-neutral-700/50 rounded" />
        <div className="h-3 w-1/3 bg-neutral-800/60 rounded" />
      </div>
      <div className="h-5 w-20 bg-neutral-700/40 rounded-full" />
    </div>
  )
}

function KpiTile({ label, value, sub, icon, accent = 'text-blue-400', href }: {
  label: string; value: number | string; sub: string; icon: React.ReactNode; accent?: string; href: string
}) {
  return (
    <Link href={href} className="block group">
      <div className="rounded-2xl border border-neutral-700/30 bg-primary-900/40 p-5 hover:border-blue-500/20 hover:bg-primary-900/60 transition-all duration-200 hover:-translate-y-0.5 group-active:translate-y-0">
        <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl mb-3 ${accent === 'text-blue-400' ? 'bg-blue-500/15' : accent === 'text-amber-400' ? 'bg-amber-500/15' : accent === 'text-emerald-400' ? 'bg-emerald-500/15' : 'bg-neutral-700/30'} ${accent}`}>
          {icon}
        </div>
        <p className={`text-3xl font-bold font-display ${accent}`}>{value}</p>
        <p className="text-sm text-neutral-300 mt-0.5 font-medium">{label}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
      </div>
    </Link>
  )
}

const QUICK_ACTIONS = [
  { label: 'My Matters', href: '/cases', emoji: '⚖️' },
  { label: 'Documents', href: '/documents', emoji: '📄' },
  { label: 'Bookings', href: '/bookings', emoji: '📅' },
  { label: 'AI Assistant', href: '/ai', emoji: '🤖' },
  { label: 'Find a Lawyer', href: '/discover', emoji: '🔍' },
  { label: 'Billing', href: '/payments', emoji: '💳' },
  { label: 'Library', href: '/library', emoji: '📚' },
  { label: 'Settings', href: '/settings', emoji: '⚙️' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [cases, setCases] = useState<CaseItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState<number | null>(null)
  const [docCount, setDocCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')

  useEffect(() => {
    const access = localStorage.getItem('access')
    const portalRole = localStorage.getItem('portalRole')
    if (!access || portalRole !== 'client') {
      router.replace('/auth/login')
      return
    }

    const stored = localStorage.getItem('fullName') || localStorage.getItem('userEmail') || ''
    setName(stored.split('@')[0] || stored)

    const run = async () => {
      const [casesRes, unreadRes, notifsRes] = await Promise.allSettled([
        getMyCases(access),
        unreadNotificationCount(access),
        listNotifications(access),
      ])

      let caseList: CaseItem[] = []
      if (casesRes.status === 'fulfilled') {
        caseList = casesRes.value.results
        setCases(caseList)
      }
      if (unreadRes.status === 'fulfilled') {
        setUnread(unreadRes.value.unread ?? (unreadRes.value as unknown as {unread_count?: number}).unread_count ?? 0)
      }
      if (notifsRes.status === 'fulfilled') setNotifications(notifsRes.value.results ?? [])

      if (caseList.length > 0) {
        const docResults = await Promise.allSettled(caseList.slice(0, 5).map(c => listDocuments(c.id, access)))
        const total = docResults.reduce((n, r) => n + (r.status === 'fulfilled' ? r.value.count : 0), 0)
        setDocCount(total)
      } else {
        setDocCount(0)
      }

      setLoading(false)
    }
    void run()
  }, [])

  const openCases = cases.filter(c => !['closed', 'dismissed', 'archived', 'settled'].includes(c.status))
  const pendingBookings = cases.filter(c => c.booking_status === 'pending')
  const activeCases = openCases.slice(0, 6)

  const firstName = name.split(' ')[0] || name

  return (
    <div className="space-y-8 max-w-full">
      {/* Welcome header */}
      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-400/70 font-medium mb-1">Client Portal</p>
            <h1 className="font-display text-3xl sm:text-4xl text-neutral-50 leading-tight">
              {firstName ? `Welcome back, ${firstName}` : 'My Legal Portal'}
            </h1>
            <p className="mt-1.5 text-sm text-neutral-400">Here's what's happening with your matters.</p>
          </div>
          <Link href="/cases/new">
            <button className="mt-1 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-900/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              File New Matter
            </button>
          </Link>
        </div>
      </header>

      {/* KPI tiles */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonKpi key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile label="Open Matters" value={openCases.length} sub={`${cases.length} total matters`} href="/cases"
            accent="text-blue-400" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
          />
          <KpiTile label="Unread Updates" value={unread ?? 0} sub="new notifications" href="/notifications"
            accent={unread ? 'text-amber-400' : 'text-neutral-500'} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
          />
          <KpiTile label="Documents" value={docCount ?? '—'} sub="files across matters" href="/documents"
            accent="text-purple-400" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          />
          <KpiTile label="Pending Bookings" value={pendingBookings.length} sub="awaiting confirmation" href="/bookings"
            accent={pendingBookings.length > 0 ? 'text-amber-400' : 'text-neutral-500'} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
          />
        </div>
      )}

      {/* Pending bookings alert */}
      {!loading && pendingBookings.length > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-400 text-lg">⏳</span>
            <h3 className="text-sm font-semibold text-amber-300">Awaiting Lawyer Confirmation</h3>
            <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">{pendingBookings.length}</span>
          </div>
          <div className="space-y-2">
            {pendingBookings.slice(0, 3).map(b => (
              <div key={b.id} className="flex items-center justify-between gap-3 py-2 border-t border-amber-500/10">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-200 truncate">{b.title}</p>
                  {b.booking_metadata?.target_name && (
                    <p className="text-xs text-neutral-500 mt-0.5">With <span className="text-amber-400">{b.booking_metadata.target_name}</span></p>
                  )}
                </div>
                <Link href={`/bookings/${b.id}`} className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/10 transition-colors">
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Active Matters — left column */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Active Matters</h2>
            <Link href="/cases" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">View all →</Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : activeCases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-700/40 p-8 text-center">
              <div className="text-4xl mb-3">⚖️</div>
              <p className="text-neutral-300 font-medium mb-1">No open matters yet</p>
              <p className="text-neutral-500 text-sm mb-4">File your first legal matter to get started.</p>
              <Link href="/cases/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/25 text-sm font-medium hover:bg-blue-600/30 transition-colors">
                + File New Matter
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {activeCases.map(c => (
                <Link key={c.id} href={`/cases/${c.id}`} className="block group">
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-neutral-700/25 bg-primary-900/30 hover:border-blue-500/20 hover:bg-primary-900/50 transition-all duration-200">
                    {/* Status dot */}
                    <span className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${statusDot(c.status)} mt-0.5 ring-2 ring-primary-900`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-100 truncate group-hover:text-white transition-colors">{c.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                        <span className="capitalize">{c.case_type?.replace(/_/g, ' ')}</span>
                        {c.assigned_lawyer_id && (
                          <><span>·</span><span className="text-emerald-400">Lawyer assigned</span></>
                        )}
                      </div>
                    </div>
                    <span className={`flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${statusBadge(c.status)} capitalize font-medium`}>
                      {statusLabel(c.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* AI Assistant CTA */}
          {!loading && (
            <Link href="/ai" className="block group">
              <div className="rounded-2xl border border-blue-500/15 bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-4 hover:border-blue-500/30 hover:from-blue-500/8 hover:to-purple-500/8 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300 text-lg">⚡</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-200">Ask LexAI</p>
                    <p className="text-xs text-neutral-500">Get instant answers on Cameroonian law, OHADA, and your rights.</p>
                  </div>
                  <svg className="w-4 h-4 text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recent Updates */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Recent Updates</h2>
              {!loading && unread !== null && unread > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-semibold">{unread} new</span>
              )}
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1,2].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-neutral-800/30 animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-700/30 p-5 text-center">
                <p className="text-neutral-500 text-xs">No updates yet. Activity on your matters will appear here.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} className={`flex gap-3 px-3 py-2.5 rounded-xl border transition-colors ${n.is_read ? 'border-neutral-700/20 bg-primary-900/20' : 'border-blue-500/15 bg-blue-500/5'}`}>
                    <div className={`flex-shrink-0 h-2 w-2 rounded-full mt-1.5 ${n.is_read ? 'bg-neutral-600' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${n.is_read ? 'text-neutral-400' : 'text-neutral-200'}`}>{n.title}</p>
                      <p className="text-[10px] text-neutral-600 mt-0.5">{formatRelative(n.created_at)}</p>
                    </div>
                  </div>
                ))}
                <Link href="/notifications" className="block text-center text-xs text-blue-400 hover:text-blue-300 py-1 transition-colors">
                  See all notifications →
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_ACTIONS.map(({ label, href, emoji }) => (
                <Link key={href} href={href}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-neutral-700/25 bg-primary-900/30 hover:border-blue-500/20 hover:bg-blue-500/5 text-center transition-all group"
                >
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300 font-medium leading-tight transition-colors">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Profile CTA */}
          {!loading && (
            <Link href="/profile" className="block">
              <div className="rounded-xl border border-neutral-700/25 bg-primary-900/30 px-4 py-3 flex items-center gap-3 hover:border-neutral-600/40 hover:bg-primary-900/50 transition-all group">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-blue-300 text-sm font-bold">
                  {name ? name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : 'ME'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-300 truncate">{name || 'My Profile'}</p>
                  <p className="text-[10px] text-neutral-600">Profile & settings →</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
