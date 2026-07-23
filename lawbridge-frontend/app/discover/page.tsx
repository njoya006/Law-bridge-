'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { browseLawyers, browseFirms, type LawyerDiscovery, type LawyerBrowseFilters } from '../../lib/discoveryApi'
import { getMyFirmMemberships, type FirmDiscovery } from '../../lib/firmsApi'
import { search } from '../../lib/searchApi'
import { getOpenCases, applyForCase, type CaseItem } from '../../lib/casesApi'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { ReputationBadge } from '../../components/ui/ReputationBadge'
import { CheckIcon, ClockIcon, MapPinIcon, SlidersIcon, SearchIcon, BuildingIcon } from '../../components/icons/Icons'

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
  const fee = lawyer.consultation_fee ? `${parseFloat(lawyer.consultation_fee).toLocaleString()} XAF` : 'On request'

  const avail = {
    available: { label: 'Available', cls: 'bg-emerald-500 text-white' },
    busy: { label: 'Busy', cls: 'bg-amber-500 text-black' },
    on_leave: { label: 'On Leave', cls: 'bg-neutral-600 text-neutral-200' },
    inactive: { label: 'Inactive', cls: 'bg-neutral-700 text-neutral-400' },
  }[lawyer.availability_status] ?? { label: 'Unknown', cls: 'bg-neutral-700 text-neutral-400' }

  const tags = [
    lawyer.specialization,
    lawyer.bijural_flag === 'common_law' ? 'Common Law' : lawyer.bijural_flag === 'civil_law' ? 'Civil Law' : lawyer.bijural_flag === 'both' ? 'Bijural' : null,
    lawyer.practice_circuit || null,
    lawyer.consultation_mode === 'virtual' ? 'Virtual' : lawyer.consultation_mode === 'in_person' ? 'In-Person' : 'Virtual & In-Person',
  ].filter(Boolean).slice(0, 3) as string[]

  return (
    <div className="group relative flex flex-col bg-primary-800/50 border border-white/8 rounded-2xl overflow-hidden hover:border-gold-500/30 hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
      {/* Top section with avatar */}
      <div className="relative px-5 pt-6 pb-4 flex flex-col items-center text-center">
        {/* Availability badge — top left */}
        <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${avail.cls}`}>
          {avail.label}
        </span>

        {/* Fee — top right */}
        <span className="absolute top-3 right-3 text-xs font-semibold text-gold-400">
          {lawyer.consultation_fee ? `${Math.round(parseFloat(lawyer.consultation_fee) / 1000)}K XAF` : 'Free'}
        </span>

        {/* Avatar */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-lg shadow-black/30">
            {lawyer.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lawyer.avatar_url} alt={lawyer.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gold-500/40 via-gold-600/30 to-primary-600/50 flex items-center justify-center">
                <span className="text-gold-200 text-xl font-bold font-display">{initials}</span>
              </div>
            )}
          </div>
          {lawyer.is_verified && (
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold-500 border-2 border-primary-800 flex items-center justify-center">
              <CheckIcon width={12} height={12} className="text-primary-900" />
            </span>
          )}
        </div>

        {/* Name + role */}
        <h3 className="font-heading font-semibold text-neutral-50 text-base leading-tight">{lawyer.name}</h3>
        <p className="mt-0.5 text-xs text-gold-400/80 truncate w-full">{lawyer.specialization || 'Legal Professional'}</p>

        {/* Affiliation row */}
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-500">
          <ClockIcon width={11} height={11} />
          {lawyer.years_of_experience}yr exp
          {lawyer.practice_circuit && <><span>·</span><MapPinIcon width={11} height={11} />{lawyer.practice_circuit}</>}
        </div>

        {/* Star rating + reputation tier */}
        <div className="mt-2 flex items-center gap-2 flex-wrap justify-center">
          <StarRating rating={lawyer.average_rating} count={lawyer.rating_count} />
          {(lawyer.reputation_score ?? 0) > 0 && (
            <ReputationBadge score={lawyer.reputation_score ?? 0} size="sm" showLabel={false} />
          )}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5 justify-center">
          {tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full border border-neutral-700/50 bg-primary-900/40 text-neutral-400">{tag}</span>
          ))}
          {lawyer.accepts_urgent_cases && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-crimson-500/30 bg-crimson-500/10 text-crimson-400">Urgent</span>
          )}
        </div>
      )}

      {/* Bio */}
      {lawyer.bio && (
        <p className="px-5 pb-3 text-xs text-neutral-500 line-clamp-2 text-center leading-relaxed">{lawyer.bio}</p>
      )}

      {/* Buttons */}
      <div className="mt-auto px-4 pb-4 pt-1 flex gap-2 border-t border-white/5">
        <Link
          href={isStaff ? `/lawyer/discover/lawyer/${lawyer.id}` : `/discover/lawyer/${lawyer.id}`}
          className="flex-1 text-center py-2.5 rounded-xl border border-neutral-600/50 text-xs font-semibold text-neutral-300 hover:border-gold-500/50 hover:text-gold-400 hover:bg-gold-500/5 transition-colors uppercase tracking-wide"
        >
          View Profile
        </Link>
        {!isStaff && (
          <Link
            href={`/book?kind=lawyer&id=${encodeURIComponent(lawyer.id)}&name=${encodeURIComponent(lawyer.name)}&fee=${lawyer.consultation_fee ?? ''}`}
            className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-xs font-bold transition-colors uppercase tracking-wide"
          >
            Book
          </Link>
        )}
      </div>
    </div>
  )
}

function FirmCard({ firm, isStaff, isOwnFirm }: { firm: FirmDiscovery; isStaff: boolean; isOwnFirm: boolean }) {
  const initials = (firm.name || '?').split(' ').map((w: string) => w[0] ?? '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <div className="group relative flex flex-col bg-primary-800/50 border border-white/8 rounded-2xl overflow-hidden hover:border-gold-500/30 hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
      {/* Top section */}
      <div className="relative px-5 pt-6 pb-4 flex flex-col items-center text-center">
        {/* Own firm badge */}
        {isOwnFirm && (
          <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500 text-black">Your Firm</span>
        )}

        {/* Member count — top right */}
        <span className="absolute top-3 right-3 text-[11px] text-neutral-500">
          {firm.member_count ?? 0} members
        </span>

        {/* Logo */}
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg shadow-black/30">
            {firm.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={firm.logo_url} alt={firm.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-600/60 via-primary-700/50 to-primary-800/60 flex items-center justify-center">
                <span className="text-neutral-200 text-xl font-bold font-display">{initials}</span>
              </div>
            )}
          </div>
          {firm.is_verified && (
            <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold-500 border-2 border-primary-800 flex items-center justify-center">
              <CheckIcon width={12} height={12} className="text-primary-900" />
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-heading font-semibold text-neutral-50 text-base leading-tight">{firm.name}</h3>
        <p className="mt-0.5 text-xs text-neutral-500">Law Firm</p>

        {/* Location */}
        {(firm.city || firm.country) && (
          <div className="mt-2 flex items-center gap-1 text-[11px] text-neutral-500">
            <MapPinIcon width={11} height={11} />
            {[firm.city, firm.country].filter(Boolean).join(', ')}
            {firm.year_established && <><span>·</span>Est. {firm.year_established}</>}
          </div>
        )}
      </div>

      {/* Specializations */}
      {firm.specializations && firm.specializations.length > 0 && (
        <div className="px-5 pb-3 flex flex-wrap gap-1.5 justify-center">
          {firm.specializations.slice(0, 3).map(s => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full border border-neutral-700/50 bg-primary-900/40 text-neutral-400">{s}</span>
          ))}
        </div>
      )}

      {/* Description */}
      {firm.description && (
        <p className="px-5 pb-3 text-xs text-neutral-500 line-clamp-2 text-center leading-relaxed">{firm.description}</p>
      )}

      {/* Buttons */}
      <div className="mt-auto px-4 pb-4 pt-1 flex gap-2 border-t border-white/5">
        <Link
          href={isStaff ? `/lawyer/discover/firm/${firm.id}` : `/discover/firm/${firm.id}`}
          className="flex-1 text-center py-2.5 rounded-xl border border-neutral-600/50 text-xs font-semibold text-neutral-300 hover:border-gold-500/50 hover:text-gold-400 hover:bg-gold-500/5 transition-colors uppercase tracking-wide"
        >
          View Firm
        </Link>
        {isOwnFirm ? (
          <Link href="/lawyer/team" className="px-4 py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-bold hover:bg-gold-500/20 transition-colors uppercase tracking-wide">
            Manage
          </Link>
        ) : isStaff ? (
          <Link href={`/lawyer/discover/firm/${firm.id}#partnership`} className="px-4 py-2.5 rounded-xl border border-neutral-600/50 text-neutral-300 text-xs font-bold hover:border-gold-500/50 hover:text-gold-400 transition-colors uppercase tracking-wide">
            Partner
          </Link>
        ) : (
          <Link href={`/book?kind=firm&id=${firm.id}&name=${encodeURIComponent(firm.name)}`} className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-xs font-bold transition-colors uppercase tracking-wide">
            Book
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

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/20 bg-gold-500/8 px-3 py-1 text-[11px] font-medium text-gold-400 hover:border-gold-500/40 hover:bg-gold-500/15 transition-colors"
    >
      {label} <span className="text-gold-400/50 text-sm leading-none">×</span>
    </button>
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

  const activeFilterCount = [
    filters.availability,
    filters.practice_circuit,
    filters.bijural,
    filters.mode,
    filters.urgent,
    filters.verified_only,
  ].filter(Boolean).length

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
            <SlidersIcon width={16} height={16} className="inline mr-1.5" />
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
              <select value={filters.sort || 'reputation'} onChange={e => updateFilter('sort', e.target.value)}
                className="w-full rounded-lg bg-primary-800/60 border border-neutral-700/40 px-2 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-gold-500/40">
                <option value="reputation">Top Reputation</option>
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

      {/* Active filter chips */}
      {activeTab === 'lawyers' && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {filters.availability && <FilterChip label={filters.availability === 'available' ? 'Available Now' : 'Busy'} onRemove={() => updateFilter('availability', '')} />}
          {filters.practice_circuit && <FilterChip label={filters.practice_circuit} onRemove={() => updateFilter('practice_circuit', '')} />}
          {filters.bijural && <FilterChip label={filters.bijural === 'both' ? 'Bijural' : filters.bijural === 'common_law' ? 'Common Law' : 'Civil Law'} onRemove={() => updateFilter('bijural', '')} />}
          {filters.mode && <FilterChip label={filters.mode === 'virtual' ? 'Virtual Only' : filters.mode === 'in_person' ? 'In-Person Only' : 'Both Modes'} onRemove={() => updateFilter('mode', '')} />}
          {filters.urgent && <FilterChip label="Urgent cases" onRemove={() => updateFilter('urgent', undefined)} />}
          {filters.verified_only && <FilterChip label="Verified only" onRemove={() => updateFilter('verified_only', undefined)} />}
          <button onClick={() => { setFilters({ sort: 'rating' }); void load(query.trim(), { sort: 'rating' }) }} className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors underline ml-1">
            Clear all
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 p-4 text-crimson-300 text-sm">{error}</div>
      )}

      {/* Featured Spotlight */}
      {!loading && lawyers.length > 0 && activeTab === 'lawyers' && (
        <div className="gradient-border rounded-2xl overflow-hidden">
          <div className="relative bg-gradient-to-r from-primary-800 via-primary-800/90 to-primary-900/60 px-6 py-5 flex items-center gap-5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.12),transparent_60%)] pointer-events-none" />
            <div className="relative z-10 h-14 w-14 rounded-full overflow-hidden border-2 border-gold-500/40 shadow-lg shadow-gold-500/20 flex-shrink-0">
              {lawyers[0].avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lawyers[0].avatar_url} alt={lawyers[0].name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gold-500/40 to-primary-600/50 flex items-center justify-center">
                  <span className="font-display text-xl font-bold text-gold-300">
                    {(lawyers[0].name || '?')[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold-400/70 mb-0.5">Featured This Week</p>
              <p className="font-display text-lg font-semibold text-neutral-50 truncate">{lawyers[0].name}</p>
              <p className="text-xs text-neutral-400 truncate">{lawyers[0].specialization || 'Legal Professional'}</p>
            </div>
            <Link
              href={isStaff ? `/lawyer/discover/lawyer/${lawyers[0].id}` : `/discover/lawyer/${lawyers[0].id}`}
              className="relative z-10 flex-shrink-0 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-xs font-semibold text-gold-400 hover:bg-gold-500/20 transition-colors"
            >
              View Profile →
            </Link>
          </div>
        </div>
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
              {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : lawyers.length === 0 ? (
            <EmptyState
              icon={<SearchIcon width={24} height={24} />}
              title="No lawyers found"
              body="Try adjusting your filters or search term."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {lawyers.map((lawyer, i) => (
                <div key={lawyer.id} className="stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                  <LawyerCard lawyer={lawyer} isStaff={isStaff} />
                </div>
              ))}
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
              {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : firms.length === 0 ? (
            <EmptyState
              icon={<BuildingIcon width={24} height={24} />}
              title="No firms found"
              body="Try different search terms."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {firms.map((firm, i) => (
                <div key={firm.id} className="stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                  <FirmCard firm={firm} isStaff={isStaff} isOwnFirm={ownFirmIds.has(String(firm.id))} />
                </div>
              ))}
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
                <div key={i} className="h-40 rounded-xl skeleton" />
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
