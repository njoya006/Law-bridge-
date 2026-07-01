'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { ArrowRightIcon, CheckIcon, LawIcon } from '../../../components/icons/Icons'
import { api } from '../../../lib/api'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.')
    }
  }, [token])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.post('auth', '/auth/password-reset/confirm/', { token, new_password: newPassword })
      setDone(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
      {done ? (
        <div className="space-y-4 text-center py-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <CheckIcon className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="font-display text-2xl text-neutral-50">Password updated</h2>
          <p className="text-sm text-neutral-300">
            Your password has been changed successfully. Redirecting you to sign in…
          </p>
          <Link href="/auth/login" className="mt-4 inline-block font-semibold text-gold-300 hover:text-gold-200 text-sm">
            Sign in now →
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8 space-y-2">
            <p className="text-sm uppercase tracking-[0.28em] text-gold-300">New password</p>
            <h2 className="font-display text-3xl text-neutral-50">Set a new password</h2>
            <p className="text-sm leading-6 text-neutral-300">Must be at least 8 characters.</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat new password"
              required
            />

            {error && (
              <div className="rounded-2xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-100">
                {error}
              </div>
            )}

            <Button type="submit" variant="gold" size="xl" className="w-full" disabled={loading || !token}>
              {loading ? 'Updating…' : 'Set new password'}
              <ArrowRightIcon width={18} height={18} />
            </Button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-5 text-center text-sm text-neutral-300">
            <Link href="/auth/forgot-password" className="font-semibold text-gold-300 hover:text-gold-200">
              Request a new reset link
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111a] text-neutral-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,146,58,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(57,107,166,0.16),transparent_30%)]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-stretch lg:grid-cols-[1fr_0.92fr]">
        <section className="flex flex-col justify-between px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
          <div className="max-w-xl space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-gold-400/20 bg-white/5 px-4 py-2 text-sm text-neutral-200 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-primary-950 shadow-lg shadow-gold-500/20">
                <LawIcon width={16} height={16} />
              </div>
              Account security
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl leading-tight text-neutral-50 sm:text-5xl lg:text-6xl">
                Create a strong new password.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-300 sm:text-lg">
                Your new password will be active immediately after you confirm it.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-100">Reset links are single-use</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-300">Once your password is changed, this link becomes invalid.</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-10 text-sm text-neutral-400">
            Remember your password?{' '}
            <Link href="/auth/login" className="font-semibold text-gold-300 hover:text-gold-200">
              Sign in
            </Link>
          </p>
        </section>

        <section className="flex items-center px-6 pb-10 sm:px-10 lg:px-12 lg:py-14">
          <Suspense fallback={<div className="text-neutral-400 text-sm">Loading…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </section>
      </div>
    </div>
  )
}
