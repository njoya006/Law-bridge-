'use client'
import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRightIcon, LawIcon } from '../../../components/icons/Icons'
import { applyRoleToSession, loginWithEmail, registerClient } from '../../../lib/authSession'

function pwStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  if (s <= 1) return { score: s, label: 'Too weak', color: 'bg-red-500' }
  if (s === 2) return { score: s, label: 'Weak', color: 'bg-amber-500' }
  if (s === 3) return { score: s, label: 'Fair', color: 'bg-yellow-400' }
  if (s === 4) return { score: s, label: 'Good', color: 'bg-emerald-500' }
  return { score: s, label: 'Strong', color: 'bg-emerald-400' }
}

function PwCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] transition-colors ${ok ? 'text-emerald-400' : 'text-neutral-600'}`}>
      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        {ok
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        }
      </svg>
      {label}
    </div>
  )
}

function Field({
  label, required, error, children,
}: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wide">
        {label} {required && <span className="text-gold-400">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-400 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </p>
      )}
    </div>
  )
}

const inputCls = (err?: string) =>
  `w-full rounded-xl px-4 py-3 bg-white/8 border text-neutral-50 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 transition-all ${
    err
      ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50'
      : 'border-white/10 focus:ring-gold-500/30 focus:border-gold-400/40'
  }`

export default function RegisterPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Validation
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const errs = useMemo(() => ({
    firstName: !firstName.trim() ? 'First name is required' : '',
    lastName: !lastName.trim() ? 'Last name is required' : '',
    email: !email.trim() ? 'Email is required' : !emailRe.test(email) ? 'Enter a valid email address' : '',
    password: password.length < 8 ? 'Password must be at least 8 characters' : '',
    confirmPassword: password !== confirmPassword ? 'Passwords do not match' : '',
  }), [firstName, lastName, email, password, confirmPassword])

  const strength = pwStrength(password)

  const canSubmit =
    !loading &&
    agreed &&
    !errs.firstName && !errs.lastName && !errs.email && !errs.password && !errs.confirmPassword &&
    firstName && lastName && email && password && confirmPassword

  function touch(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const fieldError = (field: keyof typeof errs) =>
    touched[field] ? errs[field] : undefined

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // Touch all fields to show errors
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true })
    if (!canSubmit) return

    setLoading(true)
    setError('')
    try {
      await registerClient({
        email: email.trim().toLowerCase(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        password,
      })
      const result = await loginWithEmail(email.trim().toLowerCase(), password)
      applyRoleToSession(result.me, 'client')
      router.push('/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message.replace(/^\d+ .*?: /, '') : 'Unable to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111a] text-neutral-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,146,58,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(57,107,166,0.18),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-stretch lg:grid-cols-[0.95fr_1.05fr]">

        {/* Left — info panel */}
        <section className="hidden lg:flex flex-col justify-center px-12 py-14 lg:order-2">
          <div className="max-w-md space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-gold-400/20 bg-white/5 px-4 py-2 text-sm text-neutral-200 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-primary-950 shadow-lg shadow-gold-500/20">
                <LawIcon width={16} height={16} />
              </div>
              New client onboarding
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-5xl leading-tight text-neutral-50">
                Your legal<br />portal starts<br />here.
              </h1>
              <p className="text-base leading-7 text-neutral-300">
                Secure access to your cases, documents, and your lawyer — all in one place.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { icon: '🔒', text: 'End-to-end encrypted case files' },
                { icon: '📋', text: 'Track every matter in real-time' },
                { icon: '⚖️', text: 'Access licensed Cameroonian lawyers' },
                { icon: '🌍', text: 'Available in English and French' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-neutral-300">
                  <span className="text-lg">{icon}</span>
                  {text}
                </div>
              ))}
            </div>

            <p className="text-sm text-neutral-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-gold-300 hover:text-gold-200 transition-colors">
                Sign in →
              </Link>
            </p>
          </div>
        </section>

        {/* Right — form */}
        <section className="flex items-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14 lg:order-1">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8 animate-fade-up" style={{ animationFillMode: 'both' }}>

            {/* Mobile header */}
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-primary-950">
                <LawIcon width={14} height={14} />
              </div>
              <span className="font-display font-semibold text-neutral-50">LawBridge</span>
            </div>

            <div className="mb-6 space-y-1">
              <p className="text-xs uppercase tracking-[0.28em] text-gold-300">Create account</p>
              <h2 className="font-display text-2xl text-neutral-50">Client Registration</h2>
              <p className="text-sm text-neutral-400">
                Fields marked <span className="text-gold-400">*</span> are required.
              </p>
            </div>

            <form onSubmit={submit} noValidate className="space-y-4">
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Name row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" required error={fieldError('firstName')}>
                  <input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    onBlur={() => touch('firstName')}
                    placeholder="Amina"
                    className={inputCls(fieldError('firstName'))}
                  />
                </Field>
                <Field label="Last name" required error={fieldError('lastName')}>
                  <input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    onBlur={() => touch('lastName')}
                    placeholder="Mballa"
                    className={inputCls(fieldError('lastName'))}
                  />
                </Field>
              </div>

              {/* Email + Phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email address" required error={fieldError('email')}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => touch('email')}
                    placeholder="you@example.com"
                    autoComplete="username"
                    className={inputCls(fieldError('email'))}
                  />
                </Field>
                <Field label="Phone (optional)">
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+237 6 12 456 789"
                    className={inputCls()}
                  />
                </Field>
              </div>

              {/* Password */}
              <Field label="Password" required error={fieldError('password')}>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onBlur={() => touch('password')}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    className={inputCls(fieldError('password')) + ' pr-16'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>

                {/* Strength meter */}
                {password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-1 h-1.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : 'bg-white/10'}`} />
                      ))}
                    </div>
                    <p className={`text-[11px] font-medium ${strength.score >= 4 ? 'text-emerald-400' : strength.score >= 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {strength.label}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <PwCheck ok={password.length >= 8} label="8+ characters" />
                      <PwCheck ok={/[A-Z]/.test(password)} label="Uppercase letter" />
                      <PwCheck ok={/[0-9]/.test(password)} label="Number" />
                      <PwCheck ok={/[^A-Za-z0-9]/.test(password)} label="Special character" />
                    </div>
                  </div>
                )}
              </Field>

              {/* Confirm password */}
              <Field label="Confirm password" required error={fieldError('confirmPassword')}>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onBlur={() => touch('confirmPassword')}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className={inputCls(fieldError('confirmPassword')) + ' pr-16'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                    aria-label={showConfirm ? 'Hide' : 'Show'}
                  >
                    {showConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
                {confirmPassword && !errs.confirmPassword && (
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Passwords match
                  </p>
                )}
              </Field>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${agreed ? 'border-gold-400 bg-gold-400' : 'border-neutral-600 group-hover:border-neutral-400'}`}>
                    {agreed && <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  I agree to the <span className="text-gold-300 cursor-pointer hover:text-gold-200">portal terms</span> and understand this account is for client access only.
                </p>
              </label>

              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 ${
                  canSubmit
                    ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-black hover:from-gold-300 hover:to-gold-400 shadow-lg hover:shadow-gold-500/25 active:scale-[0.99]'
                    : 'bg-neutral-700/50 text-neutral-500 cursor-not-allowed border border-white/5'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Creating your account…
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRightIcon width={16} height={16} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-white/8 pt-5 text-center text-sm text-neutral-400 space-y-2">
              <p>
                Already registered?{' '}
                <Link href="/auth/login" className="font-semibold text-gold-300 hover:text-gold-200 transition-colors">
                  Sign in
                </Link>
              </p>
              <p>
                Registering a law firm?{' '}
                <Link href="/auth/law-firm" className="font-semibold text-gold-300 hover:text-gold-200 transition-colors">
                  Create firm account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
