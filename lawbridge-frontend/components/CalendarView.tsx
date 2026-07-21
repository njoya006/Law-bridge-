'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Card } from './ui/Card'
import { getMyCases, getUserById, type CaseItem, type UserProfile } from '../lib/casesApi'
import {
  listEventsForCases,
  createCalendarEvent,
  approveCalendarEvent,
  rejectCalendarEvent,
  type CalendarEvent,
} from '../lib/calendarApi'

// ── constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const NEEDS_SCHEDULING = new Set([
  'awaiting_court_date',
  'hearing_scheduled',
  'hearing_adjourned',
  'in_progress',
])

// ── date helpers ──────────────────────────────────────────────────────────────

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00')
  d.setDate(d.getDate() + n)
  return ymd(d)
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00')
  d.setDate(d.getDate() - d.getDay())
  return ymd(d)
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b + 'T00:00').getTime() - new Date(a + 'T00:00').getTime()) / 86_400_000)
}

// ── style helpers ─────────────────────────────────────────────────────────────

function eventTypeCls(type: string) {
  switch (type) {
    case 'hearing': return 'bg-gold-500/20 text-gold-300 border-gold-500/30'
    case 'meeting': return 'bg-primary-500/20 text-primary-300 border-primary-500/30'
    case 'verdict': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    default: return 'bg-neutral-700/30 text-neutral-300 border-neutral-600/30'
  }
}

function statusCls(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    case 'pending': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    case 'cancelled':
    case 'rejected': return 'bg-crimson-500/10 text-crimson-300 border-crimson-500/30'
    default: return 'bg-neutral-700/30 text-neutral-300 border-neutral-600/30'
  }
}

function caseStatusCls(status: string) {
  if (['closed', 'dismissed', 'archived'].includes(status)) return 'text-neutral-500'
  if (['hearing_scheduled', 'hearing_adjourned', 'awaiting_court_date'].includes(status)) return 'text-amber-400'
  if (['in_progress', 'evidence_collection', 'mediation'].includes(status)) return 'text-primary-400'
  if (['verdict', 'settled'].includes(status)) return 'text-emerald-400'
  return 'text-neutral-400'
}

function dotColor(type: string) {
  switch (type) {
    case 'hearing': return 'bg-gold-400'
    case 'meeting': return 'bg-primary-400'
    case 'verdict': return 'bg-emerald-400'
    case 'consultation': return 'bg-amber-400'
    default: return 'bg-neutral-500'
  }
}

// ── types ─────────────────────────────────────────────────────────────────────

type ConsultationItem = {
  type: 'consultation'
  case_id: string
  date: string
  time: string
  consultation_type: string
  urgency: string
  location: string
  virtual_link?: string
}

type AnyDayItem = { kind: 'event'; data: CalendarEvent } | { kind: 'consult'; data: ConsultationItem }

// ── extract consultations from accepted cases ─────────────────────────────────

function extractConsultations(cases: CaseItem[]): ConsultationItem[] {
  const items: ConsultationItem[] = []
  for (const c of cases) {
    const meta = c.booking_metadata
    if (c.booking_status === 'accepted' && meta?.preferred_date) {
      items.push({
        type: 'consultation',
        case_id: c.id,
        date: meta.preferred_date,
        time: meta.preferred_time ?? '09:00',
        consultation_type: meta.consultation_type ?? 'consultation',
        urgency: meta.urgency ?? 'normal',
        location: meta.location ?? (meta.virtual_link ? 'Virtual' : 'TBD'),
        virtual_link: meta.virtual_link,
      })
    }
  }
  return items
}

// ── New Event Modal ───────────────────────────────────────────────────────────

type NewEventForm = {
  case_id: string
  event_type: string
  date: string
  time: string
  location: string
  virtual_link: string
}

function NewEventModal({
  cases,
  defaultDate,
  userId,
  onClose,
  onCreated,
}: {
  cases: CaseItem[]
  defaultDate?: string
  userId: string
  onClose: () => void
  onCreated: () => void
}) {
  const todayStr = ymd(new Date())
  const [form, setForm] = useState<NewEventForm>({
    case_id: '',
    event_type: 'hearing',
    date: defaultDate && defaultDate > todayStr ? defaultDate : '',
    time: '09:00',
    location: '',
    virtual_link: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const activeCases = cases.filter(
    c => !['closed', 'dismissed', 'archived', 'settled', 'verdict'].includes(c.status),
  )

  const set = (k: keyof NewEventForm, v: string) => setForm(f => ({ ...f, [k]: v }))
  const cls =
    'w-full rounded-lg px-3 py-2.5 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50 text-sm'
  const labelCls = 'text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-1.5'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.case_id) { setError('Select a case'); return }
    if (!form.date) { setError('Pick a date'); return }
    const access = localStorage.getItem('access')
    if (!access) { setError('Not signed in'); return }
    setSaving(true); setError('')
    try {
      await createCalendarEvent(
        {
          case_id: form.case_id,
          event_type: form.event_type as CalendarEvent['event_type'],
          date: form.date,
          time: form.time,
          location: form.location || 'TBD',
          virtual_link: form.virtual_link || null,
          initiator_id: userId,
        },
        access,
      )
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule event')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-primary-950 border border-neutral-700/50 rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-body-lg text-neutral-50">Schedule Event</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/40 transition-colors text-lg"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelCls}>Case</label>
            <select value={form.case_id} onChange={e => set('case_id', e.target.value)} className={cls} required>
              <option value="">— Select a case —</option>
              {activeCases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.case_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Event Type</label>
            <select value={form.event_type} onChange={e => set('event_type', e.target.value)} className={cls}>
              <option value="hearing">Hearing</option>
              <option value="meeting">Meeting</option>
              <option value="verdict">Verdict</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date" value={form.date} onChange={e => set('date', e.target.value)}
                min={todayStr} className={cls} required
              />
            </div>
            <div>
              <label className={labelCls}>Time</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} className={cls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Location</label>
            <input
              type="text" value={form.location} onChange={e => set('location', e.target.value)}
              placeholder="Courtroom, office address…" className={cls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Virtual Link <span className="text-neutral-500 normal-case font-normal ml-1">optional</span>
            </label>
            <input
              type="url" value={form.virtual_link} onChange={e => set('virtual_link', e.target.value)}
              placeholder="https://meet.google.com/…" className={cls}
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-neutral-300 hover:text-neutral-100 hover:border-neutral-500 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-black font-semibold text-sm transition-colors"
            >
              {saving ? 'Scheduling…' : 'Schedule Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Event Card ────────────────────────────────────────────────────────────────

function EventCard({
  event,
  caseData,
  userId,
  onAction,
}: {
  event: CalendarEvent
  caseData?: CaseItem
  userId: string
  onAction: () => void
}) {
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const myApproval = event.approvals?.find(a => a.approver_id === userId)
  const canAct = myApproval?.status === 'pending'

  async function doAction(action: 'approve' | 'reject') {
    const access = localStorage.getItem('access')
    if (!access) return
    setBusy(action)
    try {
      if (action === 'approve') await approveCalendarEvent(event.id, access)
      else await rejectCalendarEvent(event.id, access)
      onAction()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="border border-neutral-700/40 rounded-lg p-3.5 bg-primary-900/30 hover:border-neutral-600/50 transition-colors">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${eventTypeCls(event.event_type)}`}>
          {event.event_type}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusCls(event.status)}`}>
          {event.status}
        </span>
      </div>

      {caseData && (
        <div className="mt-2">
          <p className="text-sm font-medium text-neutral-100 truncate">{caseData.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] uppercase tracking-wide text-neutral-500">{caseData.case_type}</span>
            <span className={`text-[10px] capitalize ${caseStatusCls(caseData.status)}`}>{caseData.status.replace(/_/g, ' ')}</span>
          </div>
        </div>
      )}

      <p className="text-sm font-semibold text-neutral-100 mt-2">{event.time?.slice(0, 5)}</p>

      {event.location && event.location !== 'TBD' && (
        <p className="text-xs text-neutral-400 mt-0.5">📍 {event.location}</p>
      )}
      {event.virtual_link && (
        <a
          href={event.virtual_link} target="_blank" rel="noopener noreferrer"
          className="text-xs text-gold-300 hover:text-gold-200 mt-0.5 inline-block"
        >
          Join virtual meeting →
        </a>
      )}

      {canAct && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => doAction('approve')} disabled={busy !== null}
            className="flex-1 py-1.5 text-xs rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            {busy === 'approve' ? '…' : '✓ Confirm'}
          </button>
          <button
            onClick={() => doAction('reject')} disabled={busy !== null}
            className="flex-1 py-1.5 text-xs rounded-md bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {busy === 'reject' ? '…' : '✕ Cancel'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Consultation Card ─────────────────────────────────────────────────────────

function ConsultationCard({ item, caseData }: { item: ConsultationItem; caseData?: CaseItem }) {
  return (
    <div className="border border-amber-500/30 rounded-lg p-3.5 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/30 font-medium">
          📅 Consultation
        </span>
        {item.urgency === 'urgent' && (
          <span className="text-xs px-1.5 py-0.5 rounded border bg-red-500/15 text-red-300 border-red-500/30">Urgent</span>
        )}
      </div>

      {caseData && (
        <div className="mt-2">
          <p className="text-sm font-medium text-neutral-100 truncate">{caseData.title}</p>
          <span className="text-[10px] uppercase tracking-wide text-neutral-500">{caseData.case_type}</span>
        </div>
      )}

      <p className="text-sm font-semibold text-neutral-100 mt-1.5">{item.time?.slice(0, 5)}</p>

      {item.location && item.location !== 'TBD' && (
        <p className="text-xs text-neutral-400 mt-0.5">📍 {item.location}</p>
      )}
      {item.virtual_link && (
        <a href={item.virtual_link} target="_blank" rel="noopener noreferrer"
          className="text-xs text-amber-300 hover:text-amber-200 mt-0.5 inline-block"
        >
          Join meeting →
        </a>
      )}

      <p className="text-[10px] text-neutral-500 mt-1.5">Client-requested time from booking</p>
    </div>
  )
}

// ── Agenda Summary Bar ────────────────────────────────────────────────────────

function AgendaSummary({
  todayEvents,
  weekEvents,
  pendingCount,
  alertCount,
}: {
  todayEvents: number
  weekEvents: number
  pendingCount: number
  alertCount: number
}) {
  const tiles = [
    { label: 'Today', value: todayEvents, color: 'text-gold-300' },
    { label: 'This week', value: weekEvents, color: 'text-blue-300' },
    { label: 'Pending confirm', value: pendingCount, color: 'text-amber-300' },
    { label: 'Need scheduling', value: alertCount, color: alertCount > 0 ? 'text-red-300' : 'text-neutral-400' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {tiles.map(({ label, value, color }) => (
        <div key={label} className="bg-primary-900/40 border border-neutral-700/40 rounded-xl p-3.5 text-center">
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

// ── Week View ─────────────────────────────────────────────────────────────────

function WeekView({
  weekStart,
  eventsByDate,
  consultsByDate,
  casesMap,
  userId,
  onLoad,
  onPickDate,
}: {
  weekStart: string
  eventsByDate: Map<string, CalendarEvent[]>
  consultsByDate: Map<string, ConsultationItem[]>
  casesMap: Map<string, CaseItem>
  userId: string
  onLoad: () => void
  onPickDate: (d: string) => void
}) {
  const todayStr = ymd(new Date())
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="space-y-1">
      {days.map(dateStr => {
        const evts = eventsByDate.get(dateStr) ?? []
        const consults = consultsByDate.get(dateStr) ?? []
        const total = evts.length + consults.length
        const isToday = dateStr === todayStr
        const [, m, d] = dateStr.split('-').map(Number)

        return (
          <div
            key={dateStr}
            className={`rounded-lg border transition-colors ${isToday ? 'border-gold-500/40 bg-gold-500/5' : 'border-neutral-700/30 hover:border-neutral-600/40'}`}
          >
            <button
              onClick={() => onPickDate(dateStr)}
              className="w-full flex items-center gap-3 p-3 text-left"
            >
              <div className="w-14 flex-shrink-0 text-center">
                <p className="text-[10px] uppercase font-semibold text-neutral-500">
                  {DAY_NAMES[new Date(dateStr + 'T00:00').getDay()]}
                </p>
                <p className={`text-lg font-bold leading-none ${isToday ? 'text-gold-300' : 'text-neutral-300'}`}>
                  {d}
                </p>
                <p className="text-[9px] text-neutral-600 uppercase">{MONTH_NAMES[m - 1].slice(0, 3)}</p>
              </div>

              <div className="flex-1 min-w-0">
                {total === 0 ? (
                  <p className="text-xs text-neutral-600">No events</p>
                ) : (
                  <div className="space-y-1">
                    {evts.map(ev => (
                      <div key={ev.id} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor(ev.event_type)}`} />
                        <span className="text-xs text-neutral-300 truncate">
                          {ev.time?.slice(0, 5)} · <span className="capitalize">{ev.event_type}</span>
                          {casesMap.get(ev.case_id) && ` · ${casesMap.get(ev.case_id)!.title}`}
                        </span>
                        <span className={`text-[10px] px-1 rounded border capitalize ${statusCls(ev.status)}`}>{ev.status}</span>
                      </div>
                    ))}
                    {consults.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-400" />
                        <span className="text-xs text-neutral-300 truncate">
                          {c.time?.slice(0, 5)} · Consultation
                          {casesMap.get(c.case_id) && ` · ${casesMap.get(c.case_id)!.title}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Deadline Alert Panel ──────────────────────────────────────────────────────

function DeadlineAlerts({
  cases,
  eventsByDate,
  today,
  onSchedule,
}: {
  cases: CaseItem[]
  eventsByDate: Map<string, CalendarEvent[]>
  today: string
  onSchedule: (caseId: string) => void
}) {
  const alertCases = useMemo(() => {
    const futureEventCaseIds = new Set<string>()
    for (const [date, evts] of eventsByDate) {
      if (date >= today) {
        for (const ev of evts) {
          if (ev.status !== 'cancelled' && ev.status !== 'rejected') {
            futureEventCaseIds.add(ev.case_id)
          }
        }
      }
    }
    return cases
      .filter(c => NEEDS_SCHEDULING.has(c.status) && !futureEventCaseIds.has(c.id))
      .map(c => ({
        ...c,
        daysSinceUpdate: daysBetween(c.updated_at?.slice(0, 10) ?? today, today),
      }))
      .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate)
  }, [cases, eventsByDate, today])

  if (alertCases.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-400 text-sm">⚠</span>
        <h4 className="text-sm font-semibold text-amber-300">Cases needing a scheduled event</h4>
        <span className="ml-auto text-xs text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
          {alertCases.length}
        </span>
      </div>
      <div className="space-y-2">
        {alertCases.map(c => (
          <div key={c.id} className="flex items-center justify-between gap-3 py-2 border-t border-amber-500/10">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-neutral-200 font-medium truncate">{c.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] uppercase text-neutral-500">{c.case_type}</span>
                <span className="text-[10px] text-amber-400 capitalize">{c.status.replace(/_/g, ' ')}</span>
                {c.daysSinceUpdate > 0 && (
                  <span className="text-[10px] text-neutral-500">{c.daysSinceUpdate}d since last update</span>
                )}
              </div>
            </div>
            <button
              onClick={() => onSchedule(c.id)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/30 hover:bg-gold-500/30 transition-colors"
            >
              + Schedule
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── iCal export ──────────────────────────────────────────────────────────────

function addOneHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function exportIcal(events: CalendarEvent[], consultations: ConsultationItem[], casesMap: Map<string, CaseItem>) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//LawBridge//LawBridge Calendar//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  ]

  for (const ev of events) {
    if (ev.status === 'cancelled' || ev.status === 'rejected') continue
    const c = casesMap.get(ev.case_id)
    const t = (ev.time ?? '09:00').slice(0, 5)
    const dt = ev.date.replace(/-/g, '') + 'T' + t.replace(':', '') + '00'
    const dtEnd = ev.date.replace(/-/g, '') + 'T' + addOneHour(t).replace(':', '') + '00'
    lines.push(
      'BEGIN:VEVENT',
      `UID:lb-ev-${ev.id}@lawbridge.cm`,
      `DTSTART:${dt}`, `DTEND:${dtEnd}`,
      `SUMMARY:${ev.event_type.toUpperCase()}${c ? ' – ' + c.title : ''}`,
      `LOCATION:${ev.location ?? 'TBD'}`,
      `STATUS:${ev.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT',
    )
  }

  for (const c of consultations) {
    const cas = casesMap.get(c.case_id)
    const t = (c.time ?? '09:00').slice(0, 5)
    const dt = c.date.replace(/-/g, '') + 'T' + t.replace(':', '') + '00'
    const dtEnd = c.date.replace(/-/g, '') + 'T' + addOneHour(t).replace(':', '') + '00'
    lines.push(
      'BEGIN:VEVENT',
      `UID:lb-consult-${c.case_id}-${c.date}@lawbridge.cm`,
      `DTSTART:${dt}`, `DTEND:${dtEnd}`,
      `SUMMARY:Consultation${cas ? ' – ' + cas.title : ''}`,
      `LOCATION:${c.location ?? 'TBD'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'lawbridge-calendar.ics'; a.click()
  URL.revokeObjectURL(url)
}

// ── Day View ──────────────────────────────────────────────────────────────────

function DayView({
  dateStr,
  dayEvents,
  dayConsults,
  casesMap,
  userId,
  onLoad,
}: {
  dateStr: string
  dayEvents: CalendarEvent[]
  dayConsults: ConsultationItem[]
  casesMap: Map<string, CaseItem>
  userId: string
  onLoad: () => void
}) {
  const HOURS = Array.from({ length: 13 }, (_, i) => i + 7) // 7am–7pm

  function parseHour(time?: string) {
    if (!time) return 9
    return parseInt(time.split(':')[0], 10)
  }

  return (
    <div className="space-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">{formatDisplayDate(dateStr)}</p>
      {HOURS.map(hour => {
        const evts = dayEvents.filter(e => parseHour(e.time) === hour)
        const consults = dayConsults.filter(c => parseHour(c.time) === hour)
        const total = evts.length + consults.length
        return (
          <div key={hour} className="flex gap-3 min-h-[3rem]">
            <div className="w-12 flex-shrink-0 pt-1">
              <span className="text-[10px] text-neutral-600 tabular-nums">{String(hour).padStart(2, '0')}:00</span>
            </div>
            <div className={`flex-1 border-l-2 pl-3 pb-2 ${total > 0 ? 'border-gold-500/30' : 'border-white/5'}`}>
              {total === 0 ? (
                <span className="text-[10px] text-neutral-800">—</span>
              ) : (
                <div className="space-y-1.5">
                  {evts.map(ev => {
                    const cas = casesMap.get(ev.case_id)
                    return (
                      <div key={ev.id} className={`rounded-lg px-2.5 py-1.5 border text-xs ${eventTypeCls(ev.event_type)}`}>
                        <span className="font-medium capitalize">{ev.event_type}</span>
                        {cas && <span className="text-neutral-400 ml-1 truncate"> · {cas.title}</span>}
                        {ev.location && ev.location !== 'TBD' && <span className="text-neutral-500 ml-1">@ {ev.location}</span>}
                      </div>
                    )
                  })}
                  {consults.map((c, i) => {
                    const cas = casesMap.get(c.case_id)
                    return (
                      <div key={i} className="rounded-lg px-2.5 py-1.5 border text-xs bg-amber-500/15 text-amber-300 border-amber-500/25">
                        <span className="font-medium">Consultation</span>
                        {cas && <span className="text-neutral-400 ml-1 truncate"> · {cas.title}</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── CalendarView ──────────────────────────────────────────────────────────────

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')

  const today = new Date()
  const todayStr = ymd(today)

  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [weekStart, setWeekStart] = useState(getWeekStart(todayStr))
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [showModal, setShowModal] = useState(false)
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>()
  const [preselectedCaseId, setPreselectedCaseId] = useState<string | undefined>()

  const load = useCallback(async () => {
    const access = localStorage.getItem('access')
    const uid = localStorage.getItem('authUserId')
    if (!access || !uid) {
      setError('Sign in to view your calendar.')
      setLoading(false)
      return
    }
    setUserId(uid)
    try {
      const { results: caseList } = await getMyCases(access)
      setCases(caseList)
      const ids = caseList.map(c => c.id)
      const evts = await listEventsForCases(ids, access)
      setEvents(evts.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  // ── derived maps ────────────────────────────────────────────────────────────

  const casesMap = useMemo(() => {
    const m = new Map<string, CaseItem>()
    for (const c of cases) m.set(c.id, c)
    return m
  }, [cases])

  const consultations = useMemo(() => extractConsultations(cases), [cases])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const arr = map.get(ev.date) ?? []
      arr.push(ev)
      map.set(ev.date, arr)
    }
    return map
  }, [events])

  const consultsByDate = useMemo(() => {
    const map = new Map<string, ConsultationItem[]>()
    for (const c of consultations) {
      const arr = map.get(c.date) ?? []
      arr.push(c)
      map.set(c.date, arr)
    }
    return map
  }, [consultations])

  const selectedEvents = useMemo(() => eventsByDate.get(selectedDate) ?? [], [eventsByDate, selectedDate])
  const selectedConsults = useMemo(() => consultsByDate.get(selectedDate) ?? [], [consultsByDate, selectedDate])

  // ── agenda stats ─────────────────────────────────────────────────────────────

  const agendaStats = useMemo(() => {
    const weekEnd = addDays(getWeekStart(todayStr), 6)
    let todayCount = (eventsByDate.get(todayStr)?.length ?? 0) + (consultsByDate.get(todayStr)?.length ?? 0)
    let weekCount = 0
    let pendingCount = 0

    for (const [date, evts] of eventsByDate) {
      if (date >= getWeekStart(todayStr) && date <= weekEnd) weekCount += evts.length
      for (const ev of evts) {
        if (ev.status === 'pending') {
          const myApproval = ev.approvals?.find(a => a.approver_id === userId)
          if (myApproval?.status === 'pending') pendingCount++
        }
      }
    }
    for (const [date, cs] of consultsByDate) {
      if (date >= getWeekStart(todayStr) && date <= weekEnd) weekCount += cs.length
    }

    const alertCases = cases.filter(c => {
      if (!NEEDS_SCHEDULING.has(c.status)) return false
      for (const [date, evts] of eventsByDate) {
        if (date >= todayStr) {
          for (const ev of evts) {
            if (ev.case_id === c.id && ev.status !== 'cancelled' && ev.status !== 'rejected') return false
          }
        }
      }
      return true
    })

    return { todayEvents: todayCount, weekEvents: weekCount, pendingCount, alertCount: alertCases.length }
  }, [eventsByDate, consultsByDate, cases, userId, todayStr])

  // ── upcoming list ─────────────────────────────────────────────────────────────

  const upcoming = useMemo(() => {
    const items: Array<{ date: string; time: string; label: string; sublabel: string; type: string; status?: string }> = []
    for (const ev of events) {
      if (ev.date >= todayStr && ev.status !== 'cancelled' && ev.status !== 'rejected') {
        const c = casesMap.get(ev.case_id)
        items.push({
          date: ev.date, time: ev.time ?? '',
          label: ev.event_type, sublabel: c?.title ?? ev.case_id.slice(0, 8),
          type: ev.event_type, status: ev.status,
        })
      }
    }
    for (const c of consultations) {
      if (c.date >= todayStr) {
        const cas = casesMap.get(c.case_id)
        items.push({
          date: c.date, time: c.time,
          label: 'Consultation', sublabel: cas?.title ?? c.case_id.slice(0, 8),
          type: 'consultation',
        })
      }
    }
    return items.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 10)
  }, [events, consultations, casesMap, todayStr])

  // ── calendar grid helpers ────────────────────────────────────────────────────

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  function prevPeriod() {
    if (viewMode === 'month') {
      if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
      else setViewMonth(m => m - 1)
    } else if (viewMode === 'week') {
      setWeekStart(addDays(weekStart, -7))
    } else {
      pickDay(addDays(selectedDate, -1))
    }
  }
  function nextPeriod() {
    if (viewMode === 'month') {
      if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
      else setViewMonth(m => m + 1)
    } else if (viewMode === 'week') {
      setWeekStart(addDays(weekStart, 7))
    } else {
      pickDay(addDays(selectedDate, 1))
    }
  }

  function pickDay(dateStr: string) {
    setSelectedDate(dateStr)
    const [y, m] = dateStr.split('-').map(Number)
    setViewYear(y); setViewMonth(m - 1)
  }

  function openModal(date?: string, caseId?: string) {
    setModalDefaultDate(date)
    setPreselectedCaseId(caseId)
    setShowModal(true)
  }

  const periodLabel = viewMode === 'month'
    ? `${MONTH_NAMES[viewMonth]} ${viewYear}`
    : viewMode === 'day'
    ? formatDisplayDate(selectedDate)
    : (() => {
        const ws = weekStart.split('-').map(Number)
        const we = addDays(weekStart, 6).split('-').map(Number)
        return `${ws[2]} ${MONTH_NAMES[ws[1] - 1].slice(0, 3)} – ${we[2]} ${MONTH_NAMES[we[1] - 1].slice(0, 3)} ${ws[0]}`
      })()

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-display-md text-neutral-50">Calendar</h2>
          <p className="mt-1 text-sm text-neutral-400">Events, hearings, and consultations for your matters</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportIcal(events, consultations, casesMap)}
            className="px-3 py-2 rounded-lg border border-neutral-700/40 text-neutral-400 text-xs hover:text-gold-400 hover:border-gold-500/30 transition-colors flex items-center gap-1.5"
            title="Export as iCal (.ics)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            iCal
          </button>
          <button
            onClick={() => openModal(selectedDate > todayStr ? selectedDate : undefined)}
            className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors"
          >
            + New Event
          </button>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-neutral-400 py-16">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading…
        </div>
      )}

      {!loading && error && (
        <Card className="border border-red-500/30 p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* Agenda Summary */}
          <AgendaSummary {...agendaStats} />

          {/* Deadline Alerts */}
          <DeadlineAlerts
            cases={cases}
            eventsByDate={eventsByDate}
            today={todayStr}
            onSchedule={caseId => openModal(undefined, caseId)}
          />

          {/* Calendar Grid + Day Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <Card className="p-4">
                {/* View toggle + navigation */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-0.5 p-0.5 bg-neutral-800/60 rounded-lg">
                    {(['month', 'week', 'day'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => {
                          setViewMode(m)
                          if (m === 'week') setWeekStart(getWeekStart(selectedDate))
                        }}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors capitalize ${
                          viewMode === m ? 'bg-gold-500/20 text-gold-300' : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevPeriod}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-100 transition-colors"
                    >
                      ‹
                    </button>
                    <span className="text-sm font-medium text-neutral-200 min-w-[160px] text-center">
                      {periodLabel}
                    </span>
                    <button
                      onClick={nextPeriod}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-100 transition-colors"
                    >
                      ›
                    </button>
                  </div>

                  <button
                    onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setWeekStart(getWeekStart(todayStr)); setSelectedDate(todayStr) }}
                    className="text-xs text-gold-300 hover:text-gold-200 transition-colors"
                  >
                    Today
                  </button>
                </div>

                {viewMode === 'month' ? (
                  <>
                    {/* Day name headers */}
                    <div className="grid grid-cols-7 mb-1">
                      {DAY_NAMES.map(d => (
                        <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-neutral-500 py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}

                      {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const day = idx + 1
                        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const dayEvts = eventsByDate.get(dateStr) ?? []
                        const dayConsults = consultsByDate.get(dateStr) ?? []
                        const isToday = dateStr === todayStr
                        const isSelected = dateStr === selectedDate
                        const totalDots = [...dayEvts.map(e => e.event_type), ...dayConsults.map(() => 'consultation')]

                        return (
                          <button
                            key={day}
                            onClick={() => pickDay(dateStr)}
                            className={[
                              'relative flex flex-col items-center py-1.5 rounded-lg transition-colors min-h-[3rem]',
                              isSelected ? 'bg-gold-500/25 ring-1 ring-gold-500/50'
                                : isToday ? 'bg-neutral-700/40'
                                : 'hover:bg-neutral-700/30',
                            ].join(' ')}
                          >
                            <span className={[
                              'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium',
                              isSelected ? 'text-gold-200'
                                : isToday ? 'bg-gold-500/40 text-gold-200'
                                : 'text-neutral-300',
                            ].join(' ')}>
                              {day}
                            </span>
                            {totalDots.length > 0 && (
                              <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">
                                {totalDots.slice(0, 4).map((type, i) => (
                                  <span key={i} className={`w-1 h-1 rounded-full ${dotColor(type)}`} />
                                ))}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : viewMode === 'week' ? (
                  <WeekView
                    weekStart={weekStart}
                    eventsByDate={eventsByDate}
                    consultsByDate={consultsByDate}
                    casesMap={casesMap}
                    userId={userId}
                    onLoad={load}
                    onPickDate={pickDay}
                  />
                ) : (
                  <DayView
                    dateStr={selectedDate}
                    dayEvents={selectedEvents}
                    dayConsults={selectedConsults}
                    casesMap={casesMap}
                    userId={userId}
                    onLoad={load}
                  />
                )}
              </Card>

              {/* Legend */}
              <div className="flex items-center gap-5 px-1 flex-wrap">
                {[
                  ['hearing', 'bg-gold-400', 'Hearing'],
                  ['meeting', 'bg-blue-400', 'Meeting'],
                  ['verdict', 'bg-emerald-400', 'Verdict'],
                  ['consultation', 'bg-amber-400', 'Consultation (booked)'],
                ].map(([, color, label]) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Day Panel */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
                {formatDisplayDate(selectedDate)}
              </p>

              {selectedEvents.length === 0 && selectedConsults.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-neutral-700/50 rounded-xl py-10 gap-2">
                  <p className="text-neutral-500 text-sm">No events</p>
                  {selectedDate > todayStr && (
                    <button
                      onClick={() => openModal(selectedDate)}
                      className="text-xs text-gold-300 hover:text-gold-200 transition-colors"
                    >
                      + Schedule an event
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedEvents.map(ev => (
                    <EventCard
                      key={ev.id}
                      event={ev}
                      caseData={casesMap.get(ev.case_id)}
                      userId={userId}
                      onAction={load}
                    />
                  ))}
                  {selectedConsults.map((c, i) => (
                    <ConsultationCard key={i} item={c} caseData={casesMap.get(c.case_id)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
                Upcoming Events & Consultations
              </h3>
              <div className="space-y-1.5">
                {upcoming.map((item, i) => {
                  const [, m, d] = item.date.split('-').map(Number)
                  return (
                    <button
                      key={i}
                      onClick={() => pickDay(item.date)}
                      className="w-full flex items-center gap-4 p-3 rounded-lg border border-neutral-700/40 hover:border-neutral-600/50 bg-primary-900/20 hover:bg-primary-900/40 transition-colors text-left"
                    >
                      <div className="w-12 text-center flex-shrink-0">
                        <p className="text-[9px] uppercase font-medium text-neutral-500">{MONTH_NAMES[m - 1].slice(0, 3)}</p>
                        <p className="text-xl font-bold text-neutral-100 leading-tight">{d}</p>
                      </div>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor(item.type)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] px-1.5 py-0.5 rounded border capitalize ${item.type === 'consultation' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : eventTypeCls(item.type)}`}>
                            {item.label}
                          </span>
                          {item.status && (
                            <span className={`text-[11px] px-1.5 py-0.5 rounded border capitalize ${statusCls(item.status)}`}>
                              {item.status}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-300 mt-0.5 truncate">
                          {item.time?.slice(0, 5)} · {item.sublabel}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {events.length === 0 && consultations.length === 0 && (
            <Card className="p-10 text-center">
              <p className="text-neutral-400 text-sm mb-3">No calendar events yet.</p>
              <button
                onClick={() => openModal()}
                className="px-4 py-2 rounded-lg bg-gold-500/20 text-gold-300 border border-gold-500/30 hover:bg-gold-500/30 text-sm transition-colors"
              >
                Schedule your first event
              </button>
            </Card>
          )}
        </>
      )}

      {showModal && (
        <NewEventModal
          cases={cases}
          defaultDate={modalDefaultDate}
          userId={userId}
          onClose={() => { setShowModal(false); setPreselectedCaseId(undefined) }}
          onCreated={() => { setShowModal(false); setPreselectedCaseId(undefined); void load() }}
        />
      )}
    </div>
  )
}
