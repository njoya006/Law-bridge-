"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { getMyCases, type CaseItem } from '../../../lib/casesApi'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  filed: 'Filed',
  assigned: 'Assigned',
  under_review: 'Under Review',
  evidence_collection: 'Evidence Collection',
  in_progress: 'In Progress',
  hearing_scheduled: 'Hearing Scheduled',
  hearing_adjourned: 'Adjourned',
  mediation: 'Mediation',
  appeal_filed: 'Appeal Filed',
  appeal_in_progress: 'Appeal In Progress',
  awaiting_court_date: 'Awaiting Court Date',
  closed: 'Closed',
  dismissed: 'Dismissed',
  settled: 'Settled',
  verdict: 'Verdict',
  archived: 'Archived',
}

const BOOKING_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  accepted: { label: 'Consultation Accepted', cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  pending:  { label: 'Awaiting Response',     cls: 'border-amber-500/30  bg-amber-500/10  text-amber-400'   },
  declined: { label: 'Declined',              cls: 'border-neutral-600   bg-neutral-800   text-neutral-400'  },
}

function statusBadgeCls(s: string) {
  if (s === 'closed' || s === 'dismissed' || s === 'archived') return 'border-neutral-600 text-neutral-400'
  if (s === 'settled' || s === 'verdict') return 'border-emerald-500/30 text-emerald-400'
  if (s === 'filed' || s === 'assigned') return 'border-blue-500/30 text-blue-400'
  return 'border-gold-500/30 text-gold-400'
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

export default function LawyerMattersPage() {
  const [items, setItems] = useState<CaseItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        setError('Sign in as a lawyer to view active matters.')
        setLoading(false)
        return
      }
      try {
        const response = await getMyCases(access)
        setItems(response.results ?? [])
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load matters')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const pendingMatters  = items.filter(i => i.booking_status === 'pending')
  const bookingMatters  = items.filter(i => i.booking_status === 'accepted')
  const legalMatters    = items.filter(i => !i.booking_status)
  const visibleItems    = items.filter(i => i.booking_status !== 'declined')

  return (
    <div>
      <h2 className="font-display text-display-md">Matters</h2>
      <p className="mt-1 text-sm text-primary-300">Cases and consultations assigned to you.</p>

      {error && <Card className="mt-4 border border-crimson-500/30 text-crimson-200">{error}</Card>}

      {loading && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-primary-800/30 animate-pulse" />)}
        </div>
      )}

      {!loading && !error && visibleItems.length === 0 && (
        <Card className="mt-6 text-neutral-400">No matters assigned to you yet. Booking requests will appear here when clients select you.</Card>
      )}

      {/* Pending bookings — awaiting lawyer response */}
      {!loading && pendingMatters.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-500/70 mb-3">Awaiting Your Response</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pendingMatters.map(item => {
              const meta = item.booking_metadata ?? {}
              return (
                <Link key={item.id} href={`/bookings/${item.id}`} className="block group">
                  <Card className="h-full cursor-pointer hover:border-amber-500/30 transition-colors border-amber-500/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-100 truncate">{item.title}</p>
                        <p className="text-xs text-primary-300 mt-0.5">{item.case_type}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium border-amber-500/30 bg-amber-500/10 text-amber-400">Pending</span>
                    </div>
                    {meta.consultation_type && (
                      <p className="mt-2 text-sm text-neutral-400 capitalize">{meta.consultation_type.replace('_', ' ')}</p>
                    )}
                    {meta.preferred_date && (
                      <p className="mt-1 text-xs text-neutral-500">Requested: {meta.preferred_date}{meta.preferred_time ? ` at ${meta.preferred_time}` : ''}</p>
                    )}
                    <p className="mt-2 text-xs text-neutral-500">Received {formatDate(item.created_at)}</p>
                    <p className="mt-3 text-sm font-medium text-amber-400 group-hover:text-amber-300 transition-colors">Respond to request →</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Accepted consultations / bookings */}
      {!loading && bookingMatters.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-3">Active Consultations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {bookingMatters.map(item => {
              const meta = item.booking_metadata ?? {}
              return (
                <Link key={item.id} href={`/bookings/${item.id}`} className="block group">
                  <Card className="h-full cursor-pointer hover:border-gold-500/40 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-100 truncate">{item.title}</p>
                        <p className="text-xs text-primary-300 mt-0.5">{item.case_type}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Accepted</span>
                    </div>
                    {meta.consultation_type && (
                      <p className="mt-2 text-sm text-neutral-400 capitalize">{meta.consultation_type.replace('_', ' ')}</p>
                    )}
                    {meta.preferred_date && (
                      <p className="mt-1 text-xs text-neutral-500">Requested: {meta.preferred_date}{meta.preferred_time ? ` at ${meta.preferred_time}` : ''}</p>
                    )}
                    <p className="mt-2 text-xs text-primary-400">Accepted {formatDate(item.updated_at)}</p>
                    <p className="mt-3 text-sm font-medium text-gold-300 group-hover:text-gold-200 transition-colors">View booking details →</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Legal matters (filed cases) */}
      {!loading && legalMatters.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-3">Legal Matters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {legalMatters.map(item => (
              <Link key={item.id} href={`/cases/${item.id}`} className="block group">
                <Card className="h-full cursor-pointer hover:border-gold-500/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-100 truncate">{item.title}</p>
                      <p className="text-xs text-primary-300 mt-0.5">{item.case_type}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadgeCls(item.status)}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-primary-400">Updated {formatDate(item.updated_at)}</p>
                  <p className="mt-3 text-sm font-medium text-gold-300 group-hover:text-gold-200 transition-colors">Open matter →</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
