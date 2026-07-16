'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listMyBooks, listMyArticles, listReviewQueue, publishBook, rejectBook, type BookItem, type BookStatus, type ArticleItem } from '../../../lib/libraryApi'

const STATUS_CONFIG: Record<BookStatus, { label: string; color: string; dot: string }> = {
  draft:        { label: 'Draft',        color: 'text-white/40 bg-white/5 border-white/8',    dot: 'bg-white/30' },
  under_review: { label: 'Under Review', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  published:    { label: 'Published',    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
  rejected:     { label: 'Rejected',     color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
  archived:     { label: 'Archived',     color: 'text-white/30 bg-white/3 border-white/6',    dot: 'bg-white/20' },
}

function StatusBadge({ status }: { status: BookStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function ReviewCard({ book, onApprove, onReject }: { book: BookItem; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  return (
    <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-[13px] font-semibold text-white leading-snug">{book.title}</p>
          <p className="text-xs text-white/40 mt-0.5">
            By {book.author_name} · {book.tier === 'firm' ? 'Firm Library' : 'General Library'}
          </p>
        </div>
        <StatusBadge status={book.status} />
      </div>
      {book.abstract && (
        <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-4">{book.abstract}</p>
      )}

      {showRejectForm ? (
        <div className="space-y-2">
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (visible to author)…"
            rows={2}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-red-500/40 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onReject(book.id)}
              className="flex-1 rounded-lg bg-red-500/15 border border-red-500/25 text-xs font-medium text-red-400 py-2 hover:bg-red-500/25 transition-colors"
            >
              Confirm Rejection
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              className="px-4 rounded-lg bg-white/5 text-xs text-white/40 py-2 hover:bg-white/8 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(book.id)}
            className="flex-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-xs font-semibold text-emerald-400 py-2 hover:bg-emerald-500/25 transition-colors"
          >
            Approve & Publish
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            className="flex-1 rounded-lg bg-white/5 border border-white/8 text-xs font-medium text-white/40 py-2 hover:bg-white/8 transition-colors"
          >
            Reject
          </button>
          <Link
            href={`/library/${book.id}`}
            className="px-4 rounded-lg bg-white/5 border border-white/8 text-xs text-white/40 py-2 hover:bg-white/8 transition-colors flex items-center"
          >
            Read
          </Link>
        </div>
      )}
    </div>
  )
}

type MainTab = 'publications' | 'articles' | 'review' | 'analytics'

export default function LawyerLibraryPage() {
  const [myBooks, setMyBooks] = useState<BookItem[]>([])
  const [myArticles, setMyArticles] = useState<ArticleItem[]>([])
  const [reviewQueue, setReviewQueue] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<BookStatus | ''>('')
  const [mainTab, setMainTab] = useState<MainTab>('publications')
  const [isReviewer, setIsReviewer] = useState(false)
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access') || ''
      const firmId = localStorage.getItem('firmId')
      const role = localStorage.getItem('userRole') || ''
      const reviewer = ['partner', 'firm_admin', 'owner', 'admin'].includes(role)
      setIsReviewer(reviewer)

      const [mine, articles, queue] = await Promise.all([
        listMyBooks(token, activeFilter || undefined),
        listMyArticles(token).catch(() => [] as ArticleItem[]),
        reviewer ? listReviewQueue(token, firmId).catch(() => [] as BookItem[]) : Promise.resolve([] as BookItem[]),
      ])
      setMyBooks(mine)
      setMyArticles(articles)
      setReviewQueue(queue)
    } catch {
      setMyBooks([])
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('access') || ''
      const firmId = localStorage.getItem('firmId')
      await publishBook(id, token, firmId)
      load()
    } catch {}
  }

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem('access') || ''
      const firmId = localStorage.getItem('firmId')
      await rejectBook(id, rejectReasons[id] || '', token, firmId)
      load()
    } catch {}
  }

  const filters: { label: string; value: BookStatus | '' }[] = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'draft' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Published', value: 'published' },
    { label: 'Rejected', value: 'rejected' },
  ]

  // ── Analytics computations ─────────────────────────────────────────────────

  const publishedBooks = myBooks.filter(b => b.status === 'published')
  const publishedArticles = myArticles.filter(a => a.status === 'published')
  const totalViews = publishedBooks.reduce((s, b) => s + (b.views ?? 0), 0)
    + publishedArticles.reduce((s, a) => s + (a.views ?? 0), 0)

  type ContentEntry = { id: string; title: string; views: number; type: 'book' | 'article' }
  const allContent: ContentEntry[] = [
    ...publishedBooks.map(b => ({ id: b.id, title: b.title, views: b.views ?? 0, type: 'book' as const })),
    ...publishedArticles.map(a => ({ id: a.id, title: a.title, views: a.views ?? 0, type: 'article' as const })),
  ].sort((a, b) => b.views - a.views)

  const maxViews = allContent[0]?.views ?? 1

  // Most-read legal area
  const areaCount: Record<string, number> = {}
  for (const b of publishedBooks) b.legal_areas.forEach(a => { areaCount[a] = (areaCount[a] ?? 0) + 1 })
  for (const a of publishedArticles) a.legal_areas.forEach(ar => { areaCount[ar] = (areaCount[ar] ?? 0) + 1 })
  const topArea = Object.entries(areaCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return (
    <div className="min-h-screen bg-primary-950">
      {/* Header */}
      <div className="border-b border-white/6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/library" className="text-xs text-white/30 hover:text-white/50 transition-colors">
                  Library
                </Link>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white/20">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs text-white/50">My Publications</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">My Publications</h1>
              <p className="text-sm text-white/35 mt-1">Manage your legal articles and publications</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/lawyer/library/articles/new"
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-white/65 hover:bg-white/10 hover:border-white/18 hover:text-white/85 transition-all flex-shrink-0"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" strokeLinecap="round"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round"/>
                </svg>
                New Article
              </Link>
              <Link
                href="/lawyer/library/new"
                className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-primary-900 hover:bg-gold-400 transition-colors flex-shrink-0 shadow-md shadow-gold-500/20"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                New Book
              </Link>
            </div>
          </div>

          {/* Main tab bar */}
          <div className="flex gap-1 p-1 bg-white/4 rounded-xl w-fit mt-6">
            {([
              { id: 'publications', label: 'Books' },
              { id: 'articles',     label: 'Articles' },
              ...(isReviewer && reviewQueue.length > 0 ? [{ id: 'review', label: `Review (${reviewQueue.length})` }] : []),
              { id: 'analytics', label: 'Analytics' },
            ] as { id: MainTab; label: string }[]).map(t => (
              <button
                key={t.id}
                onClick={() => setMainTab(t.id)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                  mainTab === t.id ? 'bg-gold-500 text-primary-900' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Books tab ─────────────────────────────────────────────────────── */}
        {mainTab === 'publications' && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <h2 className="text-sm font-semibold text-white/70">My Books</h2>
              <div className="flex gap-1 p-1 bg-white/4 rounded-xl w-fit">
                {filters.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setActiveFilter(f.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      activeFilter === f.value
                        ? 'bg-gold-500 text-primary-900'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-primary-900/60 border border-white/6 p-5 animate-pulse">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="h-4 bg-white/8 rounded w-2/3 mb-2" />
                        <div className="h-3 bg-white/5 rounded w-1/3" />
                      </div>
                      <div className="h-6 bg-white/6 rounded-full w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : myBooks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-gold-500/8 border border-gold-500/15 flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-gold-400/50">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-[13px] font-medium text-white/40">No publications yet</p>
                <p className="text-xs text-white/25 mt-1 mb-5">Share your legal expertise with the LawBridge community</p>
                <Link href="/lawyer/library/new" className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-2.5 text-sm font-semibold text-primary-900 hover:bg-gold-400 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
                  </svg>
                  Write your first book
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myBooks.map(book => (
                  <div key={book.id} className="group rounded-xl bg-primary-900/60 border border-white/8 p-5 hover:border-white/12 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{book.title}</p>
                        <p className="text-xs text-white/35 mt-0.5">
                          {book.tier === 'general' ? 'General Library' : 'Firm Library'}
                          {book.year && ` · ${book.year}`}
                          {book.published_at && ` · Published ${new Date(book.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                          {book.views != null && book.views > 0 && (
                            <span className="text-white/25"> · {book.views.toLocaleString()} reads</span>
                          )}
                          {book.rejection_reason && <span className="text-red-400/70"> · {book.rejection_reason.slice(0, 50)}</span>}
                        </p>
                      </div>
                      <StatusBadge status={book.status} />
                    </div>

                    <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(book.status === 'draft' || book.status === 'rejected') && (
                        <Link
                          href={`/lawyer/library/${book.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/6 border border-white/8 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/70 hover:bg-white/10 transition-colors"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round"/>
                          </svg>
                          Edit
                        </Link>
                      )}
                      {book.status === 'published' && (
                        <Link
                          href={`/library/${book.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/15 transition-colors"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          View in Library
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Articles tab ──────────────────────────────────────────────────── */}
        {mainTab === 'articles' && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white/70">My Articles</h2>
              <Link href="/lawyer/library/articles/new"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/75 hover:bg-white/8 transition-colors">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
                </svg>
                New Article
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-primary-900/60 border border-white/6 p-4 animate-pulse">
                    <div className="h-3 bg-white/8 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : myArticles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/8 p-8 text-center">
                <p className="text-[13px] text-white/30">No articles yet</p>
                <p className="text-xs text-white/20 mt-1 mb-4">Share short-form legal insights, case summaries, and alerts</p>
                <Link href="/lawyer/library/articles/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/6 border border-white/10 px-5 py-2.5 text-sm font-medium text-white/60 hover:text-white/85 hover:bg-white/10 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" strokeLinecap="round"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round"/>
                  </svg>
                  Write your first article
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {myArticles.map(article => (
                  <div key={article.id} className="group rounded-xl bg-primary-900/60 border border-white/8 px-5 py-4 hover:border-white/12 transition-all flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white truncate">{article.title}</p>
                      <p className="text-xs text-white/35 mt-0.5">
                        {article.article_type?.replace('_', ' ')} ·{' '}
                        {article.reading_time ? `${article.reading_time} min read · ` : ''}
                        {article.views > 0 && `${article.views.toLocaleString()} reads · `}
                        {article.status === 'published' ? (
                          <span className="text-emerald-400/70">Published</span>
                        ) : article.status === 'archived' ? (
                          <span className="text-white/25">Archived</span>
                        ) : (
                          <span className="text-amber-400/70">Draft</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/lawyer/library/articles/${article.id}/edit`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/6 border border-white/8 px-3 py-1.5 text-xs font-medium text-white/50 hover:text-white/70 hover:bg-white/10 transition-colors">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 20h9" strokeLinecap="round"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round"/>
                        </svg>
                        Edit
                      </Link>
                      {article.status === 'published' && (
                        <Link href={`/library/articles/${article.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/15 transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          Read
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Review Queue tab ──────────────────────────────────────────────── */}
        {mainTab === 'review' && isReviewer && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold text-white/70">Review Queue</h2>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 text-xs font-semibold text-amber-400">
                {reviewQueue.length}
              </span>
            </div>
            {reviewQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/8 p-8 text-center">
                <p className="text-[13px] text-white/30">No books pending review</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviewQueue.map(book => (
                  <ReviewCard
                    key={book.id}
                    book={book}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Analytics tab ─────────────────────────────────────────────────── */}
        {mainTab === 'analytics' && (
          <section className="space-y-8">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Views', value: totalViews.toLocaleString(), sub: `across ${allContent.length} published items` },
                { label: 'Books Published', value: publishedBooks.length, sub: `of ${myBooks.length} total` },
                { label: 'Articles Published', value: publishedArticles.length, sub: `of ${myArticles.length} total` },
                { label: 'Top Area', value: topArea ?? '—', sub: topArea ? `${areaCount[topArea]} publications` : 'No data yet' },
              ].map(card => (
                <div key={card.label} className="rounded-xl bg-white/3 border border-white/8 p-4">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">{card.label}</p>
                  <p className="text-xl font-bold text-white truncate">{card.value}</p>
                  <p className="text-[10px] text-white/25 mt-1 truncate">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Top content by views */}
            <div>
              <h2 className="text-sm font-semibold text-white/70 mb-4">Top Content by Views</h2>
              {allContent.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/8 p-8 text-center">
                  <p className="text-[13px] text-white/30">Publish content to see your analytics</p>
                  <p className="text-xs text-white/20 mt-1">View counts update each time a reader opens your book or article</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allContent.slice(0, 8).map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <span className="text-[11px] font-mono text-white/20 w-5 text-right flex-shrink-0">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1.5">
                          <Link
                            href={item.type === 'book' ? `/library/${item.id}` : `/library/articles/${item.id}`}
                            className="text-[12px] font-medium text-white/65 hover:text-white transition-colors truncate"
                          >
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-white/30 font-mono">
                              {item.views.toLocaleString()}
                            </span>
                            <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-medium ${
                              item.type === 'book'
                                ? 'bg-gold-500/10 text-gold-400/70'
                                : 'bg-blue-500/10 text-blue-400/70'
                            }`}>
                              {item.type}
                            </span>
                          </div>
                        </div>
                        {/* CSS progress bar */}
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gold-500/40 transition-all"
                            style={{ width: `${Math.max(2, (item.views / maxViews) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Legal area breakdown */}
            {Object.keys(areaCount).length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-white/70 mb-4">Legal Areas Covered</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(areaCount)
                    .sort((a, b) => b[1] - a[1])
                    .map(([area, count]) => (
                      <span
                        key={area}
                        className="rounded-full bg-white/5 border border-white/8 px-3 py-1 text-xs text-white/50"
                      >
                        {area}
                        <span className="ml-1.5 text-white/25 font-mono text-[10px]">{count}</span>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
