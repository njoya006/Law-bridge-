'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getIncomingBookings, type CaseItem } from '../../../lib/casesApi'

type Tab = 'all' | 'pending' | 'accepted' | 'declined'

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    pending: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    accepted: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    declined: 'text-neutral-400 border-neutral-600/30 bg-neutral-800/30',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${cfg[status] ?? 'text-neutral-400 border-neutral-700'}`}>
      {status}
    </span>
  )
}

function PaymentBadge({ status }: { status?: string }) {
  if (!status || status === 'none') return null
  const cfg: Record<string, { label: string; color: string }> = {
    pending_verification: { label: 'Payment pending', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    verified: { label: 'Payment verified', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    rejected: { label: 'Payment rejected', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  }
  const c = cfg[status] ?? { label: status, color: 'text-neutral-400 border-neutral-700 bg-neutral-800' }
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.color}`}>{c.label}</span>
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
                ? 'bg-gold-500/15 border-gold-500/30 text-gold-300'
                : 'border-neutral-700/40 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 animate-pulse space-y-3">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-1/2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400 mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p className="font-semibold text-neutral-200 text-base">
            {tab === 'all' ? 'No bookings yet' : `No ${tab} bookings`}
          </p>
          <p className="mt-1.5 max-w-xs text-sm text-neutral-500 leading-relaxed">
            {tab === 'all'
              ? 'Client consultation requests routed to your firm will appear here. Make sure the firm has published lawyers in the directory.'
              : tab === 'pending'
              ? 'No pending requests right now. New client bookings will appear here for lawyer review.'
              : tab === 'accepted'
              ? 'No accepted bookings yet. Once a lawyer accepts a request, it appears in this list.'
              : 'No declined requests at this time.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(booking => {
            const meta = booking.booking_metadata ?? {}
            const fee = meta.booking_fee ? parseFloat(meta.booking_fee) : null
            return (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <div className={`rounded-xl border p-5 space-y-3 hover:border-gold-400/30 transition-colors cursor-pointer ${
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
                        <span className={`capitalize font-medium ${meta.urgency === 'urgent' ? 'text-red-400' : 'text-neutral-300'}`}>{meta.urgency}</span>
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
