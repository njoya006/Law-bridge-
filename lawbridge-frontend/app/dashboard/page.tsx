'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '../../components/ui/Card'
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

function statusColor(status: string) {
  if (['in_progress', 'hearing_scheduled', 'hearing_adjourned'].includes(status)) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  if (['awaiting_court_date', 'evidence_collection'].includes(status)) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  if (['closed', 'dismissed', 'archived'].includes(status)) return 'bg-neutral-700/40 text-neutral-400 border-neutral-600/30'
  if (['verdict', 'settled'].includes(status)) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (status === 'assigned') return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  return 'bg-gold-500/20 text-gold-300 border-gold-500/30'
}

function notifIcon(type: string) {
  switch (type) {
    case 'case_updated': return '📋'
    case 'case_assigned': return '⚖️'
    case 'hearing_scheduled': return '📅'
    case 'payment_confirmed': return '✅'
    case 'document_uploaded': return '📄'
    case 'analysis_ready': return '🔍'
    default: return '🔔'
  }
}

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
        listNotifications(access, 6),
      ])

      let caseList: CaseItem[] = []
      if (casesRes.status === 'fulfilled') {
        caseList = casesRes.value.results
        setCases(caseList)
      }
      if (unreadRes.status === 'fulfilled') setUnread(unreadRes.value.unread ?? (unreadRes.value as unknown as {unread_count?: number}).unread_count ?? 0)
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
  const activeCases = openCases.slice(0, 5)

  const statusBreakdown = cases.reduce<Record<string, number>>((acc, c) => {
    const key = c.status
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-display-md text-neutral-50">
            {name ? `Welcome, ${name.split(' ')[0]}` : 'My Portal'}
          </h2>
          <p className="mt-1 text-sm text-neutral-400">Here's an overview of your matters and recent activity.</p>
        </div>
        <Link href="/cases/new">
          <button className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors">
            + New Matter
          </button>
        </Link>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-neutral-400 py-12 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading your portal…
        </div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Open Matters', value: openCases.length, sub: `${cases.length} total`, href: '/cases', accent: 'text-gold-400' },
              { label: 'Unread Updates', value: unread ?? 0, sub: 'notifications', href: '/cases', accent: unread ? 'text-amber-400' : 'text-neutral-400' },
              { label: 'Documents', value: docCount ?? '—', sub: 'across all matters', href: '/documents', accent: 'text-blue-400' },
              { label: 'Pending Bookings', value: pendingBookings.length, sub: 'awaiting lawyer response', href: '/cases', accent: pendingBookings.length > 0 ? 'text-amber-400' : 'text-neutral-400' },
            ].map(({ label, value, sub, href, accent }) => (
              <Link key={label} href={href} className="block">
                <div className="bg-primary-900/50 border border-neutral-700/40 rounded-xl p-4 hover:border-neutral-600/50 transition-colors">
                  <p className={`text-3xl font-bold ${accent}`}>{value}</p>
                  <p className="text-sm text-neutral-300 mt-0.5 font-medium">{label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pending bookings banner */}
          {pendingBookings.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-400">⏳</span>
                <h3 className="text-sm font-semibold text-amber-300">Awaiting Lawyer Response</h3>
                <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{pendingBookings.length}</span>
              </div>
              <div className="space-y-2">
                {pendingBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-3 py-2 border-t border-amber-500/10">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-200 truncate">{b.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {b.booking_metadata?.target_name && <span>With <span className="text-gold-400">{b.booking_metadata.target_name}</span> · </span>}
                        {b.booking_metadata?.preferred_date} {b.booking_metadata?.preferred_time}
                      </p>
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
            {/* Active matters */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">Active Matters</h3>
                <Link href="/cases" className="text-xs text-gold-300 hover:text-gold-200">View all →</Link>
              </div>
              {activeCases.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-neutral-400 text-sm">No open matters. Start by filing a new matter.</p>
                  <Link href="/cases/new" className="mt-3 inline-block text-xs text-gold-300 hover:text-gold-200">+ New Matter →</Link>
                </Card>
              ) : (
                <div className="space-y-2">
                  {activeCases.map(c => (
                    <Link key={c.id} href={`/cases/${c.id}`} className="block">
                      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-700/40 bg-primary-900/30 hover:border-neutral-600/50 hover:bg-primary-900/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-100 truncate">{c.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase text-neutral-500 font-medium">{c.case_type}</span>
                            {c.assigned_lawyer_id && <span className="text-[10px] text-emerald-400">Lawyer assigned</span>}
                          </div>
                        </div>
                        <span className={`flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full border capitalize ${statusColor(c.status)}`}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Status breakdown */}
              {cases.length > 0 && Object.keys(statusBreakdown).length > 1 && (
                <div className="rounded-xl border border-neutral-700/40 bg-primary-900/20 p-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">By Status</p>
                  <div className="space-y-2">
                    {Object.entries(statusBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([status, count]) => (
                      <div key={status} className="flex items-center gap-3">
                        <span className="text-xs text-neutral-400 w-36 truncate capitalize">{status.replace(/_/g, ' ')}</span>
                        <div className="flex-1 bg-neutral-800/60 rounded-full h-1.5">
                          <div
                            className="bg-gold-500/60 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.round((count / cases.length) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-neutral-500 w-4 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Recent notifications */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">Recent Updates</h3>
                  {unread !== null && unread > 0 && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{unread} unread</span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <Card className="p-4 text-center">
                    <p className="text-neutral-500 text-sm">No updates yet.</p>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} className={`flex gap-3 p-3 rounded-lg border transition-colors ${n.read ? 'border-neutral-700/30 bg-primary-900/20' : 'border-gold-500/20 bg-gold-500/5'}`}>
                        <span className="text-base flex-shrink-0">{notifIcon(n.event_type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${n.read ? 'text-neutral-300' : 'text-neutral-100'}`}>{n.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5 truncate">{n.message}</p>
                          <p className="text-[10px] text-neutral-600 mt-0.5">{formatRelative(n.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick links */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '📋 All Matters', href: '/cases' },
                    { label: '📄 Documents', href: '/documents' },
                    { label: '💳 Payments', href: '/payments' },
                    { label: '🤖 AI Assistant', href: '/chat' },
                    { label: '⚖️ Find Lawyers', href: '/discover' },
                    { label: '⚙️ Settings', href: '/settings' },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-700/40 bg-primary-900/30 hover:border-neutral-600/50 hover:bg-primary-900/50 text-sm text-neutral-300 hover:text-neutral-100 transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
