'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listReviewQueue, publishBook, rejectBook, type BookItem, type BookStatus } from '../../../lib/libraryApi'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft:        { label: 'Draft',        color: 'text-white/40 bg-white/5' },
  under_review: { label: 'Under Review', color: 'text-amber-400 bg-amber-500/10' },
  published:    { label: 'Published',    color: 'text-emerald-400 bg-emerald-500/10' },
  rejected:     { label: 'Rejected',     color: 'text-red-400 bg-red-500/10' },
  archived:     { label: 'Archived',     color: 'text-white/30 bg-white/3' },
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white/20">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs text-white/50">Content Moderation</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Content Moderation</h1>
              <p className="text-sm text-white/35 mt-1">Review and approve legal publications before they go live</p>
            </div>
            <div className="flex items-center gap-3">
              {!loading && queue.length > 0 && (
                <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-3 py-1 text-xs font-semibold text-amber-400">
                  {queue.length} awaiting review
                </span>
              )}
              <Link href="/library" className="text-xs text-gold-400 hover:text-gold-300 transition-colors">
                Browse Library →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl bg-primary-900/60 border border-white/6 p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="h-5 bg-white/8 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                  </div>
                  <div className="h-6 bg-amber-500/15 rounded-full w-28" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-400/60">
                <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-[15px] font-medium text-white/50">All clear</p>
            <p className="text-sm text-white/30 mt-1">No publications awaiting review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map(book => {
              const cfg = STATUS_CONFIG[book.status] || STATUS_CONFIG.under_review
              const isActing = acting === book.id
              return (
                <div key={book.id} className="rounded-xl bg-primary-900/60 border border-white/8 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 flex-wrap">
                          <h3 className="text-[15px] font-semibold text-white leading-snug">{book.title}</h3>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color} flex-shrink-0`}>
                            {cfg.label}
                          </span>
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
                        className="flex-shrink-0 text-xs text-gold-400/60 hover:text-gold-400 transition-colors"
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
                          className="w-full rounded-lg bg-white/5 border border-red-500/20 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/40 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(book.id)}
                            disabled={isActing}
                            className="flex-1 rounded-lg bg-red-500/15 border border-red-500/25 text-xs font-semibold text-red-400 py-2 hover:bg-red-500/25 disabled:opacity-50 transition-colors"
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
