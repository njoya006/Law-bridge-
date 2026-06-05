'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { acceptInvite } from '../../../lib/firmsApi'

export default function AcceptInvitePage() {
  const params = useParams()
  const token = params?.token as string | undefined
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'no-token' | 'accepted' | 'error'>('loading')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!token) {
        if (!cancelled) setStatus('no-token')
        return
      }

      const access = localStorage.getItem('access')
      if (!access) {
        if (!cancelled) setStatus('no-token')
        return
      }

      try {
        await acceptInvite(token, access)
        if (!cancelled) setStatus('accepted')
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setMessage(err instanceof Error ? err.message : String(err))
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [token])

  if (status === 'loading') return <div>Accepting invite...</div>
  if (status === 'no-token') return <div>Please sign in to accept this invite.</div>
  if (status === 'error') return (
    <div>
      <h1>Failed to accept invite</h1>
      <p className="text-sm text-red-400">{message ?? 'Unknown error'}</p>
      <button onClick={() => router.push('/')} className="mt-4 rounded border px-3 py-1">Go home</button>
    </div>
  )

  return (
    <div>
      <h1 className="font-display text-2xl">Invite accepted</h1>
      <p className="text-sm text-primary-300">You've been added to the firm. You can now access firm resources.</p>
      <div className="mt-4">
        <button onClick={() => router.push('/lawyer/profile')} className="rounded bg-gold-500 px-3 py-2 font-semibold text-black">Go to profile</button>
      </div>
    </div>
  )
}
