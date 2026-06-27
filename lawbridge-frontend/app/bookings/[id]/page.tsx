'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api } from '../../../lib/api'

type BookingStatus = 'pending' | 'accepted' | 'declined' | ''

interface BookingMeta {
  target_type?: 'lawyer' | 'firm'
  target_name?: string
  consultation_type?: string
  booking_fee?: string
  payment_method?: string
  payment_reference?: string
  payment_status?: string
  preferred_date?: string
  preferred_time?: string
  location?: string
  virtual_link?: string
  urgency?: string
  decline_reason?: string
}

interface Booking {
  id: string
  title: string
  description: string
  case_type: string
  status: string
  booking_status: BookingStatus
  booking_metadata: BookingMeta
  created_at: string
  updated_at: string
}

const STATUS_CONFIG: Record<string, {
  icon: string
  label: string
  color: string
  bg: string
  border: string
  headline: string
  sub: string
}> = {
  pending: {
    icon: '⏳',
    label: 'Awaiting Acceptance',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    headline: 'Your booking is under review',
    sub: 'The lawyer or firm will respond within 24–48 hours. You will be notified by email and in-app notification.',
  },
  accepted: {
    icon: '✅',
    label: 'Accepted',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    headline: 'Booking accepted!',
    sub: 'Your consultation has been confirmed. The lawyer will contact you to finalize the details.',
  },
  declined: {
    icon: '❌',
    label: 'Declined',
    color: 'text-crimson-400',
    bg: 'bg-crimson-500/10',
    border: 'border-crimson-500/30',
    headline: 'Booking declined',
    sub: 'Unfortunately your booking was not accepted. If you paid a booking fee, a refund will be issued within 3–5 business days.',
  },
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return iso }
}

function formatPaymentMethod(val?: string) {
  const map: Record<string, string> = {
    mtn_momo: 'MTN Mobile Money',
    orange_money: 'Orange Money',
    bank_transfer: 'Bank Transfer',
  }
  return val ? (map[val] ?? val) : '—'
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { router.push('/auth/login'); return }
      try {
        const data = await api.get<Booking>('case', `/cases/${params.id}/`, access)
        setBooking(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Booking not found')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) void run()
  }, [params.id, router])

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      <div className="h-40 rounded-xl bg-primary-800/30" />
      <div className="h-64 rounded-xl bg-primary-800/30" />
    </div>
  )

  if (error || !booking) return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 p-6 text-crimson-300">{error || 'Booking not found.'}</div>
      <Link href="/dashboard" className="mt-4 inline-block text-gold-400 hover:text-gold-300">← Back to Dashboard</Link>
    </div>
  )

  const meta = booking.booking_metadata ?? {}
  const status = booking.booking_status || 'pending'
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const hasFee = Boolean(meta.booking_fee && parseFloat(meta.booking_fee) > 0)
  const feeDisplay = hasFee ? `${parseFloat(meta.booking_fee!).toLocaleString()} XAF` : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-neutral-400 hover:text-gold-400 text-sm transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        Back to Dashboard
      </Link>

      {/* Status Banner */}
      <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-6 text-center space-y-2`}>
        <div className="text-4xl">{cfg.icon}</div>
        <h1 className={`font-display text-display-xs ${cfg.color}`}>{cfg.headline}</h1>
        <p className="text-neutral-400 text-sm max-w-md mx-auto">{cfg.sub}</p>
        <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
          {cfg.label}
        </div>
      </div>

      {/* Booking Details */}
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6 space-y-4">
        <h2 className="font-heading text-body-lg text-neutral-50">Booking Details</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-neutral-700/20">
            <span className="text-neutral-400">Booking ID</span>
            <span className="text-neutral-200 font-mono text-xs">{booking.id.slice(0, 8).toUpperCase()}…</span>
          </div>
          <div className="flex justify-between py-2 border-b border-neutral-700/20">
            <span className="text-neutral-400">Title</span>
            <span className="text-neutral-200 text-right max-w-[60%]">{booking.title}</span>
          </div>
          {meta.target_name && (
            <div className="flex justify-between py-2 border-b border-neutral-700/20">
              <span className="text-neutral-400">Booking with</span>
              <span className="text-neutral-200">{meta.target_name}</span>
            </div>
          )}
          {booking.case_type && (
            <div className="flex justify-between py-2 border-b border-neutral-700/20">
              <span className="text-neutral-400">Case type</span>
              <span className="text-neutral-200">{booking.case_type}</span>
            </div>
          )}
          {meta.consultation_type && (
            <div className="flex justify-between py-2 border-b border-neutral-700/20">
              <span className="text-neutral-400">Consultation</span>
              <span className="text-neutral-200 capitalize">{meta.consultation_type.replace('_', ' ')}</span>
            </div>
          )}
          {meta.preferred_date && (
            <div className="flex justify-between py-2 border-b border-neutral-700/20">
              <span className="text-neutral-400">Requested date</span>
              <span className="text-neutral-200">{meta.preferred_date} at {meta.preferred_time}</span>
            </div>
          )}
          {meta.location && (
            <div className="flex justify-between py-2 border-b border-neutral-700/20">
              <span className="text-neutral-400">Location</span>
              <span className="text-neutral-200">{meta.location}</span>
            </div>
          )}
          {meta.urgency && (
            <div className="flex justify-between py-2 border-b border-neutral-700/20">
              <span className="text-neutral-400">Priority</span>
              <span className={`capitalize ${meta.urgency === 'urgent' ? 'text-crimson-400 font-medium' : 'text-neutral-300'}`}>{meta.urgency}</span>
            </div>
          )}
          <div className="flex justify-between py-2">
            <span className="text-neutral-400">Submitted</span>
            <span className="text-neutral-200">{formatDate(booking.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Payment Proof */}
      {hasFee && (
        <div className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-6 space-y-3">
          <h2 className="font-heading text-body-lg text-gold-400">Payment Record</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Booking fee</span>
              <span className="text-gold-300 font-semibold">{feeDisplay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Method</span>
              <span className="text-neutral-200">{formatPaymentMethod(meta.payment_method)}</span>
            </div>
            {meta.payment_reference && (
              <div className="flex justify-between">
                <span className="text-neutral-400">Reference</span>
                <span className="text-neutral-200 font-mono text-xs">{meta.payment_reference}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-400">Payment status</span>
              <span className={`capitalize font-medium ${
                meta.payment_status === 'verified' ? 'text-emerald-400' :
                meta.payment_status === 'pending_verification' ? 'text-amber-400' :
                'text-neutral-400'
              }`}>{meta.payment_status?.replace('_', ' ') ?? '—'}</span>
            </div>
          </div>
          {status === 'declined' && (
            <div className="mt-3 pt-3 border-t border-gold-500/20 text-sm text-amber-300">
              Your booking fee of <strong>{feeDisplay}</strong> will be refunded to your original payment method within 3–5 business days. Contact support if you do not receive it.
            </div>
          )}
        </div>
      )}

      {/* Decline reason */}
      {status === 'declined' && meta.decline_reason && (
        <div className="rounded-xl border border-crimson-500/20 bg-crimson-900/10 p-5">
          <h3 className="text-crimson-300 font-semibold text-sm mb-2">Reason for Decline</h3>
          <p className="text-neutral-400 text-sm">{meta.decline_reason}</p>
        </div>
      )}

      {/* Next Steps */}
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6 space-y-3">
        <h2 className="font-heading text-body-lg text-neutral-50">Next Steps</h2>
        {status === 'pending' && (
          <div className="space-y-3">
            {[
              { n: 1, text: 'Wait for the lawyer/firm to review your request (usually within 24–48 hours).' },
              { n: 2, text: 'You will receive an email and in-app notification when there is a response.' },
              { n: 3, text: 'Check back on this page to see the updated status anytime.' },
            ].map(s => (
              <div key={s.n} className="flex gap-3 text-sm">
                <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center flex-shrink-0 font-bold">{s.n}</span>
                <span className="text-neutral-400">{s.text}</span>
              </div>
            ))}
          </div>
        )}
        {status === 'accepted' && (
          <div className="space-y-3">
            {[
              { n: 1, text: `Expect a message from ${meta.target_name ?? 'the lawyer/firm'} to confirm the consultation time and location.` },
              { n: 2, text: 'Prepare relevant documents, contracts, or evidence related to your case.' },
              { n: 3, text: 'Attend your consultation at the agreed time. In-person: arrive 10 minutes early.' },
              { n: 4, text: 'After the consultation, you can leave a rating and review on Lawbridge.' },
            ].map(s => (
              <div key={s.n} className="flex gap-3 text-sm">
                <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center flex-shrink-0 font-bold">{s.n}</span>
                <span className="text-neutral-400">{s.text}</span>
              </div>
            ))}
          </div>
        )}
        {status === 'declined' && (
          <div className="space-y-3">
            {[
              { n: 1, text: hasFee ? `Your booking fee of ${feeDisplay} will be refunded within 3–5 business days.` : 'No payment was made, so no refund is needed.' },
              { n: 2, text: 'Browse other lawyers or firms on the Discover page who may be a better fit.' },
              { n: 3, text: 'If you believe this was an error, contact support for assistance.' },
            ].map(s => (
              <div key={s.n} className="flex gap-3 text-sm">
                <span className="h-5 w-5 rounded-full bg-neutral-700/60 text-neutral-400 text-xs flex items-center justify-center flex-shrink-0 font-bold">{s.n}</span>
                <span className="text-neutral-400">{s.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {status === 'declined' && (
          <Link href="/discover" className="flex-1 text-center px-4 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors">
            Find Another Lawyer
          </Link>
        )}
        <Link href="/dashboard" className={`${status === 'declined' ? 'flex-none' : 'flex-1'} text-center px-4 py-2.5 rounded-lg border border-neutral-600 text-neutral-300 text-sm hover:border-gold-500/50 hover:text-gold-400 transition-colors`}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
