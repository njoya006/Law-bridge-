'use client'

import React, { Suspense, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from '../../components/ui/Card'
import { createCase } from '../../lib/casesApi'
import { createCalendarEvent } from '../../lib/calendarApi'

export default function BookPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl text-sm text-primary-300">Loading booking form...</div>}>
      <BookForm />
    </Suspense>
  )
}

function BookForm() {
  const params = useSearchParams()
  const router = useRouter()
  const kind = params.get('kind') ?? 'lawyer'
  const targetId = params.get('id') ?? ''
  const targetName = params.get('name') ?? ''

  const [subject, setSubject] = useState('')
  const [details, setDetails] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('Online')
  const [virtualLink, setVirtualLink] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const bookingLabel = useMemo(() => kind === 'firm' ? 'firm' : 'lawyer', [kind])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const access = localStorage.getItem('access')
    const authUserId = localStorage.getItem('authUserId')
    if (!access || !authUserId) {
      setStatus('Sign in first to book a consultation.')
      return
    }
    setLoading(true)
    setStatus('')
    try {
      const caseItem = await createCase({
        title: `Consultation with ${targetName || bookingLabel}`,
        description: `${subject}\n\n${details}\n\nTarget ${bookingLabel}: ${targetName || targetId}`,
        case_type: 'consultation',
        legal_tradition: 'common_law',
        circuit: 'anglophone',
        language: 'en',
      }, access)

      // Create calendar event but avoid hanging the UI if the calendar service blocks.
      const withTimeout = <T,>(p: Promise<T>, ms = 12000) => {
        return Promise.race([
          p,
          new Promise<T>((_res, rej) => setTimeout(() => rej(new Error('calendar_timeout')), ms)),
        ])
      }

      try {
        await withTimeout(createCalendarEvent({
          case_id: caseItem.id,
          event_type: 'meeting',
          date,
          time,
          location: `${location}${targetName ? ` - ${targetName}` : ''}`,
          virtual_link: virtualLink || undefined,
          initiator_id: authUserId,
        }, access))
      } catch (err) {
        // Non-fatal: event creation timed out or failed. Proceed since the case was created.
        console.warn('Calendar event creation issue:', err)
        setStatus('Booking created; calendar scheduling pending.')
        router.push('/dashboard')
        return
      }

      setStatus(`Booking created for ${targetName || bookingLabel}.`)
      router.push('/dashboard')
    } catch (cause) {
      setStatus(cause instanceof Error ? cause.message : 'Unable to create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-display-md">Book a consultation</h1>
        <p className="mt-2 text-sm text-primary-300">Booking creates a real case and schedules a live calendar event.</p>
      </div>

      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm">Target</span>
              <input value={`${kind}: ${targetName || targetId}`} disabled className="mt-1 w-full rounded bg-primary-900/30 px-3 py-2 text-white" />
            </label>
            <label className="block">
              <span className="text-sm">Subject</span>
              <input value={subject} onChange={e => setSubject(e.target.value)} required className="mt-1 w-full rounded bg-primary-900/30 px-3 py-2 text-white" placeholder="What do you need help with?" />
            </label>
          </div>

          <label className="block">
            <span className="text-sm">Details</span>
            <textarea value={details} onChange={e => setDetails(e.target.value)} rows={4} className="mt-1 w-full rounded bg-primary-900/30 px-3 py-2 text-white" placeholder="Give a short summary for the lawyer or firm" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm">Date</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 w-full rounded bg-primary-900/30 px-3 py-2 text-white" />
            </label>
            <label className="block">
              <span className="text-sm">Time</span>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} required className="mt-1 w-full rounded bg-primary-900/30 px-3 py-2 text-white" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm">Location</span>
              <input value={location} onChange={e => setLocation(e.target.value)} className="mt-1 w-full rounded bg-primary-900/30 px-3 py-2 text-white" />
            </label>
            <label className="block">
              <span className="text-sm">Virtual Link</span>
              <input value={virtualLink} onChange={e => setVirtualLink(e.target.value)} className="mt-1 w-full rounded bg-primary-900/30 px-3 py-2 text-white" placeholder="https://..." />
            </label>
          </div>

          {status && <div className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-primary-100">{status}</div>}

          <button disabled={loading} className="rounded bg-gold-500 px-4 py-2 font-semibold text-black">
            {loading ? 'Booking...' : 'Confirm booking'}
          </button>
        </form>
      </Card>
    </div>
  )
}
