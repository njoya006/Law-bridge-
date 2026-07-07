'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBook, getBookVersions, type BookItem, type BookVersion } from '../../../lib/libraryApi'

function CitationBlock({ book }: { book: BookItem }) {
  const [copied, setCopied] = useState(false)
  const year = book.published_at ? new Date(book.published_at).getFullYear() : book.year || ''
  const citation = `${book.author_name}. "${book.title}${book.edition > 1 ? `, ${book.edition}${['st','nd','rd'][book.edition - 2] || 'th'} ed.` : ''}". LawBridge CamLex Library, ${year}. [v${book.version_number}]`

  const copy = () => {
    navigator.clipboard.writeText(citation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl bg-white/3 border border-white/8 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Cite this work</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-gold-400/70 hover:text-gold-400 transition-colors"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-white/50 leading-relaxed font-mono">{citation}</p>
    </div>
  )
}

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [book, setBook] = useState<BookItem | null>(null)
  const [versions, setVersions] = useState<BookVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('access')
        const firmId = localStorage.getItem('firmId')
        const [bookData, versData] = await Promise.all([
          getBook(id, token, firmId),
          getBookVersions(id, token).catch(() => [] as BookVersion[]),
        ])
        setBook(bookData)
        setVersions(versData)
      } catch {
        setError('This publication is not available or you do not have access.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-primary-950 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-400">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-white/60 text-sm">{error || 'Publication not found.'}</p>
        <button onClick={() => router.back()} className="text-gold-400 text-sm hover:text-gold-300 transition-colors">
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-950">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-primary-950/90 backdrop-blur-sm border-b border-white/6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Library
          </button>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              book.tier === 'general'
                ? 'bg-gold-500/12 text-gold-400 border border-gold-500/20'
                : 'bg-blue-500/12 text-blue-400 border border-blue-500/20'
            }`}>
              {book.tier === 'general' ? 'General Library' : 'Firm Library'}
            </span>
            <span className="text-xs text-white/25 tabular-nums">v{book.version_number}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12">
          {/* Main content */}
          <div className="min-w-0">
            {/* Title block */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight mb-2">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="text-lg text-white/40 font-light">{book.subtitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm text-white/40">
                <span>By <span className="text-white/70 font-medium">{book.author_name}</span></span>
                {book.publisher && <span className="text-white/50">{book.publisher}</span>}
                {book.year && <span className="tabular-nums">{book.year}</span>}
                {book.edition >= 1 && <span>{book.edition === 1 ? '1st' : book.edition === 2 ? '2nd' : book.edition === 3 ? '3rd' : `${book.edition}th`} edition</span>}
                {book.pages && <span>{book.pages} pages</span>}
                <span>{book.jurisdiction}</span>
                <span>{book.language === 'fr' ? 'French' : 'English'}</span>
              </div>
            </div>

            {/* Abstract */}
            {book.abstract && (
              <div className="mb-8 p-5 rounded-xl bg-gold-500/5 border border-gold-500/15">
                <p className="text-xs font-semibold text-gold-400/60 uppercase tracking-wider mb-2">Abstract</p>
                <p className="text-sm text-white/60 leading-relaxed">{book.abstract}</p>
              </div>
            )}

            {/* Full content */}
            {book.content && (
              <article className="prose prose-invert prose-sm sm:prose-base max-w-none
                prose-headings:font-semibold prose-headings:text-white
                prose-p:text-white/60 prose-p:leading-relaxed
                prose-li:text-white/60
                prose-strong:text-white/80
                prose-a:text-gold-400 prose-a:no-underline hover:prose-a:text-gold-300
                prose-blockquote:border-l-gold-500/40 prose-blockquote:text-white/40
                prose-code:text-gold-300 prose-code:bg-white/5 prose-code:rounded
                prose-hr:border-white/8">
                {/* Render content as plain text with preserved formatting until a markdown renderer is added */}
                <div style={{ whiteSpace: 'pre-wrap' }}>{book.content}</div>
              </article>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Published */}
            {book.published_at && (
              <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                <p className="text-xs text-white/30 mb-1">Published</p>
                <p className="text-sm text-white/70 font-medium">
                  {new Date(book.published_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Legal areas */}
            {book.legal_areas.length > 0 && (
              <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Legal Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {book.legal_areas.map(area => (
                    <span key={area} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-white/50 font-medium border border-white/6">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Version history */}
            {versions.length > 0 && (
              <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Version History</p>
                <div className="space-y-2">
                  {versions.map(v => (
                    <div key={v.id} className="flex items-start gap-3">
                      <span className="text-xs font-mono text-gold-400/70 mt-0.5 flex-shrink-0">v{v.version_number}</span>
                      <div>
                        <p className="text-xs text-white/40">
                          {new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {v.change_summary && (
                          <p className="text-xs text-white/30 mt-0.5">{v.change_summary}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Citation */}
            <CitationBlock book={book} />

            {/* Categories */}
            {book.categories.length > 0 && (
              <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {book.categories.map(cat => (
                    <span key={cat.id} className="rounded-md bg-white/5 px-2.5 py-1 text-xs text-white/50">
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
