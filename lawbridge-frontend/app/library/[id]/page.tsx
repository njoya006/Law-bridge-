'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBook, getBookVersions, incrementBookView, listBooks, type BookItem, type BookVersion } from '../../../lib/libraryApi'

// ─── Cover themes (keep in sync with library/page.tsx) ───────────────────────

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
function getTheme(areas: string[]) {
  for (const a of areas) if (COVER_THEMES[a]) return COVER_THEMES[a]
  return DEFAULT_THEME
}

function ordinal(n: number) {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

// ─── Mini book cover (sidebar thumbnail) ─────────────────────────────────────

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

function MiniCover({ book }: { book: BookItem }) {
  const theme = getTheme(book.legal_areas)
  return (
    <div className="relative flex-shrink-0" style={{ width: '72px' }}>
      {/* Pages edge */}
      <div className="absolute inset-y-0 pointer-events-none"
           style={{ right: '-5px', width: '8px', background: '#c0b898', borderRadius: '0 2px 2px 0', zIndex: 0 }} />
      <div className="absolute inset-y-0 pointer-events-none"
           style={{ right: '-2.5px', width: '6px', background: '#d8d0b8', borderRadius: '0 2px 2px 0', zIndex: 0 }} />
      {/* Cover */}
      <div className="relative overflow-hidden rounded-l-sm"
           style={{
             aspectRatio: '5/7', background: theme.bg, zIndex: 1,
             boxShadow: '2px 3px 10px rgba(0,0,0,0.5)',
           }}>
        <div className="absolute left-0 top-0 bottom-0" style={{ width: '11%', background: theme.spine }} />
        <div className="absolute top-0 left-[11%] right-0 flex items-center justify-center"
             style={{ height: '35%', background: theme.accent + '18' }}>
          <div className="opacity-20" style={{ width: '24px', height: '24px' }}>
            <ScalesIcon color={theme.accent} />
          </div>
        </div>
        <div className="absolute left-[11%] right-1 overflow-hidden px-1.5"
             style={{ top: '35%', bottom: '25%', display: 'flex', alignItems: 'center' }}>
          <p className="text-[7px] font-bold leading-tight text-white line-clamp-4">{book.title}</p>
        </div>
        <div className="absolute left-[11%] right-0 bottom-0 px-1.5 pb-1.5">
          <div className="h-px mb-1" style={{ background: theme.accent + '30' }} />
          <p className="text-[6px] text-white/60 truncate">{book.author_name}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Watermark overlay ───────────────────────────────────────────────────────

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

// ─── Citation block ───────────────────────────────────────────────────────────

function CitationBlock({ book }: { book: BookItem }) {
  const [copied, setCopied] = useState(false)
  const year = book.published_at ? new Date(book.published_at).getFullYear() : book.year || ''
  const edSuffix = book.edition > 1 ? `, ${ordinal(book.edition)} ed.` : ''
  const citation = `${book.author_name}. "${book.title}${edSuffix}". ${book.publisher || 'LawBridge Press'}, ${year}. [v${book.version_number}] — CamLex Digital Library.`

  const copy = () => {
    navigator.clipboard.writeText(citation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="rounded-xl bg-white/3 border border-white/8 p-4">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] font-bold text-white/35 uppercase tracking-wider">Cite this work</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-[11px] text-gold-400/60 hover:text-gold-400 transition-colors"
        >
          {copied ? (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-[11px] text-white/45 leading-relaxed font-mono">{citation}</p>
    </div>
  )
}

// ─── Content renderer (basic markdown → JSX) ─────────────────────────────────

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

function ContentRenderer({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).map(b => b.trim()).filter(Boolean)

  return (
    <div className="space-y-5 text-[15px] leading-[1.8] text-white/65">
      {blocks.map((block, i) => {
        // Horizontal rule
        if (/^---+$/.test(block)) {
          return <hr key={i} className="border-white/8 my-8" />
        }

        // Headings
        if (block.startsWith('#### ')) return (
          <h4 key={i} className="text-[13px] font-bold text-white/60 uppercase tracking-widest mt-8 mb-2">
            {block.slice(5)}
          </h4>
        )
        if (block.startsWith('### ')) return (
          <h3 key={i} className="text-[16px] font-semibold text-white/75 mt-10 mb-3 pb-2 border-b border-white/6">
            {block.slice(4)}
          </h3>
        )
        if (block.startsWith('## ')) return (
          <h2 key={i} className="text-[20px] font-bold text-white mt-12 mb-4">
            {block.slice(3)}
          </h2>
        )
        if (block.startsWith('# ')) return (
          <h1 key={i} className="text-[24px] font-bold text-white mt-14 mb-5 pb-3 border-b border-white/10">
            {block.slice(2)}
          </h1>
        )

        // Block quote
        if (block.startsWith('> ')) {
          const text = block.replace(/^> /gm, '')
          return (
            <blockquote key={i}
              className="border-l-2 pl-5 py-1 my-4 text-[14px] text-white/45 italic"
              style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(text) }} />
            </blockquote>
          )
        }

        // Unordered list
        const lines = block.split('\n')
        if (lines.every(l => /^[-*] /.test(l.trim()) || l.trim() === '')) {
          return (
            <ul key={i} className="space-y-1.5 pl-5 list-none">
              {lines.filter(l => l.trim()).map((line, j) => (
                <li key={j} className="flex gap-2.5 text-white/60">
                  <span className="mt-2.5 w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                  <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.replace(/^[-*] /, '')) }} />
                </li>
              ))}
            </ul>
          )
        }

        // Numbered list
        if (lines.every(l => /^\d+\. /.test(l.trim()) || l.trim() === '')) {
          return (
            <ol key={i} className="space-y-2 pl-6 list-none counter-reset">
              {lines.filter(l => l.trim()).map((line, j) => (
                <li key={j} className="flex gap-3 text-white/60">
                  <span className="flex-shrink-0 w-5 text-right text-white/30 font-mono text-[13px] mt-0.5">{j + 1}.</span>
                  <span dangerouslySetInnerHTML={{ __html: inlineFormat(line.replace(/^\d+\. /, '')) }} />
                </li>
              ))}
            </ol>
          )
        }

        // Article / clause format (e.g. "Article 1 —" or "Art. 1.")
        if (/^(Article|Art\.|Section|Clause|ARTICLE)\s+\d+/.test(block)) {
          const firstLine = lines[0]
          const rest = lines.slice(1).join('\n')
          return (
            <div key={i} className="bg-white/[0.025] rounded-lg p-4 border-l-2 border-white/10">
              <p className="text-[13px] font-bold text-white/70 mb-2">
                <span dangerouslySetInnerHTML={{ __html: inlineFormat(firstLine) }} />
              </p>
              {rest && (
                <p className="text-[14px] text-white/55 leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: inlineFormat(rest.replace(/\n/g, '<br />')) }} />
              )}
            </div>
          )
        }

        // Regular paragraph
        return (
          <p key={i}
             className="text-[15px] leading-[1.9] text-white/60"
             dangerouslySetInnerHTML={{
               __html: inlineFormat(block.replace(/\n/g, ' '))
             }} />
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [book, setBook] = useState<BookItem | null>(null)
  const [versions, setVersions] = useState<BookVersion[]>([])
  const [relatedBooks, setRelatedBooks] = useState<BookItem[]>([])
  const [isAuthor, setIsAuthor] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const token = localStorage.getItem('access')
        const firmId = localStorage.getItem('firmId')
        const viewerId = localStorage.getItem('authUserId')
        setIsLoggedIn(!!token)
        const [bookData, versData] = await Promise.all([
          getBook(id, token, firmId),
          getBookVersions(id, token).catch(() => [] as BookVersion[]),
        ])
        setBook(bookData)
        setVersions(versData)
        const authorMatch = !!viewerId && viewerId === bookData.author_id
        setIsAuthor(authorMatch)
        // Fire view count (server skips if viewer is the author)
        if (!authorMatch) {
          incrementBookView(id, token).catch(() => {})
        }
        // Related books: same legal areas, exclude current book
        listBooks(token).then(all => {
          const related = all
            .filter(b => b.id !== id && b.legal_areas.some(a => bookData.legal_areas.includes(a)))
            .slice(0, 3)
          setRelatedBooks(related)
        }).catch(() => {})
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
      <div className="min-h-screen bg-[#07111a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-[#07111a] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-400">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-white/60 text-sm">{error || 'Publication not found.'}</p>
        <button onClick={() => router.back()} className="text-gold-400 text-sm hover:text-gold-300 transition-colors">
          ← Go back
        </button>
      </div>
    )
  }

  const theme = getTheme(book.legal_areas)

  return (
    <div className="min-h-screen bg-[#07111a]">

      {/* ── Top navigation bar ── */}
      <div className="sticky top-0 z-10 bg-[#07111a]/90 backdrop-blur-sm border-b border-white/6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
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
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              book.tier === 'general'
                ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            }`}>
              {book.tier === 'general' ? 'General Library' : 'Firm Library'}
            </span>
            <span className="text-[11px] text-white/25 tabular-nums font-mono">v{book.version_number}</span>
          </div>
        </div>
      </div>

      {/* ── Accent header stripe ── */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(to right, ${theme.accent}60, ${theme.accent}20, transparent)` }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 lg:gap-14">

          {/* ── Main content ── */}
          <div className="min-w-0">

            {/* Title block with mini book cover */}
            <div className="flex gap-6 mb-8">
              <MiniCover book={book} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {book.legal_areas.slice(0, 3).map(area => (
                    <span key={area}
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                          style={{ background: theme.accent + '18', color: theme.accent }}>
                      {area}
                    </span>
                  ))}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="text-base text-white/40 font-light mt-1">{book.subtitle}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-white/40">
                  <span>By <span className="text-white/70 font-medium">{book.author_name}</span></span>
                  {book.publisher && <span>·</span>}
                  {book.publisher && <span>{book.publisher}</span>}
                  {book.year && <><span>·</span><span>{book.year}</span></>}
                  {book.edition >= 1 && <><span>·</span><span>{ordinal(book.edition)} edition</span></>}
                  {book.pages && <><span>·</span><span>{book.pages} pages</span></>}
                </div>
              </div>
            </div>

            {/* Abstract */}
            {book.abstract && (
              <div className="mb-8 p-5 rounded-xl border"
                   style={{ background: theme.accent + '08', borderColor: theme.accent + '22' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.accent + 'cc' }}>
                  Abstract
                </p>
                <p className="text-[14px] text-white/55 leading-relaxed">{book.abstract}</p>
              </div>
            )}

            {/* Full content */}
            {book.content ? (
              <div className="relative mt-2 max-w-[72ch]">
                <WatermarkOverlay />
                <ContentRenderer content={book.content} />
              </div>
            ) : (
              <div className="mt-8 text-center py-12 rounded-xl border border-white/6 bg-white/2">
                <p className="text-sm text-white/30">Full content not available for this publication.</p>
              </div>
            )}

            {/* You may also like */}
            {relatedBooks.length > 0 && (
              <div className="mt-14 pt-10 border-t border-white/6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">You may also like</h2>
                  {book.legal_areas[0] && (
                    <Link
                      href={`/library?legal_area=${encodeURIComponent(book.legal_areas[0])}`}
                      className="text-[11px] text-gold-400/60 hover:text-gold-400 transition-colors"
                    >
                      See all {book.legal_areas[0]} →
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedBooks.map(rb => (
                    <Link
                      key={rb.id}
                      href={`/library/${rb.id}`}
                      className="group rounded-xl bg-white/[0.025] border border-white/8 hover:border-white/15 hover:bg-white/5 p-4 transition-all"
                    >
                      <p className="text-[12px] font-semibold text-white/70 group-hover:text-white leading-snug line-clamp-2 transition-colors mb-2">
                        {rb.title}
                      </p>
                      <p className="text-[10px] text-white/30 truncate">{rb.author_name}</p>
                      {rb.legal_areas[0] && (
                        <span
                          className="inline-block mt-2 rounded-full px-2 py-0.5 text-[9px] font-medium"
                          style={{
                            background: theme.accent + '15',
                            color: theme.accent,
                          }}
                        >
                          {rb.legal_areas[0]}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Consultation CTA */}
            {!isAuthor && book.author_id !== '00000000-0000-0000-0000-000000000001' && book.status === 'published' && (
              <div
                className="mt-10 rounded-2xl border p-6"
                style={{ background: theme.accent + '08', borderColor: theme.accent + '20' }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: theme.accent + '18' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: theme.accent }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white/80">
                      Questions about {book.legal_areas[0] || 'this topic'}?
                    </p>
                    <p className="text-xs text-white/40 mt-1">
                      {book.author_name} is available for a one-on-one consultation.
                    </p>
                    <div className="mt-4">
                      {isLoggedIn ? (
                        <Link
                          href={`/bookings/new?lawyer_id=${book.author_id}`}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-950 transition-colors hover:opacity-90"
                          style={{ background: theme.accent }}
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
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">

            {/* Published date */}
            {book.published_at && (
              <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1.5">Published</p>
                <p className="text-sm text-white/65 font-medium">
                  {new Date(book.published_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
                {book.views > 0 && (
                  <p className="text-[11px] text-white/25 mt-1">{book.views.toLocaleString()} reads</p>
                )}
              </div>
            )}

            {/* Firm profile link */}
            {book.tier === 'firm' && book.firm_id && (
              <Link
                href={`/library/firm/${book.firm_id}`}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/3 border border-white/8 hover:border-white/15 hover:bg-white/5 p-4 transition-all group"
              >
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">Firm Publication</p>
                  <p className="text-xs text-white/55 group-hover:text-white/80 transition-colors">View all firm publications →</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white/25 group-hover:text-white/50 transition-colors flex-shrink-0">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            )}

            {/* Jurisdiction & Language */}
            <div className="rounded-xl bg-white/3 border border-white/8 p-4">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2.5">Details</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-white/35">Jurisdiction</span>
                  <span className="text-[12px] text-white/65 font-medium">{book.jurisdiction}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-white/35">Language</span>
                  <span className="text-[12px] text-white/65 font-medium">{book.language === 'fr' ? 'French' : 'English'}</span>
                </div>
                {book.pages && (
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-white/35">Pages</span>
                    <span className="text-[12px] text-white/65 font-medium">{book.pages}</span>
                  </div>
                )}
                {book.year && (
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-white/35">Year</span>
                    <span className="text-[12px] text-white/65 font-medium">{book.year}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Legal areas */}
            {book.legal_areas.length > 0 && (
              <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2.5">Legal Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {book.legal_areas.map(area => (
                    <span key={area} className="rounded-md bg-white/5 px-2.5 py-1 text-[11px] text-white/50 font-medium border border-white/6">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Version history */}
            {versions.length > 0 && (
              <div className="rounded-xl bg-white/3 border border-white/8 p-4">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2.5">Version History</p>
                <div className="space-y-2.5">
                  {versions.map(v => (
                    <div key={v.id} className="flex items-start gap-3">
                      <span className="text-[11px] font-mono text-gold-400/65 mt-0.5 flex-shrink-0">v{v.version_number}</span>
                      <div>
                        <p className="text-[11px] text-white/40">
                          {new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {v.change_summary && (
                          <p className="text-[11px] text-white/28 mt-0.5 leading-snug">{v.change_summary}</p>
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
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2.5">Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {book.categories.map(cat => (
                    <span key={cat.id} className="rounded-md bg-white/5 px-2.5 py-1 text-[11px] text-white/50">
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
