import { api } from './api'

export type NotificationItem = {
  id: string
  event_type: string
  title: string
  message: string
  metadata: Record<string, unknown>
  read: boolean
  created_at: string
}

export function listNotifications(token: string, limit = 20) {
  return api.get<{ count: number; results: NotificationItem[] }>('notification', `/notifications/?limit=${limit}`, token)
}

export function unreadNotificationCount(token: string) {
  // Backend uses an underscore route; keep a fallback for older deployments.
  return api
    .get<{ unread_count: number }>('notification', '/notifications/unread_count/', token)
    .catch(() => api.get<{ unread_count: number }>('notification', '/notifications/unread-count/', token))
}

export function markNotificationRead(notificationId: string, token: string) {
  return api.patch<NotificationItem>('notification', `/notifications/${notificationId}/read/`, {}, token)
}
