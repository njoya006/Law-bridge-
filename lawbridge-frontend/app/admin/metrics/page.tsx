'use client'

import React, { useEffect, useState } from 'react'
import {
  getPaymentStats, getNetworkStats, getLawyerStats, getLibraryStats, getCaseStats, getUsersStats,
  type PaymentStats, type NetworkStats, type LawyerStats, type LibraryStats, type CaseStats, type UsersStats,
} from '../../../lib/platformMetricsApi'
import { useCountUp } from '../../../lib/useCountUp'
import { SkeletonStat } from '../../../components/ui/Skeleton'
import {
  UsersIcon, PaymentIcon, CaseIcon, BadgeCheckIcon, NetworkIcon, BookOpenIcon, TrendingUpIcon, HandshakeIcon,
} from '../../../components/icons/Icons'

// Modeled platform commission on marketplace GMV — the revenue line for the deck.
const TAKE_RATE = 0.10

function fmtXAF(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return `${Math.round(n)}`
}

function Stat({ label, value, sub, Icon, accent = 'text-portal', isXAF }: {
  label: string; value: number | string; sub?: string
  Icon: React.ComponentType<{ width?: number; height?: number }>; accent?: string; isXAF?: boolean
}) {
  const numeric = typeof value === 'number'
  const anim = useCountUp(numeric ? (value as number) : 0)
  const shown = numeric ? (isXAF ? fmtXAF(anim) : anim.toLocaleString()) : value
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 mb-3 ${accent}`}><Icon width={18} height={18} /></div>
      <p className={`text-3xl stat-num ${accent}`}>{isXAF && <span className="text-lg align-top mr-0.5">XAF</span>}{shown}</p>
      <p className="text-sm font-medium text-neutral-200 mt-1">{label}</p>
      {sub && <p className="text-xs text-neutral-500 mt-0.5">{sub}</p>}
    </div>
  )
}

// Ordered (sequential) horizontal bars — one hue, darkest = top rank. Never rainbow.
function OrderedBars({ title, rows, hueClass }: { title: string; rows: { label: string; count: number }[]; hueClass: string[] }) {
  const max = Math.max(...rows.map(r => r.count), 1)
  const total = rows.reduce((s, r) => s + r.count, 0)
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">{title}</p>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="text-xs text-neutral-300 w-24 flex-shrink-0 truncate">{r.label}</span>
            <div className="flex-1 h-2.5 rounded-full bg-neutral-800/60 overflow-hidden">
              <div className={`h-full rounded-full ${hueClass[i] ?? hueClass[hueClass.length - 1]}`} style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-neutral-200 w-8 text-right tabular-nums">{r.count}</span>
            <span className="text-[10px] text-neutral-600 w-9 text-right">{total ? Math.round(100 * r.count / total) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Sequential funnel — total → accepted → completed.
function Funnel({ steps }: { steps: { label: string; count: number }[] }) {
  const max = Math.max(...steps.map(s => s.count), 1)
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">Referral funnel</p>
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-xs text-neutral-300 w-20 flex-shrink-0">{s.label}</span>
            <div className="flex-1 h-6 rounded-lg bg-neutral-800/40 overflow-hidden">
              <div className="h-full rounded-lg bg-portal-accent/70 flex items-center justify-end pr-2" style={{ width: `${Math.max((s.count / max) * 100, 6)}%`, opacity: 1 - i * 0.18 }}>
                <span className="text-[11px] font-bold text-white">{s.count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PlatformMetricsPage() {
  const [pay, setPay] = useState<PaymentStats | null>(null)
  const [net, setNet] = useState<NetworkStats | null>(null)
  const [law, setLaw] = useState<LawyerStats | null>(null)
  const [lib, setLib] = useState<LibraryStats | null>(null)
  const [cas, setCas] = useState<CaseStats | null>(null)
  const [usr, setUsr] = useState<UsersStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }
    Promise.allSettled([
      getPaymentStats(token), getNetworkStats(token), getLawyerStats(token),
      getLibraryStats(token), getCaseStats(token), getUsersStats(token),
    ]).then(([p, n, l, li, c, u]) => {
      if (p.status === 'fulfilled') setPay(p.value)
      if (n.status === 'fulfilled') setNet(n.value)
      if (l.status === 'fulfilled') setLaw(l.value)
      if (li.status === 'fulfilled') setLib(li.value)
      if (c.status === 'fulfilled') setCas(c.value)
      if (u.status === 'fulfilled') setUsr(u.value)
      setLoading(false)
    })
  }, [])

  const gmv = pay?.gmv_total ?? 0
  const revenue = gmv * TAKE_RATE

  const ROLE_HUE = ['bg-portal-accent/70', 'bg-emerald-400/70', 'bg-amber-400/70', 'bg-primary-400/70', 'bg-neutral-500/60']
  const TIER_HUE = ['bg-gold-400', 'bg-gold-500/80', 'bg-emerald-400/70', 'bg-primary-400/60', 'bg-neutral-500/50']

  const roleRows = usr ? Object.entries(usr.by_role).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k.replace('_', ' '), count: v })) : []

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="font-display text-2xl font-bold text-neutral-50">Platform Metrics</h1>
        <p className="mt-1 text-sm text-neutral-500">The growth, marketplace and network story across every system — the investor view.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4,5,6,7,8].map(i => <SkeletonStat key={i} />)}</div>
      ) : (
        <>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Registered Users" value={usr?.count ?? 0} sub="clients + lawyers + staff" Icon={UsersIcon} accent="text-portal" />
            <Stat label="Marketplace GMV" value={gmv} isXAF sub="confirmed payments" Icon={PaymentIcon} accent="text-emerald-400" />
            <Stat label="Est. Platform Revenue" value={revenue} isXAF sub={`${Math.round(TAKE_RATE * 100)}% modeled take-rate`} Icon={TrendingUpIcon} accent="text-gold-400" />
            <Stat label="Matters Managed" value={cas?.total_cases ?? 0} sub={`${cas?.cases_this_month ?? 0} this month`} Icon={CaseIcon} accent="text-primary-400" />
          </div>

          {/* Supply & trust */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-neutral-300">Supply &amp; Trust</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Lawyers" value={law?.total_lawyers ?? 0} sub="on the platform" Icon={UsersIcon} accent="text-portal" />
              <Stat label="Verified" value={law?.verified_lawyers ?? 0} sub={`${law?.verification_rate ?? 0}% of lawyers`} Icon={BadgeCheckIcon} accent="text-emerald-400" />
              <Stat label="Mentorship Links" value={law?.mentorship_connections ?? 0} sub="active pairings" Icon={HandshakeIcon} accent="text-amber-400" />
              <Stat label="Assignment Rate" value={`${cas?.assignment_rate ?? 0}%`} sub="matters with a lawyer" Icon={CaseIcon} accent="text-primary-400" />
            </div>
            {law && law.reputation_tiers.some(t => t.count > 0) && (
              <OrderedBars title="Reputation tier distribution" rows={law.reputation_tiers.map(t => ({ label: t.tier, count: t.count }))} hueClass={TIER_HUE} />
            )}
          </section>

          {/* Network effects */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-neutral-300">Network Effects</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="Follows" value={net?.total_follows ?? 0} sub={`${net?.avg_follows_per_active ?? 0} per active lawyer`} Icon={NetworkIcon} accent="text-portal" />
              <Stat label="Referrals" value={net?.total_referrals ?? 0} sub={`${net?.referral_acceptance_rate ?? 0}% accepted`} Icon={HandshakeIcon} accent="text-emerald-400" />
              <Stat label="Feed Events" value={net?.feed_events ?? 0} sub="professional activity" Icon={TrendingUpIcon} accent="text-gold-400" />
              <Stat label="Seeking Mentors" value={law?.seeking_mentor ?? 0} sub={`${law?.open_to_mentoring ?? 0} offering`} Icon={UsersIcon} accent="text-primary-400" />
            </div>
            {net && net.total_referrals > 0 && (
              <Funnel steps={[
                { label: 'Sent', count: net.total_referrals },
                { label: 'Accepted', count: net.referrals_accepted },
                { label: 'Completed', count: net.referrals_completed },
              ]} />
            )}
          </section>

          {/* Knowledge engagement + user mix */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-neutral-300">Knowledge &amp; Users</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Stat label="CamLex Titles" value={(lib?.published_books ?? 0) + (lib?.published_articles ?? 0)} sub={`${lib?.total_book_views ?? 0} views`} Icon={BookOpenIcon} accent="text-portal" />
              <Stat label="CLE Credits Issued" value={lib?.cle_credits_issued ?? 0} sub={`${lib?.lawyers_earning_cle ?? 0} lawyers`} Icon={BadgeCheckIcon} accent="text-emerald-400" />
              <Stat label="GMV This Month" value={pay?.gmv_this_month ?? 0} isXAF sub={`${pay?.payments_this_month ?? 0} payments`} Icon={PaymentIcon} accent="text-gold-400" />
              <Stat label="Active Matters" value={cas?.active_cases ?? 0} sub={`${cas?.closed_cases ?? 0} closed`} Icon={CaseIcon} accent="text-primary-400" />
            </div>
            {roleRows.length > 0 && <OrderedBars title="Users by role" rows={roleRows} hueClass={ROLE_HUE} />}
          </section>

          <p className="text-[11px] text-neutral-600 text-center">
            Revenue shown is GMV × a modeled {Math.round(TAKE_RATE * 100)}% platform take-rate. All figures aggregate live platform data.
          </p>
        </>
      )}
    </div>
  )
}
