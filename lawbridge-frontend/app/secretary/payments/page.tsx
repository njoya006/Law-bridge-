'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { getIncomingBookings, verifyPayment, type CaseItem } from '../../../lib/casesApi'

type Row = {
  id: string
  title: string
  client_email: string
  consultation_fee: number
  procedural_fee: number
  professional_fee: number
  total_compulsory: number
  payment_status: string
  payment_method: string
  payment_ref: string
  booking_status: string
  created_at: string
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

function paymentMethodLabel(v?: string) {
  const m: Record<string, string> = { mtn_momo: 'MTN MoMo', orange_money: 'Orange Money', bank_transfer: 'Bank Transfer' }
  return v ? (m[v] ?? v) : '—'
}

type Filter = 'all' | 'pending_verification' | 'verified' | 'none'

export default function SecretaryPaymentsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [actioning, setActioning] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { if (mounted) { setError('Not authenticated.'); setLoading(false) } return }
      try {
        const response = await getIncomingBookings(access)
        const items: Row[] = (response.results ?? []).map((b: CaseItem) => {
          const meta = b.booking_metadata ?? {}
          const cf = parseFloat(meta.consultation_fee || meta.booking_fee || '0') || 0
          const pf = parseFloat(meta.procedural_fee || '0') || 0
          const prof = parseFloat(meta.professional_fee || '0') || 0
          return {
            id: b.id,
            title: b.title,
            client_email: meta.client_email || '—',
            consultation_fee: cf,
            procedural_fee: pf,
            professional_fee: prof,
            total_compulsory: cf + pf,
            payment_status: meta.payment_status || 'none',
            payment_method: meta.payment_method || '',
            payment_ref: meta.payment_reference || '',
            booking_status: b.booking_status || '',
            created_at: b.created_at,
          }
        })
        if (mounted) setRows(items)
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load payments')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => { mounted = false }
  }, [])

  const visible = filter === 'all' ? rows : rows.filter(r => r.payment_status === filter)

  async function handlePaymentAction(rowId: string, action: 'verify' | 'reject') {
    const access = localStorage.getItem('access')
    if (!access) return
    setActioning(rowId + action)
    setActionError('')
    try {
      await verifyPayment(rowId, action, access)
      setRows(prev => prev.map(r =>
        r.id === rowId ? { ...r, payment_status: action === 'verify' ? 'verified' : 'rejected' } : r
      ))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Verification failed — please retry')
    } finally {
      setActioning(null)
    }
  }

  const totalConsult = rows.reduce((s, r) => s + r.consultation_fee, 0)
  const totalProc = rows.reduce((s, r) => s + r.procedural_fee, 0)
  const totalVerified = rows.filter(r => r.payment_status === 'verified').reduce((s, r) => s + r.total_compulsory, 0)
  const totalPending = rows.filter(r => r.payment_status === 'pending_verification').reduce((s, r) => s + r.total_compulsory, 0)

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: rows.length },
    { key: 'pending_verification', label: 'Pending Verification', count: rows.filter(r => r.payment_status === 'pending_verification').length },
    { key: 'verified', label: 'Verified', count: rows.filter(r => r.payment_status === 'verified').length },
    { key: 'none', label: 'No Payment', count: rows.filter(r => r.payment_status === 'none' || !r.payment_status).length },
  ]

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-display-md text-neutral-50">Payments</h1>
        <p className="mt-1 text-neutral-400">Track and validate all firm booking fees</p>
      </header>

      {/* Fee type summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold mb-1">Consultation Fees</p>
          <p className="text-xl font-bold text-neutral-50">{totalConsult.toLocaleString()} XAF</p>
          <p className="text-xs text-amber-400 mt-1">Compulsory</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold mb-1">Procedural Fees</p>
          <p className="text-xl font-bold text-neutral-50">{totalProc.toLocaleString()} XAF</p>
          <p className="text-xs text-amber-400 mt-1">Compulsory</p>
        </Card>
        <Card className="p-5 border-emerald-500/20">
          <p className="text-xs uppercase tracking-wide text-emerald-500/70 font-semibold mb-1">Verified</p>
          <p className="text-xl font-bold text-emerald-400">{totalVerified.toLocaleString()} XAF</p>
          <p className="text-xs text-neutral-500 mt-1">Confirmed payments</p>
        </Card>
        <Card className="p-5 border-amber-500/20">
          <p className="text-xs uppercase tracking-wide text-amber-500/70 font-semibold mb-1">Pending Verification</p>
          <p className="text-xl font-bold text-amber-400">{totalPending.toLocaleString()} XAF</p>
          <p className="text-xs text-neutral-500 mt-1">Needs confirmation</p>
        </Card>
      </div>

      {/* Note: professional fees */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/5 px-5 py-4 text-sm text-emerald-300">
        <strong>Professional Fees</strong> are negotiable and agreed directly between the lawyer and client after booking acceptance. They are not collected through this system.
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="ml-4 text-red-400 hover:text-red-200 text-xs">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === f.key
                ? 'bg-gold-500/15 border-gold-500/30 text-gold-300'
                : 'border-neutral-700/40 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-8 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading…
        </div>
      )}

      {!loading && error && (
        <Card className="border border-crimson-500/30 p-4">
          <p className="text-crimson-300 text-sm">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-xl border border-neutral-700/40">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700/40 bg-primary-800/40">
                <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Matter</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Client</th>
                <th className="text-right px-4 py-3 text-xs text-amber-400 font-semibold">Consult Fee</th>
                <th className="text-right px-4 py-3 text-xs text-amber-400 font-semibold">Procedural Fee</th>
                <th className="text-right px-4 py-3 text-xs text-emerald-400 font-semibold">Prof. Fee</th>
                <th className="text-right px-4 py-3 text-xs text-gold-400 font-semibold">Due Now</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Method</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Reference</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-neutral-500 text-sm">No records match this filter.</td>
                </tr>
              )}
              {visible.map((row, i) => (
                <tr key={row.id} className={`border-b border-neutral-700/20 ${i % 2 === 0 ? 'bg-primary-800/20' : ''} hover:bg-primary-700/20 transition-colors`}>
                  <td className="px-4 py-3 text-neutral-200 font-medium truncate max-w-[130px]">{row.title}</td>
                  <td className="px-4 py-3 text-neutral-400 text-xs truncate max-w-[120px]">{row.client_email}</td>
                  <td className="px-4 py-3 text-right text-neutral-300">{row.consultation_fee > 0 ? `${row.consultation_fee.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 text-right text-neutral-300">{row.procedural_fee > 0 ? `${row.procedural_fee.toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3 text-right text-emerald-400 text-xs italic">{row.professional_fee > 0 ? `${row.professional_fee.toLocaleString()}` : 'TBD'}</td>
                  <td className="px-4 py-3 text-right text-gold-300 font-bold">{row.total_compulsory > 0 ? `${row.total_compulsory.toLocaleString()} XAF` : '—'}</td>
                  <td className="px-4 py-3 text-neutral-400 text-xs">{paymentMethodLabel(row.payment_method)}</td>
                  <td className="px-4 py-3 text-neutral-400 font-mono text-xs">{row.payment_ref || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      row.payment_status === 'verified' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                      row.payment_status === 'pending_verification' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                      'border-neutral-700/30 text-neutral-500'
                    }`}>
                      {row.payment_status === 'pending_verification' ? 'Pending' : row.payment_status === 'verified' ? 'Verified' : 'None'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 text-xs">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      {row.payment_status === 'pending_verification' && (
                        <>
                          <button
                            onClick={() => handlePaymentAction(row.id, 'verify')}
                            disabled={actioning !== null}
                            className="px-2 py-1 rounded-md text-[11px] font-medium border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
                          >
                            {actioning === row.id + 'verify' ? '…' : '✓ Verify'}
                          </button>
                          <button
                            onClick={() => handlePaymentAction(row.id, 'reject')}
                            disabled={actioning !== null}
                            className="px-2 py-1 rounded-md text-[11px] font-medium border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                          >
                            {actioning === row.id + 'reject' ? '…' : '✗ Reject'}
                          </button>
                        </>
                      )}
                      <Link href={`/bookings/${row.id}`} className="text-xs text-gold-400 hover:text-gold-300 font-medium">View →</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
