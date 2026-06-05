"use client"
import React, { useEffect, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { listNotifications, markNotificationRead, type NotificationItem } from '../../lib/notificationsApi'

export default function ChatPage(){
  const [items,setItems]=useState<NotificationItem[]>([])
  const [error,setError]=useState('')

  const refresh = async () => {
    const access = localStorage.getItem('access')
    if (!access) {
      setError('Sign in to read your messages and updates.')
      return
    }

    try {
      const response = await listNotifications(access, 50)
      setItems(response.results)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load updates')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const read = async (item: NotificationItem) => {
    const access = localStorage.getItem('access')
    if (!access) return
    await markNotificationRead(item.id, access)
    await refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-display-md">Messages & Updates</h2>
      </div>
      {error && <Card className="border border-crimson-500/30 text-crimson-200">{error}</Card>}
      <div className="space-y-3">
        {items.length === 0 && !error && <Card>No updates yet.</Card>}
        {items.map(item => (
          <Card key={item.id} className={item.read ? 'opacity-70' : ''}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="mt-1 text-sm text-primary-300">{item.message}</div>
              </div>
              {!item.read && (
                <button onClick={() => void read(item)} className="rounded bg-gold-500 px-3 py-1 text-sm font-semibold text-black">Mark read</button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
