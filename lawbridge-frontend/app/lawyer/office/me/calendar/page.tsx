'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '../../../../../components/ui/Card'
import { getCaseProgress } from '../../../../../lib/monitoringApi'
import { listCalendarEvents, type CalendarEvent } from '../../../../../lib/calendarApi'

function eventStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'confirmed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    case 'pending': return 'text-gold-400 bg-gold-500/10 border-gold-500/30'
    case 'cancelled': return 'text-crimson-400 bg-crimson-500/10 border-crimson-500/30'
    default: return 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30'
  }
}

function groupByDate(events: CalendarEvent[]) {
  const groups = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const key = ev.date || 'Unknown date'
    const existing = groups.get(key)
    if (existing) existing.push(ev)
    else groups.set(key, [ev])
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export default function MyOfficeCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) {
        setError('Sign in as a lawyer to view calendar events.')
        setLoading(false)
        return
      }
      try {
        const progress = await getCaseProgress(access)
        const caseIds = (progress.results ?? [])
          .filter(item => item.assigned_lawyer_id === lawyerId)
          .map(item => item.case_id)
        const lists = await Promise.all(caseIds.map(caseId => listCalendarEvents(access, caseId)))
        if (mounted) setEvents(lists.flat())
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load calendar events')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => { mounted = false }
  }, [])

  const grouped = groupByDate(events)

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-md text-neutral-50">Calendar</h2>
        <p className="mt-1 text-neutral-400">Events linked to your assigned matters</p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-12 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading events…
        </div>
      )}

      {!loading && error && (
        <Card className="border border-crimson-500/30 p-4">
          <p className="text-crimson-300 text-sm">{error}</p>
        </Card>
      )}

      {!loading && !error && events.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-neutral-400">No calendar events scheduled for your matters.</p>
        </Card>
      )}

      {!loading && !error && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([date, dayEvents]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-neutral-700/50" />
                <span className="text-xs text-neutral-400 font-medium uppercase tracking-wide px-2">
                  {date}
                </span>
                <div className="h-px flex-1 bg-neutral-700/50" />
              </div>
              <div className="space-y-3">
                {dayEvents.map(event => (
                  <Card key={event.id} className="p-4 flex items-start gap-4 hover:border-gold-400/20 transition-colors">
                    <div className="flex-shrink-0 text-center w-12">
                      <p className="text-sm font-semibold text-gold-300">{event.time || '—'}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-neutral-100">{event.event_type}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${eventStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      {event.location && (
                        <p className="text-xs text-neutral-400 mt-1">📍 {event.location}</p>
                      )}
                      {event.virtual_link && (
                        <a
                          href={event.virtual_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gold-300 hover:text-gold-200 mt-1 inline-block"
                        >
                          Join virtual meeting →
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
