"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { getLawyerStats, getCaseProgress, getCaseRisks, type CaseRiskResponse } from '../../../lib/monitoringApi'

function CaseRiskWidget({ token }: { token: string }) {
  const [data, setData] = useState<CaseRiskResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCaseRisks(token).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  if (loading) return null
  if (!data || data.cases.length === 0) return null

  const { counts, cases } = data
  const topCases = cases.filter(c => c.risk_level !== 'healthy').slice(0, 5)

  return (
    <Card className="p-6 border border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading text-body-lg text-neutral-50">Case Risk Monitor</h3>
          <p className="text-xs text-neutral-500 mt-0.5">AI-powered early warning for at-risk matters</p>
        </div>
        <div className="flex gap-2">
          {counts.critical > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              {counts.critical} Critical
            </span>
          )}
          {counts.watch > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gold-500/15 text-gold-400 border border-gold-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 inline-block" />
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

      {topCases.length === 0 ? (
        <p className="text-sm text-emerald-400">All active cases are healthy.</p>
      ) : (
        <div className="space-y-2">
          {topCases.map(c => {
            const barColor = c.risk_level === 'critical' ? 'bg-red-500' : 'bg-gold-400'
            const textColor = c.risk_level === 'critical' ? 'text-red-400' : 'text-gold-400'
            return (
              <Link key={c.case_id} href={`/cases/${c.case_id}`} className="block group">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/40 hover:bg-neutral-800/70 transition-colors">
                  <div className="flex-shrink-0 w-10 text-center">
                    <div className={`text-sm font-bold ${textColor}`}>{c.risk_score}</div>
                    <div className={`h-1 rounded-full ${barColor} mt-1`} style={{ width: `${c.risk_score}%`, minWidth: '4px' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-100 truncate group-hover:text-gold-300">{c.title}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.risk_factors.map(f => (
                        <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-700/60 text-neutral-400">{f}</span>
                      ))}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export default function LawyerDashboardPage() {
  const [stats, setStats] = useState<{ active_cases: number; closed_cases_count: number; cases_this_month: number }>({ active_cases: 0, closed_cases_count: 0, cases_this_month: 0 })
  const [recent, setRecent] = useState<string[]>([])
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) return
      setToken(access)
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

      {token && <CaseRiskWidget token={token} />}

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
