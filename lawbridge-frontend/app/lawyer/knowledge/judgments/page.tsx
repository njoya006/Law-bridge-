'use client'

import React, { useEffect, useState } from 'react'
import { api } from '../../../../lib/api'
import { Badge } from '../../../../components/ui/Badge'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { SkeletonCard } from '../../../../components/ui/Skeleton'
import { SearchIcon, BalanceIcon } from '../../../../components/icons/Icons'

type Judgment = {
  id: string
  title: string
  author?: string
  category?: string
  excerpt?: string
  created_at: string
  url?: string
}

export default function JudgmentsPage() {
  const [items, setItems] = useState<Judgment[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }
    api.get<{ results?: Judgment[] } | Judgment[]>('library', '/?category=judgment&ordering=-created_at&limit=50', token)
      .then(res => setItems(Array.isArray(res) ? res : res.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = query
    ? items.filter(j => j.title.toLowerCase().includes(query.toLowerCase()) || (j.category ?? '').toLowerCase().includes(query.toLowerCase()))
    : items

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h2 className="font-display text-display-md">Judgments & Case Law</h2>
        <p className="mt-1 text-sm text-neutral-400">Curated legal judgments and precedents from the library</p>
      </header>

      <div className="relative">
        <SearchIcon width={16} height={16} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search judgments…"
          className="w-full rounded-xl bg-primary-800/40 border border-white/8 pl-11 pr-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-500/30"
        />
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <SkeletonCard key={i} lines={2} />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<BalanceIcon width={24} height={24} />}
          title={query ? 'No results found' : 'No judgments available'}
          body={query ? 'Try a different search term.' : 'Legal judgments published to the library will appear here.'}
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((j, i) => (
            <div key={j.id} className="rounded-2xl border border-white/8 bg-primary-800/20 p-5 hover:border-white/12 transition-colors stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    {j.category && (
                      <Badge variant="gold">{j.category}</Badge>
                    )}
                    <span className="text-[10px] text-neutral-600">{new Date(j.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <p className="font-semibold text-neutral-100">{j.title}</p>
                  {j.author && <p className="text-xs text-neutral-500 mt-0.5">{j.author}</p>}
                  {j.excerpt && <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{j.excerpt}</p>}
                </div>
                <a href={j.url ?? `/library/${j.id}`}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-gold-400/25 text-gold-400 hover:bg-gold-500/10 transition-colors">
                  Read
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
