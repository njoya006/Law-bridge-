'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { api } from '../../../lib/api'
import { acceptBooking, declineBooking, STATUS_LABELS, CaseItem as Booking, BookingMeta } from '../../../lib/casesApi'
import { buildWorkflow, LAWYER_ACTIONS } from '../../../lib/workflow'
import { ClientCard, LawyerCard, FirmCard } from '../../../components/IdentityCards'

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

function getPortalRole(): 'lawyer' | 'client' {
  if (typeof window === 'undefined') return 'client'
  try { return localStorage.getItem('portalRole') === 'lawyer' ? 'lawyer' : 'client' } catch { return 'client' }
}

// ── Client view ────────────────────────────────────────────────────────────────

const CLIENT_STATUS: Record<string, { icon: string; color: string; bg: string; border: string; headline: string; sub: string; label: string }> = {
  pending: {
    icon: '⏳', label: 'Awaiting Acceptance',
    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30',
    headline: 'Your booking is under review',
    sub: 'The lawyer or firm will respond within 24–48 hours. You will be notified by email and in-app notification.',
  },
  accepted: {
    icon: '✅', label: 'Accepted',
    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30',
    headline: 'Booking accepted!',
    sub: 'Your consultation has been confirmed. The lawyer will contact you to finalize the details.',
  },
  declined: {
    icon: '❌', label: 'Declined',
    color: 'text-crimson-400', bg: 'bg-crimson-500/10', border: 'border-crimson-500/30',
    headline: 'Booking declined',
    sub: 'Unfortunately your booking was not accepted. If you paid a booking fee, a refund will be issued within 3–5 business days.',
  },
}

function ClientBookingDetail({ booking }: { booking: Booking }) {
  const meta = booking.booking_metadata ?? {}
  const status = booking.booking_status || 'pending'
  const cfg = CLIENT_STATUS[status] ?? CLIENT_STATUS.pending
  const consultFeeNum = parseFloat(meta.consultation_fee || meta.booking_fee || '0') || 0
  const procFeeNum = parseFloat(meta.procedural_fee || '0') || 0
  const profFee = meta.professional_fee || ''
  const totalFeeNum = consultFeeNum + procFeeNum
  const hasFee = totalFeeNum > 0
  const feeDisplay = hasFee ? `${totalFeeNum.toLocaleString()} XAF` : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/bookings" className="inline-flex items-center gap-2 text-neutral-400 hover:text-gold-400 text-sm transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        Back to My Bookings
      </Link>

      {/* Status Banner */}
      <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-6 text-center space-y-2`}>
        <div className="text-4xl">{cfg.icon}</div>
        <h1 className={`font-display text-display-xs ${cfg.color}`}>{cfg.headline}</h1>
        <p className="text-neutral-400 text-sm max-w-md mx-auto">{cfg.sub}</p>
        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{cfg.label}</span>
      </div>

      {/* Identity card — lawyer or firm depending on booking target */}
      {booking.assigned_lawyer_id ? (
        <LawyerCard lawyerUserId={booking.assigned_lawyer_id} fallbackName={meta.target_name} />
      ) : meta.target_type === 'firm' && meta.target_id ? (
        <FirmCard firmId={Number(meta.target_id)} fallbackName={meta.target_name} />
      ) : null}

      {/* Booking Details */}
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6 space-y-4">
        <h2 className="font-heading text-body-lg text-neutral-50">Booking Details</h2>
        <div className="space-y-3 text-sm">
          {([
            ['Booking ID', <span key="id" className="font-mono text-xs">{booking.id.slice(0, 8).toUpperCase()}…</span>],
            ['Title', booking.title],
            meta.target_name ? ['Booking with', meta.target_name] : null,
            booking.case_type ? ['Case type', booking.case_type] : null,
            meta.consultation_type ? ['Consultation', <span key="ct" className="capitalize">{meta.consultation_type.replace('_', ' ')}</span>] : null,
            meta.preferred_date ? ['Requested date', `${meta.preferred_date} at ${meta.preferred_time}`] : null,
            meta.location ? ['Location', meta.location] : null,
            meta.urgency ? ['Priority', <span key="urg" className={`capitalize ${meta.urgency === 'urgent' ? 'text-crimson-400 font-medium' : ''}`}>{meta.urgency}</span>] : null,
            ['Submitted', formatDate(booking.created_at)],
          ].filter(Boolean) as Array<[React.ReactNode, React.ReactNode]>).map(([label, value], i, arr) => (
            <div key={String(label)} className={`flex justify-between py-2 ${i < arr.length - 1 ? 'border-b border-neutral-700/20' : ''}`}>
              <span className="text-neutral-400">{label}</span>
              <span className="text-neutral-200 text-right max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment / Fee Breakdown */}
      {(hasFee || true) && (
        <div className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-6 space-y-3">
          <h2 className="font-heading text-body-lg text-gold-400">Fee Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b border-neutral-700/20">
              <span className="text-neutral-400">Consultation Fee <span className="text-amber-400 text-xs ml-1">compulsory</span></span>
              <span className="text-neutral-200 font-medium">{consultFeeNum > 0 ? `${consultFeeNum.toLocaleString()} XAF` : '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-700/20">
              <span className="text-neutral-400">Procedural Fee <span className="text-amber-400 text-xs ml-1">compulsory</span></span>
              <span className="text-neutral-200 font-medium">{procFeeNum > 0 ? `${procFeeNum.toLocaleString()} XAF` : '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-700/20">
              <span className="text-neutral-400">Professional Fee <span className="text-emerald-400 text-xs ml-1">negotiable</span></span>
              <span className="text-neutral-500 text-xs italic">{profFee ? `${parseFloat(profFee).toLocaleString()} XAF` : 'To be agreed'}</span>
            </div>
            {hasFee && <>
              <div className="flex justify-between py-1 border-b border-neutral-700/20">
                <span className="text-neutral-400">Total Paid Now</span>
                <span className="text-gold-300 font-bold">{feeDisplay}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-700/20">
                <span className="text-neutral-400">Method</span>
                <span className="text-neutral-200">{formatPaymentMethod(meta.payment_method)}</span>
              </div>
              {meta.payment_reference && <div className="flex justify-between py-1 border-b border-neutral-700/20">
                <span className="text-neutral-400">Reference</span>
                <span className="text-neutral-200 font-mono text-xs">{meta.payment_reference}</span>
              </div>}
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Payment Status</span>
                <span className={`capitalize font-medium ${meta.payment_status === 'verified' ? 'text-emerald-400' : meta.payment_status === 'pending_verification' ? 'text-amber-400' : 'text-neutral-400'}`}>
                  {meta.payment_status?.replace('_', ' ') ?? '—'}
                </span>
              </div>
            </>}
          </div>
          {status === 'declined' && hasFee && (
            <p className="mt-3 pt-3 border-t border-gold-500/20 text-sm text-amber-300">
              Your compulsory fees of <strong>{feeDisplay}</strong> will be refunded within 3–5 business days.
            </p>
          )}
        </div>
      )}

      {status === 'declined' && meta.decline_reason && (
        <div className="rounded-xl border border-crimson-500/20 bg-crimson-900/10 p-5">
          <p className="text-crimson-300 font-semibold text-sm mb-1">Reason for Decline</p>
          <p className="text-neutral-400 text-sm">{meta.decline_reason}</p>
        </div>
      )}

      {/* Case progress stepper — shown when booking is accepted */}
      {status === 'accepted' && (() => {
        const wf = booking.workflow ?? buildWorkflow(booking.case_type, booking.status)
        const stages = wf.stages
        const currentIdx = stages.indexOf(booking.status)
        const lang = booking.language === 'fr' ? 'fr' : 'en'
        const msg = lang === 'fr' ? wf.current_message.fr : wf.current_message.en
        return (
          <div className="rounded-xl border border-gold-500/20 bg-gradient-to-b from-gold-950/20 to-transparent p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse flex-shrink-0" />
              <p className="font-heading text-sm font-semibold text-gold-300">Case Progress</p>
            </div>

            {/* Stepper */}
            <div className="hidden sm:block relative px-1">
              <div className="absolute top-3.5 left-4 right-4 h-px bg-neutral-800" />
              {currentIdx > 0 && (
                <div
                  className="absolute top-3.5 left-4 h-px bg-gradient-to-r from-gold-500 to-gold-400"
                  style={{ width: `calc(${(currentIdx / Math.max(stages.length - 1, 1)) * 100}% - 0.5rem)` }}
                />
              )}
              <div className="relative flex justify-between">
                {stages.map((stage, idx) => {
                  const done   = idx < currentIdx
                  const active = idx === currentIdx
                  return (
                    <div key={stage} className="flex flex-col items-center gap-1.5" style={{ flex: '1 1 0', minWidth: 0 }}>
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 border transition-all
                        ${done   ? 'bg-gold-500 border-gold-400 text-black' : ''}
                        ${active ? 'bg-gold-500/20 border-gold-400 text-gold-200 shadow-[0_0_12px_rgba(234,179,8,0.3)]' : ''}
                        ${!done && !active ? 'bg-primary-900 border-neutral-700/40 text-neutral-600' : ''}
                      `}>
                        {done ? (
                          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : active ? (
                          <div className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-neutral-700" />
                        )}
                      </div>
                      <span className={`text-[10px] font-medium text-center leading-tight px-0.5
                        ${done ? 'text-gold-500/80' : active ? 'text-neutral-200' : 'text-neutral-600'}
                      `} style={{ maxWidth: '68px' }}>
                        {STATUS_LABELS[stage] ?? stage}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mobile list */}
            <div className="sm:hidden space-y-0.5">
              {stages.map((stage, idx) => {
                const done   = idx < currentIdx
                const active = idx === currentIdx
                if (!done && !active && idx > currentIdx + 1) return null
                return (
                  <div key={stage} className={`flex items-center gap-3 px-2 py-1.5 rounded-lg ${active ? 'bg-gold-500/10' : ''}`}>
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border
                      ${done ? 'bg-gold-500 border-gold-400 text-black' : active ? 'bg-gold-500/15 border-gold-400 text-gold-300' : 'bg-primary-900 border-neutral-700/40 text-neutral-600'}
                    `}>
                      {done ? '✓' : idx + 1}
                    </div>
                    <span className={`text-xs font-medium flex-1 ${done ? 'text-gold-500/80' : active ? 'text-neutral-200' : 'text-neutral-600'}`}>
                      {STATUS_LABELS[stage] ?? stage}
                    </span>
                    {active && <span className="text-[10px] font-semibold text-gold-400">Current</span>}
                  </div>
                )
              })}
            </div>

            {/* What this means */}
            <div className="rounded-xl border border-neutral-700/30 bg-primary-900/40 p-4 space-y-2.5">
              <p className="text-sm font-semibold text-neutral-100">{msg.headline}</p>
              <p className="text-sm text-neutral-400 leading-relaxed">{msg.detail}</p>
              {msg.next && (
                <div className="flex gap-2 pt-2 border-t border-neutral-800/60">
                  <div className="flex-shrink-0 mt-0.5 h-4 w-4 rounded-full bg-gold-500/15 border border-gold-400/30 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wide font-semibold mb-0.5">What happens next</p>
                    <p className="text-xs text-neutral-300">{msg.next}</p>
                  </div>
                </div>
              )}
              {msg.estimate && (
                <p className="text-[11px] text-neutral-600 italic pt-1 border-t border-neutral-800/40">{msg.estimate}</p>
              )}
            </div>

            <Link
              href={`/cases/${booking.id}`}
              className="flex items-center justify-between w-full rounded-xl border border-gold-400/25 bg-gold-500/5 px-4 py-3 hover:border-gold-400/50 hover:bg-gold-500/10 transition-all"
            >
              <span className="text-sm font-medium text-gold-300">Track full case progress</span>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gold-400 flex-shrink-0">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        )
      })()}

      {/* Next Steps — pending/declined only */}
      {status !== 'accepted' && (
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6 space-y-3">
          <h2 className="font-heading text-body-lg text-neutral-50">Next Steps</h2>
          {status === 'pending' && [
            'Wait for the lawyer / firm to review your request (usually within 24–48 hours).',
            'You will receive an email and in-app notification when there is a response.',
            'Check back on this page to see the updated status anytime.',
          ].map((t, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
              <span className="text-neutral-400">{t}</span>
            </div>
          ))}
          {status === 'declined' && [
            hasFee ? `Your booking fee of ${feeDisplay} will be refunded within 3–5 business days.` : 'No payment was made, so no refund is needed.',
            'Browse other lawyers or firms on the Discover page who may be a better fit.',
            'If you believe this was an error, contact support for assistance.',
          ].map((t, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="h-5 w-5 rounded-full bg-neutral-700/60 text-neutral-400 text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
              <span className="text-neutral-400">{t}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {status === 'accepted' && (() => {
          const params = new URLSearchParams({
            case_id: booking.id,
            case_title: booking.title || `Case ${booking.id.slice(0, 8)}`,
          })
          if (booking.assigned_lawyer_id) params.set('other_id', booking.assigned_lawyer_id)
          if (meta.target_name) params.set('other_name', meta.target_name)
          params.set('other_role', 'lawyer')
          return (
            <Link
              href={`/messages?${params.toString()}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              Message Lawyer
            </Link>
          )
        })()}
        {status === 'declined' && (
          <Link href="/discover" className="flex-1 text-center px-4 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors">
            Find Another Lawyer
          </Link>
        )}
        <Link href="/bookings" className={`${status === 'accepted' || status === 'declined' ? 'flex-none' : 'flex-1'} text-center px-4 py-2.5 rounded-lg border border-neutral-600 text-neutral-300 text-sm hover:border-gold-500/50 hover:text-gold-400 transition-colors`}>
          Back to My Bookings
        </Link>
      </div>
    </div>
  )
}

// ── Lawyer view ────────────────────────────────────────────────────────────────

function LawyerBookingDetail({ booking, onUpdate }: { booking: Booking; onUpdate: (b: Booking) => void }) {
  const meta = booking.booking_metadata ?? {}
  const status = booking.booking_status || 'pending'
  const isPending = status === 'pending'
  const consultFeeNum = parseFloat(meta.consultation_fee || meta.booking_fee || '0') || 0
  const procFeeNum = parseFloat(meta.procedural_fee || '0') || 0
  const profFee = meta.professional_fee || ''
  const totalFeeNum = consultFeeNum + procFeeNum
  const hasFee = totalFeeNum > 0
  const feeDisplay = hasFee ? `${totalFeeNum.toLocaleString()} XAF` : null

  const [declining, setDeclining] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [actionLoading, setActionLoading] = useState<'accept' | 'decline' | null>(null)
  const [actionError, setActionError] = useState('')

  const handleAccept = async () => {
    const access = localStorage.getItem('access')
    if (!access) return
    setActionLoading('accept')
    setActionError('')
    try {
      const updated = await acceptBooking(booking.id, access)
      onUpdate(updated)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to accept booking')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async () => {
    const access = localStorage.getItem('access')
    if (!access) return
    setActionLoading('decline')
    setActionError('')
    try {
      const updated = await declineBooking(booking.id, declineReason, access)
      onUpdate(updated)
      setDeclining(false)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed to decline booking')
    } finally {
      setActionLoading(null)
    }
  }

  const statusBanner = status === 'pending'
    ? { icon: '📋', text: 'Pending your response', sub: 'Review the client\'s request and respond below.', cls: 'border-amber-500/30 bg-amber-500/5 text-amber-400' }
    : status === 'accepted'
    ? { icon: '✅', text: 'You accepted this booking', sub: 'Contact the client to confirm the consultation details.', cls: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' }
    : { icon: '✕', text: 'You declined this booking', sub: meta.decline_reason ? `Reason: ${meta.decline_reason}` : 'This request was declined.', cls: 'border-neutral-600/40 bg-neutral-800/30 text-neutral-400' }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/lawyer/bookings" className="inline-flex items-center gap-2 text-neutral-400 hover:text-gold-400 text-sm transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        Back to Booking Requests
      </Link>

      {/* Status Banner */}
      <div className={`rounded-xl border p-5 flex items-start gap-4 ${statusBanner.cls}`}>
        <span className="text-3xl flex-shrink-0">{statusBanner.icon}</span>
        <div>
          <p className="font-heading font-semibold text-base">{statusBanner.text}</p>
          <p className="text-neutral-400 text-sm mt-0.5">{statusBanner.sub}</p>
        </div>
      </div>

      {/* Client identity card */}
      <ClientCard clientId={booking.client_id} clientEmail={meta.client_email} />

      {/* Client's Request */}
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6 space-y-4">
        <h2 className="font-heading text-body-lg text-neutral-50">Client Request</h2>
        <div className="space-y-3 text-sm">
          {([
            ['Booking ID', <span key="id" className="font-mono text-xs">{booking.id.slice(0, 8).toUpperCase()}…</span>],
            booking.title ? ['Title', booking.title] : null,
            booking.case_type ? ['Case type', booking.case_type] : null,
            meta.consultation_type ? ['Consultation type', <span key="ct" className="capitalize">{meta.consultation_type.replace('_', ' ')}</span>] : null,
            meta.preferred_date ? ['Requested date', `${meta.preferred_date}${meta.preferred_time ? ` at ${meta.preferred_time}` : ''}`] : null,
            meta.location ? ['Location', meta.location] : null,
            meta.virtual_link ? ['Virtual link', meta.virtual_link] : null,
            meta.urgency ? ['Priority', <span key="urg" className={`capitalize font-medium ${meta.urgency === 'urgent' ? 'text-crimson-400' : 'text-neutral-200'}`}>{meta.urgency}</span>] : null,
            meta.client_email ? ['Client email', <a key="em" href={`mailto:${meta.client_email}`} className="text-gold-400 hover:underline">{meta.client_email}</a>] : null,
            ['Submitted', formatDate(booking.created_at)],
          ].filter(Boolean) as Array<[React.ReactNode, React.ReactNode]>).map(([label, value], i, arr) => (
            <div key={String(label)} className={`flex justify-between py-2 ${i < arr.length - 1 ? 'border-b border-neutral-700/20' : ''}`}>
              <span className="text-neutral-400 flex-shrink-0">{label}</span>
              <span className="text-neutral-200 text-right ml-4 max-w-[60%]">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Case description */}
      {booking.description && (
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
          <h2 className="font-heading text-body-lg text-neutral-50 mb-3">Case Description</h2>
          <p className="text-sm text-neutral-300 leading-relaxed">{booking.description}</p>
        </div>
      )}

      {/* Fee Breakdown (lawyer sees for verification) */}
      <div className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-6 space-y-3">
        <h2 className="font-heading text-body-lg text-gold-400">Fee Breakdown</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-neutral-700/20">
            <span className="text-neutral-400">Consultation Fee <span className="text-amber-400 text-xs ml-1">compulsory</span></span>
            <span className="text-neutral-200 font-medium">{consultFeeNum > 0 ? `${consultFeeNum.toLocaleString()} XAF` : '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-700/20">
            <span className="text-neutral-400">Procedural Fee <span className="text-amber-400 text-xs ml-1">compulsory</span></span>
            <span className="text-neutral-200 font-medium">{procFeeNum > 0 ? `${procFeeNum.toLocaleString()} XAF` : '—'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-neutral-700/20">
            <span className="text-neutral-400">Professional Fee <span className="text-emerald-400 text-xs ml-1">negotiable</span></span>
            <span className="text-neutral-500 text-xs italic">{profFee ? `${parseFloat(profFee).toLocaleString()} XAF` : 'To be agreed'}</span>
          </div>
          {hasFee && <>
            <div className="flex justify-between py-1 border-b border-neutral-700/20">
              <span className="text-neutral-400">Total Received</span>
              <span className="text-gold-300 font-bold">{feeDisplay}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-neutral-700/20">
              <span className="text-neutral-400">Payment Method</span>
              <span className="text-neutral-200">{formatPaymentMethod(meta.payment_method)}</span>
            </div>
            {meta.payment_reference && <div className="flex justify-between py-1 border-b border-neutral-700/20">
              <span className="text-neutral-400">Transaction Ref</span>
              <span className="text-neutral-200 font-mono text-xs">{meta.payment_reference}</span>
            </div>}
            <div className="flex justify-between py-1">
              <span className="text-neutral-400">Payment Status</span>
              <span className={`capitalize font-medium ${meta.payment_status === 'verified' ? 'text-emerald-400' : meta.payment_status === 'pending_verification' ? 'text-amber-400' : 'text-neutral-400'}`}>
                {meta.payment_status?.replace('_', ' ') ?? '—'}
              </span>
            </div>
          </>}
        </div>
      </div>

      {/* Accept / Decline actions */}
      {isPending && (
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6 space-y-4">
          <h2 className="font-heading text-body-lg text-neutral-50">Respond to Request</h2>

          {actionError && (
            <div className="rounded-lg border border-crimson-500/30 bg-crimson-900/10 p-3 text-crimson-300 text-sm">{actionError}</div>
          )}

          {!declining ? (
            <div className="flex gap-3">
              <button onClick={handleAccept} disabled={actionLoading !== null}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors disabled:opacity-50">
                {actionLoading === 'accept'
                  ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  : '✓'} Accept Booking
              </button>
              <button onClick={() => setDeclining(true)} disabled={actionLoading !== null}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-crimson-500/40 text-crimson-300 text-sm hover:bg-crimson-500/10 transition-colors disabled:opacity-50">
                ✕ Decline
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-1.5">Reason for declining (optional)</label>
                <textarea value={declineReason} onChange={e => setDeclineReason(e.target.value)} rows={3}
                  placeholder="e.g. Conflict of interest, at capacity, outside area of expertise…"
                  className="w-full rounded-lg px-3 py-2.5 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-crimson-500/50 placeholder:text-neutral-600 text-sm resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleDecline} disabled={actionLoading !== null}
                  className="px-5 py-2.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                  {actionLoading === 'decline'
                    ? <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full inline-block" />
                    : 'Confirm Decline'}
                </button>
                <button onClick={() => { setDeclining(false); setDeclineReason('') }}
                  className="px-4 py-2.5 rounded-lg border border-neutral-600 text-neutral-400 text-sm hover:text-neutral-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manage case — shown when accepted */}
      {status === 'accepted' && (
        <div className="rounded-xl border border-gold-500/20 bg-gradient-to-b from-gold-950/20 to-transparent p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse flex-shrink-0" />
            <p className="font-heading text-sm font-semibold text-gold-300">Case Management</p>
          </div>

          {/* Mini workflow preview */}
          {(() => {
            const wf = booking.workflow ?? buildWorkflow(booking.case_type, booking.status)
            const nextStatus = wf.next_status
            const stages = wf.stages
            const currentIdx = stages.indexOf(booking.status)
            const currentAction = LAWYER_ACTIONS[booking.status]
            const nextAction = nextStatus ? LAWYER_ACTIONS[nextStatus] : null
            const nextClientMsg = nextStatus ? wf.transition_previews[nextStatus] : null
            return (
              <div className="space-y-3">
                {/* Stage card */}
                <div className="rounded-xl border border-neutral-700/30 bg-primary-900/50 divide-y divide-neutral-800/60">
                  {/* Current */}
                  <div className="px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500 uppercase tracking-wide font-semibold">Your current stage</span>
                      <span className="text-xs font-semibold text-neutral-200">{STATUS_LABELS[booking.status] ?? booking.status}</span>
                    </div>
                    {currentAction && (
                      <p className="text-xs text-neutral-400 leading-relaxed">{currentAction}</p>
                    )}
                  </div>

                  {/* Suggested next */}
                  {nextStatus && (
                    <div className="px-4 py-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gold-500/80 uppercase tracking-wide font-semibold">Recommended next step</span>
                        <span className="text-xs font-semibold text-gold-300">{STATUS_LABELS[nextStatus] ?? nextStatus}</span>
                      </div>
                      {nextAction && (
                        <p className="text-xs text-neutral-400 leading-relaxed">{nextAction}</p>
                      )}
                      {/* Client notification preview — clearly labelled */}
                      {nextClientMsg && (
                        <div className="mt-2 rounded-lg border border-neutral-700/40 bg-neutral-800/30 px-3 py-2">
                          <p className="text-[10px] text-neutral-600 uppercase tracking-wide font-semibold mb-0.5">
                            Client will be notified
                          </p>
                          <p className="text-[11px] text-neutral-500 italic">"{nextClientMsg.headline}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress bar */}
                  {currentIdx >= 0 && (
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between text-[10px] text-neutral-600 mb-1.5">
                        <span>Case progress</span>
                        <span>{currentIdx + 1} of {stages.length} stages</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-800">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all"
                          style={{ width: `${Math.round(((currentIdx + 1) / stages.length) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  href={`/cases/${booking.id}`}
                  className="flex items-center justify-between w-full rounded-xl border border-gold-400/30 bg-gold-500/5 px-4 py-3.5 hover:border-gold-400/60 hover:bg-gold-500/10 transition-all"
                >
                  <div>
                    <p className="text-sm font-semibold text-gold-300">Open Case Manager</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Update status, add notes, track full timeline</p>
                  </div>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gold-400 flex-shrink-0">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )
          })()}

          {[
            `Contact ${meta.client_email ?? 'the client'} to confirm the consultation time and location.`,
            meta.preferred_date ? `Client requested ${meta.preferred_date}${meta.preferred_time ? ` at ${meta.preferred_time}` : ''}. Confirm or propose an alternative.` : 'Agree on a meeting time with the client.',
            'After the consultation, open the Case Manager above to advance the case status.',
          ].map((t, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="h-5 w-5 rounded-full bg-gold-500/15 text-gold-400 text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
              <span className="text-neutral-400">{t}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {status === 'accepted' && (() => {
          const clientUserId = booking.client_id || ''
          const clientName = meta.client_email?.split('@')[0]?.replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Client'
          const msgParams = new URLSearchParams({
            case_id: booking.id,
            case_title: booking.title || `Case ${booking.id.slice(0, 8)}`,
            other_role: 'client',
          })
          if (clientUserId) msgParams.set('other_id', clientUserId)
          if (clientName) msgParams.set('other_name', clientName)
          return (
            <Link
              href={`/messages?${msgParams.toString()}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
              Message Client
            </Link>
          )
        })()}
        <Link href="/lawyer/bookings"
          className={`${status === 'accepted' ? 'flex-none' : 'flex-1'} text-center px-4 py-2.5 rounded-lg border border-neutral-600 text-neutral-300 text-sm hover:border-gold-500/50 hover:text-gold-400 transition-colors`}>
          Back to Booking Requests
        </Link>
      </div>
    </div>
  )
}

// ── Page shell ─────────────────────────────────────────────────────────────────

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [portalRole, setPortalRole] = useState<'lawyer' | 'client'>('client')

  useEffect(() => {
    setPortalRole(getPortalRole())
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
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="h-40 rounded-xl skeleton" />
      <div className="h-64 rounded-xl skeleton" />
    </div>
  )

  if (error || !booking) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 p-6 text-crimson-300">{error || 'Booking not found.'}</div>
      <Link href={portalRole === 'lawyer' ? '/lawyer/bookings' : '/bookings'}
        className="inline-block text-gold-400 hover:text-gold-300 text-sm">← Go back</Link>
    </div>
  )

  if (portalRole === 'lawyer') {
    return <LawyerBookingDetail booking={booking} onUpdate={setBooking} />
  }

  return <ClientBookingDetail booking={booking} />
}
