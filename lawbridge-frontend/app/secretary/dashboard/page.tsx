'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { getIncomingBookings, type CaseItem } from '../../../lib/casesApi'
import { listReportRequests, updateReportRequestStatus, REPORT_TYPE_LABELS, PERIOD_LABELS, type ReportRequest } from '../../../lib/reportRequestsApi'
import { getMyFirmMemberships } from '../../../lib/firmsApi'

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

function fmtXAF(n: number) {
  return n > 0 ? `${n.toLocaleString()} XAF` : '—'
}

function payStatusCls(s: string) {
  if (s === 'verified') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  if (s === 'pending_verification') return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  return 'bg-neutral-800/30 text-neutral-500 border-neutral-700/30'
}

function bookStatusCls(s: string) {
  if (s === 'accepted') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  if (s === 'pending') return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  if (s === 'declined') return 'bg-red-500/10 text-red-400 border-red-500/30'
  return 'bg-neutral-800/30 text-neutral-500 border-neutral-700/30'
}

function reportStatusCls(s: string) {
  switch (s) {
    case 'pending': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    case 'acknowledged': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'generated': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'delivered': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    default: return 'bg-neutral-700/30 text-neutral-400 border-neutral-600/30'
  }
}

const NEXT_STATUS: Record<string, ReportRequest['status']> = {
  pending: 'acknowledged',
  acknowledged: 'generated',
  generated: 'delivered',
}

export default function SecretaryDashboardPage() {
  const [bookings, setBookings] = useState<CaseItem[]>([])
  const [reportRequests, setReportRequests] = useState<ReportRequest[]>([])
  const [firmId, setFirmId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'payments' | 'reports'>('payments')
  const [updatingReport, setUpdatingReport] = useState<string | null>(null)

  const load = useCallback(async () => {
    const access = localStorage.getItem('access')
    if (!access) { setError('Not authenticated.'); setLoading(false); return }

    const [bookingsRes, membershipsRes] = await Promise.allSettled([
      getIncomingBookings(access),
      getMyFirmMemberships(access),
    ])

    if (bookingsRes.status === 'fulfilled') setBookings(bookingsRes.value.results ?? [])
    else setError('Unable to load bookings')

    if (membershipsRes.status === 'fulfilled') {
      const ms = membershipsRes.value
      const activeFirm = ms.find(m => m.is_active !== false)
      if (activeFirm) {
        setFirmId(activeFirm.firm)
        try {
          const rr = await listReportRequests(activeFirm.firm, access)
          setReportRequests(rr.results ?? [])
        } catch { /* non-fatal */ }
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function advanceReportStatus(rr: ReportRequest) {
    const next = NEXT_STATUS[rr.status]
    if (!next) return
    const access = localStorage.getItem('access')
    if (!access) return
    setUpdatingReport(rr.id)
    try {
      await updateReportRequestStatus(rr.id, next, access)
      setReportRequests(prev => prev.map(r => r.id === rr.id ? { ...r, status: next } : r))
    } finally {
      setUpdatingReport(null)
    }
  }

  const feeRows = bookings.map(b => {
    const meta = b.booking_metadata ?? {}
    const consult = parseFloat(meta.consultation_fee || meta.booking_fee || '0') || 0
    const proc = parseFloat(meta.procedural_fee || '0') || 0
    const prof = parseFloat(meta.professional_fee || '0') || 0
    return {
      id: b.id, title: b.title,
      client_email: meta.client_email || '—',
      consult, proc, prof,
      total: consult + proc,
      pay_status: meta.payment_status || 'none',
      pay_method: meta.payment_method || '—',
      pay_ref: meta.payment_reference || '—',
      book_status: b.booking_status || '—',
      created_at: b.created_at,
    }
  })

  const totalVerified = feeRows.filter(r => r.pay_status === 'verified').reduce((s, r) => s + r.total, 0)
  const pendingVerif = feeRows.filter(r => r.pay_status === 'pending_verification')
  const pendingBookings = feeRows.filter(r => r.book_status === 'pending')
  const pendingReports = reportRequests.filter(r => r.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-display-md text-neutral-50">Secretary Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {firmId ? `Firm #${firmId} · ` : ''}Payments, bookings, and report requests
          </p>
        </div>
        <Link href="/secretary/payments" className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:text-neutral-100 text-sm transition-colors">
          Payment Tracker →
        </Link>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-neutral-400 py-16">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading dashboard…
        </div>
      ) : (
        <>
          {error && <Card className="border border-red-500/30 p-4"><p className="text-red-300 text-sm">{error}</p></Card>}

          {/* Stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-primary-900/50 border border-neutral-700/40 rounded-xl p-4">
              <p className="text-3xl font-bold text-neutral-50">{bookings.length}</p>
              <p className="text-sm text-neutral-300 mt-0.5 font-medium">Total Bookings</p>
              <p className="text-xs text-neutral-500 mt-0.5">{pendingBookings.length} awaiting response</p>
            </div>
            <div className="bg-primary-900/50 border border-amber-500/20 rounded-xl p-4">
              <p className="text-3xl font-bold text-amber-400">{pendingVerif.length}</p>
              <p className="text-sm text-neutral-300 mt-0.5 font-medium">Pending Verification</p>
              <p className="text-xs text-neutral-500 mt-0.5">{fmtXAF(pendingVerif.reduce((s, r) => s + r.total, 0))} unverified</p>
            </div>
            <div className="bg-primary-900/50 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-3xl font-bold text-emerald-400">{fmtXAF(totalVerified)}</p>
              <p className="text-sm text-neutral-300 mt-0.5 font-medium">Verified Payments</p>
              <p className="text-xs text-neutral-500 mt-0.5">Consultation + procedural</p>
            </div>
            <div className={`bg-primary-900/50 border rounded-xl p-4 ${pendingReports.length > 0 ? 'border-gold-500/30' : 'border-neutral-700/40'}`}>
              <p className={`text-3xl font-bold ${pendingReports.length > 0 ? 'text-gold-400' : 'text-neutral-300'}`}>{reportRequests.length}</p>
              <p className="text-sm text-neutral-300 mt-0.5 font-medium">Report Requests</p>
              <p className="text-xs text-neutral-500 mt-0.5">{pendingReports.length} pending action</p>
            </div>
          </div>

          {/* Pending verification alert */}
          {pendingVerif.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-400">⚠</span>
                <h3 className="text-sm font-semibold text-amber-300">Payments Awaiting Verification</h3>
                <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{pendingVerif.length}</span>
              </div>
              <div className="space-y-2">
                {pendingVerif.slice(0, 3).map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-2 border-t border-amber-500/10">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-200 font-medium truncate">{r.title}</p>
                      <p className="text-xs text-neutral-500">{r.client_email} · {fmtXAF(r.total)} due · {r.pay_method} ref: {r.pay_ref}</p>
                    </div>
                    <Link href={`/bookings/${r.id}`} className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/10 transition-colors">
                      Verify →
                    </Link>
                  </div>
                ))}
                {pendingVerif.length > 3 && (
                  <Link href="/secretary/payments" className="block text-center text-xs text-gold-300 hover:text-gold-200 mt-2">
                    View all {pendingVerif.length} pending →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 p-0.5 bg-neutral-800/60 rounded-lg w-fit">
            {(['payments', 'reports'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors capitalize ${activeTab === tab ? 'bg-gold-500/20 text-gold-300' : 'text-neutral-400 hover:text-neutral-200'}`}
              >
                {tab === 'payments' ? `Bookings & Payments` : `Report Requests${pendingReports.length > 0 ? ` (${pendingReports.length})` : ''}`}
              </button>
            ))}
          </div>

          {/* Payments tab */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto rounded-xl border border-neutral-700/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700/40 bg-primary-800/40">
                    <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Matter</th>
                    <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Client</th>
                    <th className="text-right px-4 py-3 text-xs text-neutral-400 font-semibold">Consult</th>
                    <th className="text-right px-4 py-3 text-xs text-neutral-400 font-semibold">Procedural</th>
                    <th className="text-right px-4 py-3 text-xs text-neutral-400 font-semibold">Total</th>
                    <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Payment</th>
                    <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Booking</th>
                    <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Date</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {feeRows.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-500 text-sm">No bookings found.</td></tr>
                  )}
                  {feeRows.map((row, i) => (
                    <tr key={row.id} className={`border-b border-neutral-700/20 ${i % 2 === 0 ? 'bg-primary-800/20' : ''} hover:bg-primary-700/20 transition-colors`}>
                      <td className="px-4 py-3 text-neutral-200 font-medium truncate max-w-[140px]">{row.title}</td>
                      <td className="px-4 py-3 text-neutral-400 text-xs truncate max-w-[120px]">{row.client_email}</td>
                      <td className="px-4 py-3 text-right text-neutral-400">{fmtXAF(row.consult)}</td>
                      <td className="px-4 py-3 text-right text-neutral-400">{fmtXAF(row.proc)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-200">{row.total > 0 ? fmtXAF(row.total) : '—'}</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${payStatusCls(row.pay_status)}`}>
                            {row.pay_status === 'pending_verification' ? 'Pending' : row.pay_status === 'verified' ? 'Verified' : 'None'}
                          </span>
                          {row.pay_ref !== '—' && <div className="font-mono text-[10px] text-neutral-600 mt-0.5">{row.pay_ref}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full border capitalize ${bookStatusCls(row.book_status)}`}>{row.book_status}</span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{fmtDate(row.created_at)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/bookings/${row.id}`} className="text-xs text-gold-400 hover:text-gold-300 font-medium">View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reports tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reportRequests.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-neutral-400 text-sm">No report requests yet.</p>
                  <p className="text-neutral-500 text-xs mt-1">Firm admins and partners can request reports from the office dashboard.</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {reportRequests.map(rr => (
                    <div key={rr.id} className={`rounded-xl border p-4 ${rr.status === 'pending' ? 'border-gold-500/30 bg-gold-500/5' : 'border-neutral-700/40 bg-primary-900/20'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-neutral-100">{REPORT_TYPE_LABELS[rr.report_type] ?? rr.report_type}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${reportStatusCls(rr.status)}`}>{rr.status}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-xs text-neutral-400">{PERIOD_LABELS[rr.period] ?? rr.period}</span>
                            <span className="text-xs text-neutral-500">Requested by <span className="text-neutral-300">{rr.requester_name || 'Unknown'}</span></span>
                            <span className="text-xs text-neutral-600">{fmtDate(rr.created_at)}</span>
                          </div>
                          {rr.notes && <p className="text-xs text-neutral-400 mt-2 italic">"{rr.notes}"</p>}
                        </div>

                        {NEXT_STATUS[rr.status] && (
                          <button
                            onClick={() => advanceReportStatus(rr)}
                            disabled={updatingReport === rr.id}
                            className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/30 hover:bg-gold-500/30 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {updatingReport === rr.id ? '…' : (
                              rr.status === 'pending' ? '✓ Acknowledge'
                              : rr.status === 'acknowledged' ? '📋 Mark Generated'
                              : rr.status === 'generated' ? '✅ Mark Delivered'
                              : 'Advance'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
