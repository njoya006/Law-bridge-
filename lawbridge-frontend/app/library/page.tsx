'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listBooks, listCategories, type BookItem, type BookTier, type BookCategory } from '../../lib/libraryApi'

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
      {/* Beam */}
      <line x1="8" y1="14" x2="40" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Center post */}
      <line x1="24" y1="8" x2="24" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Top ornament */}
      <circle cx="24" cy="8" r="2" fill={color} />
      {/* Base */}
      <line x1="16" y1="40" x2="32" y2="40" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Left chain */}
      <line x1="8" y1="14" x2="8" y2="26" stroke={color} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
      {/* Left pan */}
      <path d="M2 26 Q8 32 14 26" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Right chain */}
      <line x1="40" y1="14" x2="40" y2="22" stroke={color} strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
      {/* Right pan (slightly lower = balanced) */}
      <path d="M34 22 Q40 28 46 22" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

// ─── Book Cover Card ─────────────────────────────────────────────────────────

function BookCover({ book }: { book: BookItem }) {
  const theme = getTheme(book.legal_areas)

  return (
    <Link href={`/library/${book.id}`} className="group block focus:outline-none">
      {/* Wrapper adds subtle lift on hover */}
      <div className="relative transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl"
           style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>

        {/* Book body: spine + cover side by side */}
        <div className="flex rounded-sm overflow-hidden" style={{ aspectRatio: '5/7' }}>

          {/* Spine */}
          <div className="w-[10%] flex-shrink-0 flex flex-col items-center justify-center py-3 gap-1"
               style={{ background: theme.spine }}>
            <div className="w-px flex-1" style={{ background: theme.accent + '40' }} />
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: theme.accent + '60' }} />
            <div className="w-px flex-1" style={{ background: theme.accent + '40' }} />
          </div>

          {/* Main cover */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: theme.bg }}>

            {/* Top decorative band */}
            <div className="relative flex-shrink-0 flex items-center justify-center overflow-hidden"
                 style={{ height: '30%', background: theme.accent + '18' }}>
              {/* Thin rule lines */}
              <div className="absolute top-2 left-3 right-3 h-px" style={{ background: theme.accent + '30' }} />
              <div className="absolute bottom-2 left-3 right-3 h-px" style={{ background: theme.accent + '30' }} />
              {/* Scales icon */}
              <div className="w-10 h-10 opacity-25">
                <ScalesIcon color={theme.accent} />
              </div>
              {/* Tier badge top-right */}
              {book.tier === 'firm' && (
                <div className="absolute top-2 right-2 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase"
                     style={{ background: theme.accent + '30', color: theme.accent }}>
                  FIRM
                </div>
              )}
            </div>

            {/* Title area */}
            <div className="flex-1 flex flex-col justify-center px-3 py-2">
              <h3 className="font-bold leading-snug text-white line-clamp-4"
                  style={{ fontSize: 'clamp(10px, 2.2vw, 15px)' }}>
                {book.title}
              </h3>
              {book.subtitle && (
                <p className="mt-1 text-white/45 leading-snug line-clamp-2"
                   style={{ fontSize: 'clamp(8px, 1.5vw, 11px)' }}>
                  {book.subtitle}
                </p>
              )}
            </div>

            {/* Bottom metadata strip */}
            <div className="flex-shrink-0 px-3 pb-3">
              <div className="h-px mb-2" style={{ background: theme.accent + '35' }} />
              <p className="font-semibold text-white/70 truncate"
                 style={{ fontSize: 'clamp(8px, 1.4vw, 11px)' }}>
                {book.author_name}
              </p>
              <p className="text-white/35 truncate mt-0.5"
                 style={{ fontSize: 'clamp(7px, 1.2vw, 10px)' }}>
                {book.publisher || 'LawBridge Press'}
              </p>
              <div className="flex items-center gap-1 mt-1" style={{ fontSize: 'clamp(7px, 1.1vw, 10px)' }}>
                <span className="text-white/30">{ordinal(book.edition)} Ed.</span>
                {book.year && <><span className="text-white/20">·</span><span className="text-white/30">{book.year}</span></>}
                {book.pages && <><span className="text-white/20">·</span><span className="text-white/30">{book.pages}pp</span></>}
              </div>
            </div>
          </div>
        </div>

        {/* Gold border glow on hover */}
        <div className="absolute inset-0 rounded-sm border border-transparent transition-all duration-300 pointer-events-none"
             style={{ borderColor: 'transparent' }}
             onMouseEnter={e => (e.currentTarget.style.borderColor = theme.accent + '60')}
             onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')} />
      </div>

      {/* Title below card */}
      <div className="mt-2.5 px-0.5">
        <p className="text-[11px] font-medium text-white/50 group-hover:text-white/80 transition-colors leading-snug line-clamp-2">
          {book.title}
        </p>
        {book.legal_areas.length > 0 && (
          <p className="text-[10px] text-white/25 mt-0.5 truncate">{book.legal_areas[0]}</p>
        )}
      </div>
    </Link>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function BookSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex rounded-sm overflow-hidden bg-white/5" style={{ aspectRatio: '5/7' }}>
        <div className="w-[10%] bg-white/8" />
        <div className="flex-1 p-3 flex flex-col gap-2">
          <div className="h-[30%] bg-white/6 rounded" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-3 bg-white/8 rounded w-4/5" />
            <div className="h-3 bg-white/6 rounded w-3/5" />
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-white/5 rounded w-full" />
            <div className="h-2 bg-white/4 rounded w-2/3" />
          </div>
        </div>
      </div>
      <div className="mt-2 space-y-1">
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
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'firm'>('all')
  const [isLawyer, setIsLawyer] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('portalRole')
    setIsLawyer(role === 'lawyer')
    listCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const fid = localStorage.getItem('firmId')
      const data = await listBooks(token, {
        tier: activeTab === 'firm' ? 'firm' : undefined,
        search: search || undefined,
        legal_area: selectedArea || undefined,
        firm_id: fid || undefined,
      })
      setBooks(data)
    } catch {
      setBooks([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, selectedArea])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-[#07111a]">

      {/* ── Hero ── */}
      <div className="relative border-b border-white/6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/4 via-transparent to-transparent pointer-events-none" />
        {/* Subtle bookshelf line decoration */}
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

          {/* Search + filter row */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xl">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none"
                   width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search titles, authors, topics…"
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

            {isLawyer && (
              <div className="flex gap-1 p-1 bg-white/4 rounded-xl self-start sm:self-auto">
                {(['all', 'firm'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                            activeTab === tab
                              ? 'bg-gold-500 text-primary-950'
                              : 'text-white/40 hover:text-white/70'
                          }`}>
                    {tab === 'all' ? 'All' : 'My Firm'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Collection ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Results label */}
        {!loading && books.length > 0 && (
          <p className="text-xs text-white/25 mb-6">
            {books.length} publication{books.length !== 1 ? 's' : ''} in the collection
            {selectedArea && <> · <span className="text-white/40">{selectedArea}</span></>}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 sm:gap-6">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <BookSkeleton key={i} />)
            : books.length === 0
              ? <EmptyState search={search} />
              : books.map(book => <BookCover key={book.id} book={book} />)
          }
        </div>
      </div>
    </div>
  )
}
