import { SERVICE_URLS } from './serviceUrls'

export interface Review {
  id: string
  client_id: string
  client_name: string
  case_id: string | null
  rating: number
  comment: string
  created_at: string
}

export interface ReviewsResponse {
  count: number
  average_rating: number
  results: Review[]
}

export async function getReviews(lawyerId: string, token?: string | null): Promise<ReviewsResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${SERVICE_URLS.lawyer}/api/v1/lawyers/${lawyerId}/reviews/`, { headers })
  if (!res.ok) throw new Error('Failed to load reviews')
  return res.json()
}

export async function submitReview(
  lawyerId: string,
  data: { rating: number; comment?: string; case_id?: string },
  token: string,
): Promise<Review> {
  const res = await fetch(`${SERVICE_URLS.lawyer}/api/v1/lawyers/${lawyerId}/reviews/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || err.detail || 'Failed to submit review')
  }
  return res.json()
}
