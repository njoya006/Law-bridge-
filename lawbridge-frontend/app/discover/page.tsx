'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { browseLawyers, browseFirms, type LawyerDiscovery, type LawyerBrowseFilters } from '../../lib/discoveryApi'
import { getMyFirmMemberships, type FirmDiscovery } from '../../lib/firmsApi'
import { search } from '../../lib/searchApi'
import { getOpenCases, applyForCase, type CaseItem } from '../../lib/casesApi'

function isStaffPortal(): boolean {
  try {
    return localStorage.getItem('portalRole') === 'lawyer'
  } catch { return false }
}

function StarRating({ rating, count }: { rating: number | string; count?: number }) {
  const r = Number(rating) || 0
  const stars = Math.round(r)
  return (
    <span className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= stars ? 'text-gold-400' : 'text-neutral-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-neutral-400 text-xs ml-0.5">{r.toFixed(1)}{count !== undefined ? ` (${count})` : ''}</span>
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

function LawyerCard({ lawyer, isStaff }: { lawyer: LawyerDiscovery; isStaff: boolean }) {
  const initials = (lawyer.name || '?').split(' ').map((w: string) => w[0] ?? '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
  const fee = lawyer.consultation_fee ? `${parseFloat(lawyer.consultation_fee).toLocaleString()} XAF` : 'Fee on request'

  return (
    <div className="bg-primary-800/40 border border-neutral-700/40 rounded-xl p-5 hover:border-gold-500/40 hover:bg-primary-800/60 transition-all duration-200 flex flex-col gap-4">
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

      <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap">
        <StarRating rating={lawyer.average_rating} count={lawyer.rating_count} />
        <span>{lawyer.years_of_experience}yr exp</span>
        <span>{lawyer.active_cases} active cases</span>
        {lawyer.accepts_urgent_cases && <span className="text-crimson-400">Urgent ✓</span>}
      </div>

      {lawyer.bio && (
        <p className="text-neutral-400 text-body-sm line-clamp-2">{lawyer.bio}</p>
      )}

      <div className="flex items-center justify-between gap-3 pt-1 border-t border-neutral-700/30">
        <div>
          <p className="text-xs text-neutral-500">Consultation fee</p>
          <p className="text-gold-400 font-semibold text-sm">{fee}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={isStaff ? `/lawyer/discover/lawyer/${lawyer.id}` : `/discover/lawyer/${lawyer.id}`}
            className="px-3 py-1.5 rounded-lg border border-neutral-600/50 text-neutral-300 text-xs hover:border-gold-500/50 hover:text-gold-400 transition-colors"
          >
            View Profile
          </Link>
          {!isStaff && (
            <Link
              href={`/book?kind=lawyer&id=${encodeURIComponent(lawyer.id)}&name=${encodeURIComponent(lawyer.name)}&fee=${lawyer.consultation_fee ?? ''}`}
              className="px-3 py-1.5 rounded-lg bg-gold-500 text-black text-xs font-semibold hover:bg-gold-400 transition-colors"
            >
              Book
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function FirmCard({ firm, isStaff, isOwnFirm }: { firm: FirmDiscovery; isStaff: boolean; isOwnFirm: boolean }) {
  const initials = (firm.name || '?').split(' ').map((w: string) => w[0] ?? '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <div className="bg-primary-800/40 border border-neutral-700/40 rounded-xl p-5 hover:border-gold-500/40 hover:bg-primary-800/60 transition-all duration-200 flex flex-col gap-4">
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
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading text-body-md text-neutral-50 truncate">{firm.name}</h3>
            {firm.is_verified && (
              <svg className="w-4 h-4 text-gold-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            )}
            {isOwnFirm && (
              <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-gold-500/15 border border-gold-500/30 text-gold-400 font-semibold">Your Firm</span>
            )}
          </div>
          <p className="text-neutral-400 text-body-sm">{firm.member_count ?? 0} active members</p>
          {firm.city && <p className="text-neutral-500 text-xs">{firm.city}{firm.country ? `, ${firm.country}` : ''}</p>}
        </div>
      </div>

      {firm.description ? (
        <p className="text-neutral-400 text-body-sm line-clamp-2">{firm.description}</p>
      ) : (
        <p className="text-neutral-400 text-body-sm">A registered law firm on Lawbridge.</p>
      )}

      {firm.specializations && firm.specializations.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {firm.specializations.slice(0, 3).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary-700/50 border border-neutral-700/30 text-neutral-400">{s}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-neutral-700/30">
        <Link
          href={isStaff ? `/lawyer/discover/firm/${firm.id}` : `/discover/firm/${firm.id}`}
          className="flex-1 text-center px-3 py-1.5 rounded-lg border border-neutral-600/50 text-neutral-300 text-xs hover:border-gold-500/50 hover:text-gold-400 transition-colors"
        >
          View Firm
        </Link>
        {isOwnFirm ? (
          <Link
            href="/lawyer/team"
            className="flex-1 text-center px-3 py-1.5 rounded-lg bg-primary-600/60 border border-gold-500/30 text-gold-400 text-xs font-semibold hover:bg-primary-600 transition-colors"
          >
            Manage
          </Link>
        ) : isStaff ? (
          <Link
            href={`/lawyer/discover/firm/${firm.id}#partnership`}
            className="flex-1 text-center px-3 py-1.5 rounded-lg bg-primary-600/60 border border-neutral-600/50 text-neutral-200 text-xs font-semibold hover:bg-primary-600 hover:border-gold-500/50 transition-colors"
          >
            Partner
          </Link>
        ) : (
          <Link
            href={`/book?kind=firm&id=${firm.id}&name=${encodeURIComponent(firm.name)}`}
            className="flex-1 text-center px-3 py-1.5 rounded-lg bg-gold-500 text-black text-xs font-semibold hover:bg-gold-400 transition-colors"
          >
            Book with Firm
          </Link>
        )}
      </div>
    </div>
  )
}

function OpenCaseCard({ caseItem, token }: { caseItem: CaseItem; token: string }) {
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function handleApply() {
    setApplying(true)
    setError('')
    try {
      await applyForCase(caseItem.id, message, token)
      setApplied(true)
      setShowForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply')
    }
    setApplying(false)
  }

  return (
    <div className="bg-primary-800/40 border border-neutral-700/40 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-body-md text-neutral-50">{caseItem.title}</h3>
          <p className="text-gold-400/80 text-body-sm">{caseItem.case_type}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 whitespace-nowrap">Open</span>
      </div>
      {caseItem.description && (
        <p className="text-neutral-400 text-body-sm line-clamp-2">{caseItem.description}</p>
      )}
      <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
        {caseItem.circuit && <span>{caseItem.circuit} Circuit</span>}
        {caseItem.legal_tradition && <span>• {caseItem.legal_tradition}</span>}
        {caseItem.language && <span>• {caseItem.language.toUpperCase()}</span>}
      </div>
      {applied ? (
        <div className="text-emerald-400 text-sm font-medium">Application submitted</div>
      ) : showForm ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Briefly explain your relevant experience and why you can take this case…"
            rows={3}
            className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50"
          />
          {error && <p className="text-crimson-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleApply}
              disabled={applying}
              className="px-4 py-1.5 rounded-lg bg-gold-500 text-black text-xs font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors"
            >
              {applying ? 'Submitting…' : 'Submit Application'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 rounded-lg border border-neutral-600/50 text-neutral-300 text-xs hover:border-neutral-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="self-start px-4 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold hover:bg-gold-500/20 transition-colors"
        >
          Apply for Case
        </button>
      )}
    </div>
  )
}

const CIRCUITS = ['Adamawa', 'Centre', 'East', 'Far North', 'Littoral', 'North', 'Northwest', 'South', 'Southwest', 'West']

export default function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [lawyers, setLawyers] = useState<LawyerDiscovery[]>([])
  const [firms, setFirms] = useState<FirmDiscovery[]>([])
  const [openCases, setOpenCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isStaff, setIsStaff] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'lawyers' | 'firms' | 'open-cases'>('lawyers')
  const [ownFirmIds, setOwnFirmIds] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<LawyerBrowseFilters>({ sort: 'rating' })
  const [firmVerifiedOnly, setFirmVerifiedOnly] = useState(false)

  const matchText = (value: string | undefined, q: string) => (value ?? '').toLowerCase().includes(q)

  const load = useCallback(async (nextQuery = '', currentFilters: LawyerBrowseFilters = filters, firmVO = false) => {
    setError('')
    setLoading(true)
    const tk = typeof window !== 'undefined' ? localStorage.getItem('access') : null
    setToken(tk)
    const staffUser = isStaffPortal()
    setIsStaff(staffUser)

    const newOwnFirmIds = new Set<string>()
    if (tk) {
      try {
        const myMemberships = await getMyFirmMemberships(tk)
        for (const m of myMemberships ?? []) newOwnFirmIds.add(String(m.firm))
      } catch { /* ignore */ }
    }
    setOwnFirmIds(newOwnFirmIds)

    if (staffUser && tk) {
      try {
        const resp = await getOpenCases(tk)
        setOpenCases(resp.results ?? [])
      } catch { /* ignore */ }
    }

    if (nextQuery) {
      const q = nextQuery.toLowerCase()
      try {
        const resp = await search(nextQuery, tk)
        const nextLawyers: LawyerDiscovery[] = []
        const nextFirms: FirmDiscovery[] = []
        for (const item of resp.results ?? []) {
          if (item.type === 'lawyer' && item.payload) nextLawyers.push(item.payload as LawyerDiscovery)
          if (item.type === 'firm' && item.payload) nextFirms.push(item.payload as FirmDiscovery)
        }
        if (nextLawyers.length + nextFirms.length > 0) {
          setLawyers(nextLawyers)
          setFirms(nextFirms)
          setLoading(false)
          return
        }
      } catch { /* fall back */ }

      try {
        const [lr, fr] = await Promise.allSettled([
          browseLawyers(tk, { ...currentFilters, q: nextQuery }),
          browseFirms(tk, undefined, firmVO),
        ])
        const allLawyers = lr.status === 'fulfilled' ? (lr.value.results ?? []) : []
        const allFirms = fr.status === 'fulfilled' ? (fr.value.results ?? []) : []
        setLawyers(allLawyers.filter(l =>
          [l.name, l.specialization, l.bio, l.practice_circuit].some(v => matchText(v, q))
        ))
        setFirms(allFirms.filter(f => matchText(f.name, q)))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Search failed')
      }
      setLoading(false)
      return
    }

    try {
      const [lr, fr] = await Promise.allSettled([
        browseLawyers(tk, currentFilters),
        browseFirms(tk, undefined, firmVO),
      ])
      setLawyers(lr.status === 'fulfilled' ? (lr.value.results ?? []) : [])
      setFirms(fr.status === 'fulfilled' ? (fr.value.results ?? []) : [])
      if (lr.status === 'rejected') setError(lr.reason instanceof Error ? lr.reason.message : 'Lawyers unavailable')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load')
    }
    setLoading(false)
  }, [filters])

  const updateFilter = (key: keyof LawyerBrowseFilters, value: string | number | boolean | undefined) => {
    const next = { ...filters, [key]: value || undefined }
    setFilters(next)
    void load(query.trim(), next)
  }

  useEffect(() => { void load('') }, [])

  const tabs = isStaff
    ? [
        { key: 'lawyers', label: `Lawyers (${lawyers.length})` },
        { key: 'firms', label: `Law Firms (${firms.length})` },
        { key: 'open-cases', label: `Open Cases (${openCases.length})` },
      ]
    : [
        { key: 'lawyers', label: `Lawyers (${lawyers.length})` },
        { key: 'firms', label: `Law Firms (${firms.length})` },
      ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-display-md text-neutral-50">
          {isStaff ? 'Discover & Connect' : 'Find Legal Expertise'}
        </h1>
        <p className="mt-2 text-neutral-400">
          {isStaff
            ? 'Browse colleagues, partner with firms, and find open cases to take on.'
            : 'Browse verified lawyers and firms. View profiles, check fees, and book consultations.'}
        </p>
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
        {activeTab === 'lawyers' && (
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`rounded-xl px-4 py-3 border text-sm font-medium transition-colors ${
              showFilters || !!(filters.availability || filters.practice_circuit || filters.bijural || filters.mode || filters.urgent)
                ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                : 'bg-primary-800/40 border-neutral-700/40 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline mr-1.5">
              <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Filters
          </button>
        )}
      </div>

      {/* Filter panel */}
      {activeTab === 'lawyers' && showFilters && (
        <div className="rounded-xl bg-primary-800/30 border border-neutral-700/30 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Availability</label>
              <select value={filters.availability || ''} onChange={e => updateFilter('availability', e.target.value)}
                className="w-full rounded-lg bg-primary-800/60 border border-neutral-700/40 px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-gold-500/40">
                <option value="">Any</option>
                <option value="available">Available Now</option>
                <option value="busy">Busy</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Region</label>
              <select value={filters.practice_circuit || ''} onChange={e => updateFilter('practice_circuit', e.target.value)}
                className="w-full rounded-lg bg-primary-800/60 border border-neutral-700/40 px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-gold-500/40">
                <option value="">All Regions</option>
                {CIRCUITS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Legal Tradition</label>
              <select value={filters.bijural || ''} onChange={e => updateFilter('bijural', e.target.value)}
                className="w-full rounded-lg bg-primary-800/60 border border-neutral-700/40 px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-gold-500/40">
                <option value="">Any</option>
                <option value="common_law">Common Law</option>
                <option value="civil_law">Civil Law</option>
                <option value="both">Bijural</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Consultation Mode</label>
              <select value={filters.mode || ''} onChange={e => updateFilter('mode', e.target.value)}
                className="w-full rounded-lg bg-primary-800/60 border border-neutral-700/40 px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-gold-500/40">
                <option value="">Any</option>
                <option value="virtual">Virtual Only</option>
                <option value="in_person">In-Person Only</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Sort By</label>
              <select value={filters.sort || 'rating'} onChange={e => updateFilter('sort', e.target.value)}
                className="w-full rounded-lg bg-primary-800/60 border border-neutral-700/40 px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-gold-500/40">
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="fee_asc">Lowest Fee</option>
                <option value="fee_desc">Highest Fee</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-700/20 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!filters.urgent}
                onChange={e => updateFilter('urgent', e.target.checked || undefined)}
                className="rounded border-neutral-600 bg-primary-800 text-gold-500 focus:ring-gold-500/30" />
              <span className="text-xs text-neutral-400">Accepts urgent cases</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!!filters.verified_only}
                onChange={e => updateFilter('verified_only', e.target.checked || undefined)}
                className="rounded border-neutral-600 bg-primary-800 text-gold-500 focus:ring-gold-500/30" />
              <span className="text-xs text-neutral-400">Verified lawyers only</span>
            </label>
            <button onClick={() => { setFilters({ sort: 'rating' }); void load(query.trim(), { sort: 'rating' }) }}
              className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors ml-auto">
              Reset filters
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 p-4 text-crimson-300 text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-700/40">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lawyers */}
      {activeTab === 'lawyers' && (
        <section className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-52 rounded-xl bg-primary-800/30 border border-neutral-700/20 animate-pulse" />
              ))}
            </div>
          ) : lawyers.length === 0 ? (
            <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-8 text-center text-neutral-400">
              No lawyers found. Try a different search term.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {lawyers.map(lawyer => <LawyerCard key={lawyer.id} lawyer={lawyer} isStaff={isStaff} />)}
            </div>
          )}
        </section>
      )}

      {/* Firms */}
      {activeTab === 'firms' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={firmVerifiedOnly}
                onChange={e => {
                  const next = e.target.checked
                  setFirmVerifiedOnly(next)
                  void load(query.trim(), filters, next)
                }}
                className="rounded border-neutral-600 bg-primary-800 text-gold-500 focus:ring-gold-500/30"
              />
              <span className="text-xs text-neutral-400">Verified firms only</span>
            </label>
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
              {firms.map(firm => <FirmCard key={firm.id} firm={firm} isStaff={isStaff} isOwnFirm={ownFirmIds.has(String(firm.id))} />)}
            </div>
          )}
        </section>
      )}

      {/* Open Cases — lawyers/staff only */}
      {activeTab === 'open-cases' && isStaff && (
        <section className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[1,2].map(i => (
                <div key={i} className="h-40 rounded-xl bg-primary-800/30 border border-neutral-700/20 animate-pulse" />
              ))}
            </div>
          ) : openCases.length === 0 ? (
            <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-8 text-center text-neutral-400">
              No open cases right now. Declined client cases will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {openCases.map(c => (
                <OpenCaseCard key={c.id} caseItem={c} token={token ?? ''} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
