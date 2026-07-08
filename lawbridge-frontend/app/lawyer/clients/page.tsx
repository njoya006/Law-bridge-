'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { getMyCases, getUserById, type CaseItem, type UserProfile } from '../../../lib/casesApi'
import { SERVICE_URLS } from '../../../lib/serviceUrls'

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'In Progress', hearing_scheduled: 'Hearing Scheduled',
  filed: 'Filed', assigned: 'Assigned', under_review: 'Under Review',
  closed: 'Closed', dismissed: 'Dismissed', settled: 'Settled', verdict: 'Verdict',
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

function avatarUrl(userId: string) {
  return `${SERVICE_URLS.auth.replace(/\/$/, '')}/auth/avatars/${userId}/`
}

type ClientRecord = { id: string; profile: UserProfile | null; cases: CaseItem[] }

export default function LawyerClientsPage() {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { if (mounted) { setError('Sign in as a lawyer to view clients.'); setLoading(false) } return }
      try {
        const response = await getMyCases(access)
        const cases = response.results ?? []
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

  const totalOpen = clients.reduce((n, c) => n + c.cases.filter(m => !['closed','dismissed','archived','settled','verdict'].includes(m.status)).length, 0)

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-md">Clients</h2>
        <p className="mt-1 text-sm text-neutral-400">
          {clients.length} {clients.length === 1 ? 'client' : 'clients'} · {totalOpen} open matter{totalOpen !== 1 ? 's' : ''}
        </p>
      </header>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl skeleton" />)}
        </div>
      )}

      {!loading && error && (
        <Card className="border border-crimson-500/30 p-4">
          <p className="text-crimson-300 text-sm">{error}</p>
        </Card>
      )}

      {!loading && !error && clients.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-neutral-400">No clients yet.</p>
          <p className="text-neutral-500 text-sm mt-1">Clients appear once a booking is accepted and cases are assigned to you.</p>
        </Card>
      )}

      {!loading && !error && clients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => {
            const name = client.profile?.full_name || 'Unknown Client'
            const email = client.profile?.email || ''
            const openCount = client.cases.filter(m => !['closed','dismissed','archived','settled','verdict'].includes(m.status)).length
            const latestCase = [...client.cases].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
            const caseTypes = [...new Set(client.cases.map(c => c.case_type))].slice(0, 2)
            return (
              <Card key={client.id} className="p-5 flex flex-col gap-4 hover:border-gold-400/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 border border-gold-500/20 flex items-center justify-center text-gold-300 font-bold text-sm flex-shrink-0">
                    {initials(name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-100 truncate">{name}</p>
                    {email && (
                      <a href={`mailto:${email}`} className="text-xs text-neutral-400 hover:text-gold-400 transition-colors truncate block">{email}</a>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="text-center">
                    <p className="font-bold text-gold-400 text-sm">{client.cases.length}</p>
                    <p className="text-neutral-500">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-emerald-400 text-sm">{openCount}</p>
                    <p className="text-neutral-500">Open</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-neutral-300 text-sm">{client.cases.length - openCount}</p>
                    <p className="text-neutral-500">Closed</p>
                  </div>
                </div>
                {caseTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {caseTypes.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-[11px] border border-neutral-700/40 text-neutral-400">{t}</span>
                    ))}
                    {client.cases.length > 2 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] border border-neutral-700/40 text-neutral-500">+{client.cases.length - 2} more</span>
                    )}
                  </div>
                )}
                {latestCase && (
                  <p className="text-xs text-neutral-500">
                    Latest: <span className="text-neutral-400">{STATUS_LABELS[latestCase.status] ?? latestCase.status}</span>
                    {' · '}{new Date(latestCase.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                )}
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
