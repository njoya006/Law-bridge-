'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Card } from './ui/Card'
import { getMyCases, type CaseItem } from '../lib/casesApi'
import {
  listEventsForCases,
  createCalendarEvent,
  approveCalendarEvent,
  rejectCalendarEvent,
  type CalendarEvent,
} from '../lib/calendarApi'

// ── date helpers ──────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ── style helpers ─────────────────────────────────────────────────────────────

function eventTypeCls(type: string) {
  switch (type) {
    case 'hearing': return 'bg-gold-500/20 text-gold-300 border-gold-500/30'
    case 'meeting': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'verdict': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    default: return 'bg-neutral-700/30 text-neutral-300 border-neutral-600/30'
  }
}

function statusCls(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    case 'pending': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    case 'cancelled':
    case 'rejected': return 'bg-red-500/10 text-red-300 border-red-500/30'
    default: return 'bg-neutral-700/30 text-neutral-300 border-neutral-600/30'
  }
}

function dotColor(type: string) {
  switch (type) {
    case 'hearing': return 'bg-gold-400'
    case 'meeting': return 'bg-blue-400'
    case 'verdict': return 'bg-emerald-400'
    default: return 'bg-neutral-500'
  }
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
    setSaving(true)
    setError('')
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
            <select
              value={form.case_id}
              onChange={e => set('case_id', e.target.value)}
              className={cls}
              required
            >
              <option value="">— Select a case —</option>
              {activeCases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title}
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
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                min={todayStr}
                className={cls}
                required
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
              type="text"
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="Courtroom, office address…"
              className={cls}
            />
          </div>

          <div>
            <label className={labelCls}>
              Virtual Link{' '}
              <span className="text-neutral-500 normal-case font-normal ml-1">optional</span>
            </label>
            <input
              type="url"
              value={form.virtual_link}
              onChange={e => set('virtual_link', e.target.value)}
              placeholder="https://meet.google.com/…"
              className={cls}
            />
          </div>

          {error && <p className="text-red-300 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-neutral-300 hover:text-neutral-100 hover:border-neutral-500 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
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
  userId,
  onAction,
}: {
  event: CalendarEvent
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

      <p className="text-sm font-semibold text-neutral-100 mt-2">{event.time?.slice(0, 5)}</p>

      {event.location && event.location !== 'TBD' && (
        <p className="text-xs text-neutral-400 mt-0.5">📍 {event.location}</p>
      )}
      {event.virtual_link && (
        <a
          href={event.virtual_link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gold-300 hover:text-gold-200 mt-0.5 inline-block"
        >
          Join virtual meeting →
        </a>
      )}

      {canAct && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => doAction('approve')}
            disabled={busy !== null}
            className="flex-1 py-1.5 text-xs rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            {busy === 'approve' ? '…' : '✓ Confirm'}
          </button>
          <button
            onClick={() => doAction('reject')}
            disabled={busy !== null}
            className="flex-1 py-1.5 text-xs rounded-md bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            {busy === 'reject' ? '…' : '✕ Cancel'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── CalendarView (exported) ───────────────────────────────────────────────────

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState('')

  const today = new Date()
  const todayStr = ymd(today)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [showModal, setShowModal] = useState(false)
  const [modalDefaultDate, setModalDefaultDate] = useState<string | undefined>()

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

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const arr = map.get(ev.date) ?? []
      arr.push(ev)
      map.set(ev.date, arr)
    }
    return map
  }, [events])

  const selectedEvents = useMemo(() => eventsByDate.get(selectedDate) ?? [], [eventsByDate, selectedDate])

  const upcoming = useMemo(
    () =>
      events
        .filter(e => e.date >= todayStr && e.status !== 'cancelled' && e.status !== 'rejected')
        .slice(0, 10),
    [events, todayStr],
  )

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function pickDay(day: number) {
    const str = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(str)
  }

  function jumpToEvent(ev: CalendarEvent) {
    const [y, m] = ev.date.split('-').map(Number)
    setViewYear(y)
    setViewMonth(m - 1)
    setSelectedDate(ev.date)
  }

  function openModal(date?: string) {
    setModalDefaultDate(date)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-display-md text-neutral-50">Calendar</h2>
          <p className="mt-1 text-sm text-neutral-400">Events linked to your matters</p>
        </div>
        <button
          onClick={() => openModal(selectedDate > todayStr ? selectedDate : undefined)}
          className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors"
        >
          + New Event
        </button>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Calendar Grid ── */}
          <div className="lg:col-span-2 space-y-3">
            <Card className="p-4">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-100 transition-colors text-lg"
                >
                  ‹
                </button>
                <h3 className="font-semibold text-neutral-100">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </h3>
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-700/50 text-neutral-400 hover:text-neutral-100 transition-colors text-lg"
                >
                  ›
                </button>
              </div>

              {/* Day name headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-semibold uppercase tracking-wide text-neutral-500 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const day = idx + 1
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayEvts = eventsByDate.get(dateStr) ?? []
                  const isToday = dateStr === todayStr
                  const isSelected = dateStr === selectedDate

                  return (
                    <button
                      key={day}
                      onClick={() => pickDay(day)}
                      className={[
                        'relative flex flex-col items-center py-1.5 rounded-lg transition-colors min-h-[3rem]',
                        isSelected
                          ? 'bg-gold-500/25 ring-1 ring-gold-500/50'
                          : isToday
                          ? 'bg-neutral-700/40'
                          : 'hover:bg-neutral-700/30',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium',
                          isSelected
                            ? 'text-gold-200'
                            : isToday
                            ? 'bg-gold-500/40 text-gold-200'
                            : 'text-neutral-300',
                        ].join(' ')}
                      >
                        {day}
                      </span>
                      {dayEvts.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center px-1">
                          {dayEvts.slice(0, 3).map((ev, i) => (
                            <span key={i} className={`w-1 h-1 rounded-full ${dotColor(ev.event_type)}`} />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Legend */}
            <div className="flex items-center gap-5 px-1">
              {(['hearing', 'meeting', 'verdict'] as const).map(type => (
                <div key={type} className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <span className={`w-2 h-2 rounded-full ${dotColor(type)}`} />
                  <span className="capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Day Panel ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
              {formatDisplayDate(selectedDate)}
            </p>

            {selectedEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-neutral-700/50 rounded-xl py-10 gap-2">
                <p className="text-neutral-500 text-sm">No events scheduled</p>
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
                  <EventCard key={ev.id} event={ev} userId={userId} onAction={load} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Upcoming Events ── */}
      {!loading && !error && upcoming.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">
            Upcoming
          </h3>
          <div className="space-y-2">
            {upcoming.map(ev => {
              const [, m, d] = ev.date.split('-').map(Number)
              return (
                <button
                  key={ev.id}
                  onClick={() => jumpToEvent(ev)}
                  className="w-full flex items-center gap-4 p-3 rounded-lg border border-neutral-700/40 hover:border-neutral-600/50 bg-primary-900/20 hover:bg-primary-900/40 cursor-pointer transition-colors text-left"
                >
                  <div className="w-12 text-center flex-shrink-0">
                    <p className="text-[10px] uppercase font-medium text-neutral-500">
                      {MONTH_NAMES[m - 1].slice(0, 3)}
                    </p>
                    <p className="text-xl font-bold text-neutral-100 leading-tight">{d}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] px-1.5 py-0.5 rounded border capitalize ${eventTypeCls(ev.event_type)}`}>
                        {ev.event_type}
                      </span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded border capitalize ${statusCls(ev.status)}`}>
                        {ev.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-300 mt-0.5 truncate">
                      {ev.time?.slice(0, 5)}{ev.location && ev.location !== 'TBD' ? ` · ${ev.location}` : ''}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {!loading && !error && events.length === 0 && (
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

      {showModal && (
        <NewEventModal
          cases={cases}
          defaultDate={modalDefaultDate}
          userId={userId}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            void load()
          }}
        />
      )}
    </div>
  )
}
