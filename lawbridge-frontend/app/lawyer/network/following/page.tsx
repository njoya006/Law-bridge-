'use client'

import React, { useEffect, useState } from 'react'
import { getFollowing, unfollowLawyer, type Follow } from '../../../../lib/networkApi'
import { SkeletonCard } from '../../../../components/ui/Skeleton'
import { TeamIcon } from '../../../../components/icons/Icons'

export default function FollowingPage() {
  const [following, setFollowing] = useState<Follow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }
    getFollowing(token).then(setFollowing).finally(() => setLoading(false))
  }, [])

  async function handleUnfollow(f: Follow) {
    const token = localStorage.getItem('access')
    if (!token) return
    await unfollowLawyer(f.id, token).catch(() => null)
    setFollowing(prev => prev.filter(x => x.id !== f.id))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h2 className="font-display text-display-md">Following</h2>
        <p className="mt-1 text-sm text-neutral-400">Lawyers you follow · {following.length} connection{following.length !== 1 ? 's' : ''}</p>
      </header>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <SkeletonCard key={i} lines={1} />)}
        </div>
      )}

      {!loading && following.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/12 bg-primary-800/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-portal-soft text-portal"><TeamIcon width={22} height={22} /></div>
            <div>
              <h3 className="font-semibold text-neutral-200">Not following anyone yet</h3>
              <p className="text-xs text-neutral-500">Following colleagues fills your Feed with their wins, publications and milestones.</p>
            </div>
          </div>
          <ol className="space-y-2 mb-5">
            {['Open Discover and find a lawyer whose work you want to track', 'On their profile, tap the Follow button next to their name', 'Their activity then appears in your Network → Feed'].map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-neutral-400">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-portal-soft text-portal text-[11px] font-bold">{i + 1}</span>{s}
              </li>
            ))}
          </ol>
          <a href="/lawyer/discover"
            className="inline-flex items-center gap-2 rounded-xl border border-portal bg-portal-soft px-5 py-2.5 text-sm font-semibold text-portal hover:opacity-90 transition-colors">
            Browse lawyers to follow →
          </a>
        </div>
      )}

      {!loading && following.length > 0 && (
        <div className="space-y-2">
          {following.map((f, i) => (
            <div key={f.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-primary-800/20 p-4 hover:border-white/12 transition-colors stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 border border-gold-500/20 flex items-center justify-center text-gold-300 font-bold text-sm flex-shrink-0">
                {f.following_id.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-100 truncate">Lawyer {f.following_id.slice(0, 8)}</p>
                <p className="text-xs text-neutral-600">Since {new Date(f.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <button onClick={() => void handleUnfollow(f)}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-neutral-500 hover:border-crimson-500/30 hover:text-crimson-400 transition-colors flex-shrink-0">
                Unfollow
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
