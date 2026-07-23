'use client'

import { api } from './api'

export type Follow = {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export type Referral = {
  id: string
  referrer_id: string
  referred_lawyer_id: string
  client_name: string
  client_email: string
  case_type: string
  notes: string
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  fee_split_pct: number
  outcome_note: string
  responded_at: string | null
  created_at: string
  updated_at: string
}

export type FeedItemType =
  | 'article' | 'referral_accepted' | 'referral_completed' | 'follow' | 'partnership'
  | 'case_won' | 'case_settled' | 'lawyer_verified' | 'tier_reached' | 'capacity_open'

export type FeedItem = {
  id: string
  actor_id: string
  item_type: FeedItemType
  title: string
  body: string
  external_id: string
  external_url: string
  created_at: string
}

export type ReferralCreate = {
  referred_lawyer_id: string
  client_name: string
  client_email?: string
  case_type?: string
  notes?: string
  fee_split_pct?: number
}

export async function getFollowing(token: string): Promise<Follow[]> {
  try {
    const res = await api.get<Follow[] | { results: Follow[] }>('network', '/follows/', token)
    return Array.isArray(res) ? res : res.results ?? []
  } catch { return [] }
}

export async function followLawyer(lawyerId: string, token: string): Promise<void> {
  await api.post('network', '/follows/', { following_id: lawyerId }, token)
}

export async function unfollowLawyer(followId: string, token: string): Promise<void> {
  await api.del('network', `/follows/${followId}/`, token)
}

export async function getFollowerCount(lawyerId: string, token: string): Promise<number> {
  try {
    const res = await api.get<{ count: number }>('network', `/lawyers/${lawyerId}/follower-count/`, token)
    return res.count ?? 0
  } catch { return 0 }
}

export async function getFeed(token: string): Promise<FeedItem[]> {
  try {
    const res = await api.get<FeedItem[] | { results: FeedItem[] }>('network', '/feed/', token)
    return Array.isArray(res) ? res : res.results ?? []
  } catch { return [] }
}

export async function getReferrals(token: string): Promise<Referral[]> {
  try {
    const res = await api.get<Referral[] | { results: Referral[] }>('network', '/referrals/', token)
    return Array.isArray(res) ? res : res.results ?? []
  } catch { return [] }
}

export async function createReferral(data: ReferralCreate, token: string): Promise<Referral> {
  return api.post<Referral>('network', '/referrals/', data, token)
}

export async function updateReferralStatus(id: string, status: string, token: string): Promise<Referral> {
  return api.patch<Referral>('network', `/referrals/${id}/`, { status }, token)
}
