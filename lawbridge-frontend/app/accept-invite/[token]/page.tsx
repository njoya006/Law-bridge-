'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { CheckIcon, LawIcon, XCircleIcon } from '../../../components/icons/Icons'
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
    return () => { cancelled = true }
  }, [token])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111a] text-neutral-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,146,58,0.12),transparent_50%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-500 text-primary-900 shadow-lg shadow-gold-500/30">
            <LawIcon width={22} height={22} />
          </div>
        </div>

        {status === 'loading' && (
          <Card className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <span className="animate-spin h-8 w-8 border-2 border-gold-400 border-t-transparent rounded-full" />
            </div>
            <p className="text-neutral-300">Accepting your invitation…</p>
          </Card>
        )}

        {status === 'no-token' && (
          <Card className="p-8 text-center space-y-4">
            <p className="font-display text-xl text-neutral-50">Sign in required</p>
            <p className="text-sm text-neutral-400">
              You need to be signed in to accept a firm invitation.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <Button variant="gold" className="w-full" onClick={() => router.push('/auth/lawyer-login')}>
                Sign in to firm workspace
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                Go home
              </Button>
            </div>
          </Card>
        )}

        {status === 'error' && (
          <Card className="p-8 text-center space-y-4 border border-crimson-500/30">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-crimson-500/10 border border-crimson-500/30">
                <XCircleIcon className="h-7 w-7 text-crimson-400" />
              </div>
            </div>
            <div>
              <p className="font-display text-xl text-neutral-50">Failed to accept invite</p>
              {message && <p className="mt-2 text-sm text-crimson-300">{message}</p>}
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button variant="outline" className="w-full" onClick={() => router.push('/lawyer/dashboard')}>
                Go to dashboard
              </Button>
            </div>
          </Card>
        )}

        {status === 'accepted' && (
          <Card className="p-8 text-center space-y-4 border border-emerald-500/20">
            <div className="flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <CheckIcon className="h-7 w-7 text-emerald-400" />
              </div>
            </div>
            <div>
              <p className="font-display text-2xl text-neutral-50">Invite accepted!</p>
              <p className="mt-2 text-sm text-neutral-300">
                You've been added to the firm. You can now access firm resources and manage matters.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button variant="gold" className="w-full" onClick={() => router.push('/lawyer/dashboard')}>
                Go to firm dashboard
              </Button>
              <Link
                href="/lawyer/office/me"
                className="text-sm text-gold-300 hover:text-gold-200 transition-colors"
              >
                Set up my office →
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
