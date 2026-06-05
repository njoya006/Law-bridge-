'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { ArrowRightIcon, CheckIcon, LawIcon } from '../../../components/icons/Icons'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push('/auth/login')
  }

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
              Account recovery
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl leading-tight text-neutral-50 sm:text-5xl lg:text-6xl">
                Reset your password securely.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-300 sm:text-lg">
                We’ll route you back into your client portal as soon as you confirm your email address.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-start gap-3">
                <CheckIcon className="mt-0.5 h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-neutral-100">A clean handoff back to login</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-300">No account details are shown on screen.</p>
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
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
            <div className="mb-8 space-y-2">
              <p className="text-sm uppercase tracking-[0.28em] text-gold-300">Send reset link</p>
              <h2 className="font-display text-3xl text-neutral-50">Forgot password</h2>
              <p className="text-sm leading-6 text-neutral-300">
                Enter the email associated with your client account.
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

              <Button type="submit" variant="gold" size="xl" className="w-full">
                Send reset link
                <ArrowRightIcon width={18} height={18} />
              </Button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-5 text-center text-sm text-neutral-300">
              <Link href="/auth/login" className="font-semibold text-gold-300 hover:text-gold-200">
                Back to sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}