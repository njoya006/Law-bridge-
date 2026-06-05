'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { ArrowRightIcon, CheckIcon, BriefcaseIcon, LawIcon } from '../../../components/icons/Icons'
import { applyRoleToSession, loginWithEmail, registerClient } from '../../../lib/authSession'

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [organization, setOrganization] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await registerClient({
        email,
        full_name: `${firstName} ${lastName}`.trim(),
        password,
      })

      const result = await loginWithEmail(email, password)
      applyRoleToSession(result.me, 'client')
      router.push('/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to register')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111a] text-neutral-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,146,58,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(57,107,166,0.18),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-stretch lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between px-6 py-10 sm:px-10 lg:px-12 lg:py-14 lg:order-2">
          <div className="max-w-xl space-y-8 lg:ml-auto">
            <div className="inline-flex items-center gap-3 rounded-full border border-gold-400/20 bg-white/5 px-4 py-2 text-sm text-neutral-200 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-primary-950 shadow-lg shadow-gold-500/20">
                <LawIcon width={16} height={16} />
              </div>
              New client onboarding
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl leading-tight text-neutral-50 sm:text-5xl lg:text-6xl">
                Create your client account.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-300 sm:text-lg">
                Set up your portal in minutes and start receiving updates, sharing files, and tracking matters securely.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <CheckIcon className="mb-3 h-5 w-5 text-emerald-400" />
                <p className="text-sm text-neutral-300">A secure workspace for every case</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <BriefcaseIcon className="mb-3 h-5 w-5 text-sky-300" />
                <p className="text-sm text-neutral-300">Keep personal and organization details in sync</p>
              </div>
            </div>
          </div>

          <p className="mt-10 text-sm text-neutral-400 lg:ml-auto">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-gold-300 hover:text-gold-200">
              Sign in
            </Link>
          </p>
          <p className="mt-3 text-sm text-neutral-400 lg:ml-auto">
            Need to onboard a law firm instead?{' '}
            <Link href="/auth/law-firm" className="font-semibold text-gold-300 hover:text-gold-200">
              Create a firm account
            </Link>
          </p>
        </section>

        <section className="flex items-center px-6 pb-10 sm:px-10 lg:px-12 lg:py-14 lg:order-1">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
            <div className="mb-8 space-y-2">
              <p className="text-sm uppercase tracking-[0.28em] text-gold-300">Start here</p>
              <h2 className="font-display text-3xl text-neutral-50">Sign up</h2>
              <p className="text-sm leading-6 text-neutral-300">
                Create a client account to access your portal.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              {error && (
                <div className="rounded-2xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-100">
                  {error}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="First name"
                  value={firstName}
                  onChange={event => setFirstName(event.target.value)}
                  placeholder="Amina"
                />
                <Input
                  label="Last name"
                  value={lastName}
                  onChange={event => setLastName(event.target.value)}
                  placeholder="Mballa"
                />
              </div>

              <Input
                label="Organization"
                value={organization}
                onChange={event => setOrganization(event.target.value)}
                placeholder="Mballa Family Office"
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  placeholder="+237 6 12 456 789"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="Create a password"
                />
                <Input
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-neutral-600 bg-transparent text-gold-400 focus:ring-gold-400" />
                I agree to the portal terms and understand this account is for client access only.
              </label>

              <Button type="submit" variant="gold" size="xl" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
                <ArrowRightIcon width={18} height={18} />
              </Button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-5 text-center text-sm text-neutral-300">
              <span>Already registered? </span>
              <Link href="/auth/login" className="font-semibold text-gold-300 hover:text-gold-200">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
