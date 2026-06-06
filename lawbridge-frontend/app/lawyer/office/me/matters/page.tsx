'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../../../components/ui/Card'
import { getCaseProgress, type CaseProgressItem } from '../../../../../lib/monitoringApi'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'text-gold-400 bg-gold-500/10 border-gold-500/30',
    closed: 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30',
    in_progress: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  }
  const cls = map[status?.toLowerCase()] ?? 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30'
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  )
}

export default function MyOfficeMattersPage() {
  const [matters, setMatters] = useState<CaseProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) {
        setError('Sign in as a lawyer to view matters.')
        setLoading(false)
        return
      }
      try {
        const response = await getCaseProgress(access)
        if (mounted) setMatters((response.results ?? []).filter(item => item.assigned_lawyer_id === lawyerId))
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load matters')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => { mounted = false }
  }, [])

  const openMatters = matters.filter(m => m.status !== 'closed')
  const closedMatters = matters.filter(m => m.status === 'closed')

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-display-md text-neutral-50">My Matters</h2>
          <p className="mt-1 text-neutral-400">Cases assigned to you from the monitoring service</p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-gold-400 font-semibold">{openMatters.length} open</span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-400">{closedMatters.length} closed</span>
        </div>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-12 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading matters…
        </div>
      )}

      {!loading && error && (
        <Card className="border border-crimson-500/30 p-4">
          <p className="text-crimson-300 text-sm">{error}</p>
        </Card>
      )}

      {!loading && !error && matters.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-neutral-400">No matters assigned to you yet.</p>
          <Link href="/lawyer/discover" className="mt-3 inline-block text-gold-300 hover:text-gold-200 text-sm">
            Discover clients →
          </Link>
        </Card>
      )}

      {!loading && !error && matters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {matters.map(m => (
            <Card key={m.id} className="p-5 flex flex-col gap-3 hover:border-gold-400/20 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-neutral-50">{m.case_type}</p>
                  <p className="text-xs text-neutral-400 mt-0.5 font-mono">#{m.case_id}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
              <div className="text-xs text-neutral-400">
                Updated {new Date(m.updated_at).toLocaleDateString()}
              </div>
              <Link
                href={`/cases/${m.case_id}`}
                className="mt-auto text-sm font-medium text-gold-300 hover:text-gold-200 transition-colors"
              >
                Open matter →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
