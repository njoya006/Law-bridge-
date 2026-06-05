"use client"

import React, { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { getCaseProgress } from '../../../lib/monitoringApi'

export default function LawyerClientsPage() {
  const [clients, setClients] = useState<Array<{ clientId: string; cases: number }>>([])

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) return
      try {
        const response = await getCaseProgress(access)
        const groups = new Map<string, number>()
        for (const item of response.results ?? []) {
          groups.set(item.client_id, (groups.get(item.client_id) ?? 0) + 1)
        }
        setClients([...groups.entries()].map(([clientId, cases]) => ({ clientId, cases })))
      } catch {
        setClients([])
      }
    }
    void run()
  }, [])

  return (
    <div>
      <h2 className="font-display text-display-md">Clients</h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.length === 0 && <Card>No clients yet.</Card>}
        {clients.map(client => <Card key={client.clientId}>{client.clientId} — {client.cases} matters</Card>)}
      </div>
    </div>
  )
}