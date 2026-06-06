'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../../../../../components/ui/Card'
import { getCaseProgress, type CaseProgressItem } from '../../../../../lib/monitoringApi'

export default function MyOfficeClientsPage() {
  const [cases, setCases] = useState<CaseProgressItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) {
        setError('Sign in as a lawyer to view clients.')
        setLoading(false)
        return
      }
      try {
        const response = await getCaseProgress(access)
        if (mounted) setCases((response.results ?? []).filter(item => item.assigned_lawyer_id === lawyerId))
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load clients')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => { mounted = false }
  }, [])

  const clients = useMemo(() => {
    const groups = new Map<string, { cases: CaseProgressItem[]; openCount: number }>()
    for (const c of cases) {
      const existing = groups.get(c.client_id)
      if (existing) {
        existing.cases.push(c)
        if (c.status !== 'closed') existing.openCount++
      } else {
        groups.set(c.client_id, { cases: [c], openCount: c.status !== 'closed' ? 1 : 0 })
      }
    }
    return [...groups.entries()].map(([id, data]) => ({ id, ...data }))
  }, [cases])

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-md text-neutral-50">Clients</h2>
        <p className="mt-1 text-neutral-400">
          {clients.length} {clients.length === 1 ? 'client' : 'clients'} across your assigned matters
        </p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-12 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading clients…
        </div>
      )}

      {!loading && error && (
        <Card className="border border-crimson-500/30 p-4">
          <p className="text-crimson-300 text-sm">{error}</p>
        </Card>
      )}

      {!loading && !error && clients.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-neutral-400">No clients found. Clients appear when matters are assigned to you.</p>
        </Card>
      )}

      {!loading && !error && clients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => (
            <Card key={client.id} className="p-5 flex flex-col gap-3 hover:border-gold-400/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 border border-gold-500/20 flex items-center justify-center text-gold-300 font-bold text-sm flex-shrink-0">
                  {client.id[0]?.toUpperCase() ?? 'C'}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-neutral-100 text-sm truncate font-mono">{client.id}</p>
                  <p className="text-xs text-neutral-400">{client.cases.length} matter{client.cases.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-gold-400 font-semibold">{client.openCount} open</span>
                <span className="text-neutral-500">·</span>
                <span className="text-neutral-400">{client.cases.length - client.openCount} closed</span>
              </div>
              <div className="mt-1 space-y-1">
                {client.cases.slice(0, 2).map(c => (
                  <p key={c.id} className="text-xs text-neutral-400 truncate">· {c.case_type}</p>
                ))}
                {client.cases.length > 2 && (
                  <p className="text-xs text-neutral-500">+{client.cases.length - 2} more</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
