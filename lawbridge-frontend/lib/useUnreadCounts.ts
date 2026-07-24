"use client"
import { useEffect, useState } from 'react'
import { unreadNotificationCount } from './notificationsApi'

export type UnreadCounts = { messages: number; notifications: number }

// Fire this event after the user reads notifications/messages so every mounted
// sidebar badge refreshes immediately instead of waiting for the 30s poll.
export const UNREAD_REFRESH_EVENT = 'lawbridge:unread-refresh'

export function refreshUnreadCounts() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(UNREAD_REFRESH_EVENT))
  }
}

/**
 * Polls unread counts for the notification bell and the messages inbox so the
 * sidebar can surface a live count figure. Refetches every `pollMs`, when the
 * tab regains focus, and on the UNREAD_REFRESH_EVENT.
 */
export function useUnreadCounts(pollMs = 30_000): UnreadCounts {
  const [counts, setCounts] = useState<UnreadCounts>({ messages: 0, notifications: 0 })

  useEffect(() => {
    let cancelled = false

    async function fetchMessages(token: string) {
      try {
        const res = await fetch('/api/v1/messages/threads/', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const threads: Array<{ unread_count?: number }> = Array.isArray(data) ? data : (data?.results ?? [])
        const total = threads.reduce((s, t) => s + (t.unread_count || 0), 0)
        if (!cancelled) setCounts(c => (c.messages === total ? c : { ...c, messages: total }))
      } catch { /* silent */ }
    }

    async function fetchNotifications(token: string) {
      try {
        const { unread } = await unreadNotificationCount(token)
        const total = unread || 0
        if (!cancelled) setCounts(c => (c.notifications === total ? c : { ...c, notifications: total }))
      } catch { /* silent */ }
    }

    function fetchAll() {
      const token = localStorage.getItem('access')
      if (!token) return
      void fetchMessages(token)
      void fetchNotifications(token)
    }

    fetchAll()
    const iv = setInterval(fetchAll, pollMs)
    const onFocus = () => fetchAll()
    window.addEventListener('focus', onFocus)
    window.addEventListener(UNREAD_REFRESH_EVENT, onFocus)

    return () => {
      cancelled = true
      clearInterval(iv)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener(UNREAD_REFRESH_EVENT, onFocus)
    }
  }, [pollMs])

  return counts
}
