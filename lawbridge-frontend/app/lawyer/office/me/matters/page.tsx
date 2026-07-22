'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../../../components/ui/Card'
import { getMyCases, type CaseItem } from '../../../../../lib/casesApi'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', filed: 'Filed', assigned: 'Assigned',
  under_review: 'Under Review', in_progress: 'In Progress',
  hearing_scheduled: 'Hearing Scheduled', mediation: 'Mediation',
  closed: 'Closed', dismissed: 'Dismissed', settled: 'Settled', verdict: 'Verdict',
}

function StatusBadge({ status, bookingStatus }: { status: string; bookingStatus?: string }) {
  if (bookingStatus === 'pending') {
    return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-400">Pending</span>
  }
  if (bookingStatus === 'accepted') {
    return <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Consultation</span>
  }
  const map: Record<string, string> = {
    closed: 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30',
    dismissed: 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30',
    settled: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    verdict: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    filed: 'text-primary-100 bg-primary-400/10 border-primary-400/30',
    assigned: 'text-gold-300 bg-gold-500/10 border-gold-500/25',
  }
  const cls = map[status?.toLowerCase()] ?? 'text-gold-400 bg-gold-500/10 border-gold-500/30'
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

export default function MyOfficeMattersPage() {
  const [items, setItems] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { if (mounted) { setError('Sign in as a lawyer to view matters.'); setLoading(false) } return }
      try {
        const response = await getMyCases(access)
        if (mounted) setItems(response.results ?? [])
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load matters')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => { mounted = false }
  }, [])

  const TERMINAL = ['closed', 'dismissed', 'archived', 'settled', 'verdict']
  const activeItems = items.filter(m => !TERMINAL.includes(m.status) && m.booking_status !== 'declined')
  const closedItems = items.filter(m => TERMINAL.includes(m.status))
  const openItems = activeItems

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-display-md text-neutral-50">My Matters</h2>
          <p className="mt-1 text-neutral-400">Cases and consultations assigned to you</p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-gold-400 font-semibold">{openItems.length} open</span>
          <span className="text-neutral-500">·</span>
          <span className="text-neutral-400">{closedItems.length} closed</span>
        </div>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-12 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading matters…
        </div>
      )}

      {!loading && error && (
        <Card className="border border-crimson-500/30 p-4">
          <p className="text-crimson-300 text-sm">{error}</p>
        </Card>
      )}

      {!loading && !error && activeItems.length === 0 && closedItems.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-neutral-400">No matters assigned to you yet.</p>
          <p className="text-neutral-500 text-sm mt-1">Booking requests from clients will appear here as soon as they select you.</p>
          <Link href="/lawyer/bookings" className="mt-3 inline-block text-gold-300 hover:text-gold-200 text-sm">
            View incoming booking requests →
          </Link>
        </Card>
      )}

      {!loading && !error && activeItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeItems.map((item, ii) => {
            const isBooking = Boolean(item.booking_status)
            const href = isBooking ? `/bookings/${item.id}` : `/cases/${item.id}`
            const meta = item.booking_metadata ?? {}
            const isPending = item.booking_status === 'pending'
            return (
              <Card key={item.id} className={`p-5 flex flex-col gap-3 transition-colors stagger-child ${isPending ? 'hover:border-amber-400/30 border-amber-500/20' : 'hover:border-gold-400/20'}`} style={{ '--i': Math.min(ii, 8) } as React.CSSProperties}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-50 truncate">{item.title}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">{item.case_type}</p>
                  </div>
                  <StatusBadge status={item.status} bookingStatus={item.booking_status} />
                </div>
                {isBooking && meta.preferred_date && (
                  <p className="text-xs text-neutral-500">Requested: {meta.preferred_date}{meta.preferred_time ? ` at ${meta.preferred_time}` : ''}</p>
                )}
                <div className="text-xs text-neutral-400">
                  {isPending ? `Received ${formatDate(item.created_at)}` : `Updated ${formatDate(item.updated_at)}`}
                </div>
                <Link href={href} className={`mt-auto text-sm font-medium transition-colors ${isPending ? 'text-amber-400 hover:text-amber-300' : 'text-gold-300 hover:text-gold-200'}`}>
                  {isPending ? 'Respond to request →' : isBooking ? 'View booking →' : 'Open matter →'}
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
