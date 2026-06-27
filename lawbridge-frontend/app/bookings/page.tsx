'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getMyCases, type CaseItem } from '../../lib/casesApi'

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: 'Awaiting response', color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  accepted: { label: 'Accepted',          color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  declined: { label: 'Declined',          color: 'text-crimson-400', bg: 'bg-crimson-500/10', border: 'border-crimson-500/30' },
}

function BookingRow({ booking }: { booking: CaseItem }) {
  const meta = booking.booking_metadata ?? {}
  const status = booking.booking_status || 'pending'
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const hasFee = Boolean(meta.booking_fee && parseFloat(meta.booking_fee) > 0)

  return (
    <Link href={`/bookings/${booking.id}`}
      className={`block rounded-xl border ${cfg.border} ${cfg.bg} p-5 hover:brightness-110 transition-all`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-heading text-body-sm text-neutral-100">{booking.title}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
            {booking.booking_metadata?.urgency === 'urgent' && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-crimson-500/30 bg-crimson-500/10 text-crimson-300 font-medium">⚡ Urgent</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 mt-1">
            {meta.target_name && <span>With <span className="text-gold-400">{meta.target_name}</span></span>}
            {meta.preferred_date && <span>{meta.preferred_date} at {meta.preferred_time}</span>}
            {meta.consultation_type && <span className="capitalize">{meta.consultation_type.replace('_', ' ')}</span>}
            {hasFee && <span>{parseFloat(meta.booking_fee!).toLocaleString()} XAF fee</span>}
          </div>
          <p className="text-neutral-600 text-xs mt-1">Submitted {formatDate(booking.created_at)}</p>
        </div>
        <svg className="w-4 h-4 text-neutral-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
        </svg>
      </div>
    </Link>
  )
}

export default function BookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all')

  useEffect(() => {
    const access = localStorage.getItem('access')
    if (!access) { router.push('/auth/login'); return }

    // Lawyers go to their own booking management page
    try {
      const payload = JSON.parse(atob(access.split('.')[1]))
      const lawyerRoles = new Set(['lawyer', 'firm_admin', 'firm-admin', 'partner', 'associate', 'managing_partner'])
      if (lawyerRoles.has(payload.role)) {
        router.replace('/lawyer/bookings')
        return
      }
    } catch { /* continue as client */ }

    const run = async () => {
      try {
        const data = await getMyCases(access)
        // Only show cases that originated as booking requests
        const bookingCases = data.results.filter(c => c.booking_status === 'pending' || c.booking_status === 'accepted' || c.booking_status === 'declined')
        setBookings(bookingCases)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load bookings')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [router])

  const filtered = activeTab === 'all' ? bookings : bookings.filter(b => b.booking_status === activeTab)
  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.booking_status === 'pending').length,
    accepted: bookings.filter(b => b.booking_status === 'accepted').length,
    declined: bookings.filter(b => b.booking_status === 'declined').length,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md text-neutral-50">My Bookings</h1>
          <p className="text-neutral-400 mt-1">Consultation requests you have submitted.</p>
        </div>
        <Link href="/discover"
          className="flex-shrink-0 px-4 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors">
          Book New
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-primary-800/40 border border-neutral-700/30 w-fit">
        {(['all', 'pending', 'accepted', 'declined'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30' : 'text-neutral-400 hover:text-neutral-200'}`}>
            {tab}
            {counts[tab] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                tab === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                tab === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' :
                'bg-neutral-700 text-neutral-300'
              }`}>{counts[tab]}</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-crimson-500/30 bg-crimson-900/10 p-4 text-crimson-300 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-primary-800/30 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-10 text-center space-y-3">
          <p className="text-neutral-400 text-sm">
            {activeTab === 'all' ? "You haven't submitted any booking requests yet." : `No ${activeTab} bookings.`}
          </p>
          {activeTab === 'all' && (
            <Link href="/discover" className="inline-block px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors">
              Find a Lawyer or Firm
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(b => <BookingRow key={b.id} booking={b} />)}
        </div>
      )}
    </div>
  )
}
