import { api } from './api'

export type CalendarEvent = {
  id: string
  case_id: string
  event_type: string
  date: string
  time: string
  location: string
  virtual_link?: string | null
  initiator_id: string
  status: string
  approvals?: Array<{ id: string; approver_id: string; status: string; created_at: string }>
  created_at: string
}

export function createCalendarEvent(payload: Omit<CalendarEvent, 'id' | 'status' | 'approvals' | 'created_at'>, token: string) {
  return api.post<CalendarEvent>('calendar', '/events/', payload, token)
}

export function listCalendarEvents(token: string, caseId?: string) {
  const suffix = caseId ? `?case_id=${encodeURIComponent(caseId)}` : ''
  return api.get<CalendarEvent[]>('calendar', `/events/${suffix}`, token)
}
