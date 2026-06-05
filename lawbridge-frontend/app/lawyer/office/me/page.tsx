'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../../../components/ui/Card'
import { getCaseProgress, type CaseProgressItem } from '../../../../lib/monitoringApi'
import { listCalendarEvents, type CalendarEvent } from '../../../../lib/calendarApi'

export default function MyOfficePage() {
  const [cases, setCases] = useState<CaseProgressItem[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')

      if (!access || !lawyerId) {
        setError('Sign in as a lawyer to view your office.')
        return
      }

      try {
        const progress = await getCaseProgress(access)
        const assigned = (progress.results ?? []).filter(item => item.assigned_lawyer_id === lawyerId)
        setCases(assigned)

        const eventLists = await Promise.all(assigned.map(item => listCalendarEvents(access, item.case_id)))
        setEvents(eventLists.flat())
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load office data')
      }
    }

    void run()
  }, [])

  const stats = useMemo(() => {
    const openCases = cases.filter(item => item.status !== 'closed').length
    const clients = new Set(cases.map(item => item.client_id)).size
    return { openCases, clients, events: events.length }
  }, [cases, events])

  if (error) {
    return <Card className="border border-crimson-500/30 text-crimson-200">{error}</Card>
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-display-md">My Office</h2>
          <p className="mt-1 text-primary-300">Live matters, clients, and events assigned to you.</p>
        </div>
        <Link href="/discover" className="inline-flex items-center justify-center rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black">
          Discover clients
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><div className="text-3xl font-bold">{stats.openCases}</div><div>Open matters</div></Card>
        <Card><div className="text-3xl font-bold">{stats.clients}</div><div>Active clients</div></Card>
        <Card><div className="text-3xl font-bold">{stats.events}</div><div>Calendar events</div></Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="font-semibold mb-3">Recent matters</div>
          <div className="space-y-2">
            {cases.length === 0 && <div className="text-sm text-primary-300">No matters assigned yet.</div>}
            {cases.slice(0, 5).map(item => (
              <div key={item.id} className="rounded-lg border border-white/5 bg-white/5 px-4 py-3">
                <div className="font-medium">{item.case_type}</div>
                <div className="text-xs text-primary-300">{item.case_id}</div>
                <div className="mt-1 text-sm text-primary-200">{item.status}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="font-semibold mb-3">Upcoming events</div>
          <div className="space-y-2">
            {events.length === 0 && <div className="text-sm text-primary-300">No events scheduled yet.</div>}
            {events.slice(0, 5).map(event => (
              <div key={event.id} className="rounded-lg border border-white/5 bg-white/5 px-4 py-3">
                <div className="font-medium">{event.event_type}</div>
                <div className="text-xs text-primary-300">{event.date} · {event.time}</div>
                <div className="mt-1 text-sm text-primary-200">{event.location}</div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
