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

export type CaseRiskItem = {
  case_id: string
  title: string
  status: string
  risk_score: number
  risk_level: 'critical' | 'watch' | 'healthy'
  risk_factors: string[]
}

export type CaseRiskResponse = {
  cases: CaseRiskItem[]
  counts: { critical: number; watch: number; healthy: number }
}

export function getCaseRisks(token: string) {
  return api.get<CaseRiskResponse>('monitoring', '/monitoring/case-risks/', token)
}

export type LawyerLoad = {
  lawyer_id: string
  active_cases: number
  closed_cases_count: number
  avg_resolution_days: number
  cases_this_month: number
}

export type FirmIntelligence = {
  total_active_cases: number
  total_cases_all_time: number
  stalled_cases: { case_id: string; title: string; status: string; days_stale: number }[]
  lawyer_loads: LawyerLoad[]
  status_distribution: Record<string, number>
  avg_resolution_days: number
  ai_narrative: string
  ai_bullet_insights: string[]
}

export function getFirmIntelligence(token: string) {
  return api.get<FirmIntelligence>('monitoring', '/monitoring/firm-intelligence/', token)
}
