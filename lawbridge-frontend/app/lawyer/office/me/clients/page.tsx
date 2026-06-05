'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../../../../../components/ui/Card'
import { getCaseProgress, type CaseProgressItem } from '../../../../../lib/monitoringApi'

export default function MyOfficeClientsPage() {
  const [clients, setClients] = useState<Array<{ clientId: string; cases: number }>>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) {
        setError('Sign in as a lawyer to view clients.')
        return
      }

      try {
        const response = await getCaseProgress(access)
        const groups = new Map<string, number>()
        for (const item of (response.results ?? []).filter((entry: CaseProgressItem) => entry.assigned_lawyer_id === lawyerId)) {
          groups.set(item.client_id, (groups.get(item.client_id) ?? 0) + 1)
        }
        setClients([...groups.entries()].map(([clientId, cases]) => ({ clientId, cases })))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load clients')
      }
    }

    void run()
  }, [])

  const clientCount = useMemo(() => clients.length, [clients])

  return (
    <div>
      <h2 className="font-display text-display-md">Clients</h2>
      <p className="mt-2 text-sm text-primary-300">Clients grouped from your assigned matters.</p>
      {error && <Card className="mt-4 border border-crimson-500/30 text-crimson-200">{error}</Card>}
      <div className="mt-4 mb-3 text-sm text-primary-300">{clientCount} active clients</div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.length === 0 && !error && <Card>No clients yet.</Card>}
        {clients.map(client => <Card key={client.clientId}>{client.clientId} — {client.cases} matters</Card>)}
      </div>
    </div>
  )
}
