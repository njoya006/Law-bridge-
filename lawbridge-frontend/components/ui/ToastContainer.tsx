'use client'
import React, { useEffect, useState, useCallback } from 'react'
import type { ToastOptions, ToastType } from '../../lib/toast'

interface ToastItem extends ToastOptions {
  id: number
  phase: 'enter' | 'idle' | 'exit'
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <line strokeLinecap="round" strokeWidth={2.5} x1="18" y1="6" x2="6" y2="18" />
      <line strokeLinecap="round" strokeWidth={2.5} x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <line x1="12" y1="8" x2="12" y2="12" strokeWidth={2} strokeLinecap="round" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  ),
}

const PALETTE: Record<ToastType, {
  border: string; bg: string; text: string; icon: string; progress: string
}> = {
  success: {
    border: 'border-emerald-500/30',
    bg:     'bg-emerald-700/30',
    text:   'text-emerald-100',
    icon:   'text-emerald-400',
    progress: 'bg-emerald-400',
  },
  error: {
    border: 'border-crimson-500/30',
    bg:     'bg-crimson-700/30',
    text:   'text-crimson-100',
    icon:   'text-crimson-400',
    progress: 'bg-crimson-500',
  },
  warning: {
    border: 'border-amber-500/30',
    bg:     'bg-amber-700/30',
    text:   'text-amber-100',
    icon:   'text-amber-400',
    progress: 'bg-amber-400',
  },
  info: {
    border: 'border-primary-400/30',
    bg:     'bg-primary-900/90',
    text:   'text-primary-100',
    icon:   'text-primary-400',
    progress: 'bg-primary-400',
  },
}

let nextId = 1

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, phase: 'exit' as const } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const opts = (e as CustomEvent<ToastOptions>).detail
      const id = nextId++
      const item: ToastItem = { ...opts, id, phase: 'enter', type: opts.type ?? 'info' }
      setToasts(prev => [...prev.slice(-4), item])

      // Transition to idle after one frame for enter animation
      requestAnimationFrame(() => {
        setToasts(prev => prev.map(t => t.id === id && t.phase === 'enter' ? { ...t, phase: 'idle' } : t))
      })

      const duration = opts.duration ?? (opts.type === 'error' ? 7000 : 4500)
      setTimeout(() => remove(id), duration)
    }
    window.addEventListener('lawbridge:toast', handler)
    return () => window.removeEventListener('lawbridge:toast', handler)
  }, [remove])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none"
      style={{ maxWidth: 'min(380px, calc(100vw - 2.5rem))' }}
    >
      {toasts.map(t => {
        const type = t.type ?? 'info'
        const p = PALETTE[type]
        const duration = t.duration ?? (type === 'error' ? 7000 : 4500)
        const isEntering = t.phase === 'enter'
        const isExiting  = t.phase === 'exit'
        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto relative overflow-hidden rounded-2xl border ${p.border} ${p.bg} ${p.text} shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md`}
            style={{
              transition: 'opacity 300ms ease, transform 300ms cubic-bezier(0.34,1.2,0.64,1)',
              opacity:   isEntering || isExiting ? 0 : 1,
              transform: isEntering ? 'translateX(24px) scale(0.96)' : isExiting ? 'translateX(24px) scale(0.96)' : 'translateX(0) scale(1)',
            }}
          >
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
              <div
                className={`h-full ${p.progress} origin-left`}
                style={{
                  animation: `toastProgress ${duration}ms linear forwards`,
                }}
              />
            </div>

            <div className="flex items-start gap-3 px-4 py-3.5">
              <span className={`mt-0.5 ${p.icon} flex-shrink-0`}>{ICONS[type]}</span>
              <div className="flex-1 min-w-0 pr-1">
                {t.title && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70 mb-0.5">{t.title}</p>
                )}
                <p className="text-[13px] leading-snug font-medium">{t.message}</p>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-lg opacity-40 hover:opacity-90 hover:bg-white/10 transition-all mt-0.5"
                aria-label="Dismiss"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )
      })}

      <style>{`
        @keyframes toastProgress {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  )
}
