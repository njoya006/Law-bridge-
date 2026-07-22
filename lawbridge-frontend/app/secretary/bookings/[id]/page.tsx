'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getCaseDetail, verifyPayment, STATUS_LABELS, type CaseItem } from '../../../../lib/casesApi'
import { toastError, toastSuccess } from '../../../../lib/toast'
import { Badge } from '../../../../components/ui/Badge'
import { CollapseIcon, ExpandIcon, CheckIcon, XCircleIcon } from '../../../../components/icons/Icons'

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return iso }
}
function formatCurrency(v: number) {
  return v > 0 ? `${v.toLocaleString()} XAF` : '—'
}
function paymentMethodLabel(v?: string) {
  const m: Record<string, string> = { mtn_momo: 'MTN Mobile Money', orange_money: 'Orange Money', bank_transfer: 'Bank Transfer' }
  return v ? (m[v] ?? v) : '—'
}

function BookingStatusBadge({ status }: { status: string }) {
  const variant = status === 'pending' ? 'warning' : status === 'accepted' ? 'success' : status === 'declined' ? 'danger' : 'neutral'
  return (
    <Badge variant={variant} size="md" className="capitalize">
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'pending' ? 'bg-amber-400 animate-pulse' : status === 'accepted' ? 'bg-emerald-400' : 'bg-crimson-400'}`} />
      {status}
    </Badge>
  )
}

function PaymentStatusBadge({ status }: { status?: string }) {
  if (!status || status === 'none') return <Badge variant="neutral" size="md">No payment</Badge>
  const cfg: Record<string, { label: string; variant: 'warning' | 'success' | 'danger' }> = {
    pending_verification: { label: 'Pending verification', variant: 'warning' },
    verified: { label: 'Payment verified', variant: 'success' },
    rejected: { label: 'Payment rejected', variant: 'danger' },
  }
  const c = cfg[status]
  return <Badge variant={c?.variant ?? 'neutral'} size="md">{c?.label ?? status}</Badge>
}

function InfoRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-white/5 last:border-0">
      <p className="text-[11px] uppercase tracking-widest text-neutral-600 w-36 flex-shrink-0 mt-0.5">{label}</p>
      <p className={`text-sm text-neutral-200 flex-1 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/30 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/6 bg-primary-800/20">
        <p className="text-[11px] uppercase tracking-widest text-neutral-500 font-semibold">{title}</p>
      </div>
      <div className="px-6 py-1">{children}</div>
    </div>
  )
}

export default function SecretaryBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [booking, setBooking] = useState<CaseItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioning, setActioning] = useState<string | null>(null)

  useEffect(() => {
    const access = localStorage.getItem('access')
    if (!access || !id) { setError('Not authenticated'); setLoading(false); return }
    getCaseDetail(id, access)
      .then(data => setBooking(data))
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load booking'))
      .finally(() => setLoading(false))
  }, [id])

  async function handlePaymentAction(action: 'verify' | 'reject') {
    if (!booking) return
    const access = localStorage.getItem('access')
    if (!access) return
    setActioning(action)
    try {
      await verifyPayment(booking.id, action, access)
      setBooking(prev => {
        if (!prev) return prev
        const meta = { ...prev.booking_metadata, payment_status: action === 'verify' ? 'verified' : 'rejected' }
        return { ...prev, booking_metadata: meta }
      })
      toastSuccess(action === 'verify' ? 'Payment verified successfully' : 'Payment rejected')
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Action failed', 'Error')
    } finally {
      setActioning(null)
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <div className="h-6 w-48 rounded bg-white/8 animate-pulse" />
      <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl border border-white/8 bg-primary-800/30 p-6 space-y-4">
          <div className="h-3 w-28 rounded bg-white/5 animate-pulse" />
          {[1, 2, 3].map(j => (
            <div key={j} className="flex items-center gap-4 py-2">
              <div className="h-3 w-28 rounded bg-white/5 animate-pulse" />
              <div className="h-3 flex-1 rounded bg-white/4 animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )

  if (error) return (
    <div className="space-y-6">
      <Link href="/secretary/bookings" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-100 transition-colors">
        <CollapseIcon width={14} height={14} />
        All Bookings
      </Link>
      <div className="rounded-2xl border border-crimson-500/30 bg-crimson-500/8 px-5 py-5">
        <p className="text-crimson-300 text-sm">{error}</p>
      </div>
    </div>
  )

  if (!booking) return null

  const meta = booking.booking_metadata ?? {}
  const consultFee = parseFloat(meta.consultation_fee || meta.booking_fee || '0') || 0
  const procFee    = parseFloat(meta.procedural_fee || '0') || 0
  const profFee    = parseFloat(meta.professional_fee || '0') || 0
  const totalDue   = consultFee + procFee
  const payStatus  = meta.payment_status || 'none'
  const caseStatus = STATUS_LABELS[booking.status] ?? booking.status

  return (
    <div className="space-y-6 pb-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/secretary/bookings" className="text-neutral-500 hover:text-neutral-200 transition-colors flex items-center gap-1.5">
          <CollapseIcon width={13} height={13} />
          Bookings
        </Link>
        <ExpandIcon width={12} height={12} className="text-neutral-700" />
        <span className="text-neutral-400 truncate max-w-xs">{booking.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-neutral-50 leading-tight">{booking.title}</h1>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <BookingStatusBadge status={booking.booking_status ?? 'pending'} />
            <PaymentStatusBadge status={payStatus} />
            {booking.case_type && (
              <span className="text-xs px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-neutral-400 capitalize">
                {booking.case_type.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
        {/* Payment action buttons shown prominently in header if pending */}
        {payStatus === 'pending_verification' && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => void handlePaymentAction('reject')}
              disabled={actioning !== null}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-crimson-500/30 text-crimson-400 text-sm font-semibold hover:bg-crimson-500/10 disabled:opacity-50 transition-colors"
            >
              {actioning === 'reject' ? 'Rejecting…' : <><XCircleIcon width={14} height={14} />Reject Payment</>}
            </button>
            <button
              onClick={() => void handlePaymentAction('verify')}
              disabled={actioning !== null}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
            >
              {actioning === 'verify' ? 'Verifying…' : <><CheckIcon width={14} height={14} />Verify Payment</>}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fee summary tiles */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-[10px] uppercase tracking-widest text-amber-500/70 font-semibold mb-1">Consultation Fee</p>
          <p className="text-xl font-bold text-amber-300">{formatCurrency(consultFee)}</p>
          <p className="text-[11px] text-neutral-500 mt-1">Compulsory</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-[10px] uppercase tracking-widest text-amber-500/70 font-semibold mb-1">Procedural Fee</p>
          <p className="text-xl font-bold text-amber-300">{formatCurrency(procFee)}</p>
          <p className="text-[11px] text-neutral-500 mt-1">Compulsory</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <p className="text-[10px] uppercase tracking-widest text-emerald-500/70 font-semibold mb-1">Total Due Now</p>
          <p className="text-xl font-bold text-emerald-300">{formatCurrency(totalDue)}</p>
          {profFee > 0 && <p className="text-[11px] text-neutral-500 mt-1">+ {formatCurrency(profFee)} professional fee (negotiated)</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Payment details */}
        <Section title="Payment Information">
          <InfoRow label="Status" value={
            payStatus === 'pending_verification' ? 'Pending Verification' :
            payStatus === 'verified' ? 'Verified' :
            payStatus === 'rejected' ? 'Rejected' : 'No Payment'
          } />
          <InfoRow label="Method" value={paymentMethodLabel(meta.payment_method)} />
          <InfoRow label="Reference" value={meta.payment_reference} mono />
          <InfoRow label="Consultation" value={consultFee > 0 ? formatCurrency(consultFee) : undefined} />
          <InfoRow label="Procedural" value={procFee > 0 ? formatCurrency(procFee) : undefined} />
          <InfoRow label="Professional" value={profFee > 0 ? `${formatCurrency(profFee)} (agreed separately)` : 'Negotiated after acceptance'} />
          {payStatus === 'pending_verification' && (
            <div className="py-3 flex gap-2">
              <button
                onClick={() => void handlePaymentAction('reject')}
                disabled={actioning !== null}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-crimson-500/30 text-crimson-400 text-sm font-semibold hover:bg-crimson-500/10 disabled:opacity-50 transition-colors"
              >
                {actioning === 'reject' ? 'Rejecting…' : <><XCircleIcon width={14} height={14} />Reject</>}
              </button>
              <button
                onClick={() => void handlePaymentAction('verify')}
                disabled={actioning !== null}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 text-black text-sm font-semibold hover:bg-emerald-400 disabled:opacity-50 transition-colors"
              >
                {actioning === 'verify' ? 'Verifying…' : <><CheckIcon width={14} height={14} />Verify</>}
              </button>
            </div>
          )}
          {payStatus === 'verified' && (
            <div className="py-3">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-4 py-3">
                <CheckIcon width={14} height={14} className="text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-300 font-medium">Payment has been verified</p>
              </div>
            </div>
          )}
          {payStatus === 'rejected' && (
            <div className="py-3">
              <div className="flex items-center gap-2 rounded-xl bg-crimson-500/8 border border-crimson-500/20 px-4 py-3">
                <XCircleIcon width={14} height={14} className="text-crimson-400 flex-shrink-0" />
                <p className="text-sm text-crimson-300 font-medium">Payment was rejected</p>
              </div>
            </div>
          )}
        </Section>

        {/* Client information */}
        <Section title="Client Information">
          <InfoRow label="Email" value={meta.client_email} />
          <InfoRow label="Preferred Date" value={meta.preferred_date ? formatDate(meta.preferred_date) : undefined} />
          <InfoRow label="Consultation Type" value={meta.consultation_type?.replace(/_/g, ' ')} />
          <InfoRow label="Urgency" value={meta.urgency} />
          <InfoRow label="Language" value={booking.language} />
        </Section>

        {/* Case / Booking details */}
        <Section title="Case Details">
          <InfoRow label="Case ID" value={booking.id} mono />
          <InfoRow label="Case Type" value={booking.case_type?.replace(/_/g, ' ')} />
          <InfoRow label="Circuit" value={booking.circuit} />
          <InfoRow label="Legal Tradition" value={booking.legal_tradition} />
          <InfoRow label="Booking Status" value={booking.booking_status ?? '—'} />
          {booking.booking_status === 'accepted' && (
            <InfoRow label="Case Status" value={caseStatus} />
          )}
          <InfoRow label="Submitted" value={formatDate(booking.created_at)} />
        </Section>

        {/* Description */}
        {booking.description && (
          <Section title="Case Description">
            <div className="py-4">
              <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">{booking.description}</p>
            </div>
          </Section>
        )}
      </div>

      {/* Professional fee note */}
      <div className="rounded-xl border border-white/8 bg-white/3 px-5 py-4 text-sm text-neutral-500">
        <span className="font-semibold text-neutral-400">Professional Fees</span> are negotiated directly between the lawyer and client after booking acceptance. They are not collected through this system and do not appear in your payment totals.
      </div>
    </div>
  )
}
