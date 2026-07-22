'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { listNotifications, markNotificationRead, markAllNotificationsRead, type NotificationItem } from '../../lib/notificationsApi'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import {
  ClipboardIcon, BalanceIcon, PencilIcon, CheckCircleIcon, XCircleIcon,
  CalendarIcon, CheckIcon, AlertTriangleIcon, StarIcon, BellIcon,
} from '../../components/icons/Icons'

const TYPE_ICONS: Record<string, React.ComponentType<{ width?: number; height?: number; className?: string }>> = {
  case_created: ClipboardIcon,
  case_assigned: BalanceIcon,
  case_updated: PencilIcon,
  case_closed: CheckCircleIcon,
  case_rejected: XCircleIcon,
  booking_received: CalendarIcon,
  verification_approved: CheckIcon,
  verification_rejected: AlertTriangleIcon,
  review_received: StarIcon,
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    const access = localStorage.getItem('access')
    if (!access) { setError('Not authenticated'); setLoading(false); return }
    try {
      const res = await listNotifications(access)
      setItems(res.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleMarkRead = async (id: string) => {
    const access = localStorage.getItem('access')
    if (!access) return
    try {
      await markNotificationRead(id, access)
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {
      // silently update optimistically; backend may still have processed it
    }
  }

  const handleMarkAllRead = async () => {
    const access = localStorage.getItem('access')
    if (!access) return
    setMarkingAll(true)
    await markAllNotificationsRead(access).catch(() => {
      const unread = items.filter(n => !n.is_read)
      return Promise.allSettled(unread.map(n => markNotificationRead(n.id, access)))
    })
    setItems(prev => prev.map(n => ({ ...n, is_read: true })))
    setMarkingAll(false)
  }

  const unreadCount = items.filter(n => !n.is_read).length

  // Group by date
  const grouped = items.reduce<Record<string, NotificationItem[]>>((acc, n) => {
    const day = new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    ;(acc[day] ??= []).push(n)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-primary-950 text-neutral-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-neutral-50">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-neutral-400 mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="text-xs text-gold-300 hover:text-gold-200 font-semibold border border-gold-400/25 rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors"
            >
              {markingAll ? 'Marking…' : 'Mark all read'}
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} lines={1} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<BellIcon width={24} height={24} />}
            title="No notifications yet"
            body="Updates about your cases and bookings will appear here."
          />
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([day, dayItems]) => (
              <div key={day}>
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-widest mb-3">{day}</p>
                <div className="space-y-2">
                  {dayItems.map((n, i) => {
                    const TypeIcon = TYPE_ICONS[n.notification_type] ?? BellIcon
                    return (
                    <button
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkRead(n.id)}
                      className={`stagger-child w-full text-left rounded-xl border p-4 transition-all ${
                        n.is_read
                          ? 'border-white/5 bg-white/3 opacity-60'
                          : 'border-white/10 bg-white/5 hover:border-gold-400/20 hover:bg-white/8'
                      }`}
                      style={{ '--i': Math.min(i, 8) } as React.CSSProperties}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 mt-0.5 text-neutral-400"><TypeIcon width={20} height={20} /></span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-neutral-100 truncate">{n.title}</p>
                            {!n.is_read && <span className="h-2 w-2 rounded-full bg-gold-400 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-neutral-600 mt-1.5">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
