'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

type StatCard = { label: string; value: string | number; sub?: string; color: string }

type SupportThread = {
  id: number
  case_title?: string
  escalated_to_human: boolean
  is_ai_support: boolean
  updated_at: string
  participants: Array<{ display_name: string; role: string }>
  last_message?: { content: string; sender_name: string; created_at: string }
  unread_count?: number
}

function Card({ label, value, sub, color }: StatCard) {
  return (
    <div className={`rounded-2xl border ${color} bg-primary-800/40 p-5`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-display font-bold text-neutral-100">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function AdminDashboard() {
  const [threads, setThreads] = useState<SupportThread[]>([])
  const [userCount, setUserCount] = useState<number | '…'>('…')
  const [activeCases, setActiveCases] = useState<number | '…'>('…')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) return

    async function load() {
      const headers = { Authorization: `Bearer ${token}` }
      await Promise.allSettled([
        fetch('/api/v1/messages/admin/threads/', { headers })
          .then(r => r.ok ? r.json() : [])
          .then((data: SupportThread[]) => setThreads(data.slice(0, 8))),
        fetch('/api/v1/auth/admin/users/', { headers })
          .then(r => r.ok ? r.json() : { results: [], count: 0 })
          .then((data: { count?: number; results?: unknown[] }) => setUserCount(data.count ?? data.results?.length ?? '…')),
        fetch('/api/v1/cases/?status=in_progress', { headers })
          .then(r => r.ok ? r.json() : { count: 0 })
          .then((data: { count?: number }) => setActiveCases(data.count ?? '…')),
      ])
      setLoading(false)
    }
    void load()
  }, [])

  const openTickets = threads.filter(t => !t.escalated_to_human).length
  const escalated = threads.filter(t => t.escalated_to_human).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-neutral-50">Admin Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Platform overview and support queue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card label="Total Users" value={userCount} color="border-blue-500/20" />
        <Card label="Active Cases" value={activeCases} color="border-emerald-500/20" />
        <Card label="Support Tickets" value={openTickets} sub="AI-handled" color="border-gold-500/20" />
        <Card label="Escalated" value={escalated} sub="Needs human reply" color="border-amber-500/20" />
      </div>

      {/* Recent support threads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-neutral-200">Recent Support Messages</h2>
          <Link href="/admin/support" className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-primary-800/30 animate-pulse" />)}
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-xl border border-white/8 bg-primary-800/20 p-8 text-center text-neutral-500 text-sm">
            No support threads yet.
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map(t => {
              const client = t.participants?.find(p => p.role === 'client')
              return (
                <Link
                  key={t.id}
                  href={`/admin/support?thread=${t.id}`}
                  className="flex items-center gap-4 rounded-xl border border-white/6 bg-primary-800/30 px-4 py-3 transition-all hover:bg-primary-700/40 hover:border-white/10"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 text-gold-300 text-xs font-bold">
                    {(client?.display_name?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-neutral-200 truncate">{client?.display_name ?? 'Unknown client'}</p>
                      {t.escalated_to_human && (
                        <span className="flex-shrink-0 rounded-full bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                          Human
                        </span>
                      )}
                    </div>
                    {t.last_message && (
                      <p className="text-xs text-neutral-500 truncate mt-0.5">{t.last_message.content}</p>
                    )}
                  </div>
                  <span className="text-xs text-neutral-600 flex-shrink-0">{formatTime(t.updated_at)}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
