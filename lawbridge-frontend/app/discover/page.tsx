'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { browseLawyers, browseFirms, type LawyerDiscovery } from '../../lib/discoveryApi'
import { getMyFirmMemberships, type FirmDiscovery } from '../../lib/firmsApi'
import { search } from '../../lib/searchApi'

function StarRating({ rating, count }: { rating: number; count?: number }) {
  const stars = Math.round(rating)
  return (
    <span className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= stars ? 'text-gold-400' : 'text-neutral-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-neutral-400 text-xs ml-0.5">{rating.toFixed(1)}{count !== undefined ? ` (${count})` : ''}</span>
    </span>
  )
}

function AvailabilityBadge({ status }: { status: LawyerDiscovery['availability_status'] }) {
  const map = {
    available: { label: 'Available', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    busy: { label: 'Busy', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    on_leave: { label: 'On Leave', cls: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30' },
    inactive: { label: 'Inactive', cls: 'bg-neutral-600/15 text-neutral-500 border-neutral-600/30' },
  }
  const { label, cls } = map[status] ?? map.inactive
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cls}`}>{label}</span>
}

function ConsultationModeBadge({ mode }: { mode: LawyerDiscovery['consultation_mode'] }) {
  const map = {
    in_person: '🏢 In-Person',
    virtual: '💻 Virtual',
    both: '🏢 / 💻 Both',
  }
  return <span className="text-xs text-neutral-400">{map[mode] ?? mode}</span>
}

function LawyerCard({ lawyer }: { lawyer: LawyerDiscovery }) {
  const initials = lawyer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const fee = lawyer.consultation_fee ? `${parseFloat(lawyer.consultation_fee).toLocaleString()} XAF` : 'Fee on request'

  return (
    <div className="bg-primary-800/40 border border-neutral-700/40 rounded-xl p-5 hover:border-gold-500/40 hover:bg-primary-800/60 transition-all duration-200 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gold-500/40 to-gold-600/40 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
          <span className="text-gold-300 text-sm font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading text-body-md text-neutral-50 truncate">{lawyer.name}</h3>
            {lawyer.is_verified && (
              <svg className="w-4 h-4 text-gold-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            )}
          </div>
          <p className="text-gold-400/80 text-body-sm truncate">{lawyer.specialization}</p>
        </div>
        <AvailabilityBadge status={lawyer.availability_status} />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap">
        <StarRating rating={lawyer.average_rating} count={lawyer.rating_count} />
        <span>{lawyer.years_of_experience}yr exp</span>
        <span>{lawyer.active_cases} active cases</span>
        {lawyer.accepts_urgent_cases && <span className="text-crimson-400">Urgent ✓</span>}
      </div>

      {/* Bio */}
      {lawyer.bio && (
        <p className="text-neutral-400 text-body-sm line-clamp-2">{lawyer.bio}</p>
      )}

      {/* Details */}
      <div className="flex items-center justify-between gap-2 text-xs text-neutral-500 flex-wrap">
        <ConsultationModeBadge mode={lawyer.consultation_mode} />
        <span className="text-neutral-400">{lawyer.practice_circuit ? lawyer.practice_circuit.charAt(0).toUpperCase() + lawyer.practice_circuit.slice(1) : ''} Circuit</span>
      </div>

      {/* Fee + CTA */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-neutral-700/30">
        <div>
          <p className="text-xs text-neutral-500">Consultation fee</p>
          <p className="text-gold-400 font-semibold text-sm">{fee}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/discover/lawyer/${lawyer.id}`}
            className="px-3 py-1.5 rounded-lg border border-neutral-600/50 text-neutral-300 text-xs hover:border-gold-500/50 hover:text-gold-400 transition-colors"
          >
            View Profile
          </Link>
          <Link
            href={`/book?kind=lawyer&id=${encodeURIComponent(lawyer.id)}&name=${encodeURIComponent(lawyer.name)}&fee=${lawyer.consultation_fee ?? ''}`}
            className="px-3 py-1.5 rounded-lg bg-gold-500 text-black text-xs font-semibold hover:bg-gold-400 transition-colors"
          >
            Book
          </Link>
        </div>
      </div>
    </div>
  )
}

function FirmCard({ firm }: { firm: FirmDiscovery }) {
  const initials = firm.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="bg-primary-800/40 border border-neutral-700/40 rounded-xl p-5 hover:border-gold-500/40 hover:bg-primary-800/60 transition-all duration-200 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {firm.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={firm.logo_url} alt={firm.name} className="h-12 w-12 rounded-xl object-cover border border-neutral-700/30 flex-shrink-0" />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-600/50 to-primary-700/50 border border-neutral-700/30 flex items-center justify-center flex-shrink-0">
            <span className="text-neutral-300 text-sm font-bold">{initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-body-md text-neutral-50 truncate">{firm.name}</h3>
          <p className="text-neutral-400 text-body-sm">{firm.member_count ?? 0} active members</p>
        </div>
      </div>

      <div className="text-neutral-400 text-body-sm">
        A registered law firm on Lawbridge. Click "View Firm" to see the team and book a consultation.
      </div>

      {/* CTA */}
      <div className="flex gap-2 pt-1 border-t border-neutral-700/30">
        <Link
          href={`/discover/firm/${firm.id}`}
          className="flex-1 text-center px-3 py-1.5 rounded-lg border border-neutral-600/50 text-neutral-300 text-xs hover:border-gold-500/50 hover:text-gold-400 transition-colors"
        >
          View Firm
        </Link>
        <Link
          href={`/book?kind=firm&id=${firm.id}&name=${encodeURIComponent(firm.name)}`}
          className="flex-1 text-center px-3 py-1.5 rounded-lg bg-gold-500 text-black text-xs font-semibold hover:bg-gold-400 transition-colors"
        >
          Book with Firm
        </Link>
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [lawyers, setLawyers] = useState<LawyerDiscovery[]>([])
  const [firms, setFirms] = useState<FirmDiscovery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const matchText = (value: string | undefined, q: string) => (value ?? '').toLowerCase().includes(q)

  const load = async (nextQuery = '') => {
    setError('')
    setLoading(true)
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null
    const ownFirmIds = new Set<string>()
    if (token) {
      try {
        const myMemberships = await getMyFirmMemberships(token)
        for (const m of myMemberships ?? []) ownFirmIds.add(String(m.firm))
      } catch { /* ignore */ }
    }

    if (nextQuery) {
      const q = nextQuery.toLowerCase()
      try {
        const resp = await search(nextQuery, token)
        const nextLawyers: LawyerDiscovery[] = []
        const nextFirms: FirmDiscovery[] = []
        for (const item of resp.results ?? []) {
          if (item.type === 'lawyer' && item.payload) nextLawyers.push(item.payload as LawyerDiscovery)
          if (item.type === 'firm' && item.payload) nextFirms.push(item.payload as FirmDiscovery)
        }
        if (nextLawyers.length + nextFirms.length > 0) {
          setLawyers(nextLawyers)
          setFirms(nextFirms.filter(f => !ownFirmIds.has(String(f.id))))
          setLoading(false)
          return
        }
      } catch { /* fall back to individual services */ }

      try {
        const [lr, fr] = await Promise.allSettled([browseLawyers(token), browseFirms(token)])
        const allLawyers = lr.status === 'fulfilled' ? (lr.value.results ?? []) : []
        const allFirms = fr.status === 'fulfilled' ? (fr.value.results ?? []) : []
        setLawyers(allLawyers.filter(l =>
          [l.name, l.specialization, l.bio, l.practice_circuit].some(v => matchText(v, q))
        ))
        setFirms(allFirms.filter(f => matchText(f.name, q) && !ownFirmIds.has(String(f.id))))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Search failed')
      }
      setLoading(false)
      return
    }

    try {
      const [lr, fr] = await Promise.allSettled([browseLawyers(token), browseFirms(token)])
      setLawyers(lr.status === 'fulfilled' ? (lr.value.results ?? []) : [])
      setFirms(fr.status === 'fulfilled' ? (fr.value.results ?? []).filter((f: FirmDiscovery) => !ownFirmIds.has(String(f.id))) : [])
      if (lr.status === 'rejected') setError(lr.reason instanceof Error ? lr.reason.message : 'Lawyers unavailable')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load')
    }
    setLoading(false)
  }

  useEffect(() => { void load('') }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-display-md text-neutral-50">Find Legal Expertise</h1>
        <p className="mt-2 text-neutral-400">Browse verified lawyers and firms. View profiles, check fees, and book consultations.</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && void load(query.trim())}
          placeholder="Search by name, specialization, or location…"
          className="flex-1 rounded-xl bg-primary-800/40 border border-neutral-700/40 px-4 py-3 text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30"
        />
        <button
          onClick={() => void load(query.trim())}
          className="rounded-xl bg-gold-500 hover:bg-gold-400 px-5 py-3 font-semibold text-black transition-colors"
        >
          Search
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 p-4 text-crimson-300 text-sm">{error}</div>
      )}

      {/* Lawyers */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-display-xs text-neutral-50">Lawyers</h2>
          <span className="text-neutral-500 text-sm">{lawyers.length} found</span>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-52 rounded-xl bg-primary-800/30 border border-neutral-700/20 animate-pulse" />
            ))}
          </div>
        ) : lawyers.length === 0 ? (
          <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-8 text-center text-neutral-400">
            No lawyers found. Try a different search term or check back later.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lawyers.map(lawyer => <LawyerCard key={lawyer.id} lawyer={lawyer} />)}
          </div>
        )}
      </section>

      {/* Firms */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-display-xs text-neutral-50">Law Firms</h2>
          <span className="text-neutral-500 text-sm">{firms.length} found</span>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1,2].map(i => (
              <div key={i} className="h-40 rounded-xl bg-primary-800/30 border border-neutral-700/20 animate-pulse" />
            ))}
          </div>
        ) : firms.length === 0 ? (
          <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-8 text-center text-neutral-400">
            No firms found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {firms.map(firm => <FirmCard key={firm.id} firm={firm} />)}
          </div>
        )}
      </section>
    </div>
  )
}
