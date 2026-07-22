'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../../../components/ui/Card'
import { getMyCases, getUserById, type CaseItem, type UserProfile } from '../../../../../lib/casesApi'

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

const TERMINAL = new Set(['closed', 'dismissed', 'archived', 'settled', 'verdict'])

type ClientRecord = { id: string; profile: UserProfile | null; cases: CaseItem[] }

export default function MyOfficeClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) {
        if (mounted) { setError('Sign in as a lawyer to view clients.'); setLoading(false) }
        return
      }
      try {
        const response = await getMyCases(access)
        const cases = (response.results ?? []).filter(c => c.assigned_lawyer_id === lawyerId)
        const groups = new Map<string, CaseItem[]>()
        for (const c of cases) {
          if (!c.client_id) continue
          const existing = groups.get(c.client_id)
          if (existing) existing.push(c)
          else groups.set(c.client_id, [c])
        }
        const records: ClientRecord[] = await Promise.all(
          [...groups.entries()].map(async ([id, clientCases]) => {
            try {
              const profile = await getUserById(id, access)
              return { id, profile, cases: clientCases }
            } catch {
              return { id, profile: null, cases: clientCases }
            }
          })
        )
        if (mounted) setClients(records)
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load clients')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => { mounted = false }
  }, [])

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
          <p className="text-neutral-400">No clients found.</p>
          <p className="text-neutral-500 text-sm mt-1">Clients appear when matters are assigned to you.</p>
        </Card>
      )}

      {!loading && !error && clients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client, ci) => {
            const name = client.profile?.full_name || 'Unknown Client'
            const email = client.profile?.email || ''
            const openCount = client.cases.filter(c => !TERMINAL.has(c.status)).length
            const closedCount = client.cases.length - openCount
            const latestCase = [...client.cases].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
            const caseTypes = [...new Set(client.cases.map(c => c.case_type))]
            return (
              <Card key={client.id} className="p-5 flex flex-col gap-3 hover:border-gold-400/20 transition-colors stagger-child" style={{ '--i': Math.min(ci, 8) } as React.CSSProperties}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 border border-gold-500/20 flex items-center justify-center text-gold-300 font-bold text-sm flex-shrink-0">
                    {initials(name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-100 text-sm truncate">{name}</p>
                    {email && (
                      <a href={`mailto:${email}`} className="text-xs text-neutral-500 hover:text-gold-400 truncate block transition-colors">{email}</a>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 text-xs">
                  <span className="text-gold-400 font-semibold">{openCount} open</span>
                  <span className="text-neutral-500">·</span>
                  <span className="text-neutral-400">{closedCount} closed</span>
                </div>

                <div className="space-y-1">
                  {caseTypes.slice(0, 2).map(t => (
                    <p key={t} className="text-xs text-neutral-400 truncate">· {t}</p>
                  ))}
                  {caseTypes.length > 2 && (
                    <p className="text-xs text-neutral-500">+{caseTypes.length - 2} more case type{caseTypes.length - 2 > 1 ? 's' : ''}</p>
                  )}
                </div>

                {latestCase && (
                  <Link href={`/cases/${latestCase.id}`} className="mt-auto text-sm font-medium text-gold-300 hover:text-gold-200 transition-colors">
                    View latest case →
                  </Link>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
