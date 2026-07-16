'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { ArrowRightIcon, BalanceIcon, CheckIcon, LawIcon } from '../../../components/icons/Icons'
import { applyRoleToSession, clearSession, loginWithEmail } from '../../../lib/authSession'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await loginWithEmail(email, password)
      if ((result.me.role || '').toLowerCase() !== 'client') {
        clearSession()
        setError('This portal is for clients only. Please use the firm staff login instead.')
        return
      }
      applyRoleToSession(result.me, 'client')
      router.push('/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111a] text-neutral-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,146,58,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(57,107,166,0.2),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-stretch lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
          <div className="max-w-xl space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-gold-400/20 bg-white/5 px-4 py-2 text-sm text-neutral-200 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-primary-900 shadow-lg shadow-gold-500/20">
                <LawIcon width={16} height={16} />
              </div>
              Secure client access
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl leading-tight text-neutral-50 sm:text-5xl lg:text-6xl">
                Sign in to your client portal.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-300 sm:text-lg">
                Keep track of matters, documents, billing, and secure messages from one calm, focused workspace.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <BalanceIcon className="mb-3 h-5 w-5 text-gold-300" />
                <p className="text-sm text-neutral-300">Case updates and progress snapshots</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <CheckIcon className="mb-3 h-5 w-5 text-emerald-400" />
                <p className="text-sm text-neutral-300">Documents and receipts in one place</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <ArrowRightIcon className="mb-3 h-5 w-5 text-sky-300" />
                <p className="text-sm text-neutral-300">Direct access to your team when needed</p>
              </div>
            </div>
          </div>

          <p className="mt-10 text-sm text-neutral-400">
            Need a new client account?{' '}
            <Link href="/auth/register" className="font-semibold text-gold-300 hover:text-gold-200">
              Create one here
            </Link>
          </p>
          <p className="mt-3 text-sm text-neutral-400">
            Already with a law firm?{' '}
            <Link href="/auth/lawyer-login" className="font-semibold text-gold-300 hover:text-gold-200">
              Sign in as firm staff
            </Link>
          </p>
        </section>

        <section className="flex items-center px-6 pb-10 sm:px-10 lg:px-12 lg:py-14">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8 animate-fade-up" style={{ animationFillMode: 'both' }}>
            <div className="mb-8 space-y-2">
              <p className="text-sm uppercase tracking-[0.28em] text-gold-300">Welcome back</p>
              <h2 className="font-display text-3xl text-neutral-50">Sign in</h2>
              <p className="text-sm leading-6 text-neutral-300">
                Use your client email and password to continue.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
              <Input
                label="Password"
                type="password"
                showPasswordToggle
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Enter your password"
              />

              {error && (
                <div className="rounded-2xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-100">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between gap-4 text-sm text-neutral-300">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded border-neutral-600 bg-transparent text-gold-400 focus:ring-gold-400" />
                  Remember me
                </label>
                <Link href="/auth/forgot-password" className="font-medium text-gold-300 hover:text-gold-200">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" variant="gold" size="xl" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
                <ArrowRightIcon width={18} height={18} />
              </Button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-5 text-center text-sm text-neutral-300">
              <span>Need an account? </span>
              <Link href="/auth/register" className="font-semibold text-gold-300 hover:text-gold-200">
                Sign up
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
