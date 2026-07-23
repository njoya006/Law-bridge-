'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFeed, type FeedItem } from '../../../../lib/networkApi'
import { SkeletonCard } from '../../../../components/ui/Skeleton'
import { DocumentIcon, HandshakeIcon, UserIcon, BuildingIcon, NetworkIcon, GavelIcon, BadgeCheckIcon, TrophyIcon, BriefcaseIcon } from '../../../../components/icons/Icons'

const TYPE_META: Record<string, { label: string; dot: string; Icon: React.ComponentType<{ className?: string }> }> = {
  article:            { label: 'Article',            dot: 'bg-gold-400',    Icon: DocumentIcon },
  referral_accepted:  { label: 'Referral Accepted', dot: 'bg-emerald-400', Icon: HandshakeIcon },
  referral_completed: { label: 'Referral Completed',dot: 'bg-emerald-400', Icon: HandshakeIcon },
  follow:             { label: 'New Follower',       dot: 'bg-primary-400', Icon: UserIcon },
  partnership:        { label: 'Partnership',        dot: 'bg-amber-400',   Icon: BuildingIcon },
  case_won:           { label: 'Verdict Won',        dot: 'bg-emerald-400', Icon: GavelIcon },
  case_settled:       { label: 'Matter Settled',     dot: 'bg-emerald-400', Icon: HandshakeIcon },
  lawyer_verified:    { label: 'Verified',           dot: 'bg-primary-400', Icon: BadgeCheckIcon },
  tier_reached:       { label: 'Reputation Tier',    dot: 'bg-gold-400',    Icon: TrophyIcon },
  capacity_open:      { label: 'Open to Matters',    dot: 'bg-emerald-400', Icon: BriefcaseIcon },
}

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NetworkFeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }
    getFeed(token).then(setFeed).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h2 className="font-display text-display-md">Network Feed</h2>
        <p className="mt-1 text-sm text-neutral-400">Activity from your legal network</p>
      </header>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} lines={2} />)}
        </div>
      )}

      {!loading && feed.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/12 bg-primary-800/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-portal-soft text-portal"><NetworkIcon width={22} height={22} /></div>
            <div>
              <h3 className="font-semibold text-neutral-200">Your feed is quiet</h3>
              <p className="text-xs text-neutral-500">The feed shows professional activity from lawyers you follow.</p>
            </div>
          </div>
          <ol className="space-y-2 mb-5">
            {['Open Discover and follow a few colleagues', 'When they win a verdict, publish to CamLex, or reach a new reputation tier, it lands here', 'Your own milestones appear here too, so your followers see them'].map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-neutral-400">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-portal-soft text-portal text-[11px] font-bold">{i + 1}</span>{s}
              </li>
            ))}
          </ol>
          <Link href="/lawyer/discover"
            className="inline-flex items-center gap-2 rounded-xl border border-portal bg-portal-soft px-5 py-2.5 text-sm font-semibold text-portal hover:opacity-90 transition-colors">
            Find lawyers to follow →
          </Link>
        </div>
      )}

      {!loading && feed.length > 0 && (
        <div className="space-y-3">
          {feed.map((item, i) => {
            const meta = TYPE_META[item.item_type] ?? { label: item.item_type, dot: 'bg-neutral-500', Icon: NetworkIcon }
            const { Icon } = meta
            return (
              <div key={item.id} className="rounded-2xl border border-white/8 bg-primary-800/20 p-5 hover:border-white/12 transition-colors stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-700/60 border border-white/10 flex items-center justify-center text-neutral-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{meta.label}</span>
                      <span className="text-[10px] text-neutral-700 ml-auto flex-shrink-0">{timeAgo(item.created_at)}</span>
                    </div>
                    <p className="text-sm font-medium text-neutral-100">{item.title}</p>
                    {item.body && <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{item.body}</p>}
                    {item.external_url && (
                      <a href={item.external_url} target="_blank" rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 transition-colors">
                        Read more →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
