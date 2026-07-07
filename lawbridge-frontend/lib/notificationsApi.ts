import { api } from './api'

export type NotificationItem = {
  id: string
  notification_type: string
  title: string
  body: string
  case_id: string
  is_read: boolean
  created_at: string
}

export function listNotifications(token: string) {
  return api.get<{ count: number; unread: number; results: NotificationItem[] }>('monitoring', '/notifications/', token)
}

export function unreadNotificationCount(token: string) {
  return api.get<{ unread: number }>('monitoring', '/notifications/unread-count/', token)
}

export function markNotificationRead(notificationId: string, token: string) {
  return api.post<NotificationItem>('monitoring', `/notifications/${notificationId}/read/`, {}, token)
}

export function markAllNotificationsRead(token: string) {
  return api.post<{ detail: string }>('monitoring', '/notifications/all/read/', {}, token)
}
