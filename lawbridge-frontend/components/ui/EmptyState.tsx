'use client'

import React from 'react'
import Link from 'next/link'

function DefaultIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  body?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="py-16 text-center flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-primary-800/50 border border-white/6 flex items-center justify-center text-neutral-500">
        {icon ?? <DefaultIcon />}
      </div>
      <p className="text-sm font-semibold text-neutral-300 mt-1">{title}</p>
      {body && <p className="text-xs text-neutral-500 max-w-[220px] leading-relaxed">{body}</p>}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold text-gold-400 hover:bg-gold-500/20 transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs font-semibold text-gold-400 hover:bg-gold-500/20 transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
