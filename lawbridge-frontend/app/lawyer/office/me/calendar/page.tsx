'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '../../../../../components/ui/Card'
import { getCaseProgress } from '../../../../../lib/monitoringApi'
import { listCalendarEvents, type CalendarEvent } from '../../../../../lib/calendarApi'

export default function MyOfficeCalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) {
        setError('Sign in as a lawyer to view calendar events.')
        return
      }

      try {
        const progress = await getCaseProgress(access)
        const caseIds = (progress.results ?? [])
          .filter(item => item.assigned_lawyer_id === lawyerId)
          .map(item => item.case_id)
        const lists = await Promise.all(caseIds.map(caseId => listCalendarEvents(access, caseId)))
        setEvents(lists.flat())
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load calendar events')
      }
    }

    void run()
  }, [])

  return (
    <div>
      <h2 className="font-display text-display-md">Calendar</h2>
      <p className="mt-2 text-sm text-primary-300">Events linked to your assigned matters.</p>
      {error && <Card className="mt-4 border border-crimson-500/30 text-crimson-200">{error}</Card>}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {events.length === 0 && !error && <Card>No calendar events yet.</Card>}
        {events.map(event => <Card key={event.id}>{event.event_type} · {event.date} {event.time}</Card>)}
      </div>
    </div>
  )
}
