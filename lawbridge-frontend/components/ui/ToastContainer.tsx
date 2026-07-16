'use client'
import React, { useEffect, useState, useCallback } from 'react'
import type { ToastOptions, ToastType } from '../../lib/toast'

interface ToastItem extends ToastOptions {
  id: number
  exiting: boolean
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-500/40 bg-emerald-900/80 text-emerald-200 [--icon-color:theme(colors.emerald.400)]',
  error:   'border-red-500/40 bg-red-900/80 text-red-200 [--icon-color:theme(colors.red.400)]',
  warning: 'border-amber-500/40 bg-amber-900/80 text-amber-200 [--icon-color:theme(colors.amber.400)]',
  info:    'border-blue-500/40 bg-blue-900/80 text-blue-200 [--icon-color:theme(colors.blue.400)]',
}

let nextId = 1

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const opts = (e as CustomEvent<ToastOptions>).detail
      const id = nextId++
      const item: ToastItem = { ...opts, id, exiting: false, type: opts.type ?? 'info' }
      setToasts(prev => [...prev.slice(-4), item])
      const duration = opts.duration ?? (opts.type === 'error' ? 6000 : 4000)
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
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: 'min(360px, calc(100vw - 2rem))' }}
    >
      {toasts.map(t => {
        const type = t.type ?? 'info'
        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-sm transition-all duration-300 ${STYLES[type]} ${
              t.exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
            }`}
          >
            <span className="mt-0.5 text-[var(--icon-color,currentColor)]">{ICONS[type]}</span>
            <div className="flex-1 min-w-0">
              {t.title && <p className="text-xs font-bold uppercase tracking-wide opacity-80 mb-0.5">{t.title}</p>}
              <p className="text-sm leading-snug">{t.message}</p>
            </div>
            <button
              onClick={() => remove(t.id)}
              className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
              aria-label="Dismiss"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
