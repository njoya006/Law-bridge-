"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { getCaseProgress, type CaseProgressItem } from '../../../lib/monitoringApi'

export default function LawyerMattersPage() {
  const [items, setItems] = useState<CaseProgressItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) {
        setError('Sign in as a lawyer to view active matters.')
        return
      }
      try {
        const response = await getCaseProgress(access)
        setItems((response.results ?? []).filter(item => item.assigned_lawyer_id === lawyerId))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load matters')
      }
    }
    void run()
  }, [])

  return (
    <div>
      <h2 className="font-display text-display-md">Matters</h2>
      <p className="mt-2 text-sm text-primary-300">Matter management now reflects live monitoring snapshots.</p>
      {error && <Card className="mt-4 border border-crimson-500/30 text-crimson-200">{error}</Card>}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.length === 0 && !error && <Card>No matters are available yet.</Card>}
        {items.map(item => {
          const matterHref = item.case_id ? `/cases/${item.case_id}` : undefined
          return matterHref ? (
            <Link key={item.id} href={matterHref} className="block">
              <Card className="h-full cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{item.case_type}</div>
                    <div className="mt-1 text-xs text-primary-300">Case #{item.case_id}</div>
                  </div>
                  <span className="rounded-full border border-primary-600/40 px-2 py-1 text-[11px] text-primary-200">{item.status}</span>
                </div>
                <div className="mt-3 text-sm text-primary-200">Assigned lawyer: {item.assigned_lawyer_id || 'Unassigned'}</div>
                <div className="mt-2 text-xs text-primary-400">Updated {new Date(item.updated_at).toLocaleDateString()}</div>
                <div className="mt-4 text-sm font-medium text-gold-300">Open matter details</div>
              </Card>
            </Link>
          ) : (
            <Card key={item.id} className="h-full border border-orange-500/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{item.case_type}</div>
                  <div className="mt-1 text-xs text-primary-300">Missing case reference</div>
                </div>
                <span className="rounded-full border border-primary-600/40 px-2 py-1 text-[11px] text-primary-200">{item.status}</span>
              </div>
              <div className="mt-3 text-sm text-primary-200">Assigned lawyer: {item.assigned_lawyer_id || 'Unassigned'}</div>
              <div className="mt-2 text-xs text-primary-400">Updated {new Date(item.updated_at).toLocaleDateString()}</div>
              <div className="mt-4 text-sm font-medium text-gold-300">Case details unavailable</div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}