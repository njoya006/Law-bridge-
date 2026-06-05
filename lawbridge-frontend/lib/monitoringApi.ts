import { api } from './api'

export type CaseProgressItem = {
  id: string
  case_id: string
  client_id: string
  assigned_lawyer_id: string | null
  case_type: string
  status: string
  created_at: string
  updated_at: string
}

export type LawyerStats = {
  id: string
  lawyer_id: string
  active_cases: number
  closed_cases_count: number
  avg_resolution_days: number
  cases_this_month: number
  updated_at: string
}

export function getCaseProgress(token: string) {
  return api.get<{ count?: number; results?: CaseProgressItem[] }>('monitoring', '/monitoring/case-progress/', token)
}

export function getLawyerStats(lawyerId: string, token: string) {
  return api.get<LawyerStats>('monitoring', `/monitoring/lawyer-stats/${lawyerId}/`, token)
}
