"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../components/ui/Card'
import { getMyCases, type CaseItem } from '../../lib/casesApi'
import { unreadNotificationCount, listNotifications, type NotificationItem } from '../../lib/notificationsApi'
import { listDocuments } from '../../lib/documentsApi'
import { getCaseProgress } from '../../lib/monitoringApi'

type DashboardStats = {
  cases: number | null
  notifications: number | null
  documents: number | null
  monitoringTotal: number | null
  monitoringOpen: number | null
}

function StatCard({ label, value, href }: { label: string; value: number | null; href?: string }) {
  const content = (
    <Card>
      <div className="text-3xl font-bold text-gold-400">
        {value === null ? <span className="text-neutral-500 text-xl">—</span> : value}
      </div>
      <div className="text-neutral-400 text-sm mt-1">{label}</div>
    </Card>
  )
  return href ? <Link href={href} className="block hover:opacity-80 transition-opacity">{content}</Link> : content
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    cases: null,
    notifications: null,
    documents: null,
    monitoringTotal: null,
    monitoringOpen: null,
  })
  const [activity, setActivity] = useState<NotificationItem[]>([])
  const [pendingBookings, setPendingBookings] = useState<CaseItem[]>([])
  const [serviceErrors, setServiceErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        setServiceErrors(['Sign in to view your portal summary.'])
        setLoading(false)
        return
      }

      const errors: string[] = []

      const [casesResult, notifCountResult, progressResult, notifListResult] = await Promise.allSettled([
        getMyCases(access),
        unreadNotificationCount(access),
        getCaseProgress(access),
        listNotifications(access, 5),
      ])

      let caseCount: number | null = null
      let caseItems: CaseItem[] = []
      if (casesResult.status === 'fulfilled') {
        caseCount = casesResult.value.count
        caseItems = casesResult.value.results
        // Show booking requests separately
        setPendingBookings(caseItems.filter(c => c.booking_status === 'pending'))
      } else {
        errors.push('Matters service unavailable')
      }

      let notifCount: number | null = null
      if (notifCountResult.status === 'fulfilled') {
        notifCount = notifCountResult.value.unread_count
      } else {
        errors.push('Notifications service unavailable')
      }

      let monitoringTotal: number | null = null
      let monitoringOpen: number | null = null
      if (progressResult.status === 'fulfilled') {
        const items = progressResult.value.results ?? []
        monitoringTotal = progressResult.value.count ?? items.length
        monitoringOpen = items.filter(item => !/closed/i.test(item.status)).length
      }

      let documentCount: number | null = null
      if (caseItems.length > 0) {
        const docResults = await Promise.allSettled(caseItems.map(item => listDocuments(item.id, access)))
        documentCount = docResults.reduce((count, current) => {
          if (current.status !== 'fulfilled') return count
          return count + current.value.count
        }, 0)
      } else if (casesResult.status === 'fulfilled') {
        documentCount = 0
      }

      if (notifListResult.status === 'fulfilled') {
        setActivity(notifListResult.value.results ?? [])
      }

      setStats({ cases: caseCount, notifications: notifCount, documents: documentCount, monitoringTotal, monitoringOpen })
      setServiceErrors(errors)
      setLoading(false)
    }

    void run()
  }, [])

  return (
    <div className="space-y-6 max-w-full">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-display-md">Client Portal</h2>
          <p className="mt-2 text-primary-300">Overview of your matters, documents, and activity.</p>
        </div>
        <Link href="/documents">
          <button className="w-full sm:w-auto px-4 py-2 rounded bg-gold-500 text-black font-medium">View Documents</button>
        </Link>
      </header>

      {serviceErrors.length > 0 && (
        <Card className="border border-gold-500/30 bg-gold-500/5 p-4">
          <p className="text-gold-300 text-sm font-medium mb-1">Some services are currently unavailable</p>
          <ul className="list-disc list-inside text-gold-400/80 text-xs space-y-0.5">
            {serviceErrors.map(err => <li key={err}>{err}</li>)}
          </ul>
        </Card>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-4">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading portal data…
        </div>
      )}

      {!loading && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard label="Open Matters" value={stats.cases} href="/cases" />
            <StatCard label="Unread Updates" value={stats.notifications} href="/analyses" />
            <StatCard label="Documents in Play" value={stats.documents} href="/documents" />
            <Card>
              <div className="text-3xl font-bold text-gold-400">
                {stats.monitoringTotal === null ? <span className="text-neutral-500 text-xl">—</span> : stats.monitoringTotal}
              </div>
              <div className="text-neutral-400 text-sm mt-1">Monitored matters</div>
              {stats.monitoringOpen !== null && (
                <div className="mt-1 text-xs text-primary-300">{stats.monitoringOpen} open</div>
              )}
            </Card>
          </section>

          {/* Pending Bookings */}
          {pendingBookings.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading text-body-md text-neutral-50">Pending Booking Requests</h3>
                <span className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-full">{pendingBookings.length} awaiting response</span>
              </div>
              <div className="space-y-3">
                {pendingBookings.map(b => (
                  <div key={b.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-200 text-sm truncate">{b.title}</p>
                      <p className="text-neutral-500 text-xs mt-0.5">
                        {b.booking_metadata?.target_name && <>With <span className="text-gold-400">{b.booking_metadata.target_name}</span> · </>}
                        {b.booking_metadata?.preferred_date} {b.booking_metadata?.preferred_time}
                      </p>
                    </div>
                    <Link href={`/bookings/${b.id}`} className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/10 transition-colors">
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="font-semibold mb-3">Recent activity</div>
              <div className="space-y-2 text-sm text-primary-200">
                {activity.length === 0 && <div className="text-neutral-500">No recent updates.</div>}
                {activity.map(item => (
                  <div key={item.id} className="rounded border border-white/5 bg-white/5 px-3 py-2">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-primary-300">{item.message}</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <div className="font-semibold mb-3">Quick links</div>
              <div className="space-y-2">
                {[
                  { label: 'View all matters', href: '/cases' },
                  { label: 'Browse documents', href: '/documents' },
                  { label: 'Billing & payments', href: '/payments' },
                  { label: 'AI legal assistant', href: '/chat' },
                ].map(link => (
                  <Link key={link.href} href={link.href} className="block px-3 py-2 rounded border border-white/5 bg-white/5 hover:bg-white/10 text-sm text-neutral-200 transition-colors">
                    {link.label} →
                  </Link>
                ))}
              </div>
            </Card>
          </section>
        </>
      )}
    </div>
  )
}
