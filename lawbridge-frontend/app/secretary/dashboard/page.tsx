'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { getIncomingBookings, type CaseItem } from '../../../lib/casesApi'

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

function fmtXAF(val?: string) {
  const n = parseFloat(val || '0')
  return n > 0 ? `${n.toLocaleString()} XAF` : '—'
}

type FeeRow = {
  id: string
  title: string
  client_email: string
  consultation_fee: number
  procedural_fee: number
  professional_fee: number
  total: number
  payment_status: string
  payment_method: string
  payment_ref: string
  booking_status: string
  created_at: string
}

export default function SecretaryDashboardPage() {
  const [bookings, setBookings] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { if (mounted) { setError('Not authenticated.'); setLoading(false) } return }
      try {
        const response = await getIncomingBookings(access)
        if (mounted) setBookings(response.results ?? [])
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load bookings')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => { mounted = false }
  }, [])

  const feeRows: FeeRow[] = bookings.map(b => {
    const meta = b.booking_metadata ?? {}
    const consultFee = parseFloat(meta.consultation_fee || meta.booking_fee || '0') || 0
    const procFee = parseFloat(meta.procedural_fee || '0') || 0
    const profFee = parseFloat(meta.professional_fee || '0') || 0
    return {
      id: b.id,
      title: b.title,
      client_email: meta.client_email || '—',
      consultation_fee: consultFee,
      procedural_fee: procFee,
      professional_fee: profFee,
      total: consultFee + procFee,
      payment_status: meta.payment_status || 'none',
      payment_method: meta.payment_method || '—',
      payment_ref: meta.payment_reference || '—',
      booking_status: b.booking_status || '—',
      created_at: b.created_at,
    }
  })

  const totalCollected = feeRows.filter(r => r.payment_status === 'verified').reduce((s, r) => s + r.total, 0)
  const pendingVerif = feeRows.filter(r => r.payment_status === 'pending_verification')
  const pendingBookings = feeRows.filter(r => r.booking_status === 'pending')

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-display-md text-neutral-50">Secretary Dashboard</h1>
        <p className="mt-1 text-neutral-400">Firm booking overview and payment tracking</p>
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-neutral-50">{bookings.length}</p>
          <p className="text-xs text-neutral-500 mt-1">{pendingBookings.length} awaiting response</p>
        </Card>
        <Card className="p-5 border-amber-500/20">
          <p className="text-xs uppercase tracking-wide text-amber-500/70 font-semibold mb-1">Pending Verification</p>
          <p className="text-2xl font-bold text-amber-400">{pendingVerif.length}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {pendingVerif.reduce((s, r) => s + r.total, 0).toLocaleString()} XAF unverified
          </p>
        </Card>
        <Card className="p-5 border-emerald-500/20">
          <p className="text-xs uppercase tracking-wide text-emerald-500/70 font-semibold mb-1">Verified Payments</p>
          <p className="text-2xl font-bold text-emerald-400">{totalCollected.toLocaleString()} XAF</p>
          <p className="text-xs text-neutral-500 mt-1">Consultation + procedural fees</p>
        </Card>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-8 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading bookings…
        </div>
      )}

      {!loading && error && (
        <Card className="border border-crimson-500/30 p-4">
          <p className="text-crimson-300 text-sm">{error}</p>
        </Card>
      )}

      {/* Payments needing verification */}
      {!loading && pendingVerif.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-sm font-semibold text-amber-400 uppercase tracking-wide">Payments Awaiting Verification</h2>
          <div className="overflow-x-auto rounded-xl border border-amber-500/20">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700/40 bg-primary-800/40">
                  <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Client</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Matter</th>
                  <th className="text-right px-4 py-3 text-xs text-neutral-400 font-semibold">Consult</th>
                  <th className="text-right px-4 py-3 text-xs text-neutral-400 font-semibold">Procedural</th>
                  <th className="text-right px-4 py-3 text-xs text-amber-400 font-semibold">Total Due</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Method / Ref</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pendingVerif.map((row, i) => (
                  <tr key={row.id} className={`border-b border-neutral-700/20 ${i % 2 === 0 ? 'bg-primary-800/20' : ''} hover:bg-amber-500/5 transition-colors`}>
                    <td className="px-4 py-3 text-neutral-300">{row.client_email}</td>
                    <td className="px-4 py-3 text-neutral-200 font-medium truncate max-w-[140px]">{row.title}</td>
                    <td className="px-4 py-3 text-right text-neutral-400">{fmtXAF(String(row.consultation_fee))}</td>
                    <td className="px-4 py-3 text-right text-neutral-400">{fmtXAF(String(row.procedural_fee))}</td>
                    <td className="px-4 py-3 text-right text-amber-400 font-bold">{row.total.toLocaleString()} XAF</td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">
                      <div>{row.payment_method}</div>
                      <div className="font-mono text-neutral-500">{row.payment_ref}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/bookings/${row.id}`} className="text-xs text-gold-400 hover:text-gold-300 font-medium">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* All bookings */}
      {!loading && !error && feeRows.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-heading text-sm font-semibold text-neutral-400 uppercase tracking-wide">All Bookings</h2>
          <div className="overflow-x-auto rounded-xl border border-neutral-700/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700/40 bg-primary-800/40">
                  <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Matter</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Client</th>
                  <th className="text-right px-4 py-3 text-xs text-neutral-400 font-semibold">Total Fees</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Payment</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {feeRows.map((row, i) => (
                  <tr key={row.id} className={`border-b border-neutral-700/20 ${i % 2 === 0 ? 'bg-primary-800/20' : ''} hover:bg-primary-700/20 transition-colors`}>
                    <td className="px-4 py-3 text-neutral-200 font-medium truncate max-w-[160px]">{row.title}</td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">{row.client_email}</td>
                    <td className="px-4 py-3 text-right text-neutral-200 font-medium">{row.total > 0 ? `${row.total.toLocaleString()} XAF` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        row.payment_status === 'verified' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                        row.payment_status === 'pending_verification' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                        'border-neutral-700/30 bg-neutral-800/30 text-neutral-500'
                      }`}>
                        {row.payment_status === 'pending_verification' ? 'Pending' : row.payment_status === 'verified' ? 'Verified' : 'None'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        row.booking_status === 'accepted' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                        row.booking_status === 'pending' ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' :
                        row.booking_status === 'declined' ? 'border-crimson-500/30 bg-crimson-500/10 text-crimson-400' :
                        'border-neutral-700/30 text-neutral-500'
                      }`}>
                        {row.booking_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/bookings/${row.id}`} className="text-xs text-gold-400 hover:text-gold-300 font-medium">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && !error && feeRows.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-neutral-400">No bookings found.</p>
          <p className="text-neutral-500 text-sm mt-1">Firm bookings will appear here as clients submit requests.</p>
        </Card>
      )}
    </div>
  )
}
