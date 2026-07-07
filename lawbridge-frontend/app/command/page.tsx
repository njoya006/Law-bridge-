'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const ENDPOINT = '/api/v1/auth/sys/token'

function Blink() {
  const [on, setOn] = useState(true)
  useEffect(() => {
    const t = setInterval(() => setOn(v => !v), 530)
    return () => clearInterval(t)
  }, [])
  return <span className={on ? 'opacity-100' : 'opacity-0'}>█</span>
}

function TermLine({ text, delay = 0, onDone }: { text: string; delay?: number; onDone?: () => void }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    if (!text) {
      const t = setTimeout(() => onDone?.(), delay)
      return () => clearTimeout(t)
    }
    let i = 0
    const t = setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setShown(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(interval)
          onDone?.()
        }
      }, 18)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(t)
  }, [text, delay, onDone])
  return <p className="min-h-[1.25rem]">{shown || ' '}</p>
}

export default function CommandPage() {
  const router = useRouter()
  const [step, setStep] = useState<'boot' | 'key' | 'creds' | 'loading' | 'error'>('boot')
  const [accessKey, setAccessKey] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockUntil, setLockUntil] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [bootDone, setBootDone] = useState(false)
  const keyRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (step === 'key') setTimeout(() => keyRef.current?.focus(), 50)
    if (step === 'creds') setTimeout(() => emailRef.current?.focus(), 50)
  }, [step])

  const lockRemaining = Math.max(0, Math.ceil((lockUntil - now) / 1000))
  const isLocked = lockRemaining > 0

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessKey.trim()) return
    setStep('creds')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked) return
    if (!email.trim() || !password.trim()) return

    setStep('loading')
    setErrorMsg('')

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_key: accessKey, email, password }),
      })

      if (!res.ok) {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        if (newAttempts >= 5) {
          setLockUntil(Date.now() + 60_000)
          setAttempts(0)
          setErrorMsg('Too many failed attempts. Terminal locked for 60 seconds.')
        } else {
          setErrorMsg(`Authentication failed. ${5 - newAttempts} attempt(s) remaining.`)
        }
        setStep('error')
        return
      }

      const data = await res.json() as {
        access: string; refresh: string
        user: { id: string; email: string; full_name: string; role: string }
      }

      localStorage.setItem('access', data.access)
      localStorage.setItem('refresh', data.refresh)
      localStorage.setItem('portalRole', 'admin')
      localStorage.setItem('userRole', data.user.role)
      localStorage.setItem('authUserId', data.user.id)
      localStorage.setItem('userEmail', data.user.email)
      localStorage.setItem('fullName', data.user.full_name)

      router.replace('/admin')
    } catch {
      setErrorMsg('Connection error. Check network and retry.')
      setStep('error')
    }
  }

  const retryFromKey = () => {
    setAccessKey('')
    setEmail('')
    setPassword('')
    setErrorMsg('')
    setStep('key')
  }

  const retryFromCreds = () => {
    setErrorMsg('')
    setStep('creds')
  }

  return (
    <div className="min-h-screen bg-black text-[#00ff88] font-mono flex flex-col items-center justify-center px-4 select-none">
      <div className="w-full max-w-xl">
        {/* Boot sequence */}
        {step === 'boot' && (
          <div className="text-sm leading-5">
            <TermLine text="LawBridge OS v2.0.3 (build 20250629)" delay={0} />
            <TermLine text="Copyright (c) LawBridge Technologies Ltd." delay={300} />
            <TermLine text="" delay={500} />
            <TermLine text="Initializing secure subsystem..." delay={600} />
            <TermLine text="Loading cryptographic modules.............. OK" delay={1000} />
            <TermLine text="Verifying session integrity................. OK" delay={1600} />
            <TermLine text="Establishing encrypted channel.............. OK" delay={2200} />
            <TermLine text="" delay={2600} />
            <TermLine
              text="WARNING: Unauthorized access is strictly prohibited."
              delay={2800}
            />
            <TermLine
              text="All sessions are logged, monitored, and audited."
              delay={3100}
            />
            <TermLine text="" delay={3400} />
            <TermLine
              text="SYSTEM ACCESS REQUIRED >"
              delay={3500}
              onDone={() => setTimeout(() => { setBootDone(true); setStep('key') }, 400)}
            />
          </div>
        )}

        {/* Step 1 — Access Key */}
        {step === 'key' && (
          <div className="space-y-6">
            <div className="space-y-1 text-sm leading-6">
              <p className="text-[#00ff88]/60">LawBridge OS v2.0.3 — Secure Terminal</p>
              <p className="text-[#00ff88]/40 text-xs">All sessions are logged and audited.</p>
            </div>

            <form onSubmit={handleKeySubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[#00ff88]/50 mb-2 tracking-widest uppercase">
                  &gt; System Access Key
                </label>
                <div className="flex items-center border border-[#00ff88]/20 bg-[#00ff88]/[0.03] rounded">
                  <span className="text-[#00ff88]/40 pl-3 text-sm">$</span>
                  <input
                    ref={keyRef}
                    type="password"
                    value={accessKey}
                    onChange={e => setAccessKey(e.target.value)}
                    placeholder="Enter system access key"
                    autoComplete="off"
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-[#00ff88] placeholder:text-[#00ff88]/20 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!accessKey.trim()}
                className="w-full py-2.5 border border-[#00ff88]/30 text-[#00ff88]/80 text-sm tracking-widest uppercase hover:bg-[#00ff88]/5 hover:border-[#00ff88]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                AUTHENTICATE →
              </button>
            </form>
          </div>
        )}

        {/* Step 2 — Credentials */}
        {step === 'creds' && (
          <div className="space-y-6">
            <div className="space-y-1 text-sm leading-6">
              <p className="text-[#00ff88]/60">LawBridge OS v2.0.3 — Secure Terminal</p>
              <p className="text-[#00ff88]">
                <span className="text-[#00ff88]/40">&gt;</span> Identity verification required
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-[#00ff88]/50 mb-2 tracking-widest uppercase">
                  &gt; Email
                </label>
                <div className="flex items-center border border-[#00ff88]/20 bg-[#00ff88]/[0.03] rounded">
                  <span className="text-[#00ff88]/40 pl-3 text-sm">@</span>
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="operator@lawbridge.cm"
                    autoComplete="username"
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-[#00ff88] placeholder:text-[#00ff88]/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#00ff88]/50 mb-2 tracking-widest uppercase">
                  &gt; Password
                </label>
                <div className="flex items-center border border-[#00ff88]/20 bg-[#00ff88]/[0.03] rounded">
                  <span className="text-[#00ff88]/40 pl-3 text-sm">#</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="flex-1 bg-transparent px-3 py-3 text-sm text-[#00ff88] placeholder:text-[#00ff88]/20 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="pr-3 text-[#00ff88]/30 hover:text-[#00ff88]/60 text-xs tracking-wider transition-colors"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!email.trim() || !password.trim()}
                className="w-full py-2.5 border border-[#00ff88]/30 text-[#00ff88]/80 text-sm tracking-widest uppercase hover:bg-[#00ff88]/5 hover:border-[#00ff88]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                SIGN IN →
              </button>

              <button
                type="button"
                onClick={retryFromKey}
                className="w-full text-xs text-[#00ff88]/25 hover:text-[#00ff88]/50 transition-colors py-1"
              >
                ← re-enter access key
              </button>
            </form>
          </div>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div className="space-y-2 text-sm">
            <p className="text-[#00ff88]/60">Authenticating<span className="animate-pulse">...</span></p>
            <p className="text-[#00ff88]/30 text-xs">Verifying credentials against secure registry</p>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="space-y-4 text-sm">
            <div className="border border-red-500/30 bg-red-500/5 p-4 space-y-1">
              <p className="text-red-400 text-xs tracking-widest uppercase">⚠ Access Denied</p>
              <p className="text-red-400/80 text-xs mt-1">{errorMsg}</p>
            </div>
            {isLocked ? (
              <p className="text-[#00ff88]/30 text-xs text-center">
                Terminal locked — retry in {lockRemaining}s
              </p>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={retryFromKey}
                  className="flex-1 py-2 border border-[#00ff88]/20 text-[#00ff88]/40 text-xs tracking-widest uppercase hover:border-[#00ff88]/40 hover:text-[#00ff88]/70 transition-all"
                >
                  RESTART
                </button>
                <button
                  onClick={retryFromCreds}
                  className="flex-1 py-2 border border-[#00ff88]/20 text-[#00ff88]/40 text-xs tracking-widest uppercase hover:border-[#00ff88]/40 hover:text-[#00ff88]/70 transition-all"
                >
                  RETRY CREDENTIALS
                </button>
              </div>
            )}
          </div>
        )}

        {/* Cursor when idle */}
        {(step === 'key' || step === 'creds') && (
          <div className="mt-6 text-[#00ff88]/20 text-xs flex items-center gap-1">
            <Blink />
          </div>
        )}
      </div>
    </div>
  )
}
