import { api } from './api'

export type CalendarEvent = {
  id: string
  case_id: string
  event_type: 'hearing' | 'meeting' | 'verdict'
  date: string
  time: string
  location: string
  virtual_link?: string | null
  initiator_id: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'approved' | 'reschedule_proposed'
  approvals?: Array<{ id: string; approver_id: string; status: string; created_at: string }>
  created_at: string
}

export function createCalendarEvent(
  payload: Omit<CalendarEvent, 'id' | 'status' | 'approvals' | 'created_at'>,
  token: string,
) {
  return api.post<CalendarEvent>('calendar', '/events/', payload, token)
}

export function listCalendarEvents(token: string, caseId?: string) {
  const suffix = caseId ? `?case_id=${encodeURIComponent(caseId)}` : ''
  return api.get<CalendarEvent[]>('calendar', `/events/${suffix}`, token)
}

export function listEventsForCases(caseIds: string[], token: string): Promise<CalendarEvent[]> {
  if (caseIds.length === 0) return Promise.resolve([])
  const ids = caseIds.map(encodeURIComponent).join(',')
  return api.get<CalendarEvent[]>('calendar', `/events/?case_ids=${ids}`, token)
}

export function approveCalendarEvent(eventId: string, token: string) {
  return api.patch<CalendarEvent>('calendar', `/events/${eventId}/approve/`, {}, token)
}

export function rejectCalendarEvent(eventId: string, token: string) {
  return api.patch<CalendarEvent>('calendar', `/events/${eventId}/reject/`, {}, token)
}

export function deleteCalendarEvent(eventId: string, token: string) {
  return api.del<void>('calendar', `/events/${eventId}/`, token)
}
