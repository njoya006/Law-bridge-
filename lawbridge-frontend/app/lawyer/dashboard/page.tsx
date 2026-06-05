"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { getLawyerStats, getCaseProgress } from '../../../lib/monitoringApi'

export default function LawyerDashboardPage() {
  const [stats, setStats] = useState<{ active_cases: number; closed_cases_count: number; cases_this_month: number }>({ active_cases: 0, closed_cases_count: 0, cases_this_month: 0 })
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) return
      try {
        const [statsResult, progressResult] = await Promise.all([
          getLawyerStats(lawyerId, access),
          getCaseProgress(access),
        ])
        setStats(statsResult)
        setRecent((progressResult.results ?? [])
          .filter(item => item.assigned_lawyer_id === lawyerId)
          .slice(0, 3)
          .map(item => `${item.case_type} · ${item.status}`))
      } catch {
        setRecent([])
      }
    }
    void run()
  }, [])

  return (
    <div className="space-y-6 max-w-full">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-display-md">Firm Dashboard</h2>
          <p className="mt-2 text-primary-300">Overview of firm matters, associate work, and client activity.</p>
        </div>
        <Link href="/lawyer/matters" className="inline-flex items-center justify-center rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black">
          View matters
        </Link>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><div className="text-3xl font-bold">{stats.active_cases}</div><div>Open Firm Matters</div></Card>
        <Card><div className="text-3xl font-bold">{stats.cases_this_month}</div><div>Cases This Month</div></Card>
        <Card><div className="text-3xl font-bold">{stats.closed_cases_count}</div><div>Closed Matters</div></Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="font-semibold mb-2">Recent assignments</div>
          <div className="space-y-2 text-sm text-primary-200">
            {recent.length === 0 && <div>No recent assignments yet.</div>}
            {recent.map(item => <div key={item}>{item}</div>)}
          </div>
        </Card>
        <Card>Firm announcements and admin actions</Card>
      </section>
    </div>
  )
}