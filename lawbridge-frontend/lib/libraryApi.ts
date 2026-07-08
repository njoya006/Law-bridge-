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
  publisher: string
  pages: number | null
  language: string
  jurisdiction: string
  legal_areas: string[]
  categories: BookCategory[]
  views: number
  is_featured: boolean
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

// ── Articles ──────────────────────────────────────────────────────────────────

export type ArticleType = 'case_summary' | 'legal_alert' | 'analysis' | 'commentary' | 'explainer' | 'news'
export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface ArticleItem {
  id: string
  title: string
  summary: string
  content?: string
  article_type: ArticleType
  author_id: string
  author_name: string
  firm_id: string | null
  tier: BookTier
  status: ArticleStatus
  legal_areas: string[]
  jurisdiction: string
  language: string
  reading_time: number
  views: number
  published_at: string | null
  created_at: string
  updated_at: string
}

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  case_summary: 'Case Summary',
  legal_alert: 'Legal Alert',
  analysis: 'Analysis',
  commentary: 'Commentary',
  explainer: 'Explainer',
  news: 'Legal News',
}

export function listArticles(token: string | null, params?: {
  tier?: BookTier; search?: string; type?: ArticleType; legal_area?: string
}) {
  const qs = new URLSearchParams()
  if (params?.tier) qs.set('tier', params.tier)
  if (params?.search) qs.set('search', params.search)
  if (params?.type) qs.set('type', params.type)
  if (params?.legal_area) qs.set('legal_area', params.legal_area)
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return api.get<ArticleItem[]>('library', `/articles/${query}`, token)
}

export function getArticle(id: string, token: string | null) {
  return api.get<ArticleItem>('library', `/articles/${id}/`, token)
}

export function createArticle(data: Partial<ArticleItem>, token: string) {
  return api.request<ArticleItem>('library', '/articles/', {
    method: 'POST', token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateArticle(id: string, data: Partial<ArticleItem>, token: string) {
  return api.request<ArticleItem>('library', `/articles/${id}/`, {
    method: 'PUT', token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteArticle(id: string, token: string) {
  return api.request<void>('library', `/articles/${id}/`, { method: 'DELETE', token })
}

export function listMyArticles(token: string, status?: ArticleStatus) {
  const query = status ? `?status=${status}` : ''
  return api.get<ArticleItem[]>('library', `/my-articles/${query}`, token)
}

// ── Engagement & Discovery ─────────────────────────────────────────────────────

export function incrementBookView(id: string, token: string | null) {
  return api.request<void>('library', `/books/${id}/view/`, {
    method: 'POST',
    token,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
}

export function listFirmContent(firmId: string, token: string | null) {
  return api.get<BookItem[]>('library', `/books/firm/${firmId}/`, token)
}

export function listFeaturedBooks(token: string | null) {
  return api.get<BookItem[]>('library', '/books/featured/', token)
}
