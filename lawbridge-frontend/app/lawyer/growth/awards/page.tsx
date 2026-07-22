'use client'

import React, { useEffect, useState } from 'react'
import { api } from '../../../../lib/api'
import { getLawyerStats } from '../../../../lib/monitoringApi'
import { ReputationBadge } from '../../../../components/ui/ReputationBadge'
import { SkeletonCard } from '../../../../components/ui/Skeleton'
import {
  BadgeCheckIcon, BalanceIcon, LawIcon, StarIcon, SparklesIcon, TrophyIcon,
} from '../../../../components/icons/Icons'

type LawyerProfile = {
  reputation_score?: number
  verified_at?: string | null
  years_of_experience: number
  total_cases: number
  average_rating: string
  rating_count: number
}
type Stats = { active_cases: number; closed_cases_count: number; cases_this_month: number }

type Achievement = {
  id: string
  label: string
  desc: string
  icon: React.ComponentType<{ className?: string }> | string
  unlocked: boolean
  tier?: 'gold' | 'silver' | 'bronze'
}

function AchievementIcon({ icon, className }: { icon: Achievement['icon']; className?: string }) {
  if (typeof icon === 'string') return <span className="text-2xl">{icon}</span>
  const Icon = icon
  return <Icon className={className} />
}

export default function AwardsPage() {
  const [profile, setProfile] = useState<LawyerProfile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    const lid = localStorage.getItem('authUserId') || ''
    if (!token) { setLoading(false); return }
    Promise.allSettled([
      api.get<LawyerProfile>('lawyer', '/lawyers/me/', token),
      getLawyerStats(lid, token),
    ]).then(([pr, sr]) => {
      if (pr.status === 'fulfilled') setProfile(pr.value)
      if (sr.status === 'fulfilled') setStats(sr.value as Stats)
    }).finally(() => setLoading(false))
  }, [])

  const score = profile?.reputation_score ?? 0
  const closedCases = stats?.closed_cases_count ?? 0
  const rating = parseFloat(profile?.average_rating ?? '0')

  const achievements: Achievement[] = [
    { id: 'verified',   label: 'Verified Professional', desc: 'Completed identity and credential verification',            icon: BadgeCheckIcon, unlocked: !!profile?.verified_at,   tier: 'gold' },
    { id: 'pioneer',    label: 'Pioneer',               desc: 'One of the first lawyers on LawBridge',                    icon: '🚀', unlocked: true,                     tier: 'silver' },
    { id: 'closer5',    label: 'Case Closer',           desc: 'Resolved 5+ cases successfully',                           icon: BalanceIcon, unlocked: closedCases >= 5,         tier: 'bronze' },
    { id: 'closer25',   label: 'Veteran Litigator',     desc: 'Resolved 25+ cases',                                       icon: LawIcon, unlocked: closedCases >= 25,        tier: 'silver' },
    { id: 'closer100',  label: 'Elite Counsel',         desc: 'Resolved 100+ cases',                                      icon: '👑', unlocked: closedCases >= 100,       tier: 'gold' },
    { id: 'toprated',   label: 'Top Rated',             desc: 'Maintained a 4.5+ average client rating',                  icon: StarIcon, unlocked: rating >= 4.5,           tier: 'gold' },
    { id: 'reputation', label: 'Rising Star',           desc: 'Achieved a reputation score above 50',                     icon: SparklesIcon, unlocked: score >= 50,             tier: 'silver' },
    { id: 'elite',      label: 'Elite Member',          desc: 'Reached a reputation score above 85',                      icon: '💎', unlocked: score >= 85,             tier: 'gold' },
    { id: 'experience', label: 'Senior Counsel',        desc: '10+ years of legal experience',                            icon: '🎓', unlocked: (profile?.years_of_experience ?? 0) >= 10, tier: 'silver' },
  ]

  const unlocked = achievements.filter(a => a.unlocked)
  const locked   = achievements.filter(a => !a.unlocked)

  const tierColors = {
    gold:   'border-gold-400/40 bg-gold-500/10',
    silver: 'border-neutral-400/30 bg-neutral-500/10',
    bronze: 'border-amber-600/30 bg-amber-700/10',
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h2 className="font-display text-display-md">Awards & Recognition</h2>
        <p className="mt-1 text-sm text-neutral-400">Achievements earned through your practice on LawBridge</p>
      </header>

      {!loading && profile && (
        <div className="rounded-2xl border border-gold-400/20 bg-gold-500/[0.04] p-6 flex items-center gap-5">
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-700/20 border border-gold-400/30 flex items-center justify-center text-gold-400">
            <TrophyIcon width={28} height={28} />
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Reputation Score</p>
            <ReputationBadge score={score} size="lg" showLabel />
            <p className="text-xs text-neutral-500 mt-2">{unlocked.length} of {achievements.length} achievements unlocked</p>
          </div>
        </div>
      )}

      {loading && <SkeletonCard />}

      {unlocked.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Unlocked ({unlocked.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlocked.map((a, i) => (
              <div key={a.id} className={`rounded-2xl border p-4 flex items-center gap-4 stagger-child ${a.tier ? tierColors[a.tier] : 'border-white/8 bg-primary-800/20'}`} style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                <div className="flex-shrink-0 text-gold-400 flex items-center justify-center w-8 h-8">
                  <AchievementIcon icon={a.icon} className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-100 text-sm">{a.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-3">Locked ({locked.length})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locked.map((a, i) => (
              <div key={a.id} className="rounded-2xl border border-white/5 bg-primary-900/30 p-4 flex items-center gap-4 opacity-50 stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                <div className="flex-shrink-0 text-neutral-500 grayscale flex items-center justify-center w-8 h-8">
                  <AchievementIcon icon={a.icon} className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-400 text-sm">{a.label}</p>
                  <p className="text-xs text-neutral-600 mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
