import { api } from './api'

export type BookStatus = 'draft' | 'under_review' | 'published' | 'rejected' | 'archived'
export type BookTier = 'firm' | 'general'

export interface BookCategory {
  id: string
  name: string
  slug: string
  parent: string | null
}

export interface BookItem {
  id: string
  title: string
  subtitle: string
  author_id: string
  author_name: string
  firm_id: string | null
  tier: BookTier
  status: BookStatus
  abstract: string
  content?: string
  year: number | null
  edition: number
  language: string
  jurisdiction: string
  legal_areas: string[]
  categories: BookCategory[]
  version_number: number
  submitted_at: string | null
  reviewed_by_id: string | null
  reviewed_at: string | null
  rejection_reason: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface BookVersion {
  id: string
  version_number: number
  change_summary: string
  created_by_id: string
  created_at: string
}

function firmHeader(firmId?: string | null): Record<string, string> {
  return firmId ? { 'X-Firm-ID': firmId } : {}
}

export function listBooks(token: string | null, params?: { tier?: BookTier; search?: string; legal_area?: string; firm_id?: string | null }) {
  const qs = new URLSearchParams()
  if (params?.tier) qs.set('tier', params.tier)
  if (params?.search) qs.set('search', params.search)
  if (params?.legal_area) qs.set('legal_area', params.legal_area)
  if (params?.firm_id) qs.set('firm_id', params.firm_id)
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return api.get<BookItem[]>('library', `/books/${query}`, token)
}

export function getBook(id: string, token: string | null, firmId?: string | null) {
  return api.request<BookItem>('library', `/books/${id}/`, {
    method: 'GET',
    token,
    headers: firmHeader(firmId),
  })
}

export function createBook(data: Partial<BookItem>, token: string, firmId?: string | null) {
  return api.request<BookItem>('library', '/books/', {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json', ...firmHeader(firmId) },
    body: JSON.stringify(data),
  })
}

export function updateBook(id: string, data: Partial<BookItem>, token: string, firmId?: string | null) {
  return api.request<BookItem>('library', `/books/${id}/`, {
    method: 'PATCH',
    token,
    headers: { 'Content-Type': 'application/json', ...firmHeader(firmId) },
    body: JSON.stringify(data),
  })
}

export function submitBook(id: string, token: string) {
  return api.request<BookItem>('library', `/books/${id}/submit/`, {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export function publishBook(id: string, token: string, firmId?: string | null, changeSummary?: string) {
  return api.request<BookItem>('library', `/books/${id}/publish/`, {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json', ...firmHeader(firmId) },
    body: JSON.stringify({ change_summary: changeSummary || '' }),
  })
}

export function rejectBook(id: string, reason: string, token: string, firmId?: string | null) {
  return api.request<BookItem>('library', `/books/${id}/reject/`, {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json', ...firmHeader(firmId) },
    body: JSON.stringify({ reason }),
  })
}

export function getBookVersions(id: string, token: string | null) {
  return api.get<BookVersion[]>('library', `/books/${id}/versions/`, token)
}

export function listMyBooks(token: string, status?: BookStatus) {
  const query = status ? `?status=${status}` : ''
  return api.get<BookItem[]>('library', `/my-books/${query}`, token)
}

export function listReviewQueue(token: string, firmId?: string | null) {
  return api.request<BookItem[]>('library', '/review-queue/', {
    method: 'GET',
    token,
    headers: firmHeader(firmId),
  })
}

export function listCategories() {
  return api.get<BookCategory[]>('library', '/categories/', null)
}
