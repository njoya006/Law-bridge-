'use client'

import React from 'react'

interface ReputationBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

function getTier(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 85) return { label: 'Elite',    color: 'text-gold-300',    bg: 'bg-gold-500/15',    border: 'border-gold-400/40' }
  if (score >= 70) return { label: 'Expert',   color: 'text-primary-300', bg: 'bg-primary-500/15', border: 'border-primary-400/40' }
  if (score >= 50) return { label: 'Senior',   color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-400/40' }
  if (score >= 30) return { label: 'Active',   color: 'text-neutral-300', bg: 'bg-neutral-600/20', border: 'border-neutral-500/30' }
  return               { label: 'Rising',   color: 'text-neutral-400', bg: 'bg-neutral-700/20', border: 'border-neutral-600/30' }
}

export function ReputationBadge({ score, size = 'md', showLabel = true }: ReputationBadgeProps) {
  const tier = getTier(score)
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size]

  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${sizeClasses} ${tier.color} ${tier.bg} ${tier.border}`}>
      <svg
        width={size === 'sm' ? 10 : size === 'md' ? 12 : 14}
        height={size === 'sm' ? 10 : size === 'md' ? 12 : 14}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      <span>{score}</span>
      {showLabel && <span className="opacity-70">· {tier.label}</span>}
    </span>
  )
}
