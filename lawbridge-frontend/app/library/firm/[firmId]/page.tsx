'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { listFirmContent, listArticles, ARTICLE_TYPE_LABELS, type BookItem, type ArticleItem } from '../../../../lib/libraryApi'

const ARTICLE_TYPE_COLORS: Record<string, string> = {
  case_summary: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  legal_alert:  'text-red-400 bg-red-500/10 border-red-500/20',
  analysis:     'text-purple-400 bg-purple-500/10 border-purple-500/20',
  commentary:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  explainer:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  news:         'text-sky-400 bg-sky-500/10 border-sky-500/20',
}

const COVER_THEMES: Record<string, { bg: string; accent: string }> = {
  'Constitutional Law':               { bg: '#1a0d3d', accent: '#7c3aed' },
  'Administrative Law':               { bg: '#0a1428', accent: '#1d4ed8' },
  'Criminal Law':                     { bg: '#1f0808', accent: '#b91c1c' },
  'Civil Law':                        { bg: '#051428', accent: '#0284c7' },
  'Commercial Law':                   { bg: '#050f28', accent: '#1e40af' },
  'OHADA Law':                        { bg: '#042014', accent: '#15803d' },
  'Labor & Employment Law':           { bg: '#1c1005', accent: '#b45309' },
  'Family Law':                       { bg: '#1c0512', accent: '#be185d' },
  'Tax Law':                          { bg: '#0d1a05', accent: '#4d7c0f' },
  'Intellectual Property':            { bg: '#140520', accent: '#7e22ce' },
  'Environmental Law':                { bg: '#041a0a', accent: '#166534' },
  'International Law':                { bg: '#050a20', accent: '#1e3a8a' },
}
const DEFAULT_THEME = { bg: '#0c0f1a', accent: '#b5891f' }

function getTheme(areas: string[]) {
  for (const a of areas) if (COVER_THEMES[a]) return COVER_THEMES[a]
  return DEFAULT_THEME
}

function MiniBookCard({ book }: { book: BookItem }) {
  const theme = getTheme(book.legal_areas)
  const pubDate = book.published_at
    ? new Date(book.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <Link
      href={`/library/${book.id}`}
      className="group flex gap-4 rounded-xl bg-white/[0.025] border border-white/8 hover:border-white/15 hover:bg-white/5 p-4 transition-all"
    >
      {/* Mini cover strip */}
      <div
        className="w-8 flex-shrink-0 rounded-sm"
        style={{ background: theme.bg, borderLeft: `3px solid ${theme.accent}` }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white/75 group-hover:text-white leading-snug line-clamp-2 transition-colors">
          {book.title}
        </p>
        {book.subtitle && (
          <p className="text-[11px] text-white/35 mt-0.5 line-clamp-1">{book.subtitle}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          <span className="text-[10px] text-white/30">{book.author_name}</span>
          {pubDate && <span className="text-[10px] text-white/20">{pubDate}</span>}
          {book.views > 0 && (
            <span className="text-[10px] text-white/20">{book.views.toLocaleString()} reads</span>
          )}
        </div>
        {book.legal_areas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {book.legal_areas.slice(0, 2).map(a => (
              <span
                key={a}
                className="rounded-full px-2 py-0.5 text-[9px] font-medium"
                style={{ background: theme.accent + '15', color: theme.accent }}
              >
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

function ArticleCard({ article }: { article: ArticleItem }) {
  const typeCls = ARTICLE_TYPE_COLORS[article.article_type] || ARTICLE_TYPE_COLORS.analysis
  const pubDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <Link
      href={`/library/articles/${article.id}`}
      className="group flex items-start gap-3 rounded-xl bg-white/[0.025] border border-white/8 hover:border-white/15 hover:bg-white/5 p-4 transition-all"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold flex-shrink-0 ${typeCls}`}>
            {ARTICLE_TYPE_LABELS[article.article_type] || article.article_type}
          </span>
          <span className="text-[10px] text-white/25 flex-shrink-0">{article.reading_time} min</span>
        </div>
        <p className="text-[13px] font-semibold text-white/75 group-hover:text-white leading-snug line-clamp-2 transition-colors">
          {article.title}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-white/30 truncate">{article.author_name}</span>
          {pubDate && <span className="text-[10px] text-white/20 flex-shrink-0">{pubDate}</span>}
          {article.views > 0 && (
            <span className="text-[10px] text-white/20 flex-shrink-0">{article.views.toLocaleString()} reads</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function FirmProfilePage() {
  const params = useParams()
  const firmId = params.firmId as string

  const [books, setBooks] = useState<BookItem[]>([])
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'books' | 'articles'>('books')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('access')
        const [booksData, articlesData] = await Promise.all([
          listFirmContent(firmId, token).catch(() => [] as BookItem[]),
          listArticles(token, { tier: 'firm' }).then(all =>
            all.filter(a => a.firm_id === firmId)
          ).catch(() => [] as ArticleItem[]),
        ])
        setBooks(booksData)
        setArticles(articlesData)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [firmId])

  const totalContent = books.length + articles.length
  const totalViews = books.reduce((s, b) => s + (b.views ?? 0), 0)
    + articles.reduce((s, a) => s + (a.views ?? 0), 0)

  // Derive initials from firmId (first two chars uppercased, UUID-style fallback)
  const firmInitials = firmId.replace(/-/g, '').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#07111a]">
      {/* Back nav */}
      <div className="border-b border-white/6 bg-[#07111a]/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link
            href="/library"
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Library
          </Link>
          <span className="text-white/15">/</span>
          <span className="text-sm text-white/40">Firm Publications</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Firm header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-primary-950 font-bold text-xl shadow-lg shadow-gold-500/20 flex-shrink-0">
            {firmInitials}
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] text-gold-400/60 uppercase mb-1">Law Firm</p>
            <h1 className="text-2xl font-bold text-white">Firm Publications</h1>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="text-xs text-white/35">
                {totalContent} publication{totalContent !== 1 ? 's' : ''}
              </span>
              {totalViews > 0 && (
                <span className="text-xs text-white/25">
                  {totalViews.toLocaleString()} total reads
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto">
            <Link
              href={`/discover?firm_id=${firmId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-primary-950 hover:bg-gold-400 transition-colors"
            >
              Consult with this Firm
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/4 rounded-xl w-fit mb-7">
          {(['books', 'articles'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-gold-500 text-primary-950' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab === 'books' ? `Books (${books.length})` : `Articles (${articles.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl bg-white/3 border border-white/6 p-4 animate-pulse flex gap-4">
                <div className="w-8 h-16 bg-white/5 rounded-sm" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/8 rounded w-2/3" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                  <div className="h-3 bg-white/4 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'books' ? (
          books.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/25">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-sm text-white/35">No books published by this firm yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {books.map(book => <MiniBookCard key={book.id} book={book} />)}
            </div>
          )
        ) : (
          articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/25">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </div>
              <p className="text-sm text-white/35">No articles published by this firm yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map(article => <ArticleCard key={article.id} article={article} />)}
            </div>
          )
        )}
      </div>
    </div>
  )
}
