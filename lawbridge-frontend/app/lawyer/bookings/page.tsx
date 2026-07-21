'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getIncomingBookings, acceptBooking, declineBooking, type CaseItem } from '../../../lib/casesApi'
import { toastSuccess, toastError } from '../../../lib/toast'

type Tab = 'pending' | 'accepted' | 'declined'

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

// ── Payment Badge ─────────────────────────────────────────────────────────────

function PaymentBadge({ status }: { status?: string }) {
  if (!status || status === 'none') return null
  const cfg: Record<string, { label: string; color: string }> = {
    pending_verification: { label: 'Payment pending',  color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
    verified:             { label: 'Payment verified', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
    failed:               { label: 'Payment failed',   color: 'text-crimson-400 border-crimson-500/30 bg-crimson-500/10' },
  }
  const c = cfg[status] ?? { label: status, color: 'text-neutral-400 border-neutral-700 bg-neutral-800' }
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.color}`}>{c.label}</span>
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({
  allBookings,
  selected,
  onSelect,
}: {
  allBookings: CaseItem[]
  selected: string | null
  onSelect: (d: string | null) => void
}) {
  const [viewDate, setViewDate] = useState(new Date())
  const today = new Date().toISOString().slice(0, 10)

  const bookedDays = useMemo(() => {
    const set = new Set<string>()
    allBookings.forEach(b => {
      const d = (b.booking_metadata?.preferred_date as string | undefined) || ''
      if (d) set.add(d.slice(0, 10))
    })
    return set
  }, [allBookings])

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blanks = (firstDay + 6) % 7 // Mon-start

  const prev = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const next = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const monthLabel = viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-xs font-semibold text-neutral-300">{monthLabel}</span>
        <button onClick={next} className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-neutral-600 font-semibold py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: blanks }, (_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isToday = iso === today
          const isSelected = iso === selected
          const hasBooking = bookedDays.has(iso)

          return (
            <button
              key={iso}
              onClick={() => onSelect(isSelected ? null : iso)}
              className={`relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-all ${
                isSelected ? 'bg-gold-500/25 text-gold-300 border border-gold-400/40' :
                isToday    ? 'bg-white/8 text-neutral-100 border border-white/12' :
                hasBooking ? 'hover:bg-primary-700/40 text-neutral-200' :
                             'text-neutral-600 hover:bg-white/4 hover:text-neutral-400'
              }`}
            >
              {day}
              {hasBooking && !isSelected && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-gold-400' : 'bg-amber-400'}`} />
              )}
            </button>
          )
        })}
      </div>

      {selected && (
        <button
          onClick={() => onSelect(null)}
          className="mt-3 w-full text-xs text-gold-400 hover:text-gold-300 text-center transition-colors"
        >
          Clear filter ×
        </button>
      )}
    </div>
  )
}

// ── Booking Card ──────────────────────────────────────────────────────────────

function BookingCard({ booking, onAccept, onDecline }: {
  booking: CaseItem
  onAccept: (id: string) => Promise<void>
  onDecline: (id: string, reason: string) => Promise<void>
}) {
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)

  const meta = booking.booking_metadata ?? {}
  const hasFee = Boolean(meta.booking_fee && parseFloat(meta.booking_fee as string) > 0)
  const feeDisplay = hasFee ? `${parseFloat(meta.booking_fee as string).toLocaleString()} XAF` : null
  const isPending = booking.booking_status === 'pending'

  const clientEmail = (meta.client_email as string) || ''
  const clientDisplayName = clientEmail
    ? clientEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Client'
  const clientInitials = clientDisplayName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || '?'

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
    <div className={`rounded-xl border overflow-hidden ${
      isPending ? 'border-amber-500/20' :
      booking.booking_status === 'accepted' ? 'border-emerald-500/20' :
      'border-neutral-700/30'
    }`}>
      {/* Client strip */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${
        isPending ? 'bg-amber-500/5 border-amber-500/10' :
        booking.booking_status === 'accepted' ? 'bg-emerald-500/5 border-emerald-500/10' :
        'bg-primary-800/40 border-neutral-700/20'
      }`}>
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-primary-500/30 to-primary-600/30 border border-primary-400/20 flex items-center justify-center text-primary-100 text-sm font-bold">
          {clientInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-200">{clientDisplayName}</p>
          {clientEmail && <p className="text-xs text-neutral-500 truncate">{clientEmail}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasFee && <PaymentBadge status={meta.payment_status as string | undefined} />}
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${
            isPending ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
            booking.booking_status === 'accepted' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
            'text-neutral-400 border-neutral-600/30'
          }`}>{booking.booking_status}</span>
        </div>
      </div>

      <div className="p-5 space-y-4 bg-primary-800/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-100">{booking.title}</p>
            <p className="text-neutral-500 text-xs mt-0.5">{booking.case_type} · Submitted {formatDate(booking.created_at)}</p>
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-neutral-400">
          {meta.consultation_type && (
            <div>
              <span className="text-neutral-500 block uppercase tracking-wide text-[10px] mb-0.5">Type</span>
              <span className="text-neutral-300 capitalize">{(meta.consultation_type as string).replace('_', ' ')}</span>
            </div>
          )}
          {meta.preferred_date && (
            <div>
              <span className="text-neutral-500 block uppercase tracking-wide text-[10px] mb-0.5">Requested</span>
              <span className="text-neutral-300">{meta.preferred_date as string} {meta.preferred_time as string}</span>
            </div>
          )}
          {meta.urgency && (
            <div>
              <span className="text-neutral-500 block uppercase tracking-wide text-[10px] mb-0.5">Urgency</span>
              <span className={`capitalize font-medium ${meta.urgency === 'urgent' ? 'text-crimson-400' : 'text-neutral-300'}`}>{meta.urgency as string}</span>
            </div>
          )}
        </div>

        {booking.description && (
          <p className="text-neutral-500 text-xs leading-relaxed line-clamp-2">{booking.description}</p>
        )}

        {/* Fee row */}
        {hasFee && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gold-500/5 border border-gold-400/15">
            <svg className="w-4 h-4 text-gold-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gold-400 font-semibold text-sm">{feeDisplay}</span>
            <span className="text-neutral-600 text-xs">booking fee</span>
            {meta.payment_reference && (
              <span className="text-neutral-600 text-xs ml-auto font-mono">#{String(meta.payment_reference).slice(0, 12)}</span>
            )}
          </div>
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
            <Link href={`/bookings/${booking.id}`} className="ml-auto px-3 py-2 rounded-lg border border-neutral-600/40 text-neutral-400 text-xs hover:text-gold-400 transition-colors flex items-center">
              Details
            </Link>
          </div>
        )}

        {declining && (
          <div className="space-y-3 pt-1">
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-1.5">Reason for declining (optional)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
              placeholder="e.g. Conflict of interest, not taking new cases…"
              className="w-full rounded-lg px-3 py-2 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-crimson-500/50 placeholder:text-neutral-600 text-sm resize-none" />
            <div className="flex gap-2">
              <button onClick={handleDecline} disabled={loading !== null}
                className="px-4 py-2 rounded-lg bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold transition-colors disabled:opacity-50">
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
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LawyerBookingsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('pending')
  const [bookings, setBookings] = useState<Record<Tab, CaseItem[]>>({ pending: [], accepted: [], declined: [] })
  const [counts, setCounts] = useState<Record<Tab, number>>({ pending: 0, accepted: 0, declined: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState<string | null>(null)

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
      if (pending.status === 'fulfilled')  { b.pending  = pending.value.results;  c.pending  = pending.value.count }
      if (accepted.status === 'fulfilled') { b.accepted = accepted.value.results; c.accepted = accepted.value.count }
      if (declined.status === 'fulfilled') { b.declined = declined.value.results; c.declined = declined.value.count }
      setBookings(b); setCounts(c)
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
    try {
      await acceptBooking(id, access)
      toastSuccess('Booking accepted — the client will be notified.')
      await fetchAll()
    } catch (e) {
      toastError(e instanceof Error ? e.message.replace(/^\d+[^:]*:\s*/, '') : 'Failed to accept booking.', 'Accept failed')
    }
  }

  const handleDecline = async (id: string, reason: string) => {
    const access = localStorage.getItem('access')
    if (!access) return
    try {
      await declineBooking(id, reason, access)
      toastSuccess('Booking declined — the client will be notified.')
      await fetchAll()
    } catch (e) {
      toastError(e instanceof Error ? e.message.replace(/^\d+[^:]*:\s*/, '') : 'Failed to decline booking.', 'Decline failed')
    }
  }

  const allBookings = [...bookings.pending, ...bookings.accepted, ...bookings.declined]

  const visibleBookings = useMemo(() => {
    const list = bookings[tab]
    if (!dateFilter) return list
    return list.filter(b => {
      const d = (b.booking_metadata?.preferred_date as string | undefined) || ''
      return d.startsWith(dateFilter)
    })
  }, [bookings, tab, dateFilter])

  const TABS: { id: Tab; label: string }[] = [
    { id: 'pending',  label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'declined', label: 'Declined' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-primary-800/25 px-6 py-5">
        <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-amber-500 opacity-[0.05] blur-3xl" />
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-neutral-50 leading-tight">Booking Requests</h1>
        <p className="text-sm text-neutral-500 mt-1">Review and respond to client consultation requests.</p>
        {counts.pending > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-amber-300">{counts.pending} pending — awaiting your response</span>
          </div>
        )}
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
        <div className="rounded-lg border border-crimson-500/30 bg-crimson-700/10 p-4 text-crimson-300 text-sm">{error}</div>
      )}

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Mini calendar */}
        <div className="space-y-4">
          <MiniCalendar allBookings={allBookings} selected={dateFilter} onSelect={setDateFilter} />

          {/* Quick stats */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-4 space-y-3">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Overview</p>
            {[
              { label: 'Pending',  value: counts.pending,  color: 'bg-amber-400' },
              { label: 'Accepted', value: counts.accepted, color: 'bg-emerald-400' },
              { label: 'Declined', value: counts.declined, color: 'bg-neutral-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
                <span className="text-xs text-neutral-400 flex-1">{label}</span>
                <span className="text-xs font-bold text-neutral-200 tabular-nums">{value}</span>
              </div>
            ))}
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mt-1 flex gap-0.5">
              <div className="bg-amber-400/60 rounded-full" style={{ width: `${(counts.pending / Math.max(counts.pending + counts.accepted + counts.declined, 1)) * 100}%` }} />
              <div className="bg-emerald-400/60 rounded-full" style={{ width: `${(counts.accepted / Math.max(counts.pending + counts.accepted + counts.declined, 1)) * 100}%` }} />
              <div className="bg-neutral-600/60 flex-1 rounded-full" />
            </div>
          </div>
        </div>

        {/* Right: Booking cards */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-primary-800/30 animate-pulse" />)}
            </div>
          ) : visibleBookings.length === 0 ? (
            <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-10 text-center">
              <p className="text-neutral-400 text-sm">
                {dateFilter ? `No ${tab} bookings on ${dateFilter}.` : `No ${tab} booking requests.`}
              </p>
              {tab === 'pending' && !dateFilter && (
                <p className="text-neutral-600 text-xs mt-2">New requests appear here when clients book a consultation with you.</p>
              )}
              {dateFilter && (
                <button onClick={() => setDateFilter(null)} className="mt-3 text-xs text-gold-400 hover:text-gold-300 transition-colors">
                  Show all {tab} bookings →
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {dateFilter && (
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs text-neutral-500">Showing bookings for <span className="text-neutral-300 font-medium">{dateFilter}</span></p>
                  <button onClick={() => setDateFilter(null)} className="text-xs text-gold-400 hover:text-gold-300 transition-colors">Clear ×</button>
                </div>
              )}
              {visibleBookings.map(b => (
                <BookingCard key={b.id} booking={b} onAccept={handleAccept} onDecline={handleDecline} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
