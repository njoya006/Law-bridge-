'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listBooks, listArticles, listCategories, listFeaturedBooks, ARTICLE_TYPE_LABELS, type BookItem, type BookTier, type BookCategory, type ArticleItem, type ArticleType } from '../../lib/libraryApi'

const ARTICLE_TYPE_COLORS: Record<string, string> = {
  case_summary: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  legal_alert:  'text-red-400 bg-red-500/10 border-red-500/20',
  analysis:     'text-purple-400 bg-purple-500/10 border-purple-500/20',
  commentary:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  explainer:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  news:         'text-sky-400 bg-sky-500/10 border-sky-500/20',
}

function ArticleCard({ article }: { article: ArticleItem }) {
  const typeCls = ARTICLE_TYPE_COLORS[article.article_type] || ARTICLE_TYPE_COLORS.analysis
  const pubDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <Link href={`/library/articles/${article.id}`} className="group block rounded-xl bg-white/[0.025] border border-white/8 hover:border-white/15 hover:bg-white/5 p-5 transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold flex-shrink-0 ${typeCls}`}>
          {ARTICLE_TYPE_LABELS[article.article_type] || article.article_type}
        </span>
        <span className="text-[11px] text-white/25 flex-shrink-0">{article.reading_time} min read</span>
      </div>
      <h3 className="text-[14px] font-semibold text-white/80 group-hover:text-white leading-snug mb-2 line-clamp-2 transition-colors">
        {article.title}
      </h3>
      {article.summary && (
        <p className="text-[12px] text-white/40 leading-relaxed line-clamp-2 mb-3">{article.summary}</p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-white/30 truncate">{article.author_name}</span>
        {pubDate && <span className="text-[11px] text-white/20 flex-shrink-0">{pubDate}</span>}
      </div>
      {article.legal_areas.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {article.legal_areas.slice(0, 2).map(a => (
            <span key={a} className="rounded bg-white/4 px-1.5 py-0.5 text-[10px] text-white/30">{a}</span>
          ))}
        </div>
      )}
    </Link>
  )
}

// ─── Cover themes per legal area ────────────────────────────────────────────

const COVER_THEMES: Record<string, { bg: string; spine: string; accent: string }> = {
  'Constitutional Law':               { bg: '#1a0d3d', spine: '#0e0726', accent: '#7c3aed' },
  'Administrative Law':               { bg: '#0a1428', spine: '#060d1a', accent: '#1d4ed8' },
  'Criminal Law':                     { bg: '#1f0808', spine: '#130404', accent: '#b91c1c' },
  'Criminal Procedure':               { bg: '#1a0510', spine: '#10030a', accent: '#e11d48' },
  'Civil Law':                        { bg: '#051428', spine: '#030c1a', accent: '#0284c7' },
  'Civil Procedure':                  { bg: '#051020', spine: '#030914', accent: '#0369a1' },
  'Commercial Law':                   { bg: '#050f28', spine: '#03091a', accent: '#1e40af' },
  'OHADA Law':                        { bg: '#042014', spine: '#020d09', accent: '#15803d' },
  'Labor & Employment Law':           { bg: '#1c1005', spine: '#100903', accent: '#b45309' },
  'Family Law':                       { bg: '#1c0512', spine: '#10030b', accent: '#be185d' },
  'Property & Land Law':              { bg: '#18120a', spine: '#0f0a06', accent: '#92400e' },
  'Banking & Finance Law':            { bg: '#041414', spine: '#020b0b', accent: '#0f766e' },
  'Tax Law':                          { bg: '#0d1a05', spine: '#080f03', accent: '#4d7c0f' },
  'Intellectual Property':            { bg: '#140520', spine: '#0d0314', accent: '#7e22ce' },
  'Environmental Law':                { bg: '#041a0a', spine: '#020f05', accent: '#166534' },
  'International Law':                { bg: '#050a20', spine: '#030614', accent: '#1e3a8a' },
  'Human Rights Law':                 { bg: '#1a0808', spine: '#100404', accent: '#9f1239' },
  'Customary & Traditional Law':      { bg: '#1a1005', spine: '#100903', accent: '#7c2d12' },
  'Arbitration & Dispute Resolution': { bg: '#0a0f1c', spine: '#060913', accent: '#4338ca' },
  'Legal Practice & Ethics':          { bg: '#14140a', spine: '#0d0d06', accent: '#854d0e' },
}

const DEFAULT_THEME = { bg: '#0c0f1a', spine: '#07090f', accent: '#b5891f' }

function getTheme(legal_areas: string[]) {
  for (const area of legal_areas) {
    if (COVER_THEMES[area]) return COVER_THEMES[area]
  }
  return DEFAULT_THEME
}

function ordinal(n: number) {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

// ─── Scales of Justice SVG (decorative, on cover) ────────────────────────────

function ScalesIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-full h-full" aria-hidden>
      <line x1="8" y1="14" x2="40" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="8" x2="24" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="8" r="2" fill={color} />
      <line x1="16" y1="40" x2="32" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="14" x2="8" y2="26" stroke={color} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M2 26 Q8 32 14 26" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <line x1="40" y1="14" x2="40" y2="22" stroke={color} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M34 22 Q40 28 46 22" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// ─── Book Cover Card ─────────────────────────────────────────────────────────

function BookCover({ book }: { book: BookItem }) {
  const theme = getTheme(book.legal_areas)

  return (
    <Link href={`/library/${book.id}`} className="group block focus:outline-none">
      <div className="relative transition-transform duration-300 group-hover:-translate-y-2">

        {/* ── Pages-edge effect: three cream layers behind the cover ── */}
        {/* Layer 3 – darkest, furthest back */}
        <div
          className="absolute inset-y-0 pointer-events-none"
          style={{
            right: '-9px', width: '14px',
            background: '#a09880',
            borderRadius: '0 3px 3px 0',
            zIndex: 0,
          }}
        />
        {/* Layer 2 */}
        <div
          className="absolute inset-y-0 pointer-events-none"
          style={{
            right: '-6px', width: '11px',
            background: '#c4baa0',
            borderRadius: '0 3px 3px 0',
            zIndex: 0,
          }}
        />
        {/* Layer 1 – closest, lightest */}
        <div
          className="absolute inset-y-0 pointer-events-none"
          style={{
            right: '-3px', width: '8px',
            background: 'linear-gradient(to right, #d8d0b8, #eee8d4, #d8d0b8)',
            borderRadius: '0 2px 2px 0',
            zIndex: 0,
          }}
        />

        {/* ── Main cover ── */}
        <div
          className="relative overflow-hidden rounded-l-sm rounded-r-[1px]"
          style={{
            aspectRatio: '5/7',
            background: theme.bg,
            zIndex: 1,
            boxShadow: [
              '3px 4px 18px rgba(0,0,0,0.65)',
              'inset -2px 0 8px rgba(0,0,0,0.28)',
              'inset 0 1px 0 rgba(255,255,255,0.04)',
            ].join(', '),
          }}
        >
          {/* Spine strip */}
          <div
            className="absolute left-0 top-0 bottom-0 flex flex-col items-center justify-center gap-0.5"
            style={{ width: '11%', background: theme.spine }}
          >
            <div className="flex-1 w-px mt-3" style={{ background: theme.accent + '55' }} />
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: theme.accent + '80' }} />
            <div className="flex-1 w-px mb-3" style={{ background: theme.accent + '55' }} />
          </div>

          {/* Top decoration band */}
          <div
            className="absolute top-0 left-[11%] right-0 flex items-center justify-center"
            style={{ height: '30%', background: theme.accent + '18' }}
          >
            <div className="absolute top-2 left-2 right-2 h-px" style={{ background: theme.accent + '35' }} />
            <div className="absolute bottom-2 left-2 right-2 h-px" style={{ background: theme.accent + '35' }} />
            <div className="opacity-[0.18]" style={{ width: '36px', height: '36px' }}>
              <ScalesIcon color={theme.accent} />
            </div>
            {book.tier === 'firm' && book.firm_id && (
              <Link
                href={`/library/firm/${book.firm_id}`}
                onClick={e => e.stopPropagation()}
                className="absolute top-1.5 right-2 rounded px-1 py-0.5 text-[8px] font-bold tracking-wider uppercase hover:opacity-80 transition-opacity"
                style={{ background: theme.accent + '28', color: theme.accent }}
              >
                FIRM
              </Link>
            )}
          </div>

          {/* Title area */}
          <div
            className="absolute left-[11%] right-1.5 overflow-hidden flex flex-col justify-center px-2.5"
            style={{ top: '30%', bottom: '30%' }}
          >
            <h3 className="text-[12px] font-bold leading-snug text-white line-clamp-4">
              {book.title}
            </h3>
            {book.subtitle && (
              <p className="text-[9px] mt-1 leading-snug text-white/40 line-clamp-2">
                {book.subtitle}
              </p>
            )}
          </div>

          {/* Bottom author/publisher strip */}
          <div
            className="absolute left-[11%] right-0 bottom-0 px-2.5 pb-2.5"
            style={{ height: '30%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          >
            <div className="h-px mb-1.5" style={{ background: theme.accent + '30' }} />
            <p className="text-[10px] font-semibold text-white/75 truncate">{book.author_name}</p>
            <p className="text-[8px] text-white/30 truncate mt-0.5">
              {book.publisher || 'LawBridge Press'}{book.year ? ` · ${book.year}` : ''}
            </p>
            <p className="text-[8px] text-white/20 truncate mt-0.5">
              {ordinal(book.edition)} Ed.{book.pages ? ` · ${book.pages}pp` : ''}
            </p>
          </div>

          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: `linear-gradient(135deg, ${theme.accent}14 0%, transparent 55%)` }}
          />
        </div>

        {/* Ground shadow */}
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-6px', left: '8px', right: '14px', height: '12px',
            background: 'rgba(0,0,0,0.35)',
            filter: 'blur(6px)',
            borderRadius: '50%',
            zIndex: -1,
          }}
        />
      </div>

      {/* Caption below */}
      <div className="mt-3 px-0.5">
        <p className="text-[11px] font-medium text-white/45 group-hover:text-white/75 transition-colors leading-snug line-clamp-2">
          {book.title}
        </p>
        {book.legal_areas.length > 0 && (
          <p className="text-[10px] text-white/22 mt-0.5 truncate">{book.legal_areas[0]}</p>
        )}
      </div>
    </Link>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function BookSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="relative">
        {/* Fake pages edge */}
        <div className="absolute inset-y-0 right-[-3px] w-2 bg-white/6 rounded-r" />
        <div
          className="overflow-hidden rounded-l-sm bg-white/5"
          style={{ aspectRatio: '5/7' }}
        >
          <div className="h-[10%] bg-white/6" style={{ width: '11%' }} />
          <div className="absolute top-0 left-[11%] right-0 h-[30%] bg-white/4" />
          <div className="absolute left-[11%] right-2 top-[33%] space-y-2 px-2.5">
            <div className="h-2.5 bg-white/8 rounded w-4/5" />
            <div className="h-2.5 bg-white/6 rounded w-full" />
            <div className="h-2.5 bg-white/5 rounded w-3/5" />
          </div>
          <div className="absolute left-[11%] right-0 bottom-0 h-[28%] px-2.5 pb-2.5 flex flex-col justify-end gap-1">
            <div className="h-px bg-white/6" />
            <div className="h-2 bg-white/8 rounded w-3/4" />
            <div className="h-1.5 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <div className="h-2.5 bg-white/6 rounded w-4/5" />
        <div className="h-2 bg-white/4 rounded w-1/2" />
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ search }: { search: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gold-500/8 border border-gold-500/15 flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gold-400/60">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-[15px] font-medium text-white/50">
        {search ? `No books match "${search}"` : 'No books published yet'}
      </p>
      <p className="text-sm text-white/25 mt-1">
        {search ? 'Try a different search term or filter' : 'Check back as lawyers publish resources'}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [books, setBooks] = useState<BookItem[]>([])
  const [articles, setArticles] = useState<ArticleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [featuredBooks, setFeaturedBooks] = useState<BookItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'firm'>('all')
  const [contentType, setContentType] = useState<'books' | 'articles'>('books')
  const [articleTypeFilter, setArticleTypeFilter] = useState<ArticleType | ''>('')
  const [isLawyer, setIsLawyer] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('portalRole')
    setIsLawyer(role === 'lawyer')
    listCategories().then(setCategories).catch(() => setCategories([]))
    const token = localStorage.getItem('access')
    listFeaturedBooks(token).then(setFeaturedBooks).catch(() => setFeaturedBooks([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const fid = localStorage.getItem('firmId')
      if (contentType === 'books') {
        const data = await listBooks(token, {
          tier: activeTab === 'firm' ? 'firm' : undefined,
          search: search || undefined,
          legal_area: selectedArea || undefined,
          firm_id: fid || undefined,
        })
        setBooks(data)
      } else {
        const data = await listArticles(token, {
          tier: activeTab === 'firm' ? 'firm' : undefined,
          search: search || undefined,
          legal_area: selectedArea || undefined,
          type: articleTypeFilter || undefined,
        })
        setArticles(data)
      }
    } catch {
      setBooks([]); setArticles([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, selectedArea, contentType, articleTypeFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-[#07111a]">

      {/* ── Hero ── */}
      <div className="relative border-b border-white/6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/4 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gold-500/12 border border-gold-500/20 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gold-400">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"
                          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-[11px] font-bold tracking-[0.2em] text-gold-400/70 uppercase">CamLex</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Legal Library</h1>
              <p className="text-sm text-white/35 mt-2 max-w-md">
                Authoritative legal publications by Cameroonian practitioners — searchable, citable, versioned.
              </p>
            </div>

            {isLawyer && (
              <Link href="/lawyer/library"
                    className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-2.5 text-sm font-semibold text-primary-950 hover:bg-gold-400 transition-colors flex-shrink-0 shadow-lg shadow-gold-500/20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                My Publications
              </Link>
            )}
          </div>

          {/* Content type + search + filter row */}
          <div className="mt-7 space-y-3">
            {/* Books / Articles toggle */}
            <div className="flex gap-1 p-1 bg-white/4 rounded-xl w-fit">
              {(['books', 'articles'] as const).map(ct => (
                <button key={ct} onClick={() => setContentType(ct)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                    contentType === ct ? 'bg-gold-500 text-primary-950' : 'text-white/40 hover:text-white/70'
                  }`}>
                  {ct === 'books' ? 'Books' : 'Articles'}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-xl">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
                     width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  placeholder={contentType === 'books' ? 'Search titles, authors, topics…' : 'Search articles…'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/8 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-gold-500/40 focus:bg-white/8 transition-all"
                />
              </div>

              <select
                value={selectedArea}
                onChange={e => setSelectedArea(e.target.value)}
                className="rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 text-sm text-white/50 focus:outline-none focus:border-gold-500/30 cursor-pointer"
              >
                <option value="">All Areas of Law</option>
                {categories.map(c => (
                  <option key={c.slug} value={c.name} className="bg-[#07111a]">{c.name}</option>
                ))}
              </select>

              {contentType === 'articles' && (
                <select
                  value={articleTypeFilter}
                  onChange={e => setArticleTypeFilter(e.target.value as ArticleType | '')}
                  className="rounded-xl bg-white/5 border border-white/8 px-3 py-2.5 text-sm text-white/50 focus:outline-none focus:border-gold-500/30 cursor-pointer"
                >
                  <option value="">All Types</option>
                  {(Object.entries(ARTICLE_TYPE_LABELS) as [ArticleType, string][]).map(([v, l]) => (
                    <option key={v} value={v} className="bg-[#07111a]">{l}</option>
                  ))}
                </select>
              )}

              {isLawyer && (
                <div className="flex gap-1 p-1 bg-white/4 rounded-xl self-start sm:self-auto">
                  {(['all', 'firm'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                              activeTab === tab ? 'bg-gold-500 text-primary-950' : 'text-white/40 hover:text-white/70'
                            }`}>
                      {tab === 'all' ? 'All' : 'My Firm'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Collection ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {contentType === 'books' ? (
          <>
            {/* Featured resources strip */}
            {!loading && featuredBooks.length > 0 && !search && !selectedArea && activeTab === 'all' && (
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] font-bold tracking-[0.2em] text-gold-400/60 uppercase flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-gold-400/80">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Featured Resources
                  </span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', paddingRight: '12px' }}>
                  {featuredBooks.map(book => (
                    <div key={book.id} className="flex-shrink-0" style={{ width: '140px' }}>
                      <BookCover book={book} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && books.length > 0 && (
              <p className="text-xs text-white/25 mb-8">
                {books.length} publication{books.length !== 1 ? 's' : ''} in the collection
                {selectedArea && <> · <span className="text-white/40">{selectedArea}</span></>}
              </p>
            )}
            <div
              className="grid gap-6 sm:gap-8"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', paddingRight: '12px' }}
            >
              {loading
                ? Array.from({ length: 12 }).map((_, i) => <BookSkeleton key={i} />)
                : books.length === 0
                  ? <EmptyState search={search} />
                  : books.map(book => <BookCover key={book.id} book={book} />)
              }
            </div>
          </>
        ) : (
          <>
            {!loading && articles.length > 0 && (
              <p className="text-xs text-white/25 mb-6">
                {articles.length} article{articles.length !== 1 ? 's' : ''}
                {selectedArea && <> · <span className="text-white/40">{selectedArea}</span></>}
              </p>
            )}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-xl bg-white/3 border border-white/6 p-5 animate-pulse">
                    <div className="h-4 bg-white/8 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-white/6 rounded w-full mb-2" />
                    <div className="h-4 bg-white/5 rounded w-3/4 mb-4" />
                    <div className="h-3 bg-white/4 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/25">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <p className="text-[15px] font-medium text-white/40">
                  {search ? `No articles match "${search}"` : 'No articles published yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map(a => <ArticleCard key={a.id} article={a} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
