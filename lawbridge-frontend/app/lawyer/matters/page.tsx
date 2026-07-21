"use client"

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../components/ui/Card'
import { getMyCases, type CaseItem } from '../../../lib/casesApi'
import { ChevronUpIcon, ChevronDownIcon, SearchIcon } from '../../../components/icons/Icons'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', filed: 'Filed', assigned: 'Assigned',
  under_review: 'Under Review', evidence_collection: 'Evidence Collection',
  in_progress: 'In Progress', hearing_scheduled: 'Hearing Scheduled',
  hearing_adjourned: 'Adjourned', mediation: 'Mediation',
  appeal_filed: 'Appeal Filed', appeal_in_progress: 'Appeal In Progress',
  awaiting_court_date: 'Awaiting Court Date', closed: 'Closed',
  dismissed: 'Dismissed', settled: 'Settled', verdict: 'Verdict', archived: 'Archived',
}

function statusBadgeCls(s: string) {
  if (s === 'closed' || s === 'dismissed' || s === 'archived') return 'border-neutral-600 text-neutral-400 bg-neutral-800/50'
  if (s === 'settled' || s === 'verdict') return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
  if (s === 'filed' || s === 'assigned') return 'border-primary-400/30 text-primary-100 bg-primary-400/10'
  return 'border-gold-500/30 text-gold-400 bg-gold-500/10'
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(' ')
  const init = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
  return (
    <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 text-[11px] font-bold text-gold-300 ring-1 ring-gold-500/20">
      {init.toUpperCase() || '?'}
    </span>
  )
}

type SortDir = 'asc' | 'desc'

function SortIcon({ field, sort }: { field: string; sort: { field: string; dir: SortDir } }) {
  if (sort.field !== field) return <ChevronDownIcon className="w-3 h-3 opacity-30" />
  return sort.dir === 'asc' ? <ChevronUpIcon className="w-3 h-3 text-gold-400" /> : <ChevronDownIcon className="w-3 h-3 text-gold-400" />
}

function Th({ label, field, sort, onSort }: { label: string; field: string; sort: { field: string; dir: SortDir }; onSort: (f: string) => void }) {
  return (
    <th
      onClick={() => onSort(field)}
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400 cursor-pointer select-none hover:text-neutral-200 transition-colors"
    >
      <span className="inline-flex items-center gap-1.5">
        {label} <SortIcon field={field} sort={sort} />
      </span>
    </th>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={10} className="px-4 py-16 text-center text-neutral-500 text-sm">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl opacity-30">⚖️</span>
          <span>{message}</span>
        </div>
      </td>
    </tr>
  )
}

// ── Desktop data tables ────────────────────────────────────────────────────────

function PendingTable({ items, search }: { items: CaseItem[]; search: string }) {
  const [sort, setSort] = useState<{ field: string; dir: SortDir }>({ field: 'created_at', dir: 'desc' })

  function toggleSort(field: string) {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })
  }

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    let r = items.filter(i => !q || i.title.toLowerCase().includes(q) || i.case_type.toLowerCase().includes(q))
    r = [...r].sort((a, b) => {
      let va = '', vb = ''
      if (sort.field === 'title') { va = a.title; vb = b.title }
      else if (sort.field === 'consultation_type') { va = a.booking_metadata?.consultation_type ?? ''; vb = b.booking_metadata?.consultation_type ?? '' }
      else if (sort.field === 'preferred_date') { va = a.booking_metadata?.preferred_date ?? ''; vb = b.booking_metadata?.preferred_date ?? '' }
      else { va = a.created_at; vb = b.created_at }
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    return r
  }, [items, search, sort])

  return (
    <div className="overflow-x-auto rounded-xl border border-amber-500/15 bg-primary-900/40">
      <table className="w-full">
        <thead className="border-b border-amber-500/10 bg-amber-500/5">
          <tr>
            <Th label="Case" field="title" sort={sort} onSort={toggleSort} />
            <Th label="Consultation" field="consultation_type" sort={sort} onSort={toggleSort} />
            <Th label="Requested" field="preferred_date" sort={sort} onSort={toggleSort} />
            <Th label="Received" field="created_at" sort={sort} onSort={toggleSort} />
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.length === 0 ? <EmptyState message="No pending bookings" /> : rows.map(item => {
            const meta = item.booking_metadata ?? {}
            return (
              <tr key={item.id} className="group hover:bg-amber-500/5 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Initials name={item.title} />
                    <div>
                      <p className="font-medium text-neutral-100 text-sm leading-tight">{item.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 capitalize">{item.case_type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-neutral-300 capitalize">
                  {meta.consultation_type?.replace(/_/g, ' ') ?? '—'}
                </td>
                <td className="px-4 py-3.5 text-sm text-neutral-400">
                  {meta.preferred_date
                    ? <>{meta.preferred_date}{meta.preferred_time ? <span className="ml-1 text-neutral-500">at {meta.preferred_time}</span> : ''}</>
                    : <span className="text-neutral-600">Not set</span>}
                </td>
                <td className="px-4 py-3.5 text-sm text-neutral-500">{formatDate(item.created_at)}</td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`/bookings/${item.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/20 hover:border-amber-400/40 hover:text-amber-300"
                  >
                    Respond →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ActiveTable({ items, search }: { items: CaseItem[]; search: string }) {
  const [sort, setSort] = useState<{ field: string; dir: SortDir }>({ field: 'updated_at', dir: 'desc' })

  function toggleSort(field: string) {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })
  }

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    let r = items.filter(i => !q || i.title.toLowerCase().includes(q) || i.case_type.toLowerCase().includes(q))
    r = [...r].sort((a, b) => {
      let va = '', vb = ''
      if (sort.field === 'title') { va = a.title; vb = b.title }
      else if (sort.field === 'consultation_type') { va = a.booking_metadata?.consultation_type ?? ''; vb = b.booking_metadata?.consultation_type ?? '' }
      else { va = a.updated_at; vb = b.updated_at }
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    return r
  }, [items, search, sort])

  return (
    <div className="overflow-x-auto rounded-xl border border-emerald-500/15 bg-primary-900/40">
      <table className="w-full">
        <thead className="border-b border-emerald-500/10 bg-emerald-500/5">
          <tr>
            <Th label="Case" field="title" sort={sort} onSort={toggleSort} />
            <Th label="Consultation" field="consultation_type" sort={sort} onSort={toggleSort} />
            <Th label="Date Accepted" field="updated_at" sort={sort} onSort={toggleSort} />
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.length === 0 ? <EmptyState message="No active consultations" /> : rows.map(item => {
            const meta = item.booking_metadata ?? {}
            return (
              <tr key={item.id} className="group hover:bg-emerald-500/5 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Initials name={item.title} />
                    <div>
                      <p className="font-medium text-neutral-100 text-sm leading-tight">{item.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5 capitalize">{item.case_type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-neutral-300 capitalize">
                  {meta.consultation_type?.replace(/_/g, ' ') ?? '—'}
                </td>
                <td className="px-4 py-3.5 text-sm text-neutral-500">{formatDate(item.updated_at)}</td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    href={`/bookings/${item.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-400/40 hover:text-emerald-300"
                  >
                    View details →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LegalTable({ items, search }: { items: CaseItem[]; search: string }) {
  const [sort, setSort] = useState<{ field: string; dir: SortDir }>({ field: 'updated_at', dir: 'desc' })

  function toggleSort(field: string) {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })
  }

  const rows = useMemo(() => {
    const q = search.toLowerCase()
    let r = items.filter(i => !q || i.title.toLowerCase().includes(q) || i.case_type.toLowerCase().includes(q) || (STATUS_LABELS[i.status] ?? '').toLowerCase().includes(q))
    r = [...r].sort((a, b) => {
      let va = '', vb = ''
      if (sort.field === 'title') { va = a.title; vb = b.title }
      else if (sort.field === 'case_type') { va = a.case_type; vb = b.case_type }
      else if (sort.field === 'status') { va = a.status; vb = b.status }
      else if (sort.field === 'created_at') { va = a.created_at; vb = b.created_at }
      else { va = a.updated_at; vb = b.updated_at }
      return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    })
    return r
  }, [items, search, sort])

  return (
    <div className="overflow-x-auto rounded-xl border border-gold-500/15 bg-primary-900/40">
      <table className="w-full">
        <thead className="border-b border-gold-500/10 bg-gold-500/5">
          <tr>
            <Th label="Case" field="title" sort={sort} onSort={toggleSort} />
            <Th label="Type" field="case_type" sort={sort} onSort={toggleSort} />
            <Th label="Status" field="status" sort={sort} onSort={toggleSort} />
            <Th label="Filed" field="created_at" sort={sort} onSort={toggleSort} />
            <Th label="Updated" field="updated_at" sort={sort} onSort={toggleSort} />
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-neutral-400">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.length === 0 ? <EmptyState message="No legal matters" /> : rows.map(item => (
            <tr key={item.id} className="group hover:bg-gold-500/5 transition-colors">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <Initials name={item.title} />
                  <p className="font-medium text-neutral-100 text-sm leading-tight max-w-xs truncate">{item.title}</p>
                </div>
              </td>
              <td className="px-4 py-3.5 text-sm text-neutral-400 capitalize">{item.case_type}</td>
              <td className="px-4 py-3.5">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusBadgeCls(item.status)}`}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </td>
              <td className="px-4 py-3.5 text-sm text-neutral-500">{formatDate(item.created_at)}</td>
              <td className="px-4 py-3.5 text-sm text-neutral-500">{formatDate(item.updated_at)}</td>
              <td className="px-4 py-3.5 text-right">
                <Link
                  href={`/cases/${item.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-gold-500/25 bg-gold-500/10 px-3 py-1.5 text-xs font-semibold text-gold-400 transition-all hover:bg-gold-500/20 hover:border-gold-400/40 hover:text-gold-300"
                >
                  Open →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Mobile card sections (unchanged) ──────────────────────────────────────────

function MobileCards({ pendingMatters, bookingMatters, legalMatters }: {
  pendingMatters: CaseItem[]
  bookingMatters: CaseItem[]
  legalMatters: CaseItem[]
}) {
  return (
    <>
      {pendingMatters.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-500/70 mb-3">Awaiting Your Response</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pendingMatters.map(item => {
              const meta = item.booking_metadata ?? {}
              return (
                <Link key={item.id} href={`/bookings/${item.id}`} className="block group">
                  <Card className="h-full cursor-pointer hover:border-amber-500/30 transition-colors border-amber-500/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-100 truncate">{item.title}</p>
                        <p className="text-xs text-primary-300 mt-0.5">{item.case_type}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium border-amber-500/30 bg-amber-500/10 text-amber-400">Pending</span>
                    </div>
                    {meta.consultation_type && <p className="mt-2 text-sm text-neutral-400 capitalize">{meta.consultation_type.replace('_', ' ')}</p>}
                    {meta.preferred_date && <p className="mt-1 text-xs text-neutral-500">Requested: {meta.preferred_date}{meta.preferred_time ? ` at ${meta.preferred_time}` : ''}</p>}
                    <p className="mt-2 text-xs text-neutral-500">Received {formatDate(item.created_at)}</p>
                    <p className="mt-3 text-sm font-medium text-amber-400 group-hover:text-amber-300 transition-colors">Respond to request →</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {bookingMatters.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-3">Active Consultations</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {bookingMatters.map(item => {
              const meta = item.booking_metadata ?? {}
              return (
                <Link key={item.id} href={`/bookings/${item.id}`} className="block group">
                  <Card className="h-full cursor-pointer hover:border-gold-500/40 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-100 truncate">{item.title}</p>
                        <p className="text-xs text-primary-300 mt-0.5">{item.case_type}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Accepted</span>
                    </div>
                    {meta.consultation_type && <p className="mt-2 text-sm text-neutral-400 capitalize">{meta.consultation_type.replace('_', ' ')}</p>}
                    {meta.preferred_date && <p className="mt-1 text-xs text-neutral-500">Requested: {meta.preferred_date}{meta.preferred_time ? ` at ${meta.preferred_time}` : ''}</p>}
                    <p className="mt-2 text-xs text-primary-400">Accepted {formatDate(item.updated_at)}</p>
                    <p className="mt-3 text-sm font-medium text-gold-300 group-hover:text-gold-200 transition-colors">View booking details →</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {legalMatters.length > 0 && (
        <section className="mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400 mb-3">Legal Matters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {legalMatters.map(item => (
              <Link key={item.id} href={`/cases/${item.id}`} className="block group">
                <Card className="h-full cursor-pointer hover:border-gold-500/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-100 truncate">{item.title}</p>
                      <p className="text-xs text-primary-300 mt-0.5">{item.case_type}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusBadgeCls(item.status)}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-primary-400">Updated {formatDate(item.updated_at)}</p>
                  <p className="mt-3 text-sm font-medium text-gold-300 group-hover:text-gold-200 transition-colors">Open matter →</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

// ── Kanban View ───────────────────────────────────────────────────────────────

const KANBAN_COLS = [
  { key: 'assigned',            label: 'Assigned',        color: 'border-gold-400/30 bg-gold-500/5',       badge: 'bg-gold-500/20 text-gold-300',    dot: 'bg-gold-400' },
  { key: 'in_progress',         label: 'In Progress',     color: 'border-primary-400/30 bg-primary-500/5', badge: 'bg-primary-400/20 text-primary-100', dot: 'bg-primary-400' },
  { key: 'evidence_collection', label: 'Evidence',        color: 'border-amber-400/30 bg-amber-500/5',     badge: 'bg-amber-500/20 text-amber-300',  dot: 'bg-amber-400' },
  { key: 'hearing_scheduled',   label: 'Hearing Set',     color: 'border-primary-400/30 bg-primary-500/5', badge: 'bg-primary-400/20 text-primary-100', dot: 'bg-primary-400' },
  { key: 'awaiting_court_date', label: 'Awaiting Court',  color: 'border-amber-400/30 bg-amber-500/5',     badge: 'bg-amber-500/20 text-amber-300',  dot: 'bg-amber-400' },
  { key: 'verdict',             label: 'Verdict / Closed', color: 'border-emerald-400/30 bg-emerald-500/5', badge: 'bg-emerald-500/20 text-emerald-300', dot: 'bg-emerald-400' },
]

function KanbanView({ items, search }: { items: CaseItem[]; search: string }) {
  const q = search.toLowerCase()
  const filtered = q ? items.filter(i => i.title.toLowerCase().includes(q) || i.case_type.toLowerCase().includes(q)) : items

  const grouped: Record<string, CaseItem[]> = {}
  const other: CaseItem[] = []
  filtered.forEach(item => {
    const col = KANBAN_COLS.find(c => c.key === item.status)
    if (col) { grouped[col.key] = [...(grouped[col.key] ?? []), item] }
    else other.push(item)
  })

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
      {KANBAN_COLS.map(col => {
        const colItems = grouped[col.key] ?? []
        return (
          <div key={col.key} className={`flex-shrink-0 w-56 rounded-2xl border ${col.color} flex flex-col`}>
            <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-300">{col.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${col.badge}`}>{colItems.length}</span>
            </div>
            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
              {colItems.length === 0 ? (
                <div className="text-center py-8 text-neutral-700 text-xs">No cases here</div>
              ) : colItems.map((item, idx) => (
                <Link key={item.id} href={`/cases/${item.id}`} className="block stagger-child" style={{ '--i': idx } as React.CSSProperties}>
                  <div className="rounded-xl bg-primary-900/60 border border-white/6 p-3 hover:border-white/15 hover:bg-primary-800/60 transition-all flex items-start gap-2">
                    <span className={`w-1 mt-1 self-stretch rounded-full flex-shrink-0 opacity-60 ${col.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-100 leading-snug line-clamp-2">{item.title}</p>
                      <p className="text-[10px] text-neutral-500 mt-1 capitalize">{item.case_type.replace(/_/g, ' ')}</p>
                      <p className="text-[9px] text-neutral-700 mt-0.5 tabular-nums">#{item.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )
      })}
      {other.length > 0 && (
        <div className="flex-shrink-0 w-56 rounded-2xl border border-neutral-700/30 bg-neutral-800/20 flex flex-col">
          <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">Other</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-neutral-700/40 text-neutral-400">{other.length}</span>
          </div>
          <div className="p-2 space-y-2">
            {other.map(item => (
              <Link key={item.id} href={`/cases/${item.id}`} className="block">
                <div className="rounded-xl bg-primary-900/60 border border-white/6 p-3 hover:border-white/12 transition-all">
                  <p className="text-xs font-medium text-neutral-200 leading-snug line-clamp-2">{item.title}</p>
                  <span className={`inline-flex mt-1 text-[10px] px-1.5 py-0.5 rounded-full border ${statusBadgeCls(item.status)}`}>{STATUS_LABELS[item.status] ?? item.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Statute of Limitations Calculator ────────────────────────────────────────

const SOL_RULES: { caseType: string; years: number; label: string; note?: string }[] = [
  { caseType: 'Civil / Contract', years: 5, label: '5 years', note: 'Civil Code Art. 2224' },
  { caseType: 'Criminal (Felony)', years: 10, label: '10 years', note: 'Code of Criminal Procedure' },
  { caseType: 'Criminal (Misdemeanor)', years: 3, label: '3 years', note: 'Code of Criminal Procedure' },
  { caseType: 'Labour / Employment', years: 5, label: '5 years', note: 'Labour Code' },
  { caseType: 'Property / Land', years: 30, label: '30 years', note: 'Long-form prescription' },
  { caseType: 'Commercial (OHADA)', years: 5, label: '5 years', note: 'OHADA Uniform Act' },
  { caseType: 'Family / Divorce', years: 2, label: '2 years', note: 'From date of separation' },
  { caseType: 'Administrative', years: 2, label: '2 years', note: 'Administrative Procedure Code' },
  { caseType: 'Medical Malpractice', years: 3, label: '3 years', note: 'From date of discovery' },
  { caseType: 'Personal Injury', years: 3, label: '3 years', note: 'Civil Code' },
]

function SoLCalculator() {
  const [caseType, setCaseType] = useState(SOL_RULES[0].caseType)
  const [incidentDate, setIncidentDate] = useState('')

  const rule = SOL_RULES.find(r => r.caseType === caseType) ?? SOL_RULES[0]

  const deadline = incidentDate ? (() => {
    const d = new Date(incidentDate)
    d.setFullYear(d.getFullYear() + rule.years)
    return d
  })() : null

  const daysLeft = deadline ? Math.round((deadline.getTime() - Date.now()) / 86400000) : null
  const isPast = daysLeft !== null && daysLeft < 0
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 90

  return (
    <div className="rounded-2xl border border-primary-400/20 bg-primary-500/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-primary-400/15 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-neutral-200">Statute of Limitations Calculator</h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-400/15 text-primary-300 border border-primary-400/20">Cameroon Law</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-neutral-500 block mb-1">Case Type</label>
          <select
            value={caseType}
            onChange={e => setCaseType(e.target.value)}
            className="w-full rounded-xl bg-primary-900/60 border border-white/10 px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-primary-400/40"
          >
            {SOL_RULES.map(r => <option key={r.caseType} value={r.caseType}>{r.caseType}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-1">Incident / Act Date</label>
          <input
            type="date"
            value={incidentDate}
            onChange={e => setIncidentDate(e.target.value)}
            className="w-full rounded-xl bg-primary-900/60 border border-white/10 px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-primary-400/40"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-1">Limitation Period</label>
          <div className="rounded-xl bg-primary-900/40 border border-white/8 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-primary-300">{rule.label}</span>
            {rule.note && <span className="text-[10px] text-neutral-600">{rule.note}</span>}
          </div>
        </div>
      </div>

      {deadline && (
        <div className={`rounded-xl px-4 py-3 border flex items-center gap-3 ${
          isPast   ? 'bg-crimson-700/10 border-crimson-500/30' :
          isUrgent ? 'bg-amber-500/10 border-amber-500/30' :
                     'bg-emerald-500/8 border-emerald-500/20'
        }`}>
          <div>
            <p className={`text-sm font-bold ${isPast ? 'text-crimson-400' : isUrgent ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isPast ? 'Limitation period has EXPIRED' : `Deadline: ${deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
            </p>
            {!isPast && daysLeft !== null && (
              <p className={`text-xs mt-0.5 ${isUrgent ? 'text-amber-300' : 'text-neutral-400'}`}>
                {daysLeft === 0 ? 'Expires today' : `${daysLeft.toLocaleString()} days remaining`}
                {isUrgent && ' — file urgently'}
              </p>
            )}
            {isPast && <p className="text-xs text-crimson-300 mt-0.5">This matter may no longer be actionable. Consult applicable exceptions.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

type ActiveTab = 'pending' | 'active' | 'legal'
type ViewMode = 'list' | 'kanban'

export default function LawyerMattersPage() {
  const [items, setItems] = useState<CaseItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<ActiveTab>('pending')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showSoL, setShowSoL] = useState(false)

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { setError('Sign in as a lawyer to view active matters.'); setLoading(false); return }
      try {
        const response = await getMyCases(access)
        setItems(response.results ?? [])
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load matters')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  const pendingMatters  = items.filter(i => i.booking_status === 'pending')
  const bookingMatters  = items.filter(i => i.booking_status === 'accepted')
  const legalMatters    = items.filter(i => !i.booking_status)
  const visibleItems    = items.filter(i => i.booking_status !== 'declined')

  const TABS: { key: ActiveTab; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: pendingMatters.length },
    { key: 'active',  label: 'Active',  count: bookingMatters.length },
    { key: 'legal',   label: 'Legal Matters', count: legalMatters.length },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-display-md">Matters</h2>
          <p className="mt-1 text-sm text-primary-300">Cases and consultations assigned to you.</p>
        </div>
        <button
          onClick={() => setShowSoL(v => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            showSoL
              ? 'bg-primary-400/20 border-primary-400/40 text-primary-300'
              : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:border-white/15 hover:text-neutral-200'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          SoL Calculator
        </button>
      </div>

      {showSoL && <div className="mt-4"><SoLCalculator /></div>}

      {error && <Card className="mt-4 border border-crimson-500/30 text-crimson-200">{error}</Card>}

      {loading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl skeleton" />)}
        </div>
      )}

      {!loading && !error && visibleItems.length === 0 && (
        <div className="mt-6 rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-14 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
          </div>
          <h3 className="font-semibold text-neutral-200 text-base">No matters yet</h3>
          <p className="mt-1.5 max-w-sm mx-auto text-sm text-neutral-500 leading-relaxed">
            Your caseload will appear here once clients book a consultation with you and you accept their request.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            {[
              { icon: '⚙️', title: 'Set up your profile', text: 'Complete your specialization, fees, and availability so clients can find you.', href: '/lawyer/settings' },
              { icon: '📋', title: 'Check Bookings', text: 'New client consultation requests arrive in the Bookings section for your review.', href: '/lawyer/bookings' },
              { icon: '🔍', title: 'Get discovered', text: 'Clients search for lawyers by practice area and circuit. Make sure your profile is public.', href: '/lawyer/profile' },
            ].map(({ icon, title, text, href }) => (
              <Link key={title} href={href} className="flex flex-col gap-1.5 rounded-xl border border-white/6 bg-primary-900/40 px-4 py-3 hover:border-gold-500/20 hover:bg-primary-900/60 transition-colors">
                <span className="text-xl">{icon}</span>
                <p className="text-xs font-semibold text-neutral-300">{title}</p>
                <p className="text-[11px] text-neutral-500 leading-relaxed">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && visibleItems.length > 0 && (
        <>
          {/* ── Desktop view ──────────────────────────────────────────────────── */}
          <div className="hidden lg:block mt-6">
            {/* Tabs + search row */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex gap-1 rounded-xl border border-white/8 bg-primary-900/40 p-1">
                {TABS.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                      tab === t.key
                        ? 'bg-primary-700/80 text-neutral-100 shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {t.label}
                    <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                      tab === t.key
                        ? t.key === 'pending' ? 'bg-amber-500/20 text-amber-400'
                          : t.key === 'active' ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-gold-500/20 text-gold-400'
                        : 'bg-white/10 text-neutral-500'
                    }`}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* View toggle — only meaningful on Legal Matters */}
                {tab === 'legal' && (
                  <div className="flex rounded-xl border border-white/8 bg-primary-900/40 p-1">
                    {([['list', 'M4 6h16M4 10h16M4 14h16M4 18h16'], ['kanban', 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2']] as [ViewMode, string][]).map(([mode, d]) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        title={mode === 'list' ? 'List view' : 'Board view'}
                        className={`p-1.5 rounded-lg transition-colors ${viewMode === mode ? 'bg-gold-500/15 text-gold-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={d} />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative w-56">
                  <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500">
                    <SearchIcon width={14} height={14} />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search matters…"
                    className="w-full rounded-xl border border-white/10 bg-primary-900/60 py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-gold-500/40 focus:ring-1 focus:ring-gold-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Table / Kanban */}
            {tab === 'pending' && <PendingTable items={pendingMatters} search={search} />}
            {tab === 'active'  && <ActiveTable  items={bookingMatters} search={search} />}
            {tab === 'legal' && viewMode === 'list'   && <LegalTable   items={legalMatters} search={search} />}
            {tab === 'legal' && viewMode === 'kanban' && <KanbanView   items={legalMatters} search={search} />}
          </div>

          {/* ── Mobile cards ──────────────────────────────────────────────────── */}
          <div className="lg:hidden">
            <MobileCards
              pendingMatters={pendingMatters}
              bookingMatters={bookingMatters}
              legalMatters={legalMatters}
            />
          </div>
        </>
      )}
    </div>
  )
}
