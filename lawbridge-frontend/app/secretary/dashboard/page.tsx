'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { getIncomingBookings, assignCase, acceptBooking, declineBooking, type CaseItem } from '../../../lib/casesApi'
import { listReportRequests, updateReportRequestStatus, REPORT_TYPE_LABELS, PERIOD_LABELS, type ReportRequest } from '../../../lib/reportRequestsApi'
import { getMyFirmMemberships, getFirmLawyers, type FirmLawyer } from '../../../lib/firmsApi'
import { ChartBarIcon, UsersIcon } from '../../../components/icons/Icons'

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}
function fmtXAF(n: number) { return n > 0 ? `${n.toLocaleString()} XAF` : '—' }

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
  pending: 'acknowledged', acknowledged: 'generated', generated: 'delivered',
}

function AssignModal({ caseItem, lawyers, onClose, onAssigned }: {
  caseItem: CaseItem; lawyers: FirmLawyer[]; onClose: () => void; onAssigned: (u: CaseItem) => void
}) {
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    if (!selectedId) { setErr('Select a lawyer first'); return }
    setSaving(true); setErr('')
    const token = localStorage.getItem('access') || ''
    try { onAssigned(await assignCase(caseItem.id, selectedId, token, note || undefined)) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Failed to assign') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-primary-900 border border-neutral-700/60 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-100">Assign Lawyer</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-neutral-400 truncate">Case: <span className="text-neutral-200">{caseItem.title}</span></p>
        {lawyers.length === 0 ? (
          <p className="text-sm text-neutral-500 italic">No lawyers found for this firm.</p>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {lawyers.map(l => (
              <label key={l.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedId === l.id ? 'border-gold-500/50 bg-gold-500/10' : 'border-neutral-700/40 hover:border-neutral-600/50'}`}>
                <input type="radio" name="lawyer" value={l.id} checked={selectedId === l.id} onChange={() => setSelectedId(l.id)} className="accent-gold-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-100">{l.name}</p>
                  <p className="text-xs text-neutral-500">{l.specialization || l.role || 'Lawyer'}{l.availability_status === 'available' ? <span className="text-emerald-400 ml-1"> · Available</span> : null}</p>
                </div>
              </label>
            ))}
          </div>
        )}
        <div>
          <label className="text-xs text-neutral-400 block mb-1">Note to lawyer <span className="text-neutral-600">(optional)</span></label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Context for the lawyer…"
            className="w-full bg-primary-800/50 border border-neutral-700/40 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-500/50 resize-none" />
        </div>
        {err && <p className="text-xs text-red-400">{err}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-neutral-700/40 text-neutral-400 hover:text-neutral-200 text-sm transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving || !selectedId} className="flex-1 py-2 rounded-lg bg-gold-500/20 border border-gold-500/30 text-gold-300 hover:bg-gold-500/30 text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Assigning…' : 'Assign Lawyer'}
          </button>
        </div>
      </div>
    </div>
  )
}

type Tab = 'overview' | 'bookings' | 'payments' | 'reports'

export default function SecretaryDashboardPage() {
  const [bookings, setBookings] = useState<CaseItem[]>([])
  const [reportRequests, setReportRequests] = useState<ReportRequest[]>([])
  const [firmId, setFirmId] = useState<number | null>(null)
  const [firmLawyers, setFirmLawyers] = useState<FirmLawyer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [updatingReport, setUpdatingReport] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<CaseItem | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [decliningId, setDecliningId] = useState<string | null>(null)

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
      const active = membershipsRes.value.find(m => m.is_active !== false)
      if (active) {
        setFirmId(active.firm)
        const [rrRes, lawyersRes] = await Promise.allSettled([
          listReportRequests(active.firm, access),
          getFirmLawyers(active.firm, access),
        ])
        if (rrRes.status === 'fulfilled') setReportRequests(rrRes.value.results ?? [])
        if (lawyersRes.status === 'fulfilled') setFirmLawyers(lawyersRes.value ?? [])
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function advanceReport(rr: ReportRequest) {
    const next = NEXT_STATUS[rr.status]; if (!next) return
    const access = localStorage.getItem('access'); if (!access) return
    setUpdatingReport(rr.id)
    try { await updateReportRequestStatus(rr.id, next, access); setReportRequests(prev => prev.map(r => r.id === rr.id ? { ...r, status: next } : r)) }
    finally { setUpdatingReport(null) }
  }

  async function handleAccept(id: string) {
    const access = localStorage.getItem('access'); if (!access) return
    setAcceptingId(id)
    try { const u = await acceptBooking(id, access); setBookings(prev => prev.map(b => b.id === id ? u : b)) }
    finally { setAcceptingId(null) }
  }

  async function handleDecline(id: string) {
    const access = localStorage.getItem('access'); if (!access) return
    setDecliningId(id)
    try { await declineBooking(id, 'Declined by firm secretary', access); setBookings(prev => prev.map(b => b.id === id ? { ...b, booking_status: 'declined' } : b)) }
    finally { setDecliningId(null) }
  }

  const feeRows = bookings.map(b => {
    const meta = b.booking_metadata ?? {}
    const c = parseFloat(meta.consultation_fee || meta.booking_fee || '0') || 0
    const p = parseFloat(meta.procedural_fee || '0') || 0
    return { id: b.id, title: b.title, client_email: meta.client_email || '—', consult: c, proc: p, total: c + p, pay_status: meta.payment_status || 'none', book_status: b.booking_status || '—', created_at: b.created_at }
  })
  const totalVerified = feeRows.filter(r => r.pay_status === 'verified').reduce((s, r) => s + r.total, 0)
  const pendingVerif = feeRows.filter(r => r.pay_status === 'pending_verification')
  const pendingBookings = bookings.filter(b => b.booking_status === 'pending')
  const unassignedPending = bookings.filter(b => b.booking_status === 'pending' && !b.assigned_lawyer_id)
  const pendingReports = reportRequests.filter(r => r.status === 'pending')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'bookings', label: `Firm Bookings${pendingBookings.length > 0 ? ` (${pendingBookings.length})` : ''}` },
    { id: 'payments', label: 'Payments' },
    { id: 'reports', label: `Reports${pendingReports.length > 0 ? ` (${pendingReports.length})` : ''}` },
  ]

  return (
    <div className="space-y-6">
      {assignTarget && (
        <AssignModal caseItem={assignTarget} lawyers={firmLawyers} onClose={() => setAssignTarget(null)}
          onAssigned={u => { setBookings(prev => prev.map(b => b.id === u.id ? u : b)); setAssignTarget(null) }} />
      )}

      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-display-md text-neutral-50">Firm Administration</h1>
          <p className="mt-1 text-sm text-neutral-400">{firmId ? `Firm #${firmId} · ` : ''}Bookings, payments &amp; reports</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/secretary/reports" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold-500/20 border border-gold-500/30 text-gold-300 text-sm font-medium hover:bg-gold-500/30 transition-colors">
            <ChartBarIcon className="w-4 h-4" width={16} height={16} />Generate Reports
          </Link>
          <Link href="/secretary/members" className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:text-neutral-100 text-sm transition-colors">
            <UsersIcon className="w-4 h-4" width={16} height={16} />Members
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-neutral-400 py-16">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />Loading…
        </div>
      ) : (
        <>
          {error && <Card className="border border-red-500/30 p-4"><p className="text-red-300 text-sm">{error}</p></Card>}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-primary-900/50 border border-neutral-700/40 rounded-xl p-4">
              <p className="text-3xl font-bold text-neutral-50">{bookings.length}</p>
              <p className="text-sm text-neutral-300 mt-0.5 font-medium">Total Bookings</p>
              <p className="text-xs text-neutral-500 mt-0.5">{pendingBookings.length} pending · {unassignedPending.length} unassigned</p>
            </div>
            <div className="bg-primary-900/50 border border-amber-500/20 rounded-xl p-4">
              <p className="text-3xl font-bold text-amber-400">{pendingVerif.length}</p>
              <p className="text-sm text-neutral-300 mt-0.5 font-medium">Pending Payments</p>
              <p className="text-xs text-neutral-500 mt-0.5">{fmtXAF(pendingVerif.reduce((s, r) => s + r.total, 0))}</p>
            </div>
            <div className="bg-primary-900/50 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-3xl font-bold text-emerald-400">{fmtXAF(totalVerified)}</p>
              <p className="text-sm text-neutral-300 mt-0.5 font-medium">Verified Revenue</p>
              <p className="text-xs text-neutral-500 mt-0.5">Consultation + procedural</p>
            </div>
            <div className={`bg-primary-900/50 border rounded-xl p-4 ${pendingReports.length > 0 ? 'border-gold-500/30' : 'border-neutral-700/40'}`}>
              <p className={`text-3xl font-bold ${pendingReports.length > 0 ? 'text-gold-400' : 'text-neutral-300'}`}>{reportRequests.length}</p>
              <p className="text-sm text-neutral-300 mt-0.5 font-medium">Report Requests</p>
              <p className="text-xs text-neutral-500 mt-0.5">{pendingReports.length} pending action</p>
            </div>
          </div>

          {unassignedPending.length > 0 && (
            <div className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-4">
              <div className="flex items-center gap-2">
                <span className="text-gold-400">⚡</span>
                <h3 className="text-sm font-semibold text-gold-300">Unassigned Firm Bookings</h3>
                <span className="ml-auto text-xs bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full">{unassignedPending.length}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">These cases were booked to your firm but haven't been assigned to a lawyer yet.</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 p-0.5 bg-neutral-800/60 rounded-lg w-fit flex-wrap">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === t.id ? 'bg-gold-500/20 text-gold-300' : 'text-neutral-400 hover:text-neutral-200'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Recent Bookings</h3>
                {bookings.length === 0 ? <Card className="p-4 text-center"><p className="text-neutral-500 text-sm">No bookings yet.</p></Card> : (
                  <>
                    {bookings.slice(0, 5).map(b => (
                      <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-700/40 bg-primary-900/20">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-100 truncate">{b.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{b.booking_metadata?.client_email || 'Client'} · {fmtDate(b.created_at)}</p>
                        </div>
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${bookStatusCls(b.booking_status || '')}`}>{b.booking_status || 'new'}</span>
                        {!b.assigned_lawyer_id && b.booking_status === 'pending' && (
                          <button onClick={() => setAssignTarget(b)} className="text-xs text-gold-400 hover:text-gold-300 font-medium flex-shrink-0">Assign →</button>
                        )}
                      </div>
                    ))}
                    {bookings.length > 5 && <button onClick={() => setActiveTab('bookings')} className="text-xs text-gold-300 hover:text-gold-200">View all {bookings.length} →</button>}
                  </>
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Firm Lawyers ({firmLawyers.length})</h3>
                {firmLawyers.length === 0 ? <Card className="p-4 text-center"><p className="text-neutral-500 text-sm">No lawyers found.</p></Card> : (
                  <>
                    {firmLawyers.slice(0, 5).map(l => (
                      <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-700/40 bg-primary-900/20">
                        <div className="w-8 h-8 rounded-full bg-primary-800 border border-neutral-700/40 flex items-center justify-center text-xs font-bold text-neutral-300">{l.name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-100">{l.name}</p>
                          <p className="text-xs text-neutral-500">{l.specialization || l.role || 'Lawyer'}</p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${l.availability_status === 'available' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-neutral-800/30 text-neutral-500 border-neutral-700/30'}`}>
                          {l.availability_status || 'unknown'}
                        </span>
                      </div>
                    ))}
                    <Link href="/secretary/members" className="block text-xs text-gold-300 hover:text-gold-200 text-center mt-1">Manage members →</Link>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Firm Bookings */}
          {activeTab === 'bookings' && (
            <div className="space-y-3">
              {bookings.length === 0 ? <Card className="p-8 text-center"><p className="text-neutral-400 text-sm">No bookings yet.</p></Card> : (
                bookings.map(b => {
                  const meta = b.booking_metadata ?? {}
                  const assignedLawyer = firmLawyers.find(l => l.id === b.assigned_lawyer_id)
                  return (
                    <div key={b.id} className={`rounded-xl border p-4 ${b.booking_status === 'pending' && !b.assigned_lawyer_id ? 'border-gold-500/20 bg-gold-500/5' : 'border-neutral-700/40 bg-primary-900/20'}`}>
                      <div className="flex items-start gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-neutral-100">{b.title}</p>
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${bookStatusCls(b.booking_status || '')}`}>{b.booking_status || '—'}</span>
                            {!b.assigned_lawyer_id && <span className="text-[11px] px-1.5 py-0.5 rounded-full border border-gold-500/30 bg-gold-500/10 text-gold-400">Unassigned</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400 flex-wrap">
                            <span>{b.case_type}</span>
                            {meta.client_email && <span>Client: {meta.client_email}</span>}
                            {meta.preferred_date && <span>Preferred: {meta.preferred_date}</span>}
                            <span>{fmtDate(b.created_at)}</span>
                          </div>
                          {assignedLawyer && <p className="text-xs text-emerald-400 mt-1">Assigned to: {assignedLawyer.name}</p>}
                          {!assignedLawyer && b.assigned_lawyer_id && <p className="text-xs text-blue-400 mt-1">Assigned (ID: {String(b.assigned_lawyer_id).slice(0, 8)}…)</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0 flex-wrap">
                          {b.booking_status === 'pending' && (
                            <>
                              <button onClick={() => setAssignTarget(b)} className="px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-300 text-xs font-medium hover:bg-gold-500/10 transition-colors">Assign Lawyer</button>
                              <button onClick={() => handleAccept(b.id)} disabled={acceptingId === b.id} className="px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300 text-xs font-medium hover:bg-emerald-500/10 disabled:opacity-50 transition-colors">
                                {acceptingId === b.id ? '…' : '✓ Accept'}
                              </button>
                              <button onClick={() => handleDecline(b.id)} disabled={decliningId === b.id} className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-300 text-xs font-medium hover:bg-red-500/10 disabled:opacity-50 transition-colors">
                                {decliningId === b.id ? '…' : '✗ Decline'}
                              </button>
                            </>
                          )}
                          <Link href={`/bookings/${b.id}`} className="px-3 py-1.5 rounded-lg border border-neutral-700/40 text-neutral-400 text-xs hover:text-neutral-200 transition-colors">View →</Link>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Payments */}
          {activeTab === 'payments' && (
            <div className="overflow-x-auto rounded-xl border border-neutral-700/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700/40 bg-primary-800/40">
                    {['Matter', 'Client', 'Consult', 'Procedural', 'Total', 'Payment', 'Booking', 'Date', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feeRows.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-neutral-500 text-sm">No bookings.</td></tr>}
                  {feeRows.map((r, i) => (
                    <tr key={r.id} className={`border-b border-neutral-700/20 ${i % 2 === 0 ? 'bg-primary-800/20' : ''} hover:bg-primary-700/20`}>
                      <td className="px-4 py-3 text-neutral-200 font-medium truncate max-w-[140px]">{r.title}</td>
                      <td className="px-4 py-3 text-neutral-400 text-xs truncate max-w-[120px]">{r.client_email}</td>
                      <td className="px-4 py-3 text-right text-neutral-400">{fmtXAF(r.consult)}</td>
                      <td className="px-4 py-3 text-right text-neutral-400">{fmtXAF(r.proc)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-neutral-200">{r.total > 0 ? fmtXAF(r.total) : '—'}</td>
                      <td className="px-4 py-3"><span className={`text-[11px] px-1.5 py-0.5 rounded-full border ${payStatusCls(r.pay_status)}`}>{r.pay_status === 'pending_verification' ? 'Pending' : r.pay_status === 'verified' ? 'Verified' : 'None'}</span></td>
                      <td className="px-4 py-3"><span className={`text-[11px] px-1.5 py-0.5 rounded-full border capitalize ${bookStatusCls(r.book_status)}`}>{r.book_status}</span></td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">{fmtDate(r.created_at)}</td>
                      <td className="px-4 py-3"><Link href={`/bookings/${r.id}`} className="text-xs text-gold-400 hover:text-gold-300">View →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reports inbox */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-400">Report requests from firm admins and partners.</p>
                <Link href="/secretary/reports" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/20 border border-gold-500/30 text-gold-300 text-xs font-medium hover:bg-gold-500/30 transition-colors">
                  <ChartBarIcon className="w-3.5 h-3.5" width={14} height={14} />Generate a Report →
                </Link>
              </div>
              {reportRequests.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-neutral-400 text-sm">No report requests yet.</p>
                  <p className="text-neutral-500 text-xs mt-1">Firm owners and partners can request reports from the office dashboard.</p>
                </Card>
              ) : reportRequests.map(rr => (
                <div key={rr.id} className={`rounded-xl border p-4 ${rr.status === 'pending' ? 'border-gold-500/30 bg-gold-500/5' : 'border-neutral-700/40 bg-primary-900/20'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-neutral-100">{REPORT_TYPE_LABELS[rr.report_type] ?? rr.report_type}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${reportStatusCls(rr.status)}`}>{rr.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-neutral-400">
                        <span>{PERIOD_LABELS[rr.period] ?? rr.period}</span>
                        <span>By <span className="text-neutral-300">{rr.requester_name || 'Unknown'}</span></span>
                        <span className="text-neutral-600">{fmtDate(rr.created_at)}</span>
                      </div>
                      {rr.notes && <p className="text-xs text-neutral-400 mt-2 italic">"{rr.notes}"</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {NEXT_STATUS[rr.status] && (
                        <button onClick={() => advanceReport(rr)} disabled={updatingReport === rr.id}
                          className="px-3 py-1.5 rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/30 hover:bg-gold-500/30 text-xs font-medium disabled:opacity-50 transition-colors">
                          {updatingReport === rr.id ? '…' : rr.status === 'pending' ? '✓ Acknowledge' : rr.status === 'acknowledged' ? '📋 Mark Generated' : '✅ Mark Delivered'}
                        </button>
                      )}
                      {rr.status === 'acknowledged' && (
                        <Link href={`/secretary/reports?type=${rr.report_type}&period=${rr.period}`}
                          className="px-3 py-1.5 rounded-lg border border-neutral-700/40 text-neutral-300 text-xs hover:text-neutral-100 transition-colors">
                          Generate →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
