import React from 'react'
import { cn } from '../../lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold' | 'portal'

// Codifies the soft-pill recipe that was hand-typed per page across the app
// (e.g. `rounded-full border px-2 py-0.5 text-[10px] bg-gold-500/10 border-gold-400/20 text-gold-400`).
const VARIANTS: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 border-emerald-400/25 text-emerald-400',
  warning: 'bg-amber-500/10 border-amber-400/25 text-amber-400',
  danger:  'bg-crimson-500/10 border-crimson-400/25 text-crimson-400',
  info:    'bg-primary-500/15 border-primary-400/30 text-primary-300',
  neutral: 'bg-white/5 border-white/10 text-neutral-400',
  gold:    'bg-gold-500/10 border-gold-400/25 text-gold-400',
  portal:  'bg-portal-soft border-portal text-portal',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
}

export function Badge({
  children,
  variant = 'gold',
  size = 'sm',
  className = '',
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {children}
    </span>
  )
}

export default Badge
