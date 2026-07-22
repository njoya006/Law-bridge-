'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listReviewQueue, publishBook, rejectBook, type BookItem, type BookStatus } from '../../../lib/libraryApi'
import { Badge } from '../../../components/ui/Badge'
import { SkeletonCard } from '../../../components/ui/Skeleton'
import { EmptyState } from '../../../components/ui/EmptyState'
import { ExpandIcon, CheckCircleIcon } from '../../../components/icons/Icons'

const STATUS_CONFIG: Record<string, { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' }> = {
  draft:        { label: 'Draft',        variant: 'neutral' },
  under_review: { label: 'Under Review', variant: 'warning' },
  published:    { label: 'Published',    variant: 'success' },
  rejected:     { label: 'Rejected',     variant: 'danger' },
  archived:     { label: 'Archived',     variant: 'neutral' },
}

export default function AdminContentPage() {
  const [queue, setQueue] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})
  const [rejectOpen, setRejectOpen] = useState<Record<string, boolean>>({})
  const [acting, setActing] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access') || ''
      const data = await listReviewQueue(token)
      setQueue(data)
    } catch {
      setQueue([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    setActing(id)
    try {
      const token = localStorage.getItem('access') || ''
      await publishBook(id, token)
      showToast('Publication approved and published')
      load()
    } catch {
      showToast('Failed to approve')
    } finally {
      setActing(null)
    }
  }

  const handleReject = async (id: string) => {
    setActing(id)
    try {
      const token = localStorage.getItem('access') || ''
      await rejectBook(id, rejectReasons[id] || '', token)
      showToast('Publication rejected')
      setRejectOpen(prev => ({ ...prev, [id]: false }))
      load()
    } catch {
      showToast('Failed to reject')
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="min-h-screen bg-primary-950">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-primary-900 border border-white/10 px-4 py-3 text-sm text-white/80 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin" className="text-xs text-white/30 hover:text-white/50 transition-colors">Admin</Link>
            <ExpandIcon width={12} height={12} className="text-white/20" />
            <span className="text-xs text-white/50">Content Moderation</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Content Moderation</h1>
              <p className="text-sm text-white/35 mt-1">Review and approve legal publications before they go live</p>
            </div>
            <div className="flex items-center gap-3">
              {!loading && queue.length > 0 && <Badge variant="warning" size="md">{queue.length} awaiting review</Badge>}
              <Link href="/library" className="text-xs text-portal hover:opacity-80 transition-colors">
                Browse Library →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} lines={2} />)}
          </div>
        ) : queue.length === 0 ? (
          <EmptyState
            icon={<CheckCircleIcon width={24} height={24} className="text-emerald-400/60" />}
            title="All clear"
            body="No publications awaiting review"
          />
        ) : (
          <div className="space-y-4">
            {queue.map((book, i) => {
              const cfg = STATUS_CONFIG[book.status] || STATUS_CONFIG.under_review
              const isActing = acting === book.id
              return (
                <div key={book.id} className="rounded-xl bg-primary-900/60 border border-white/8 overflow-hidden stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 flex-wrap">
                          <h3 className="text-[15px] font-semibold text-white leading-snug">{book.title}</h3>
                          <Badge variant={cfg.variant} size="md" className="flex-shrink-0">{cfg.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-white/35">
                          <span>By <span className="text-white/55 font-medium">{book.author_name}</span></span>
                          <span>{book.tier === 'general' ? 'General Library' : 'Firm Library'}</span>
                          {book.submitted_at && (
                            <span>Submitted {new Date(book.submitted_at).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}</span>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/library/${book.id}`}
                        className="flex-shrink-0 text-xs text-portal/60 hover:text-portal transition-colors"
                      >
                        Read full →
                      </Link>
                    </div>

                    {book.abstract && (
                      <p className="text-sm text-white/40 leading-relaxed line-clamp-2 mb-4">{book.abstract}</p>
                    )}

                    {book.legal_areas.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {book.legal_areas.map(area => (
                          <span key={area} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/35">
                            {area}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {rejectOpen[book.id] ? (
                      <div className="space-y-2">
                        <textarea
                          placeholder="Rejection reason (shown to the author)…"
                          value={rejectReasons[book.id] || ''}
                          onChange={e => setRejectReasons(prev => ({ ...prev, [book.id]: e.target.value }))}
                          rows={2}
                          className="w-full rounded-lg bg-white/5 border border-crimson-500/20 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-crimson-500/40 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(book.id)}
                            disabled={isActing}
                            className="flex-1 rounded-lg bg-crimson-500/15 border border-crimson-500/25 text-xs font-semibold text-crimson-400 py-2 hover:bg-crimson-500/25 disabled:opacity-50 transition-colors"
                          >
                            {isActing ? 'Rejecting…' : 'Confirm Rejection'}
                          </button>
                          <button
                            onClick={() => setRejectOpen(prev => ({ ...prev, [book.id]: false }))}
                            className="px-4 rounded-lg bg-white/5 text-xs text-white/40 py-2 hover:bg-white/8 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(book.id)}
                          disabled={isActing}
                          className="flex-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-sm font-semibold text-emerald-400 py-2.5 hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
                        >
                          {isActing ? 'Publishing…' : 'Approve & Publish'}
                        </button>
                        <button
                          onClick={() => setRejectOpen(prev => ({ ...prev, [book.id]: true }))}
                          disabled={isActing}
                          className="flex-1 rounded-lg bg-white/5 border border-white/8 text-sm font-medium text-white/40 py-2.5 hover:bg-white/8 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
