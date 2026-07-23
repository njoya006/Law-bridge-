'use client'

import { api } from './api'

// Aggregates admin-only stats from every service for the investor / platform view.
// Each call is independent so one slow/down service never blocks the rest.

export type PaymentStats = {
  gmv_total: number; payments_confirmed: number; gmv_this_month: number
  payments_this_month: number; currency: string
}
export type NetworkStats = {
  total_follows: number; lawyers_following: number; avg_follows_per_active: number
  total_referrals: number; referrals_accepted: number; referrals_completed: number
  referral_acceptance_rate: number; feed_events: number
}
export type LawyerStats = {
  total_lawyers: number; verified_lawyers: number; verification_rate: number
  open_to_mentoring: number; seeking_mentor: number; mentorship_connections: number
  reputation_tiers: { tier: string; count: number }[]
}
export type LibraryStats = {
  published_books: number; published_articles: number; total_book_views: number
  cle_credits_issued: number; cle_awards: number; book_completions: number
  lawyers_earning_cle: number
}
export type CaseStats = {
  total_cases: number; cases_this_month: number; active_cases: number
  closed_cases: number; assigned_cases: number; assignment_rate: number
}
export type UsersStats = { count: number; by_role: Record<string, number> }

export const getPaymentStats = (t: string) => api.get<PaymentStats>('payment', '/stats/', t)
export const getNetworkStats = (t: string) => api.get<NetworkStats>('network', '/stats/', t)
export const getLawyerStats = (t: string) => api.get<LawyerStats>('lawyer', '/stats/', t)
export const getLibraryStats = (t: string) => api.get<LibraryStats>('library', '/stats/', t)
export const getCaseStats = (t: string) => api.get<CaseStats>('case', '/cases/stats/', t)

export async function getUsersStats(token: string): Promise<UsersStats> {
  const res = await api.get<{ count: number; results: { role: string }[] }>('auth', '/auth/admin/users/', token)
  const by_role: Record<string, number> = {}
  for (const u of res.results ?? []) by_role[u.role] = (by_role[u.role] ?? 0) + 1
  return { count: res.count ?? (res.results?.length ?? 0), by_role }
}
