"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../components/ui/Card'
import { getMyCases } from '../../lib/casesApi'
import { unreadNotificationCount } from '../../lib/notificationsApi'
import { listDocuments } from '../../lib/documentsApi'
import { listNotifications, type NotificationItem } from '../../lib/notificationsApi'
import { getCaseProgress } from '../../lib/monitoringApi'

type DashboardStats = {
  cases: number
  notifications: number
  documents: number
}

type MonitoringStats = {
  total: number
  open: number
}

export default function DashboardPage(){
  const [stats, setStats] = useState<DashboardStats>({ cases: 0, notifications: 0, documents: 0 })
  const [activity, setActivity] = useState<NotificationItem[]>([])
  const [monitoring, setMonitoring] = useState<MonitoringStats>({ total: 0, open: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        setError('Sign in to view your portal summary.')
        return
      }

      try {
        const [cases, notifications] = await Promise.all([
          getMyCases(access),
          unreadNotificationCount(access),
        ])
        const docs = await Promise.allSettled(cases.results.map(item => listDocuments(item.id, access)))
        const documentCount = docs.reduce((count, current) => {
          if (current.status !== 'fulfilled') return count
          return count + current.value.count
        }, 0)

        const progress = await getCaseProgress(access)
        const progressItems = progress.results ?? []
        const openProgress = progressItems.filter(item => !/closed/i.test(item.status)).length

        const recent = await listNotifications(access, 5).catch(() => null)

        setStats({
          cases: cases.count,
          notifications: notifications.unread_count,
          documents: documentCount,
        })
        setMonitoring({ total: progress.count ?? progressItems.length, open: openProgress })
        setActivity(recent?.results ?? [])
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load dashboard')
      }
    }

    void run()
  }, [])

  return (
    <div className="space-y-6 max-w-full">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-display-md">Client Portal</h2>
          <p className="mt-2 text-primary-300">Overview of your matters, documents, and billing.</p>
        </div>
        <div>
          <Link href="/documents"><button className="w-full sm:w-auto px-4 py-2 rounded bg-gold-500 text-black">View Documents</button></Link>
        </div>
      </header>
      {error && <Card className="border border-crimson-500/30 text-crimson-200">{error}</Card>}

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><div className="text-3xl font-bold">{stats.cases}</div><div>Open Matters</div></Card>
        <Card><div className="text-3xl font-bold">{stats.notifications}</div><div>Unread Updates</div></Card>
        <Card><div className="text-3xl font-bold">{stats.documents}</div><div>Documents in Play</div></Card>
        <Card>
          <div className="text-3xl font-bold">{monitoring.total}</div>
          <div>Monitored matter snapshots</div>
          <div className="mt-2 text-sm text-primary-300">{monitoring.open} open progress items</div>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="font-semibold mb-2">Recent activity</div>
          <div className="space-y-2 text-sm text-primary-200">
            {activity.length === 0 && <div>No recent updates.</div>}
            {activity.map(item => (
              <div key={item.id} className="rounded border border-white/5 bg-white/5 px-3 py-2">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-primary-300">{item.message}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <Link href="/documents">Go to documents</Link>
        </Card>
      </section>
    </div>
  )
}
