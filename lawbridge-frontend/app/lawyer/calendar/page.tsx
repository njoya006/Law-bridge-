"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { listCalendarEvents, type CalendarEvent } from '../../../lib/calendarApi'
import { getCaseProgress } from '../../../lib/monitoringApi'

export default function LawyerCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) {
        setError('Sign in as a lawyer to view your calendar.')
        return
      }

      try {
        const progress = await getCaseProgress(access)
        const caseIds = (progress.results ?? [])
          .filter(item => item.assigned_lawyer_id === lawyerId)
          .map(item => item.case_id)

        const lists = await Promise.all(caseIds.map(caseId => listCalendarEvents(access, caseId)))
        setEvents(lists.flat().sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`)))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load calendar')
      }
    }

    void run()
  }, [])

  const upcoming = useMemo(() => events.slice(0, 6), [events])

  return (
    <div>
      <h2 className="font-display text-display-md">Calendar</h2>
      <p className="mt-2 text-sm text-primary-300">Live consultation events linked to your assigned matters.</p>
      {error && <Card className="mt-4 border border-crimson-500/30 text-crimson-200">{error}</Card>}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {upcoming.length === 0 && !error && <Card>No calendar events yet.</Card>}
        {upcoming.map(event => (
          <Card key={event.id}>
            <div className="font-semibold">{event.event_type}</div>
            <div className="mt-2 text-xs text-primary-300">{event.date} · {event.time}</div>
            <div className="mt-1 text-sm text-primary-200">{event.location}</div>
            <div className="mt-1 text-xs text-primary-400">Status: {event.status}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}