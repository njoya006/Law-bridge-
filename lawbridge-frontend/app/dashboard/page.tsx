'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMyCases, type CaseItem } from '../../lib/casesApi'
import { unreadNotificationCount, listNotifications, type NotificationItem } from '../../lib/notificationsApi'
import { listDocuments } from '../../lib/documentsApi'
import { useCountUp } from '../../lib/useCountUp'
import { SkeletonStat, SkeletonTable } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  CaseIcon, DocumentIcon, CalendarIcon, SparklesIcon, SearchIcon, PaymentIcon,
  BookOpenIcon, SettingsIcon, BellIcon, PlusIcon, ArrowRightIcon, ClockIcon,
} from '../../components/icons/Icons'

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

function KpiTile({ label, value, sub, Icon, accent = 'text-portal', href, portal, i }: {
  label: string; value: number | string; sub: string; Icon: React.ComponentType<{ width?: number; height?: number }>; accent?: string; href: string; portal?: boolean; i: number
}) {
  return (
    <Link href={href} className="block group stagger-child" style={{ '--i': i } as React.CSSProperties}>
      <div className={`rounded-2xl border bg-primary-900/40 p-5 transition-all duration-200 hover:-translate-y-0.5 group-active:translate-y-0 ${portal ? 'border-portal/40 hover:shadow-portal-glow' : 'border-neutral-700/30 hover:border-blue-500/20 hover:bg-primary-900/60'}`}>
        <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl mb-3 ${portal ? 'bg-portal-soft' : accent === 'text-amber-400' ? 'bg-amber-500/15' : accent === 'text-emerald-400' ? 'bg-emerald-500/15' : accent === 'text-purple-400' ? 'bg-purple-500/15' : 'bg-neutral-700/30'} ${accent}`}>
          <Icon width={20} height={20} />
        </div>
        <p className={`text-3xl stat-num font-bold ${accent}`}>{value}</p>
        <p className="text-sm text-neutral-300 mt-0.5 font-medium">{label}</p>
        <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
      </div>
    </Link>
  )
}

const QUICK_ACTIONS = [
  { label: 'My Matters', href: '/cases', Icon: CaseIcon },
  { label: 'Documents', href: '/documents', Icon: DocumentIcon },
  { label: 'Bookings', href: '/bookings', Icon: CalendarIcon },
  { label: 'AI Assistant', href: '/ai', Icon: SparklesIcon },
  { label: 'Find a Lawyer', href: '/discover', Icon: SearchIcon },
  { label: 'Billing', href: '/payments', Icon: PaymentIcon },
  { label: 'Library', href: '/library', Icon: BookOpenIcon },
  { label: 'Settings', href: '/settings', Icon: SettingsIcon },
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

  const animOpenCases = useCountUp(openCases.length)
  const animUnread = useCountUp(unread ?? 0)
  const animPendingBookings = useCountUp(pendingBookings.length)

  const firstName = name.split(' ')[0] || name

  return (
    <div className="space-y-8 max-w-full">
      {/* Welcome header */}
      <header>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-portal font-medium mb-1">Client Portal</p>
            <h1 className="font-display text-3xl sm:text-4xl text-neutral-50 leading-tight">
              {firstName ? `Welcome back, ${firstName}` : 'My Legal Portal'}
            </h1>
            <p className="mt-1.5 text-sm text-neutral-400">Here's what's happening with your matters.</p>
          </div>
          <Link href="/cases/new">
            <button className="mt-1 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-portal-accent hover:opacity-90 text-white text-sm font-semibold transition-opacity shadow-lg shadow-portal-glow">
              <PlusIcon width={16} height={16} />
              File New Matter
            </button>
          </Link>
        </div>
      </header>

      {/* KPI tiles */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonStat key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile i={0} label="Open Matters" value={animOpenCases} sub={`${cases.length} total matters`} href="/cases"
            accent="text-portal" portal Icon={CaseIcon}
          />
          <KpiTile i={1} label="Unread Updates" value={animUnread} sub="new notifications" href="/notifications"
            accent={unread ? 'text-amber-400' : 'text-neutral-500'} Icon={BellIcon}
          />
          <KpiTile i={2} label="Documents" value={docCount ?? '—'} sub="files across matters" href="/documents"
            accent="text-purple-400" Icon={DocumentIcon}
          />
          <KpiTile i={3} label="Pending Bookings" value={animPendingBookings} sub="awaiting confirmation" href="/bookings"
            accent={pendingBookings.length > 0 ? 'text-amber-400' : 'text-neutral-500'} Icon={CalendarIcon}
          />
        </div>
      )}

      {/* Pending bookings alert */}
      {!loading && pendingBookings.length > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon width={16} height={16} className="text-amber-400" />
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
            <SkeletonTable rows={3} />
          ) : activeCases.length === 0 ? (
            <EmptyState
              icon={<CaseIcon width={24} height={24} />}
              title="No open matters yet"
              body="File your first legal matter to get started."
              action={{ label: 'File New Matter', href: '/cases/new' }}
            />
          ) : (
            <div className="space-y-2">
              {activeCases.map((c, i) => (
                <Link key={c.id} href={`/cases/${c.id}`} className="block group stagger-child" style={{ '--i': i } as React.CSSProperties}>
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
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300"><SparklesIcon width={18} height={18} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-200">Ask LexAI</p>
                    <p className="text-xs text-neutral-500">Get instant answers on Cameroonian law, OHADA, and your rights.</p>
                  </div>
                  <ArrowRightIcon width={16} height={16} className="text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
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
              {QUICK_ACTIONS.map(({ label, href, Icon }, i) => (
                <Link key={href} href={href}
                  className="stagger-child flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-neutral-700/25 bg-primary-900/30 text-neutral-400 hover:border-portal hover:text-portal text-center transition-all group"
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <Icon width={18} height={18} />
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
