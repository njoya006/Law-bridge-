'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getArticle, ARTICLE_TYPE_LABELS, type ArticleItem } from '../../../../lib/libraryApi'

const SYSTEM_AUTHOR_ID = '00000000-0000-0000-0000-000000000001'

function WatermarkOverlay() {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const name = localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'CamLex'
    setLabel(name)
  }, [])
  if (!label) return null
  const text = encodeURIComponent(`${label} · CamLex`)
  const svgUri = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180'%3E%3Ctext x='50%25' y='50%25' transform='rotate(-30 160 90)' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif' font-size='13' fill='rgba(255,255,255,0.04)' font-weight='500' letter-spacing='1'%3E${text}%3C/text%3E%3C/svg%3E")`
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', inset: 0, backgroundImage: svgUri,
        backgroundRepeat: 'repeat', backgroundSize: '320px 180px',
        pointerEvents: 'none', zIndex: 2, userSelect: 'none',
      }}
    />
  )
}

const TYPE_COLORS: Record<string, string> = {
  case_summary: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  legal_alert:  'text-red-400 bg-red-500/10 border-red-500/20',
  analysis:     'text-purple-400 bg-purple-500/10 border-purple-500/20',
  commentary:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  explainer:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  news:         'text-sky-400 bg-sky-500/10 border-sky-500/20',
}

export default function ArticleDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [article, setArticle] = useState<ArticleItem | null>(null)
  const [isAuthor, setIsAuthor] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access')
    const viewerId = localStorage.getItem('authUserId')
    setIsLoggedIn(!!token)
    getArticle(id, token)
      .then(a => {
        setArticle(a)
        setIsAuthor(!!viewerId && viewerId === a.author_id)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load article'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-primary-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
    </div>
  )

  if (error || !article) return (
    <div className="min-h-screen bg-primary-950 flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-white/50 text-sm">{error || 'Article not found'}</p>
      <Link href="/library" className="text-gold-400 text-sm">Back to Library</Link>
    </div>
  )

  const typeCls = TYPE_COLORS[article.article_type] || TYPE_COLORS.analysis
  const pubDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-primary-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 text-sm transition-colors mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Library
        </Link>

        <article>
          {/* Type badge */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeCls}`}>
              {ARTICLE_TYPE_LABELS[article.article_type] || article.article_type}
            </span>
            {article.reading_time > 0 && (
              <span className="text-xs text-white/30">{article.reading_time} min read</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-4">
            {article.title}
          </h1>

          {/* Summary */}
          {article.summary && (
            <p className="text-lg text-white/50 leading-relaxed mb-6 font-light">
              {article.summary}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-8 pb-8 border-b border-white/6 text-sm text-white/35">
            <span>By <span className="text-white/55 font-medium">{article.author_name}</span></span>
            {pubDate && <span>{pubDate}</span>}
            <span>{article.jurisdiction}</span>
            {article.views > 0 && <span>{article.views.toLocaleString()} reads</span>}
          </div>

          {/* Legal areas */}
          {article.legal_areas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-8">
              {article.legal_areas.map(a => (
                <span key={a} className="rounded-md bg-white/5 border border-white/8 px-2.5 py-0.5 text-xs text-white/40">
                  {a}
                </span>
              ))}
            </div>
          )}

          {/* Content with watermark */}
          {article.content && (
            <div className="relative">
              <WatermarkOverlay />
              <div className="prose prose-invert max-w-none prose-p:text-white/65 prose-headings:text-white prose-headings:font-semibold prose-strong:text-white/80 prose-li:text-white/65 prose-blockquote:border-gold-500/30 prose-blockquote:text-white/50" style={{ whiteSpace: 'pre-wrap', zIndex: 1, position: 'relative' }}>
                {article.content}
              </div>
            </div>
          )}

          {/* Consultation CTA */}
          {!isAuthor && article.author_id !== SYSTEM_AUTHOR_ID && article.status === 'published' && (
            <div className="mt-12 rounded-2xl bg-gold-500/5 border border-gold-500/15 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gold-500/12 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gold-400">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white/80">
                    Questions about {article.legal_areas[0] || 'this topic'}?
                  </p>
                  <p className="text-xs text-white/40 mt-1">
                    {article.author_name} is available for a one-on-one consultation.
                  </p>
                  <div className="mt-4">
                    {isLoggedIn ? (
                      <Link
                        href={`/bookings/new?lawyer_id=${article.author_id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-primary-950 hover:bg-gold-400 transition-colors"
                      >
                        Book a Consultation
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    ) : (
                      <Link
                        href="/auth/register"
                        className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-primary-950 hover:bg-gold-400 transition-colors"
                      >
                        Create a free account to book
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
