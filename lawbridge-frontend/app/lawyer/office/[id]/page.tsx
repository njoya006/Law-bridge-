'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '../../../../components/ui/Card'
import { useParams } from 'next/navigation'
import { getCaseProgress, getLawyerStats, type CaseProgressItem } from '../../../../lib/monitoringApi'

export default function LawyerOfficePage() {
  const params = useParams() as { id?: string }
  const { id } = params
  const [matters, setMatters] = useState<CaseProgressItem[]>([])
  const [summary, setSummary] = useState<{ active_cases: number; closed_cases_count: number; cases_this_month: number } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      if (!id) return
      const access = localStorage.getItem('access')
      if (!access) {
        setError('Sign in as a lawyer to view this office.')
        return
      }

      try {
        const [stats, progress] = await Promise.all([getLawyerStats(id, access), getCaseProgress(access)])
        setSummary(stats)
        setMatters((progress.results ?? []).filter(item => item.assigned_lawyer_id === id))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load office data')
      }
    }

    void run()
  }, [id])

  if (!id) return <div>Missing lawyer id</div>

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-display-md">Office for user {id}</h2>
          <p className="mt-1 text-primary-300">Live office view for the selected lawyer.</p>
        </div>
      </header>

      {error && <Card className="border border-crimson-500/30 text-crimson-200">{error}</Card>}

      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card><div className="text-3xl font-bold">{summary.active_cases}</div><div>Active cases</div></Card>
          <Card><div className="text-3xl font-bold">{summary.cases_this_month}</div><div>Cases this month</div></Card>
          <Card><div className="text-3xl font-bold">{summary.closed_cases_count}</div><div>Closed cases</div></Card>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {matters.length === 0 && !error && <Card>No matters assigned to this lawyer yet.</Card>}
        {matters.map(m => (
          <Card key={m.id}>
            <div className="font-semibold">{m.case_type}</div>
            <div className="text-xs text-primary-300 mt-2">{m.case_id}</div>
            <div className="text-sm text-primary-200 mt-2">{m.status}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
