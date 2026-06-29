'use client'

import React, { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '../../../../components/ui/Card'
import { getMyCases, getUserById, type CaseItem, type UserProfile } from '../../../../lib/casesApi'
import { getLawyerStats, type LawyerStats } from '../../../../lib/monitoringApi'
import { listEventsForCases, type CalendarEvent } from '../../../../lib/calendarApi'
import { getMyFirmMemberships, type FirmMembership } from '../../../../lib/firmsApi'
import { createReportRequest, listReportRequests, updateReportRequestStatus, REPORT_TYPE_LABELS, PERIOD_LABELS, type ReportRequest } from '../../../../lib/reportRequestsApi'
import { ChartBarIcon, SendIcon } from '../../../../components/icons/Icons'

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function statusColor(status: string) {
  if (['in_progress', 'hearing_scheduled'].includes(status)) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  if (['awaiting_court_date', 'hearing_adjourned'].includes(status)) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  if (['closed', 'dismissed', 'archived'].includes(status)) return 'bg-neutral-700/40 text-neutral-400 border-neutral-600/30'
  if (['verdict', 'settled'].includes(status)) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  return 'bg-gold-500/20 text-gold-300 border-gold-500/30'
}

function reportStatusCls(status: string) {
  switch (status) {
    case 'pending': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    case 'acknowledged': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'generated': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'delivered': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    default: return 'bg-neutral-700/30 text-neutral-400 border-neutral-600/30'
  }
}

// ── Report Request Modal ──────────────────────────────────────────────────────
function ReportRequestModal({
  firmId,
  requesterName,
  onClose,
  onSent,
}: {
  firmId: number
  requesterName: string
  onClose: () => void
  onSent: () => void
}) {
  const [form, setForm] = useState({ report_type: 'financial', period: 'current_month', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const cls = 'w-full rounded-lg px-3 py-2.5 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50 text-sm'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const access = localStorage.getItem('access')
    if (!access) { setError('Not signed in'); return }
    setSaving(true); setError('')
    try {
      await createReportRequest({ firm_id: firmId, requester_name: requesterName, ...form }, access)
      onSent()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-primary-950 border border-neutral-700/50 rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-heading text-body-lg text-neutral-50">Request Firm Report</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Secretary will be notified to generate this report.</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/40 transition-colors text-lg">×</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-1.5">Report Type</label>
            <select value={form.report_type} onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))} className={cls}>
              <option value="financial">Financial Summary</option>
              <option value="case_summary">Case Summary</option>
              <option value="activity">Activity Report</option>
              <option value="all">Full Firm Report</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-1.5">Period</label>
            <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} className={cls}>
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="ytd">Year to Date</option>
              <option value="all_time">All Time</option>
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-1.5">Notes <span className="text-neutral-500 normal-case font-normal">optional</span></label>
            <textarea
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any specific details to include…"
              rows={3}
              className={`${cls} resize-none`}
            />
          </div>
          {error && <p className="text-red-300 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-neutral-300 hover:text-neutral-100 text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-semibold text-sm transition-colors">
              {saving ? 'Sending…' : <span className="flex items-center gap-1.5"><SendIcon className="w-3.5 h-3.5" width={14} height={14} />Send to Secretary</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MyOfficePage() {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [lawyerStats, setLawyerStats] = useState<LawyerStats | null>(null)
  const [memberships, setMemberships] = useState<FirmMembership[]>([])
  const [reportRequests, setReportRequests] = useState<ReportRequest[]>([])
  const [clientProfiles, setClientProfiles] = useState<Map<string, UserProfile>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [userName, setUserName] = useState('')

  const firmMembership = memberships.find(m => ['owner', 'firm_admin', 'partner'].includes(m.role))
  const firmId = firmMembership?.firm

  const load = useCallback(async () => {
    const access = localStorage.getItem('access')
    const lawyerId = localStorage.getItem('authUserId')
    const storedName = localStorage.getItem('fullName') || ''
    setUserName(storedName)
    if (!access || !lawyerId) { setError('Sign in as a lawyer to view your office.'); setLoading(false); return }

    const [casesRes, statsRes, membershipsRes] = await Promise.allSettled([
      getMyCases(access),
      getLawyerStats(lawyerId, access),
      getMyFirmMemberships(access),
    ])

    let caseList: CaseItem[] = []
    if (casesRes.status === 'fulfilled') {
      caseList = casesRes.value.results
      setCases(caseList)
    }
    if (statsRes.status === 'fulfilled') setLawyerStats(statsRes.value)
    if (membershipsRes.status === 'fulfilled') {
      const ms = membershipsRes.value
      setMemberships(ms)
      const activeFirm = ms.find(m => ['owner', 'firm_admin', 'partner'].includes(m.role))
      if (activeFirm) {
        try {
          const rr = await listReportRequests(activeFirm.firm, access)
          setReportRequests(rr.results ?? [])
        } catch { /* non-fatal */ }
      }
    }

    if (caseList.length > 0) {
      const ids = caseList.map(c => c.id)
      const [evtsRes] = await Promise.allSettled([listEventsForCases(ids, access)])
      if (evtsRes.status === 'fulfilled') {
        const today = new Date().toISOString().split('T')[0]
        setEvents(evtsRes.value.filter(e => e.date >= today && e.status !== 'cancelled'))
      }

      const clientIds = [...new Set(caseList.map(c => c.client_id))]
      const profiles = new Map<string, UserProfile>()
      await Promise.allSettled(
        clientIds.slice(0, 8).map(async id => {
          try {
            const p = await getUserById(id, access)
            profiles.set(id, p)
          } catch { /* noop */ }
        }),
      )
      setClientProfiles(profiles)
    }

    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const todayStr = new Date().toISOString().split('T')[0]
  const openCases = useMemo(() => cases.filter(c => !['closed', 'dismissed', 'archived', 'settled'].includes(c.status)), [cases])
  const todayEvents = useMemo(() => events.filter(e => e.date === todayStr), [events, todayStr])
  const urgentCases = useMemo(() => openCases.filter(c => ['awaiting_court_date', 'hearing_adjourned', 'hearing_scheduled'].includes(c.status)), [openCases])

  if (!loading && error) return <Card className="border border-red-500/30 p-4"><p className="text-red-300 text-sm">{error}</p></Card>

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-display-md text-neutral-50">My Office</h2>
          <p className="mt-1 text-sm text-neutral-400">Live matters, clients, and firm activity.</p>
        </div>
        <div className="flex gap-2">
          {firmId && (
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-700/50 text-neutral-300 hover:text-neutral-100 hover:border-neutral-500 text-sm transition-colors"
            >
              <ChartBarIcon className="w-4 h-4" width={16} height={16} />
              Request Report
            </button>
          )}
          <Link href="/lawyer/matters" className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors">
            View Matters
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-neutral-400 py-16">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading…
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Open Matters', value: openCases.length, sub: `${cases.length} total`, accent: 'text-gold-400' },
              { label: 'Active Clients', value: new Set(openCases.map(c => c.client_id)).size, sub: 'unique clients', accent: 'text-blue-400' },
              { label: 'Upcoming Events', value: events.length, sub: `${todayEvents.length} today`, accent: todayEvents.length > 0 ? 'text-amber-400' : 'text-neutral-400' },
              { label: 'Closed (Total)', value: lawyerStats?.closed_cases_count ?? cases.filter(c => ['closed', 'settled', 'verdict'].includes(c.status)).length, sub: lawyerStats ? `avg ${Math.round(lawyerStats.avg_resolution_days)}d resolution` : 'completed', accent: 'text-emerald-400' },
            ].map(({ label, value, sub, accent }) => (
              <div key={label} className="bg-primary-900/50 border border-neutral-700/40 rounded-xl p-4">
                <p className={`text-3xl font-bold ${accent}`}>{value}</p>
                <p className="text-sm text-neutral-300 mt-0.5 font-medium">{label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* Urgent cases alert */}
          {urgentCases.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-400">⚠</span>
                <h4 className="text-sm font-semibold text-amber-300">Matters Needing Attention</h4>
                <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{urgentCases.length}</span>
              </div>
              <div className="space-y-1.5">
                {urgentCases.slice(0, 3).map(c => (
                  <Link key={c.id} href={`/cases/${c.id}`} className="flex items-center gap-3 py-1.5 border-t border-amber-500/10 group">
                    <span className="flex-1 text-sm text-neutral-300 group-hover:text-neutral-100 truncate">{c.title}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${statusColor(c.status)}`}>{c.status.replace(/_/g, ' ')}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent matters */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Recent Matters</h3>
                <Link href="/lawyer/matters" className="text-xs text-gold-300 hover:text-gold-200">All matters →</Link>
              </div>
              {openCases.length === 0 ? (
                <Card className="p-6 text-center"><p className="text-neutral-400 text-sm">No active matters.</p></Card>
              ) : (
                <div className="space-y-2">
                  {openCases.slice(0, 6).map(c => {
                    const client = clientProfiles.get(c.client_id)
                    return (
                      <Link key={c.id} href={`/cases/${c.id}`} className="block">
                        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-neutral-700/40 bg-primary-900/30 hover:border-neutral-600/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-100 truncate">{c.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] uppercase text-neutral-500">{c.case_type}</span>
                              {client && <span className="text-[10px] text-neutral-400">· {client.full_name}</span>}
                              <span className="text-[10px] text-neutral-600">{formatRelative(c.updated_at)}</span>
                            </div>
                          </div>
                          <span className={`flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full border capitalize ${statusColor(c.status)}`}>
                            {c.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Right column: Today + Events */}
            <div className="space-y-4">
              {/* Today's schedule */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Today's Schedule</h3>
                {todayEvents.length === 0 ? (
                  <div className="border border-dashed border-neutral-700/50 rounded-xl p-6 text-center">
                    <p className="text-neutral-500 text-sm">No events today</p>
                    <Link href="/lawyer/calendar" className="text-xs text-gold-300 hover:text-gold-200 mt-1 inline-block">Open calendar →</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayEvents.map(ev => (
                      <div key={ev.id} className="p-3 rounded-lg border border-neutral-700/40 bg-primary-900/30">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gold-300">{ev.time?.slice(0, 5)}</span>
                          <span className="text-xs capitalize text-neutral-400">{ev.event_type}</span>
                        </div>
                        {ev.location && <p className="text-xs text-neutral-500 mt-0.5 truncate">📍 {ev.location}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming events (next 3) */}
              {events.filter(e => e.date > todayStr).slice(0, 3).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Upcoming Events</h3>
                  <div className="space-y-2">
                    {events.filter(e => e.date > todayStr).slice(0, 3).map(ev => {
                      const [, m, d] = ev.date.split('-').map(Number)
                      return (
                        <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-700/30 bg-primary-900/20">
                          <div className="text-center w-8 flex-shrink-0">
                            <p className="text-[9px] text-neutral-500 uppercase">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]}</p>
                            <p className="text-sm font-bold text-neutral-200">{d}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-neutral-300 capitalize">{ev.event_type}</p>
                            <p className="text-[10px] text-neutral-500">{ev.time?.slice(0, 5)}</p>
                          </div>
                        </div>
                      )
                    })}
                    <Link href="/lawyer/calendar" className="text-xs text-gold-300 hover:text-gold-200 block text-center mt-1">
                      View full calendar →
                    </Link>
                  </div>
                </div>
              )}

              {/* Quick links */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Quick Links</h3>
                <div className="space-y-1.5">
                  {[
                    { label: '👥 Clients', href: '/lawyer/clients' },
                    { label: '📅 Calendar', href: '/lawyer/calendar' },
                    { label: '📄 Documents', href: '/documents' },
                    { label: '⚙️ Settings', href: '/lawyer/settings' },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-700/30 text-sm text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-colors">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Report Requests (visible to firm admin/owner/partner) */}
          {firmId && reportRequests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Report Requests</h3>
                <button onClick={() => setShowReportModal(true)} className="text-xs text-gold-300 hover:text-gold-200">+ New request</button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-neutral-700/40">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-700/40 bg-primary-800/40">
                      <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Type</th>
                      <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Period</th>
                      <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Requested by</th>
                      <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Status</th>
                      <th className="text-left px-4 py-3 text-xs text-neutral-400 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRequests.map((rr, i) => (
                      <tr key={rr.id} className={`border-b border-neutral-700/20 ${i % 2 === 0 ? 'bg-primary-800/20' : ''}`}>
                        <td className="px-4 py-3 text-neutral-200 font-medium">{REPORT_TYPE_LABELS[rr.report_type] ?? rr.report_type}</td>
                        <td className="px-4 py-3 text-neutral-400">{PERIOD_LABELS[rr.period] ?? rr.period}</td>
                        <td className="px-4 py-3 text-neutral-400">{rr.requester_name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${reportStatusCls(rr.status)}`}>{rr.status}</span>
                        </td>
                        <td className="px-4 py-3 text-neutral-500 text-xs">{new Date(rr.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showReportModal && firmId && (
        <ReportRequestModal
          firmId={firmId}
          requesterName={userName}
          onClose={() => setShowReportModal(false)}
          onSent={() => { setShowReportModal(false); void load() }}
        />
      )}
    </div>
  )
}
