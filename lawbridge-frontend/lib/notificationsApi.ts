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

// NOTE: paths are prefixed with `/monitoring` because the notification bell is
// served by monitoring-service (case/network/growth events all write there), not
// notification-service. The production env sets NEXT_PUBLIC_MONITORING_SERVICE_URL
// to `/api/v1`, so a bare `/notifications/` would resolve to `/api/v1/notifications/`
// — which nginx routes to notification-service (empty). The `/monitoring` prefix
// makes it `/api/v1/monitoring/notifications/`, matching monitoringApi.ts.
export function listNotifications(token: string) {
  return api.get<{ count: number; unread: number; results: NotificationItem[] }>('monitoring', '/monitoring/notifications/', token)
}

export function unreadNotificationCount(token: string) {
  return api.get<{ unread: number }>('monitoring', '/monitoring/notifications/unread-count/', token)
}

export function markNotificationRead(notificationId: string, token: string) {
  return api.post<NotificationItem>('monitoring', `/monitoring/notifications/${notificationId}/read/`, {}, token)
}

export function markAllNotificationsRead(token: string) {
  return api.post<{ detail: string }>('monitoring', '/monitoring/notifications/all/read/', {}, token)
}
