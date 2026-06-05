'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../../../components/ui/Card'
import { getCaseProgress, type CaseProgressItem } from '../../../../../lib/monitoringApi'

export default function MyOfficeMattersPage() {
  const [matters, setMatters] = useState<CaseProgressItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) {
        setError('Sign in as a lawyer to view matters.')
        return
      }

      try {
        const response = await getCaseProgress(access)
        setMatters((response.results ?? []).filter(item => item.assigned_lawyer_id === lawyerId))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load matters')
      }
    }

    void run()
  }, [])

  return (
    <div>
      <h2 className="font-display text-display-md">My Matters</h2>
      <p className="mt-2 text-sm text-primary-300">Live matters pulled from the monitoring service.</p>
      {error && <Card className="mt-4 border border-crimson-500/30 text-crimson-200">{error}</Card>}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {matters.length === 0 && !error && <Card>No matters assigned yet.</Card>}
        {matters.map(m => {
          const matterHref = m.case_id ? `/cases/${m.case_id}` : undefined
          return matterHref ? (
            <Link key={m.id} href={matterHref} className="block">
              <Card className="h-full cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{m.case_type}</div>
                    <div className="mt-1 text-xs text-primary-300">Case #{m.case_id}</div>
                  </div>
                  <span className="rounded-full border border-primary-600/40 px-2 py-1 text-[11px] text-primary-200">{m.status}</span>
                </div>
                <div className="mt-3 text-sm text-primary-200">Assigned lawyer: {m.assigned_lawyer_id || 'Unassigned'}</div>
                <div className="mt-2 text-xs text-primary-400">Updated {new Date(m.updated_at).toLocaleDateString()}</div>
                <div className="mt-4 text-sm font-medium text-gold-300">Open matter details</div>
              </Card>
            </Link>
          ) : (
            <Card key={m.id} className="h-full border border-orange-500/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{m.case_type}</div>
                  <div className="mt-1 text-xs text-primary-300">Missing case reference</div>
                </div>
                <span className="rounded-full border border-primary-600/40 px-2 py-1 text-[11px] text-primary-200">{m.status}</span>
              </div>
              <div className="mt-3 text-sm text-primary-200">Assigned lawyer: {m.assigned_lawyer_id || 'Unassigned'}</div>
              <div className="mt-2 text-xs text-primary-400">Updated {new Date(m.updated_at).toLocaleDateString()}</div>
              <div className="mt-4 text-sm font-medium text-gold-300">Case details unavailable</div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
