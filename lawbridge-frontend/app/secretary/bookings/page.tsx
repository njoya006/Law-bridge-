'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getIncomingBookings, type CaseItem } from '../../../lib/casesApi'
import { Badge } from '../../../components/ui/Badge'
import { EmptyState } from '../../../components/ui/EmptyState'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { CalendarIcon } from '../../../components/icons/Icons'

type Tab = 'all' | 'pending' | 'accepted' | 'declined'

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'pending' ? 'warning' : status === 'accepted' ? 'success' : 'neutral'
  return <Badge variant={variant} className="capitalize">{status}</Badge>
}

function PaymentBadge({ status }: { status?: string }) {
  if (!status || status === 'none') return null
  const cfg: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' | 'neutral' }> = {
    pending_verification: { label: 'Payment pending', variant: 'warning' },
    verified: { label: 'Payment verified', variant: 'success' },
    rejected: { label: 'Payment rejected', variant: 'danger' },
  }
  const c = cfg[status] ?? { label: status, variant: 'neutral' as const }
  return <Badge variant={c.variant}>{c.label}</Badge>
}

export default function SecretaryBookingsPage() {
  const [bookings, setBookings] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('all')

  useEffect(() => {
    const access = localStorage.getItem('access')
    if (!access) { setError('Not authenticated'); setLoading(false); return }
    getIncomingBookings(access)
      .then(res => setBookings(res.results ?? []))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load bookings'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tab === 'all' ? bookings : bookings.filter(b => b.booking_status === tab)

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.booking_status === 'pending').length,
    accepted: bookings.filter(b => b.booking_status === 'accepted').length,
    declined: bookings.filter(b => b.booking_status === 'declined').length,
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'pending', label: `Pending (${counts.pending})` },
    { key: 'accepted', label: `Accepted (${counts.accepted})` },
    { key: 'declined', label: `Declined (${counts.declined})` },
  ]

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-display-md text-neutral-50">Firm Bookings</h1>
        <p className="mt-1 text-neutral-400">All booking requests directed at your firm across all lawyers</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              tab === t.key
                ? 'bg-portal-soft border-portal-solid text-portal'
                : 'border-neutral-700/40 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon width={24} height={24} />}
          title={tab === 'all' ? 'No bookings yet' : `No ${tab} bookings`}
          body={
            tab === 'all'
              ? 'Client consultation requests routed to your firm will appear here. Make sure the firm has published lawyers in the directory.'
              : tab === 'pending'
              ? 'No pending requests right now. New client bookings will appear here for lawyer review.'
              : tab === 'accepted'
              ? 'No accepted bookings yet. Once a lawyer accepts a request, it appears in this list.'
              : 'No declined requests at this time.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((booking, i) => {
            const meta = booking.booking_metadata ?? {}
            const fee = meta.booking_fee ? parseFloat(meta.booking_fee) : null
            return (
              <Link key={booking.id} href={`/secretary/bookings/${booking.id}`} className="stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                <div className={`rounded-xl border p-5 space-y-3 hover:border-portal-solid/30 transition-colors cursor-pointer ${
                  booking.booking_status === 'pending'
                    ? 'border-amber-500/20 bg-amber-500/5'
                    : booking.booking_status === 'accepted'
                    ? 'border-emerald-500/20 bg-emerald-500/5'
                    : 'border-neutral-700/30 bg-white/5'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-neutral-100 text-sm leading-tight truncate flex-1">{booking.title}</p>
                    <StatusBadge status={booking.booking_status ?? ''} />
                  </div>

                  <p className="text-xs text-neutral-500">{booking.case_type} · {formatDate(booking.created_at)}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {meta.consultation_type && (
                      <div>
                        <span className="text-neutral-500 block uppercase tracking-wide text-[10px] mb-0.5">Type</span>
                        <span className="text-neutral-300 capitalize">{meta.consultation_type.replace('_', ' ')}</span>
                      </div>
                    )}
                    {fee !== null && fee > 0 && (
                      <div>
                        <span className="text-neutral-500 block uppercase tracking-wide text-[10px] mb-0.5">Booking Fee</span>
                        <span className="text-neutral-300">{fee.toLocaleString()} XAF</span>
                      </div>
                    )}
                    {meta.preferred_date && (
                      <div>
                        <span className="text-neutral-500 block uppercase tracking-wide text-[10px] mb-0.5">Requested</span>
                        <span className="text-neutral-300">{meta.preferred_date}</span>
                      </div>
                    )}
                    {meta.urgency && (
                      <div>
                        <span className="text-neutral-500 block uppercase tracking-wide text-[10px] mb-0.5">Urgency</span>
                        <span className={`capitalize font-medium ${meta.urgency === 'urgent' ? 'text-crimson-400' : 'text-neutral-300'}`}>{meta.urgency}</span>
                      </div>
                    )}
                  </div>

                  <PaymentBadge status={meta.payment_status} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
