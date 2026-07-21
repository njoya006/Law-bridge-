'use client'

import React, { useEffect, useState, useCallback } from 'react'
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function avatarUrl(userId: string) {
  return `${SERVICE_URLS.auth.replace(/\/$/, '')}/auth/avatars/${userId}/`
}

function relationshipScore(cases: CaseItem[]): number {
  if (cases.length === 0) return 0
  const openCount = cases.filter(c => !['closed', 'dismissed', 'archived', 'settled', 'verdict'].includes(c.status)).length
  const lastActivity = Math.max(...cases.map(c => new Date(c.updated_at || c.created_at).getTime()))
  const daysSince = (Date.now() - lastActivity) / 86400000
  const volumeScore  = Math.min(cases.length / 5, 1) * 40
  const activeScore  = (openCount / cases.length) * 30
  const recencyScore = daysSince < 7 ? 30 : daysSince < 30 ? 20 : daysSince < 90 ? 10 : 0
  return Math.round(Math.min(volumeScore + activeScore + recencyScore, 100))
}

function RelationshipBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-400' : score >= 40 ? 'bg-gold-400' : 'bg-neutral-500'
  const label = score >= 70 ? 'Strong' : score >= 40 ? 'Active' : 'Early'
  const textColor = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-gold-400' : 'text-neutral-500'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wide">Relationship</span>
        <span className={`text-[10px] font-semibold ${textColor}`}>{label} · {score}</span>
      </div>
      <div className="h-1 rounded-full bg-white/6 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

const NOTES_KEY = 'lawbridge_client_notes'

function getCRMNotes(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}') }
  catch { return {} }
}

function saveCRMNote(clientId: string, note: string) {
  const notes = getCRMNotes()
  if (note.trim()) notes[clientId] = note
  else delete notes[clientId]
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

function ClientNotes({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(() => getCRMNotes()[clientId] || '')

  const handleBlur = useCallback(() => {
    saveCRMNote(clientId, note)
  }, [clientId, note])

  return (
    <div className="mt-1">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-[11px] text-neutral-600 hover:text-gold-400 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          {note ? <span className="truncate max-w-[160px]">{note}</span> : 'Add private note'}
        </button>
      )}
      {open && (
        <div className="space-y-1.5">
          <textarea
            autoFocus
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={() => { handleBlur(); setOpen(false) }}
            rows={2}
            placeholder="Private note visible only to you…"
            className="w-full rounded-lg bg-primary-900/60 border border-white/10 px-2.5 py-2 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-gold-500/30 resize-none"
          />
          <div className="flex gap-2">
            <button
              onMouseDown={() => { saveCRMNote(clientId, note); setOpen(false) }}
              className="text-[10px] px-2 py-1 rounded-lg bg-gold-500/15 text-gold-400 border border-gold-400/25 hover:bg-gold-500/25 transition-colors"
            >
              Save
            </button>
            <button
              onMouseDown={() => setOpen(false)}
              className="text-[10px] px-2 py-1 rounded-lg text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
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
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-14 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-neutral-200 text-base">No clients yet</h3>
          <p className="mt-1.5 max-w-xs mx-auto text-sm text-neutral-500 leading-relaxed">
            Your clients will appear here once you accept their booking requests and cases are opened.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/lawyer/bookings" className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-5 py-2.5 text-sm font-semibold text-gold-400 hover:bg-gold-500/20 transition-colors">
              Review Bookings
            </Link>
            <Link href="/lawyer/settings" className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/10 transition-colors">
              Update Profile
            </Link>
          </div>
          <p className="mt-5 text-xs text-neutral-600">
            Tip: Clients search for lawyers by specialization and circuit. Keep your profile complete to appear in more searches.
          </p>
        </div>
      )}

      {!loading && !error && clients.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client, ci) => {
            const name = client.profile?.full_name || 'Unknown Client'
            const email = client.profile?.email || ''
            const openCount = client.cases.filter(m => !['closed','dismissed','archived','settled','verdict'].includes(m.status)).length
            const latestCase = [...client.cases].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
            const caseTypes = [...new Set(client.cases.map(c => c.case_type))].slice(0, 2)
            const score = relationshipScore(client.cases)
            return (
              <div key={client.id} className="stagger-child" style={{ '--i': ci } as React.CSSProperties}>
              <Card className="p-5 flex flex-col gap-3 hover:border-gold-400/20 transition-colors h-full">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 border border-gold-500/20 flex items-center justify-center text-gold-300 font-bold text-sm flex-shrink-0">
                    {initials(name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-neutral-100 truncate">{name}</p>
                    {email && (
                      <a href={`mailto:${email}`} className="text-xs text-neutral-400 hover:text-gold-400 transition-colors truncate block">{email}</a>
                    )}
                  </div>
                </div>

                {/* Relationship strength */}
                <RelationshipBar score={score} />

                {/* Stats */}
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

                {/* Case type chips */}
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

                {/* CRM note */}
                <ClientNotes clientId={client.id} />

                {latestCase && (
                  <Link href={`/cases/${latestCase.id}`} className="mt-auto text-sm font-medium text-gold-300 hover:text-gold-200 transition-colors">
                    View latest case →
                  </Link>
                )}
              </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
