'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getIncomingBookings, acceptBooking, declineBooking, type CaseItem } from '../../../lib/casesApi'

type Tab = 'pending' | 'accepted' | 'declined'

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

function PaymentBadge({ status }: { status?: string }) {
  if (!status || status === 'none') return null
  const cfg: Record<string, { label: string; color: string }> = {
    pending_verification: { label: 'Payment pending', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    verified: { label: 'Payment verified', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    failed: { label: 'Payment failed', color: 'text-crimson-400 border-crimson-500/30 bg-crimson-500/10' },
  }
  const c = cfg[status] ?? { label: status, color: 'text-neutral-400 border-neutral-700 bg-neutral-800' }
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.color}`}>{c.label}</span>
}

function BookingCard({ booking, onAccept, onDecline }: {
  booking: CaseItem
  onAccept: (id: string) => Promise<void>
  onDecline: (id: string, reason: string) => Promise<void>
}) {
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const meta = booking.booking_metadata ?? {}
  const hasFee = Boolean(meta.booking_fee && parseFloat(meta.booking_fee) > 0)
  const feeDisplay = hasFee ? `${parseFloat(meta.booking_fee!).toLocaleString()} XAF` : null
  const isPending = booking.booking_status === 'pending'

  const handleAccept = async () => {
    setLoading('accept')
    await onAccept(booking.id)
    setLoading(null)
  }

  const handleDecline = async () => {
    setLoading('decline')
    await onDecline(booking.id, reason)
    setLoading(null)
    setDeclining(false)
  }

  return (
    <div className={`rounded-xl border p-5 space-y-4 ${
      isPending ? 'border-amber-500/20 bg-amber-500/5' :
      booking.booking_status === 'accepted' ? 'border-emerald-500/20 bg-emerald-500/5' :
      'border-neutral-700/30 bg-primary-800/30'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-heading text-body-sm text-neutral-100">{booking.title}</p>
          <p className="text-neutral-500 text-xs mt-0.5">{booking.case_type} · Submitted {formatDate(booking.created_at)}</p>
        </div>
        {!isPending && (
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${
            booking.booking_status === 'accepted' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-neutral-400 border-neutral-600/30'
          }`}>{booking.booking_status}</span>
        )}
      </div>

      {/* Client request details */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-neutral-400">
        {meta.consultation_type && (
          <div><span className="text-neutral-500 block uppercase tracking-wide text-[10px] mb-0.5">Type</span><span className="text-neutral-300 capitalize">{meta.consultation_type.replace('_', ' ')}</span></div>
        )}
        {meta.preferred_date && (
          <div><span className="text-neutral-500 block uppercase tracking-wide text-[10px] mb-0.5">Requested</span><span className="text-neutral-300">{meta.preferred_date} {meta.preferred_time}</span></div>
        )}
        {meta.urgency && (
          <div><span className="text-neutral-500 block uppercase tracking-wide text-[10px] mb-0.5">Urgency</span><span className={`capitalize font-medium ${meta.urgency === 'urgent' ? 'text-crimson-400' : 'text-neutral-300'}`}>{meta.urgency}</span></div>
        )}
      </div>

      {/* Description excerpt */}
      {booking.description && (
        <p className="text-neutral-500 text-xs leading-relaxed line-clamp-2">{booking.description}</p>
      )}

      {/* Fee */}
      {hasFee && (
        <div className="flex items-center gap-3">
          <span className="text-gold-400 font-semibold text-sm">{feeDisplay} booking fee</span>
          <PaymentBadge status={meta.payment_status} />
        </div>
      )}
      {meta.payment_reference && (
        <p className="text-neutral-500 text-xs">Ref: <span className="font-mono text-neutral-300">{meta.payment_reference}</span></p>
      )}

      {/* Actions */}
      {isPending && !declining && (
        <div className="flex gap-2 pt-1">
          <button onClick={handleAccept} disabled={loading !== null}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {loading === 'accept' ? <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" /> : '✓'} Accept
          </button>
          <button onClick={() => setDeclining(true)} disabled={loading !== null}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-crimson-500/40 text-crimson-300 text-sm hover:bg-crimson-500/10 transition-colors disabled:opacity-50">
            ✕ Decline
          </button>
          <Link href={`/bookings/${booking.id}`} className="ml-auto px-3 py-2 rounded-lg border border-neutral-600/40 text-neutral-400 text-sm hover:text-gold-400 transition-colors text-xs">
            Details
          </Link>
        </div>
      )}

      {/* Decline form */}
      {declining && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-1.5">Reason for declining (optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="e.g. Conflict of interest, not taking new cases…"
              className="w-full rounded-lg px-3 py-2 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-crimson-500/50 placeholder:text-neutral-600 text-sm resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleDecline} disabled={loading !== null}
              className="px-4 py-2 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
              {loading === 'decline' ? <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full inline-block" /> : 'Confirm Decline'}
            </button>
            <button onClick={() => { setDeclining(false); setReason('') }} className="px-4 py-2 rounded-lg border border-neutral-600 text-neutral-400 text-sm hover:text-neutral-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {!isPending && booking.booking_status === 'accepted' && (
        <div className="pt-1">
          <Link href={`/bookings/${booking.id}`} className="text-gold-400 text-sm hover:text-gold-300 transition-colors">View booking details →</Link>
        </div>
      )}
    </div>
  )
}

export default function LawyerBookingsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('pending')
  const [bookings, setBookings] = useState<Record<Tab, CaseItem[]>>({ pending: [], accepted: [], declined: [] })
  const [counts, setCounts] = useState<Record<Tab, number>>({ pending: 0, accepted: 0, declined: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    const access = localStorage.getItem('access')
    if (!access) { router.push('/auth/login'); return }
    setLoading(true)
    try {
      const [pending, accepted, declined] = await Promise.allSettled([
        getIncomingBookings(access, 'pending'),
        getIncomingBookings(access, 'accepted'),
        getIncomingBookings(access, 'declined'),
      ])
      const b = { pending: [] as CaseItem[], accepted: [] as CaseItem[], declined: [] as CaseItem[] }
      const c = { pending: 0, accepted: 0, declined: 0 }
      if (pending.status === 'fulfilled') { b.pending = pending.value.results; c.pending = pending.value.count }
      if (accepted.status === 'fulfilled') { b.accepted = accepted.value.results; c.accepted = accepted.value.count }
      if (declined.status === 'fulfilled') { b.declined = declined.value.results; c.declined = declined.value.count }
      setBookings(b)
      setCounts(c)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { void fetchAll() }, [fetchAll])

  const handleAccept = async (id: string) => {
    const access = localStorage.getItem('access')
    if (!access) return
    await acceptBooking(id, access)
    await fetchAll()
  }

  const handleDecline = async (id: string, reason: string) => {
    const access = localStorage.getItem('access')
    if (!access) return
    await declineBooking(id, reason, access)
    await fetchAll()
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'declined', label: 'Declined' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-display-md text-neutral-50">Booking Requests</h1>
        <p className="text-neutral-400 mt-1">Review and respond to client consultation requests.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-primary-800/40 border border-neutral-700/30 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30' : 'text-neutral-400 hover:text-neutral-200'}`}>
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${t.id === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-700 text-neutral-300'}`}>{counts[t.id]}</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-crimson-500/30 bg-crimson-900/10 p-4 text-crimson-300 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-primary-800/30 animate-pulse" />)}
        </div>
      ) : bookings[tab].length === 0 ? (
        <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-10 text-center">
          <p className="text-neutral-400 text-sm">No {tab} booking requests.</p>
          {tab === 'pending' && <p className="text-neutral-600 text-xs mt-2">New requests will appear here when clients book a consultation with you.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings[tab].map(b => (
            <BookingCard key={b.id} booking={b} onAccept={handleAccept} onDecline={handleDecline} />
          ))}
        </div>
      )}
    </div>
  )
}
