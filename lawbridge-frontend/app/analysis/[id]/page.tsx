"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { SERVICE_URLS } from '../../../lib/serviceUrls'

type CaseProgress = {
  id: string
  case_id: string
  case_type: string
  status: string
  client_id: string
  assigned_lawyer_id: string | null
  created_at: string
  updated_at: string
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'text-gold-400 bg-gold-500/10 border-gold-500/30',
    closed: 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30',
    in_progress: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  }
  const cls = map[status.toLowerCase()] ?? 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30'
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  )
}

export default function AnalysisDetail({ params }: { params: { id: string } }) {
  const { id } = params
  const [data, setData] = useState<CaseProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      setLoading(true)
      setError('')
      try {
        const res = await fetch(
          `${SERVICE_URLS.monitoring}/monitoring/case-progress/${id}/`,
          { headers: access ? { Authorization: `Bearer ${access}` } : {} },
        )
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const json = await res.json() as CaseProgress
        if (mounted) setData(json)
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load analysis')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void run()
    return () => { mounted = false }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-neutral-400">
        <span className="animate-spin h-5 w-5 border-2 border-gold-400 border-t-transparent rounded-full" />
        Loading case progress…
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border border-crimson-500/30 p-6 max-w-lg">
        <p className="text-crimson-300 text-sm">{error}</p>
        <Link href="/analyses" className="mt-4 inline-block text-gold-300 hover:text-gold-200 text-sm">← Back to updates</Link>
      </Card>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/analyses" className="text-sm text-neutral-400 hover:text-gold-300 transition-colors">← Back to updates</Link>
          <h2 className="font-display text-display-md text-neutral-50 mt-2">{data.case_type}</h2>
          <p className="text-neutral-400 text-sm mt-1">Case {data.case_id}</p>
        </div>
        <StatusBadge status={data.status} />
      </div>

      <Card className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Case ID</p>
            <p className="text-neutral-200 font-mono">{data.case_id}</p>
          </div>
          <div>
            <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Status</p>
            <StatusBadge status={data.status} />
          </div>
          <div>
            <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Case Type</p>
            <p className="text-neutral-200">{data.case_type}</p>
          </div>
          <div>
            <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Assigned Lawyer</p>
            <p className="text-neutral-200">{data.assigned_lawyer_id ?? 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Opened</p>
            <p className="text-neutral-200">{new Date(data.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Last updated</p>
            <p className="text-neutral-200">{new Date(data.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
