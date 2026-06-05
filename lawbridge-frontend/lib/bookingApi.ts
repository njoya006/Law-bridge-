import { api } from './api'
import type { CalendarEvent } from './calendarApi'

export function createBooking(payload: {
  case_id: string
  event_type: 'meeting' | 'hearing' | 'verdict'
  date: string
  time: string
  location: string
  virtual_link?: string
  initiator_id: string
}, token: string) {
  return api.post<CalendarEvent>('calendar', '/events/', payload, token)
}

export function listBookings(token: string, caseId?: string) {
  const suffix = caseId ? `?case_id=${encodeURIComponent(caseId)}` : ''
  return api.get<CalendarEvent[]>('calendar', `/events/${suffix}`, token)
}
