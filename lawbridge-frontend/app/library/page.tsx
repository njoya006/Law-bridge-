'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listBooks, listCategories, type BookItem, type BookTier, type BookCategory } from '../../lib/libraryApi'

const TIER_LABELS: Record<BookTier, string> = {
  general: 'General Library',
  firm: 'Firm Library',
}

function BookCard({ book }: { book: BookItem }) {
  return (
    <Link
      href={`/library/${book.id}`}
      className="group relative flex flex-col bg-primary-900/60 border border-white/8 rounded-2xl p-6 hover:border-gold-500/40 hover:bg-primary-900/80 transition-all duration-200 hover:shadow-lg hover:shadow-gold-500/5"
    >
      {/* Tier badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
          book.tier === 'general'
            ? 'bg-gold-500/12 text-gold-400 border border-gold-500/20'
            : 'bg-blue-500/12 text-blue-400 border border-blue-500/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${book.tier === 'general' ? 'bg-gold-400' : 'bg-blue-400'}`} />
          {TIER_LABELS[book.tier]}
        </span>
        {book.year && (
          <span className="text-xs text-white/30 font-medium tabular-nums">{book.year}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-semibold text-white leading-snug mb-1 group-hover:text-gold-300 transition-colors line-clamp-2">
        {book.title}
      </h3>
      {book.subtitle && (
        <p className="text-xs text-white/40 mb-3 line-clamp-1">{book.subtitle}</p>
      )}

      {/* Author */}
      <p className="text-xs text-white/50 mb-3">
        By <span className="text-white/70 font-medium">{book.author_name}</span>
        {book.jurisdiction && <span className="text-white/30"> · {book.jurisdiction}</span>}
      </p>

      {/* Abstract */}
      {book.abstract && (
        <p className="text-sm text-white/45 leading-relaxed line-clamp-3 mb-4 flex-1">
          {book.abstract}
        </p>
      )}

      {/* Legal areas */}
      {book.legal_areas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {book.legal_areas.slice(0, 3).map(area => (
            <span key={area} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/40 font-medium">
              {area}
            </span>
          ))}
          {book.legal_areas.length > 3 && (
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-white/30">
              +{book.legal_areas.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Arrow indicator */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gold-400">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  )
}

function EmptyState({ search }: { search: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gold-500/8 border border-gold-500/15 flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-gold-400/60">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p className="text-[15px] font-medium text-white/50">
        {search ? `No publications match "${search}"` : 'No publications yet'}
      </p>
      <p className="text-sm text-white/30 mt-1">
        {search ? 'Try a different search term or filter' : 'Check back soon as lawyers publish resources'}
      </p>
    </div>
  )
}

export default function LibraryPage() {
  const [books, setBooks] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [search, setSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState('')
  const [selectedTier, setSelectedTier] = useState<BookTier | ''>('')
  const [activeTab, setActiveTab] = useState<'all' | 'firm' | 'my'>('all')
  const [isLawyer, setIsLawyer] = useState(false)
  const [firmId, setFirmId] = useState<string | null>(null)

  useEffect(() => {
    const role = localStorage.getItem('portalRole')
    const fid = localStorage.getItem('firmId')
    setIsLawyer(role === 'lawyer')
    setFirmId(fid)
    listCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const fid = localStorage.getItem('firmId')
      const tier: BookTier | undefined =
        activeTab === 'firm' ? 'firm' :
        activeTab === 'all' ? undefined : undefined
      const data = await listBooks(token, {
        tier: tier || (selectedTier || undefined),
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
  }, [activeTab, search, selectedArea, selectedTier])

  useEffect(() => { load() }, [load])

  const tabs = [
    { key: 'all', label: 'All Publications' },
    ...(isLawyer ? [{ key: 'firm', label: 'Firm Library' }] : []),
  ] as const

  return (
    <div className="min-h-screen bg-primary-950">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-white/6">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gold-500/15 border border-gold-500/25 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gold-400">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold tracking-widest text-gold-400/70 uppercase">CamLex</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Legal Library</h1>
              <p className="text-sm text-white/40 mt-1.5">
                Authoritative publications from Cameroonian legal practitioners
              </p>
            </div>
            {isLawyer && (
              <Link
                href="/lawyer/library"
                className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-primary-950 hover:bg-gold-400 transition-colors flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                My Publications
              </Link>
            )}
          </div>

          {/* Search */}
          <div className="mt-7 relative max-w-xl">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search publications, authors, topics…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500/50 focus:bg-white/8 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs + filters row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex gap-1 p-1 bg-white/4 rounded-xl w-fit">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gold-500 text-primary-950 shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Legal area filter */}
          <select
            value={selectedArea}
            onChange={e => setSelectedArea(e.target.value)}
            className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white/60 focus:outline-none focus:border-gold-500/40 cursor-pointer"
          >
            <option value="">All Areas</option>
            {categories.map(c => (
              <option key={c.slug} value={c.name} className="bg-primary-900">{c.name}</option>
            ))}
          </select>
        </div>

        {/* Book grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-primary-900/60 border border-white/6 rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-white/8 rounded mb-3 w-24" />
                <div className="h-5 bg-white/8 rounded mb-2 w-4/5" />
                <div className="h-4 bg-white/6 rounded mb-4 w-3/5" />
                <div className="space-y-2">
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-3 bg-white/5 rounded w-5/6" />
                  <div className="h-3 bg-white/5 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <EmptyState search={search} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        )}

        {/* Stats bar */}
        {!loading && books.length > 0 && (
          <p className="text-xs text-white/25 text-center mt-8">
            {books.length} publication{books.length !== 1 ? 's' : ''} · CamLex Legal Library
          </p>
        )}
      </div>
    </div>
  )
}
