'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../../../../lib/api'

type LawyerProfile = {
  id: string
  specialization: string
  availability_status: string
  open_to_partnerships?: boolean
  max_active_cases: number
  active_cases: number
}

export default function OpportunitiesPage() {
  const [profile, setProfile] = useState<LawyerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }
    api.get<LawyerProfile>('lawyer', '/lawyers/me/', token)
      .then(setProfile).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const capacity = profile ? Math.max(profile.max_active_cases - profile.active_cases, 0) : 0

  const opportunities = [
    {
      id: 'cases',
      title: 'New Case Requests',
      desc: `You have capacity for ${capacity} more active ${capacity === 1 ? 'matter' : 'matters'}.`,
      cta: 'View Bookings',
      href: '/lawyer/bookings',
      active: capacity > 0,
      icon: '📋',
    },
    {
      id: 'verify',
      title: 'Get Verified',
      desc: 'Verified lawyers appear first in search results and build client trust faster.',
      cta: 'Start Verification',
      href: '/lawyer/verify',
      active: true,
      icon: '✅',
    },
    {
      id: 'partnerships',
      title: 'Firm Partnerships',
      desc: 'Partner with other firms to handle complex multi-discipline matters.',
      cta: 'Explore Partnerships',
      href: '/lawyer/network/partnerships',
      active: profile?.open_to_partnerships !== false,
      icon: '🏛️',
    },
    {
      id: 'discover',
      title: 'Network & Visibility',
      desc: 'Get discovered by clients searching in your specialization and circuit.',
      cta: 'View Your Profile',
      href: '/lawyer/profile',
      active: true,
      icon: '🌐',
    },
    {
      id: 'library',
      title: 'Publish Articles',
      desc: 'Establish thought leadership by publishing to the LawBridge library.',
      cta: 'Write an Article',
      href: '/lawyer/library/new',
      active: true,
      icon: '✍️',
    },
    {
      id: 'referrals',
      title: 'Receive Referrals',
      desc: 'Build your network so colleagues refer clients who need your specialization.',
      cta: 'View Referrals',
      href: '/lawyer/network/referrals',
      active: true,
      icon: '↗️',
    },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h2 className="font-display text-display-md">Opportunities</h2>
        <p className="mt-1 text-sm text-neutral-400">Ways to grow your practice and build your reputation</p>
      </header>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-40 rounded-2xl border border-white/8 bg-primary-800/20 animate-pulse"/>)}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {opportunities.map(opp => (
            <div key={opp.id} className={`rounded-2xl border p-5 flex flex-col gap-3 transition-all ${
              opp.active ? 'border-white/8 bg-primary-800/20 hover:border-white/15' : 'border-white/5 bg-primary-900/40 opacity-60'
            }`}>
              <div className="text-3xl">{opp.icon}</div>
              <div className="flex-1">
                <p className="font-semibold text-neutral-100">{opp.title}</p>
                <p className="text-sm text-neutral-500 mt-1 leading-relaxed">{opp.desc}</p>
              </div>
              <Link href={opp.href}
                className="self-start text-sm font-semibold text-gold-400 hover:text-gold-300 transition-colors">
                {opp.cta} →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
