'use client'

import { api } from './api'

export type MentorshipPrefs = {
  open_to_mentoring: boolean
  seeking_mentor: boolean
  mentorship_note: string
}

export type MentorCard = {
  user_id: string
  name: string
  specialization: string
  practice_circuit: string
  years_of_experience: number
  reputation_score: number
  is_verified: boolean
  mentorship_note: string
  match_score?: number
}

export type MentorshipMatches = {
  me: { open_to_mentoring: boolean; seeking_mentor: boolean } | null
  mentors: MentorCard[]
  mentees: MentorCard[]
}

export type MentorshipRequest = {
  id: string
  mentee_id: string
  mentor_id: string
  mentee_name: string
  mentor_name: string
  message: string
  focus_area: string
  status: 'pending' | 'accepted' | 'declined' | 'ended'
  created_at: string
}

export const getMentorshipPrefs = (token: string) =>
  api.get<MentorshipPrefs>('lawyer', '/mentorship/prefs/', token)

export const updateMentorshipPrefs = (data: Partial<MentorshipPrefs>, token: string) =>
  api.patch<MentorshipPrefs>('lawyer', '/mentorship/prefs/', data, token)

export const getMentorshipMatches = (token: string) =>
  api.get<MentorshipMatches>('lawyer', '/mentorship/matches/', token)

export const getMentorshipRequests = (token: string) =>
  api.get<{ sent: MentorshipRequest[]; received: MentorshipRequest[] }>('lawyer', '/mentorship/requests/', token)

export const requestMentorship = (mentor_id: string, message: string, focus_area: string, token: string) =>
  api.post<{ id: string; status: string }>('lawyer', '/mentorship/requests/', { mentor_id, message, focus_area }, token)

export const respondMentorship = (id: string, status: 'accepted' | 'declined' | 'ended', token: string) =>
  api.patch<{ id: string; status: string }>('lawyer', `/mentorship/requests/${id}/`, { status }, token)
