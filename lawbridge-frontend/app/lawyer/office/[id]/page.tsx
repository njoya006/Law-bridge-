'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../../components/ui/Card'
import { useParams } from 'next/navigation'
import { getCaseProgress, getLawyerStats, type CaseProgressItem, type LawyerStats } from '../../../../lib/monitoringApi'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'text-gold-400 bg-gold-500/10 border-gold-500/30',
    closed: 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30',
    in_progress: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  }
  const cls = map[status?.toLowerCase()] ?? 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30'
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>{status}</span>
}

export default function LawyerOfficePage() {
  const params = useParams() as { id?: string }
  const { id } = params
  const [matters, setMatters] = useState<CaseProgressItem[]>([])
  const [stats, setStats] = useState<LawyerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      if (!id) { setLoading(false); return }
      const access = localStorage.getItem('access')
      if (!access) {
        setError('Sign in as a lawyer to view this office.')
        setLoading(false)
        return
      }
      try {
        const [statsData, progress] = await Promise.all([
          getLawyerStats(id, access).catch(() => null),
          getCaseProgress(access),
        ])
        if (!mounted) return
        setStats(statsData)
        setMatters((progress.results ?? []).filter(item => item.assigned_lawyer_id === id))
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load office data')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => { mounted = false }
  }, [id])

  if (!id) {
    return (
      <Card className="p-6 border border-crimson-500/30">
        <p className="text-crimson-300">Missing lawyer ID.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <Link href="/lawyer/office/me" className="text-sm text-neutral-400 hover:text-gold-300 transition-colors">
            ← My Office
          </Link>
          <h2 className="font-display text-display-md text-neutral-50 mt-2">Associate Office</h2>
          <p className="mt-1 text-neutral-400 font-mono text-sm">User {id}</p>
        </div>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-12 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading office data…
        </div>
      )}

      {!loading && error && (
        <Card className="border border-crimson-500/30 p-4">
          <p className="text-crimson-300 text-sm">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-xs text-neutral-400 uppercase tracking-widest mb-2">Active cases</p>
              <p className="font-display text-3xl text-gold-400">{stats?.active_cases ?? matters.filter(m => m.status !== 'closed').length}</p>
            </Card>
            <Card className="p-6">
              <p className="text-xs text-neutral-400 uppercase tracking-widest mb-2">This month</p>
              <p className="font-display text-3xl text-neutral-50">{stats?.cases_this_month ?? '—'}</p>
            </Card>
            <Card className="p-6">
              <p className="text-xs text-neutral-400 uppercase tracking-widest mb-2">Closed</p>
              <p className="font-display text-3xl text-emerald-400">{stats?.closed_cases_count ?? matters.filter(m => m.status === 'closed').length}</p>
            </Card>
          </div>

          {/* Matters */}
          <Card className="p-6">
            <h3 className="font-heading text-body-lg text-neutral-50 mb-4">Assigned Matters</h3>
            {matters.length === 0 ? (
              <p className="text-neutral-400 text-sm">No matters assigned to this lawyer.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {matters.map(m => (
                  <div key={m.id} className="rounded-xl border border-neutral-700/40 bg-primary-800/20 p-4 flex flex-col gap-2 hover:border-gold-400/20 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-neutral-100 text-sm">{m.case_type}</p>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-neutral-400 font-mono">#{m.case_id}</p>
                    <p className="text-xs text-neutral-500">Updated {new Date(m.updated_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
