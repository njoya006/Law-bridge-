'use client'

import React, { useEffect, useState } from 'react'
import { getFollowing, unfollowLawyer, type Follow } from '../../../../lib/networkApi'

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
          {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl border border-white/8 bg-primary-800/20 animate-pulse"/>)}
        </div>
      )}

      {!loading && following.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-700/40 text-3xl">👥</div>
          <h3 className="font-semibold text-neutral-200">Not following anyone yet</h3>
          <p className="mt-1.5 text-sm text-neutral-500">Discover lawyers and follow them to stay updated with their work.</p>
          <a href="/discover"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-5 py-2.5 text-sm font-semibold text-gold-400 hover:bg-gold-500/20 transition-colors">
            Discover Lawyers →
          </a>
        </div>
      )}

      {!loading && following.length > 0 && (
        <div className="space-y-2">
          {following.map(f => (
            <div key={f.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-primary-800/20 p-4 hover:border-white/12 transition-colors">
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
