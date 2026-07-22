import React from 'react'
import { cn } from '../../lib/utils'

type CardVariant = 'default' | 'interactive' | 'elevated' | 'glass'

const VARIANTS: Record<CardVariant, string> = {
  // Standard content surface — the one card recipe, used everywhere by default.
  default: `rounded-2xl p-6 bg-primary-800/30 border border-white/8 shadow-card
             transition-all duration-200
             hover:border-white/12 hover:bg-primary-800/40`,
  // Clickable cards (kanban items, list rows that link somewhere) — lift + portal-tinted glow.
  interactive: `rounded-2xl p-6 bg-primary-800/30 border border-white/8 shadow-card cursor-pointer
                card-lift hover:border-portal hover:bg-primary-800/40`,
  // Prominent standalone panels (hero/featured blocks) — stronger resting shadow, no hover motion.
  elevated: `rounded-2xl p-6 bg-primary-800/40 border border-white/10 shadow-card-lg`,
  // Overlay/glass surfaces (modals, floating panels over imagery).
  glass: `rounded-2xl p-6 bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-card-lg`,
}

export function Card({
  children,
  className = '',
  variant = 'default',
  style,
}: {
  children: React.ReactNode
  className?: string
  variant?: CardVariant
  style?: React.CSSProperties
}) {
  return (
    <div className={cn(VARIANTS[variant], className)} style={style}>
      {children}
    </div>
  )
}

export default Card
