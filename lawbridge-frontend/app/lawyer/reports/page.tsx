'use client'

import React, { useEffect, useState, useRef } from 'react'
import { getMyCases, getIncomingBookings, type CaseItem } from '../../../lib/casesApi'
import { getMyFirmMemberships, getFirmMembers, getFirmLawyers, type FirmMembership, type FirmLawyer } from '../../../lib/firmsApi'
import { getReportRequests, acknowledgeReportRequest, type ReportRequestItem } from '../../../lib/monitoringApi'
import { ClipboardIcon, PaymentIcon, UserIcon, BalanceIcon, CalendarIcon, BuildingIcon, BarChart2Icon, PrinterIcon, InboxIcon } from '../../../components/icons/Icons'
import { Badge } from '../../../components/ui/Badge'

function fmtXAF(n: number) { return n > 0 ? `${n.toLocaleString()} XAF` : '0 XAF' }
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}
function fmtNow() {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

type ReportType = 'general' | 'financial' | 'clients' | 'lawyers' | 'activity' | 'full'
type Period = 'current_month' | 'last_month' | 'ytd' | 'all_time'
type IconComp = React.FC<{ className?: string; width?: number; height?: number }>

const REPORT_TYPES: { id: ReportType; label: string; Icon: IconComp; desc: string }[] = [
  { id: 'general',   label: 'General Report',       Icon: ClipboardIcon, desc: 'High-level overview: active cases, team, bookings' },
  { id: 'financial', label: 'Financial Report',      Icon: PaymentIcon,   desc: 'Revenue, payment status, fee breakdown per booking' },
  { id: 'clients',   label: 'Clients Report',        Icon: UserIcon,      desc: 'All clients, their matters, status, and contact info' },
  { id: 'lawyers',   label: 'Lawyers Participation', Icon: BalanceIcon,   desc: 'Case assignments, load, and performance by lawyer' },
  { id: 'activity',  label: 'Activity Report',       Icon: CalendarIcon,  desc: 'Timeline of all firm events, status changes, and notes' },
  { id: 'full',      label: 'Full Firm Report',      Icon: BuildingIcon,  desc: 'Complete report combining all sections above' },
]

function ChartThumbnail({ type, active }: { type: ReportType; active: boolean }) {
  const stroke = active ? '#C9A84C' : '#404040'
  const fill = active ? '#C9A84C22' : '#ffffff0a'
  const w = 52, h = 30
  const accent = active ? '#C9A84C' : '#555'

  if (type === 'general') {
    const bars = [18, 28, 22, 30, 12, 24]
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="flex-shrink-0 opacity-80">
        {bars.map((v, i) => (
          <rect key={i} x={i * 8 + 2} y={h - v} width="6" height={v} rx="1" fill={i === 3 ? accent : fill} stroke={i === 3 ? accent : stroke} strokeWidth="0.5" />
        ))}
      </svg>
    )
  }
  if (type === 'financial') {
    const pts = '2,28 10,20 18,24 26,14 34,18 42,8 50,12'
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="flex-shrink-0 opacity-80">
        <polyline points={pts} stroke={accent} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <polygon points={`${pts} 50,30 2,30`} fill={fill} />
      </svg>
    )
  }
  if (type === 'clients') {
    const cx = w / 2, cy = h / 2, r = 12
    const segs = [0.45, 0.3, 0.25]
    const colors = [accent, stroke, '#ffffff18']
    let angle = -Math.PI / 2
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="flex-shrink-0 opacity-80">
        {segs.map((pct, i) => {
          const start = angle
          const end = angle + pct * 2 * Math.PI
          const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
          const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end)
          const lg = pct > 0.5 ? 1 : 0
          const d = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} Z`
          angle = end
          return <path key={i} d={d} fill={colors[i]} stroke="none" />
        })}
        <circle cx={cx} cy={cy} r={6} fill="#0a0f1e" />
      </svg>
    )
  }
  if (type === 'lawyers') {
    const bars = [40, 28, 22, 16, 10]
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="flex-shrink-0 opacity-80">
        {bars.map((bw, i) => (
          <rect key={i} x={2} y={i * 5 + 2} width={bw} height="3.5" rx="1" fill={i === 0 ? accent : fill} stroke={i === 0 ? accent : stroke} strokeWidth="0.5" />
        ))}
      </svg>
    )
  }
  if (type === 'activity') {
    const dots = [[4,4],[12,4],[20,4],[28,4],[36,4],[44,4],[4,12],[12,12],[20,12],[28,12],[36,12],[4,20],[12,20],[20,20]]
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="flex-shrink-0 opacity-80">
        {dots.map(([cx, cy], i) => (
          <rect key={i} x={cx - 2} y={cy - 2} width="4" height="4" rx="0.5" fill={i % 3 === 0 ? accent : fill} stroke={stroke} strokeWidth="0.5" />
        ))}
      </svg>
    )
  }
  // full
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="flex-shrink-0 opacity-80">
      <rect x={1} y={1} width={24} height={13} rx="1" fill={fill} stroke={stroke} strokeWidth="0.5" />
      <rect x={27} y={1} width={24} height={13} rx="1" fill={fill} stroke={stroke} strokeWidth="0.5" />
      <rect x={1} y={16} width={50} height={13} rx="1" fill={fill} stroke={accent} strokeWidth="0.5" />
      {[5,9,13,17,21].map(x => <line key={x} x1={x} y1={19} x2={x} y2={27} stroke={accent} strokeWidth="0.8" />)}
    </svg>
  )
}

const PERIODS: { id: Period; label: string }[] = [
  { id: 'current_month', label: 'Current Month' },
  { id: 'last_month',    label: 'Last Month' },
  { id: 'ytd',           label: 'Year to Date' },
  { id: 'all_time',      label: 'All Time' },
]

function filterByPeriod<T extends { created_at: string }>(items: T[], period: Period): T[] {
  const now = new Date()
  if (period === 'all_time') return items
  let from: Date
  switch (period) {
    case 'current_month': from = new Date(now.getFullYear(), now.getMonth(), 1); break
    case 'last_month':    from = new Date(now.getFullYear(), now.getMonth() - 1, 1); break
    default:              from = new Date(now.getFullYear(), 0, 1)
  }
  const to = period === 'last_month' ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(now.getTime() + 1)
  return items.filter(i => { const d = new Date(i.created_at); return d >= from && d < to })
}

interface ReportData {
  cases: CaseItem[]
  bookings: CaseItem[]
  members: FirmMembership[]
  lawyers: FirmLawyer[]
  firmName: string
  period: Period
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold text-neutral-100 border-b border-neutral-700/40 pb-2 mb-4">{title}</h2>
      {children}
    </div>
  )
}

function StatGrid({ stats }: { stats: { label: string; value: string | number; sub?: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
      {stats.map(s => (
        <div key={s.label} className="bg-primary-900/50 border border-neutral-700/40 rounded-xl p-4">
          <p className="text-2xl font-bold text-neutral-50">{s.value}</p>
          <p className="text-sm text-neutral-400 mt-0.5">{s.label}</p>
          {s.sub && <p className="text-xs text-neutral-600 mt-0.5">{s.sub}</p>}
        </div>
      ))}
    </div>
  )
}

function GeneralSection({ data }: { data: ReportData }) {
  const open   = data.cases.filter(c => !['closed', 'dismissed', 'archived', 'settled'].includes(c.status))
  const closed = data.cases.filter(c => ['closed', 'settled'].includes(c.status))
  const pending = data.bookings.filter(b => b.booking_status === 'pending')
  return (
    <Section title="Firm Overview">
      <StatGrid stats={[
        { label: 'Total Cases',      value: data.cases.length },
        { label: 'Open Cases',       value: open.length,          sub: `${closed.length} closed` },
        { label: 'Pending Bookings', value: pending.length },
        { label: 'Firm Members',     value: data.members.length,  sub: `${data.lawyers.length} lawyers` },
      ]} />
      <div className="overflow-x-auto rounded-xl border border-neutral-700/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700/40 bg-primary-800/40">
              {['Matter', 'Type', 'Status', 'Opened'].map(h => (
                <th key={h} className="text-left px-4 py-2 text-xs text-neutral-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.cases.slice(0, 15).map((c, i) => (
              <tr key={c.id} className={`border-b border-neutral-700/20 ${i % 2 === 0 ? 'bg-primary-800/10' : ''}`}>
                <td className="px-4 py-2 text-neutral-200 truncate max-w-[200px]">{c.title}</td>
                <td className="px-4 py-2 text-neutral-400 text-xs capitalize">{c.case_type}</td>
                <td className="px-4 py-2 text-neutral-400 text-xs capitalize">{c.status.replace(/_/g, ' ')}</td>
                <td className="px-4 py-2 text-neutral-500 text-xs">{fmtDate(c.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.cases.length > 15 && <p className="text-xs text-neutral-600 mt-2">Showing 15 of {data.cases.length} cases.</p>}
    </Section>
  )
}

function FinancialSection({ data }: { data: ReportData }) {
  const rows = data.bookings.map(b => {
    const meta = b.booking_metadata ?? {}
    const c    = parseFloat(meta.consultation_fee || meta.booking_fee || '0') || 0
    const p    = parseFloat(meta.procedural_fee   || '0') || 0
    const prof = parseFloat(meta.professional_fee || '0') || 0
    return {
      id: b.id, title: b.title, consult: c, proc: p, prof,
      total: c + p,
      pay_status: meta.payment_status || 'none',
      method: meta.payment_method || '—',
      ref: meta.payment_reference || '—',
    }
  })
  const verified = rows.filter(r => r.pay_status === 'verified').reduce((s, r) => s + r.total, 0)
  const pending  = rows.filter(r => r.pay_status === 'pending_verification').reduce((s, r) => s + r.total, 0)
  const total    = rows.reduce((s, r) => s + r.total, 0)
  return (
    <Section title="Financial Report">
      <StatGrid stats={[
        { label: 'Total Billed',         value: fmtXAF(total) },
        { label: 'Verified Revenue',     value: fmtXAF(verified), sub: `${rows.filter(r => r.pay_status === 'verified').length} payments` },
        { label: 'Pending Verification', value: fmtXAF(pending),  sub: `${rows.filter(r => r.pay_status === 'pending_verification').length} pending` },
        { label: 'Total Bookings',       value: rows.length },
      ]} />
      <div className="overflow-x-auto rounded-xl border border-neutral-700/40">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700/40 bg-primary-800/40">
              {['Matter', 'Consultation', 'Procedural', 'Professional', 'Total', 'Status', 'Method', 'Reference'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs text-neutral-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={`border-b border-neutral-700/20 ${i % 2 === 0 ? 'bg-primary-800/10' : ''}`}>
                <td className="px-3 py-2 text-neutral-200 truncate max-w-[160px]">{r.title}</td>
                <td className="px-3 py-2 text-neutral-400 text-right">{fmtXAF(r.consult)}</td>
                <td className="px-3 py-2 text-neutral-400 text-right">{fmtXAF(r.proc)}</td>
                <td className="px-3 py-2 text-neutral-500 text-right text-xs">{r.prof > 0 ? fmtXAF(r.prof) : 'TBD'}</td>
                <td className="px-3 py-2 text-neutral-200 font-semibold text-right">{fmtXAF(r.total)}</td>
                <td className="px-3 py-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded-full border text-[10px] ${
                    r.pay_status === 'verified'             ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    r.pay_status === 'pending_verification' ? 'bg-amber-500/10   text-amber-400   border-amber-500/30' :
                                                             'bg-neutral-800/30  text-neutral-500  border-neutral-700/30'}`}>
                    {r.pay_status === 'pending_verification' ? 'Pending' : r.pay_status}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-500 text-xs">{r.method}</td>
                <td className="px-3 py-2 text-neutral-600 font-mono text-xs">{r.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}

function ClientsSection({ data }: { data: ReportData }) {
  const byClient: Record<string, CaseItem[]> = {}
  for (const c of data.bookings) {
    const email = c.booking_metadata?.client_email || c.client_id || 'Unknown'
    if (!byClient[email]) byClient[email] = []
    byClient[email].push(c)
  }
  const clients = Object.entries(byClient)
  return (
    <Section title="Clients Report">
      <StatGrid stats={[
        { label: 'Unique Clients', value: clients.length },
        { label: 'Total Matters',  value: data.bookings.length },
        { label: 'Accepted',       value: data.bookings.filter(b => b.booking_status === 'accepted').length },
        { label: 'Pending',        value: data.bookings.filter(b => b.booking_status === 'pending').length },
      ]} />
      <div className="space-y-3">
        {clients.map(([email, cases]) => (
          <div key={email} className="rounded-xl border border-neutral-700/40 bg-primary-900/20 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary-800 border border-neutral-700/40 flex items-center justify-center text-xs font-bold text-neutral-300">
                {email[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-100">{email}</p>
                <p className="text-xs text-neutral-500">{cases.length} matter{cases.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="space-y-1 pl-11">
              {cases.map(c => (
                <div key={c.id} className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="truncate flex-1">{c.title}</span>
                  <span className="text-neutral-600 capitalize">{c.status.replace(/_/g, ' ')}</span>
                  <span className="text-neutral-600">{fmtDate(c.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {clients.length === 0 && <p className="text-neutral-500 text-sm italic">No client data for this period.</p>}
      </div>
    </Section>
  )
}

function LawyersSection({ data }: { data: ReportData }) {
  const byLawyer: Record<string, CaseItem[]> = {}
  for (const c of data.cases) {
    const id = c.assigned_lawyer_id ? String(c.assigned_lawyer_id) : 'unassigned'
    if (!byLawyer[id]) byLawyer[id] = []
    byLawyer[id].push(c)
  }
  return (
    <Section title="Lawyer Participation">
      <StatGrid stats={[
        { label: 'Firm Lawyers',    value: data.lawyers.length },
        { label: 'Assigned Cases',  value: data.cases.filter(c => c.assigned_lawyer_id).length },
        { label: 'Unassigned',      value: data.cases.filter(c => !c.assigned_lawyer_id).length },
        { label: 'Avg Load',        value: data.lawyers.length > 0 ? (data.cases.length / data.lawyers.length).toFixed(1) : '—', sub: 'cases per lawyer' },
      ]} />
      <div className="space-y-3">
        {data.lawyers.map(l => {
          const assigned = byLawyer[l.id] || []
          const open = assigned.filter(c => !['closed', 'dismissed', 'archived', 'settled'].includes(c.status))
          return (
            <div key={l.id} className="rounded-xl border border-neutral-700/40 bg-primary-900/20 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary-800 border border-neutral-700/40 flex items-center justify-center text-xs font-bold text-gold-400">
                  {l.name[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-100">{l.name}</p>
                  <p className="text-xs text-neutral-500">{l.specialization || l.role || 'Lawyer'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-neutral-50">{assigned.length}</p>
                  <p className="text-xs text-neutral-500">{open.length} open</p>
                </div>
              </div>
              {assigned.length > 0 && (
                <div className="space-y-1 pl-11 mt-2">
                  {assigned.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center gap-2 text-xs text-neutral-400">
                      <span className="truncate flex-1">{c.title}</span>
                      <span className="text-neutral-600 capitalize">{c.status.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                  {assigned.length > 5 && <p className="text-xs text-neutral-600">+{assigned.length - 5} more</p>}
                </div>
              )}
            </div>
          )
        })}
        {byLawyer['unassigned']?.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-300 mb-2">Unassigned Cases ({byLawyer['unassigned'].length})</p>
            <div className="space-y-1">
              {byLawyer['unassigned'].slice(0, 5).map(c => (
                <div key={c.id} className="text-xs text-neutral-400 truncate">{c.title} — {fmtDate(c.created_at)}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Section>
  )
}

function ActivitySection({ data }: { data: ReportData }) {
  type Event = { date: string; type: string; title: string; detail: string }
  const events: Event[] = []
  for (const c of data.cases) {
    for (const t of (c.timeline || [])) {
      events.push({ date: t.timestamp, type: t.status, title: c.title, detail: t.notes })
    }
  }
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return (
    <Section title="Activity Report">
      <StatGrid stats={[
        { label: 'Total Events',        value: events.length },
        { label: 'Cases with Activity', value: data.cases.filter(c => c.timeline?.length).length },
        { label: 'New Bookings',        value: data.bookings.length },
        { label: 'Period',              value: PERIODS.find(p => p.id === data.period)?.label || data.period },
      ]} />
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {events.slice(0, 50).map((e, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg border border-neutral-700/30 bg-primary-900/20">
            <div className="flex-shrink-0 w-20 text-xs text-neutral-600">{fmtDate(e.date)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-neutral-300 capitalize">
                {e.type.replace(/_/g, ' ')} — <span className="text-neutral-400">{e.title}</span>
              </p>
              {e.detail && <p className="text-xs text-neutral-600 mt-0.5">{e.detail}</p>}
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-neutral-500 text-sm italic">No activity events for this period.</p>}
        {events.length > 50 && <p className="text-xs text-neutral-600">Showing 50 of {events.length} events.</p>}
      </div>
    </Section>
  )
}

function ReportContent({ data, type }: { data: ReportData; type: ReportType }) {
  return (
    <>
      {(type === 'general'   || type === 'full') && <GeneralSection  data={data} />}
      {(type === 'financial' || type === 'full') && <FinancialSection data={data} />}
      {(type === 'clients'   || type === 'full') && <ClientsSection  data={data} />}
      {(type === 'lawyers'   || type === 'full') && <LawyersSection  data={data} />}
      {(type === 'activity'  || type === 'full') && <ActivitySection data={data} />}
    </>
  )
}

const REPORT_TYPE_MAP: Record<string, ReportType> = {
  case_summary: 'general', financial: 'financial', clients: 'clients',
  lawyers: 'lawyers', activity: 'activity', all: 'full',
}

export default function LawyerReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('general')
  const [period, setPeriod]         = useState<Period>('current_month')
  const [data, setData]             = useState<ReportData | null>(null)
  const [loading, setLoading]       = useState(false)
  const [firmName, setFirmName]     = useState('Your Firm')
  const [firmId, setFirmId]         = useState<number | null>(null)
  const [requests, setRequests]     = useState<ReportRequestItem[]>([])
  const [ackingId, setAckingId]     = useState<string | null>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const access = localStorage.getItem('access')
    if (!access) return
    getMyFirmMemberships(access)
      .then(async ms => {
        const active = ms.find(m => m.is_active !== false)
        if (!active) return
        setFirmId(active.firm)
        setFirmName(`Firm #${active.firm}`)
        try {
          const raw = await getReportRequests(active.firm, access)
          const items = Array.isArray(raw) ? raw : (raw as { results?: ReportRequestItem[] }).results ?? []
          setRequests(items.filter(r => r.status === 'delivered' || r.status === 'pending'))
        } catch { /* non-fatal */ }
      })
      .catch(() => {})
  }, [])

  async function acknowledge(id: string) {
    const access = localStorage.getItem('access')
    if (!access) return
    setAckingId(id)
    try {
      await acknowledgeReportRequest(id, access)
      setRequests(prev => prev.filter(r => r.id !== id))
    } finally {
      setAckingId(null)
    }
  }

  function loadFromRequest(req: ReportRequestItem) {
    const mapped = REPORT_TYPE_MAP[req.report_type] ?? 'general'
    setReportType(mapped)
    setPeriod(req.period as Period)
  }

  async function generate() {
    const access = localStorage.getItem('access')
    if (!access) return
    setLoading(true); setData(null)
    try {
      const [casesRes, bookingsRes, membershipsRes] = await Promise.allSettled([
        getMyCases(access),
        getIncomingBookings(access),
        getMyFirmMemberships(access),
      ])
      const allCases    = casesRes.status    === 'fulfilled' ? (casesRes.value.results    ?? []) : []
      const allBookings = bookingsRes.status === 'fulfilled' ? (bookingsRes.value.results ?? []) : []
      let members: FirmMembership[] = []
      let lawyers: FirmLawyer[]    = []
      let fName = firmName

      if (membershipsRes.status === 'fulfilled') {
        const active = membershipsRes.value.find(m => m.is_active !== false)
        if (active) {
          fName = `Firm #${active.firm}`
          const [memRes, lawRes] = await Promise.allSettled([
            getFirmMembers(active.firm, access),
            getFirmLawyers(active.firm, access),
          ])
          if (memRes.status === 'fulfilled') members = memRes.value
          if (lawRes.status === 'fulfilled') { lawyers = lawRes.value; setFirmName(fName) }
        }
      }

      const filtered         = filterByPeriod(allCases, period)
      const filteredBookings = filterByPeriod(allBookings, period)
      setData({
        cases:    filtered.length         > 0 ? filtered         : allCases,
        bookings: filteredBookings.length > 0 ? filteredBookings : allBookings,
        members, lawyers, firmName: fName, period,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <style>{`@media print { .no-print { display: none !important; } .print-report { background: white !important; color: black !important; } }`}</style>

      <header className="no-print">
        <h1 className="font-display text-display-md text-neutral-50">Reports</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Generate firm reports. Your secretary can ship reports to you from the Secretary Portal — they appear below.
        </p>
      </header>

      {/* Secretary inbox */}
      {requests.length > 0 && (
        <div className="no-print rounded-xl border border-primary-400/20 bg-primary-900/20 p-5 space-y-3">
          <h2 className="font-heading text-body-lg text-neutral-50 flex items-center gap-2">
            <InboxIcon className="w-5 h-5 text-primary-400" />
            From Secretary
            <Badge variant="danger" className="ml-1">{requests.length} new</Badge>
          </h2>
          <div className="space-y-2">
            {requests.map((req, ri) => {
              const typeLabel = REPORT_TYPES.find(r => r.id === (REPORT_TYPE_MAP[req.report_type] ?? req.report_type))?.label ?? req.report_type
              const periodLabel = PERIODS.find(p => p.id === req.period)?.label ?? req.period
              const ago = (() => {
                const diff = Date.now() - new Date(req.created_at).getTime()
                const h = Math.floor(diff / 3600000)
                if (h < 1) return 'just now'
                if (h < 24) return `${h}h ago`
                return `${Math.floor(h / 24)}d ago`
              })()
              return (
                <div key={req.id} className="flex items-center gap-4 rounded-lg border border-primary-400/10 bg-primary-900/30 px-4 py-3 stagger-child" style={{ '--i': Math.min(ri, 8) } as React.CSSProperties}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-100">
                      {req.requester_name || 'Secretary'} shipped a <span className="text-gold-300">{typeLabel}</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">{periodLabel} · {ago}</p>
                    {req.notes && <p className="text-xs text-neutral-400 mt-1 truncate">{req.notes}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => { loadFromRequest(req); window.scrollTo({ top: 999, behavior: 'smooth' }) }}
                      className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-gold-500/20 transition-colors"
                    >
                      Generate
                    </button>
                    <button
                      onClick={() => acknowledge(req.id)}
                      disabled={ackingId === req.id}
                      className="rounded-lg border border-neutral-600/40 px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 transition-colors disabled:opacity-40"
                    >
                      {ackingId === req.id ? '…' : 'Dismiss'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="no-print grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Report type selector */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Report Type</p>
          <div className="space-y-2">
            {REPORT_TYPES.map(rt => (
              <button key={rt.id} onClick={() => setReportType(rt.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  reportType === rt.id
                    ? 'border-portal bg-portal-soft'
                    : 'border-neutral-700/40 hover:border-neutral-600/50 bg-primary-900/20'}`}>
                <span className={`flex-shrink-0 ${reportType === rt.id ? 'text-portal-accent' : 'text-neutral-500'}`}>
                  <rt.Icon width={18} height={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-100">{rt.label}</p>
                  <p className="text-xs text-neutral-500">{rt.desc}</p>
                </div>
                <ChartThumbnail type={rt.id} active={reportType === rt.id} />
              </button>
            ))}
          </div>
        </div>

        {/* Period + actions */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Period</p>
            <div className="grid grid-cols-2 gap-2">
              {PERIODS.map(p => (
                <button key={p.id} onClick={() => setPeriod(p.id)}
                  className={`p-3 rounded-xl border text-sm transition-colors ${
                    period === p.id
                      ? 'border-gold-500/50 bg-gold-500/10 text-gold-300'
                      : 'border-neutral-700/40 text-neutral-400 hover:border-neutral-600/50 hover:text-neutral-200'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={loading}
            className="w-full py-3 rounded-xl bg-gold-500/20 border border-gold-500/30 text-gold-300 hover:bg-gold-500/30 font-semibold text-sm transition-colors disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
                Generating…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <BarChart2Icon width={16} height={16} />
                Generate Report
              </span>
            )}
          </button>

          {data && (
            <button onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl border border-neutral-700/40 text-neutral-300 hover:text-neutral-100 text-sm font-medium transition-colors">
              <span className="flex items-center justify-center gap-2">
                <PrinterIcon width={14} height={14} />
                Print / Save as PDF
              </span>
            </button>
          )}

          {data && (
            <div className="rounded-xl border border-neutral-700/40 bg-primary-900/20 p-4">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Report Info</p>
              <div className="space-y-1 text-xs text-neutral-400">
                <p>Firm: <span className="text-neutral-200">{data.firmName}</span></p>
                <p>Type: <span className="text-neutral-200">{REPORT_TYPES.find(r => r.id === reportType)?.label}</span></p>
                <p>Period: <span className="text-neutral-200">{PERIODS.find(p => p.id === period)?.label}</span></p>
                <p>Generated: <span className="text-neutral-200">{fmtNow()}</span></p>
                <p>Cases: <span className="text-neutral-200">{data.cases.length}</span> · Bookings: <span className="text-neutral-200">{data.bookings.length}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report output */}
      {data && (
        <div ref={reportRef} className="print-report bg-primary-950 rounded-2xl border border-neutral-700/40 p-6">
          <div className="border-b border-neutral-700/40 pb-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-gold-400 uppercase tracking-widest font-semibold">Confidential — Internal Report</p>
                <h1 className="font-display text-2xl font-bold text-neutral-50 mt-1">{REPORT_TYPES.find(r => r.id === reportType)?.label}</h1>
                <p className="text-sm text-neutral-400 mt-0.5">{data.firmName} · {PERIODS.find(p => p.id === period)?.label}</p>
              </div>
              <div className="text-right text-xs text-neutral-500">
                <p>Generated: {fmtNow()}</p>
                <p>Prepared by: Firm Owner / Lawyer</p>
              </div>
            </div>
          </div>
          <ReportContent data={data} type={reportType} />
        </div>
      )}

      {!data && !loading && (
        <div className="rounded-2xl border border-neutral-700/40 bg-primary-900/20 p-12 text-center">
          <div className="flex justify-center mb-4">
            <BarChart2Icon width={48} height={48} className="text-neutral-700" />
          </div>
          <p className="text-neutral-300 font-medium">Select a report type and period, then click Generate</p>
          <p className="text-neutral-500 text-sm mt-1">Reports pull live data from your firm's cases, bookings, and team.</p>
        </div>
      )}
    </div>
  )
}
