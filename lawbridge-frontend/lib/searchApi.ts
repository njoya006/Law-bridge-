import { api } from './api'

export type SearchResultItem = {
  type: 'lawyer' | 'firm' | 'case' | string
  id: string | number
  score?: number
  payload?: any
}

export function search(query: string, token?: string | null) {
  const q = encodeURIComponent(query)
  return api.get<{ results: SearchResultItem[] }>('search', `/search/?q=${q}`, token)
}
