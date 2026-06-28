'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../../lib/api'
import { getFirmLawyers, type LawyerDiscovery } from '../../../../lib/discoveryApi'
import {
  type FirmDiscovery,
  type PartnershipPolicy,
  getPartnershipPolicy,
  getMyFirmMemberships,
  sendPartnershipRequest,
  updatePartnershipPolicy,
} from '../../../../lib/firmsApi'

function isStaffPortal(): boolean {
  try {
    return localStorage.getItem('portalRole') === 'lawyer'
  } catch { return false }
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.round(rating)
  return (
    <span className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= stars ? 'text-gold-400' : 'text-neutral-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-neutral-400 text-xs ml-0.5">{rating.toFixed(1)}</span>
    </span>
  )
}

function LawyerMiniCard({ lawyer, firmId, isStaff }: { lawyer: LawyerDiscovery; firmId: string; isStaff: boolean }) {
  const initials = lawyer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const fee = lawyer.consultation_fee ? `${parseFloat(lawyer.consultation_fee).toLocaleString()} XAF` : 'On request'
  const isStub = Boolean(lawyer.is_stub)

  return (
    <div className={`bg-primary-800/30 border rounded-xl p-4 transition-all duration-200 ${isStub ? 'border-neutral-700/20 opacity-75' : 'border-neutral-700/30 hover:border-gold-500/30'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-600/30 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-gold-300 text-xs font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-body-sm text-neutral-100 truncate">{lawyer.name}</p>
          <p className="text-gold-400/70 text-xs truncate">{lawyer.specialization}</p>
        </div>
        {isStub ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-700/40 text-neutral-500 border border-neutral-700/30 flex-shrink-0">Member</span>
        ) : lawyer.is_verified ? (
          <svg className="w-4 h-4 text-gold-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
        ) : null}
      </div>

      {!isStub && (
        <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
          <StarRating rating={lawyer.average_rating} />
          <span>{lawyer.years_of_experience}yr</span>
          <span className={lawyer.availability_status === 'available' ? 'text-emerald-400' : 'text-amber-400'}>
            {lawyer.availability_status === 'available' ? 'Available' : 'Busy'}
          </span>
        </div>
      )}

      {isStub ? (
        <p className="text-neutral-600 text-xs">No public lawyer profile set up yet.</p>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-gold-400 text-xs font-semibold">{fee}</span>
          <div className="flex gap-1.5">
            <Link href={isStaff ? `/lawyer/discover/lawyer/${lawyer.id}` : `/discover/lawyer/${lawyer.id}`} className="px-2.5 py-1 rounded-lg border border-neutral-600/40 text-neutral-400 text-xs hover:text-gold-400 transition-colors">
              Profile
            </Link>
            {!isStaff && (
              <Link
                href={`/book?kind=lawyer&id=${encodeURIComponent(lawyer.id)}&name=${encodeURIComponent(lawyer.name)}&fee=${lawyer.consultation_fee ?? ''}&firm_id=${firmId}`}
                className="px-2.5 py-1 rounded-lg bg-gold-500 text-black text-xs font-semibold hover:bg-gold-400 transition-colors"
              >
                Book
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PartnershipSection({
  firm,
  policy: initialPolicy,
  token,
  isOwnAdmin,
}: {
  firm: FirmDiscovery
  policy: PartnershipPolicy | null
  token: string
  isOwnAdmin: boolean
}) {
  const [policy, setPolicy] = useState<PartnershipPolicy | null>(initialPolicy)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Partial<PartnershipPolicy>>({})
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function startEdit() {
    setDraft({
      is_open: policy?.is_open ?? false,
      min_years_experience: policy?.min_years_experience ?? 0,
      requires_specialization_overlap: policy?.requires_specialization_overlap ?? false,
      revenue_share_percentage: policy?.revenue_share_percentage ?? '0',
      process_description: policy?.process_description ?? '',
      additional_requirements: policy?.additional_requirements ?? '',
    })
    setSaveErr('')
    setEditing(true)
  }

  async function savePolicy() {
    setSaving(true)
    setSaveErr('')
    try {
      const updated = await updatePartnershipPolicy(firm.id, draft, token)
      setPolicy(updated)
      setEditing(false)
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Failed to save')
    }
    setSaving(false)
  }

  async function handleSend() {
    setSending(true)
    setError('')
    try {
      await sendPartnershipRequest(firm.id, message, token)
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send request')
    }
    setSending(false)
  }

  // --- Admin edit panel ---
  if (isOwnAdmin && editing) {
    return (
      <div className="rounded-xl border border-gold-500/30 bg-primary-800/40 p-6 space-y-4" id="partnership">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-body-lg text-neutral-50">Edit Partnership Policy</h2>
          <button onClick={() => setEditing(false)} className="text-neutral-500 hover:text-neutral-300 text-xs">Cancel</button>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setDraft(d => ({ ...d, is_open: !d.is_open }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${draft.is_open ? 'bg-emerald-500' : 'bg-neutral-600'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${draft.is_open ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-sm text-neutral-200">{draft.is_open ? 'Open to partnership requests' : 'Not accepting partnerships'}</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Min. Years Experience Required</label>
            <input
              type="number" min={0} max={50}
              value={draft.min_years_experience ?? 0}
              onChange={e => setDraft(d => ({ ...d, min_years_experience: Number(e.target.value) }))}
              className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Revenue Share % (your firm&apos;s cut)</label>
            <input
              type="number" min={0} max={100}
              value={draft.revenue_share_percentage ?? 0}
              onChange={e => setDraft(d => ({ ...d, revenue_share_percentage: e.target.value }))}
              className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 focus:outline-none focus:border-gold-500/50"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.requires_specialization_overlap ?? false}
            onChange={e => setDraft(d => ({ ...d, requires_specialization_overlap: e.target.checked }))}
            className="w-4 h-4 accent-gold-500"
          />
          <span className="text-sm text-neutral-200">Require specialization overlap</span>
        </label>

        <div>
          <label className="text-xs text-neutral-400 block mb-1">Partnership Process (optional)</label>
          <textarea
            value={draft.process_description ?? ''}
            onChange={e => setDraft(d => ({ ...d, process_description: e.target.value }))}
            rows={3}
            placeholder="Describe how partnerships work at your firm…"
            className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50"
          />
        </div>

        <div>
          <label className="text-xs text-neutral-400 block mb-1">Additional Requirements (optional)</label>
          <textarea
            value={draft.additional_requirements ?? ''}
            onChange={e => setDraft(d => ({ ...d, additional_requirements: e.target.value }))}
            rows={2}
            placeholder="Any other requirements for partners…"
            className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50"
          />
        </div>

        {saveErr && <p className="text-crimson-400 text-xs">{saveErr}</p>}
        <button
          onClick={savePolicy}
          disabled={saving}
          className="px-5 py-2 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Policy'}
        </button>
      </div>
    )
  }

  // --- View for own admin (not editing) ---
  if (isOwnAdmin) {
    return (
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6 space-y-4" id="partnership">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-body-lg text-neutral-50">Partnership Policy</h2>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${policy?.is_open ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              {policy?.is_open ? 'Open to Partners' : 'Closed'}
            </span>
            <button
              onClick={startEdit}
              className="text-xs px-3 py-1 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 hover:bg-gold-500/20 transition-colors"
            >
              Edit Policy
            </button>
          </div>
        </div>
        {!policy ? (
          <p className="text-neutral-500 text-sm">No policy set yet. Click &quot;Edit Policy&quot; to configure your partnership settings.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg bg-primary-900/40 p-3">
              <p className="text-neutral-500 text-xs mb-1">Min. Experience Required</p>
              <p className="text-neutral-100 font-semibold">{policy.min_years_experience} years</p>
            </div>
            <div className="rounded-lg bg-primary-900/40 p-3">
              <p className="text-neutral-500 text-xs mb-1">Specialization Overlap</p>
              <p className="text-neutral-100 font-semibold">{policy.requires_specialization_overlap ? 'Required' : 'Not required'}</p>
            </div>
            <div className="rounded-lg bg-primary-900/40 p-3">
              <p className="text-neutral-500 text-xs mb-1">Revenue Share (Our cut)</p>
              <p className="text-neutral-100 font-semibold">{policy.revenue_share_percentage}%</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // --- View for other staff (read-only + request form) ---
  if (!policy) {
    return (
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6" id="partnership">
        <h2 className="font-heading text-body-lg text-neutral-50 mb-2">Partnership</h2>
        <p className="text-neutral-500 text-sm">This firm has not published a partnership policy yet.</p>
      </div>
    )
  }

  if (!policy.is_open) {
    return (
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6" id="partnership">
        <h2 className="font-heading text-body-lg text-neutral-50 mb-2">Partnership</h2>
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          This firm is not currently accepting partnership requests.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6 space-y-4" id="partnership">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-body-lg text-neutral-50">Partnership Policy</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">Open to Partners</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg bg-primary-900/40 p-3">
          <p className="text-neutral-500 text-xs mb-1">Min. Experience Required</p>
          <p className="text-neutral-100 font-semibold">{policy.min_years_experience} years</p>
        </div>
        <div className="rounded-lg bg-primary-900/40 p-3">
          <p className="text-neutral-500 text-xs mb-1">Specialization Overlap</p>
          <p className="text-neutral-100 font-semibold">{policy.requires_specialization_overlap ? 'Required' : 'Not required'}</p>
        </div>
        <div className="rounded-lg bg-primary-900/40 p-3">
          <p className="text-neutral-500 text-xs mb-1">Revenue Share (Our cut)</p>
          <p className="text-neutral-100 font-semibold">{policy.revenue_share_percentage}%</p>
        </div>
      </div>

      {policy.process_description && (
        <div>
          <p className="text-neutral-500 text-xs mb-1">Partnership Process</p>
          <p className="text-neutral-300 text-sm whitespace-pre-line">{policy.process_description}</p>
        </div>
      )}
      {policy.additional_requirements && (
        <div>
          <p className="text-neutral-500 text-xs mb-1">Additional Requirements</p>
          <p className="text-neutral-300 text-sm">{policy.additional_requirements}</p>
        </div>
      )}

      {sent ? (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-400 text-sm">
          Partnership request sent successfully. {firm.name} will review your request.
        </div>
      ) : (
        <div className="space-y-3 border-t border-neutral-700/30 pt-4">
          <h3 className="text-neutral-200 text-sm font-medium">Request Partnership</h3>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={`Introduce your firm and explain why you'd like to partner with ${firm.name}…`}
            rows={4}
            className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50"
          />
          {error && <p className="text-crimson-400 text-xs">{error}</p>}
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="px-5 py-2 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors"
          >
            {sending ? 'Sending…' : 'Send Partnership Request'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function FirmDetailPage() {
  const params = useParams<{ id: string }>()
  const [firm, setFirm] = useState<FirmDiscovery & { member_count?: number } | null>(null)
  const [lawyers, setLawyers] = useState<LawyerDiscovery[]>([])
  const [policy, setPolicy] = useState<PartnershipPolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isStaff, setIsStaff] = useState(false)
  const [isOwnAdmin, setIsOwnAdmin] = useState(false)
  const [token, setToken] = useState('')
  const partnershipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const run = async () => {
      const tk = localStorage.getItem('access') ?? ''
      setToken(tk)
      setIsStaff(isStaffPortal())

      try {
        const [firmData, lawyersData, policyData, membershipsData] = await Promise.allSettled([
          api.get<FirmDiscovery & { member_count?: number }>('firms', `/${params.id}/`, tk || null),
          getFirmLawyers(params.id, tk || null),
          tk ? getPartnershipPolicy(Number(params.id), tk) : Promise.reject('no token'),
          tk ? getMyFirmMemberships(tk) : Promise.reject('no token'),
        ])
        if (firmData.status === 'fulfilled') setFirm(firmData.value)
        else throw new Error('Firm not found')
        if (lawyersData.status === 'fulfilled') setLawyers(Array.isArray(lawyersData.value) ? lawyersData.value : [])
        if (policyData.status === 'fulfilled') setPolicy(policyData.value)
        if (membershipsData.status === 'fulfilled') {
          const myMems = membershipsData.value ?? []
          const adminOfThisFirm = myMems.some(
            m => String(m.firm) === params.id && ['owner', 'firm_admin'].includes(m.role)
          )
          setIsOwnAdmin(adminOfThisFirm)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load firm')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) void run()
  }, [params.id])

  // scroll to #partnership anchor if hash in URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#partnership' && partnershipRef.current) {
      partnershipRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [loading])

  if (loading) return (
    <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
      <div className="h-40 rounded-xl bg-primary-800/30" />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-primary-800/30" />)}
      </div>
    </div>
  )

  if (error || !firm) return (
    <div className="max-w-5xl mx-auto">
      <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 p-6 text-crimson-300">
        {error || 'Firm not found.'}
      </div>
      <Link href={isStaffPortal() ? '/lawyer/discover' : '/discover'} className="mt-4 inline-block text-gold-400 hover:text-gold-300">← Back to Discover</Link>
    </div>
  )

  const initials = firm.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const availableLawyers = lawyers.filter(l => l.availability_status === 'available')
  const specializations = firm.specializations?.length
    ? firm.specializations
    : [...new Set(lawyers.map(l => l.specialization).filter(Boolean))]
  const avgFee = lawyers.length > 0
    ? lawyers.filter(l => l.consultation_fee).reduce((sum, l) => sum + parseFloat(l.consultation_fee!), 0) / (lawyers.filter(l => l.consultation_fee).length || 1)
    : null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href={isStaff ? '/lawyer/discover' : '/discover'} className="inline-flex items-center gap-2 text-neutral-400 hover:text-gold-400 text-sm transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        Back to Discover
      </Link>

      {/* Firm Header */}
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {firm.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={firm.logo_url} alt={firm.name} className="h-20 w-20 rounded-xl object-cover border border-neutral-700/30 flex-shrink-0" />
          ) : (
            <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-primary-600/50 to-primary-700/50 border border-neutral-700/30 flex items-center justify-center flex-shrink-0">
              <span className="text-neutral-300 text-2xl font-bold">{initials}</span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-display text-display-sm text-neutral-50 mb-1">{firm.name}</h1>
            {firm.description && <p className="text-neutral-400 text-sm mb-2">{firm.description}</p>}

            {/* Contact / location row */}
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-neutral-500 mb-3">
              {(firm.city || firm.country) && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {[firm.office_address, firm.city, firm.country].filter(Boolean).join(', ')}
                </span>
              )}
              {firm.phone && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  {firm.phone}
                </span>
              )}
              {firm.contact_email && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  {firm.contact_email}
                </span>
              )}
              {firm.website && (
                <a href={firm.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-gold-400 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/></svg>
                  Website
                </a>
              )}
              {firm.year_established && <span>Est. {firm.year_established}</span>}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
              <span>{firm.member_count ?? lawyers.length} active members</span>
              {availableLawyers.length > 0 && <span className="text-emerald-400">{availableLawyers.length} available now</span>}
              {avgFee && <span>Avg. fee: {Math.round(avgFee).toLocaleString()} XAF</span>}
            </div>
          </div>

          {/* CTA */}
          {isOwnAdmin ? (
            <Link
              href="/lawyer/team"
              className="px-5 py-2.5 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 font-semibold text-sm hover:bg-gold-500/20 transition-colors flex-shrink-0"
            >
              Manage Firm
            </Link>
          ) : isStaff ? (
            <a
              href="#partnership"
              onClick={() => partnershipRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-5 py-2.5 rounded-lg bg-primary-600/60 border border-neutral-600/50 hover:bg-primary-600 text-neutral-200 font-semibold text-sm transition-colors flex-shrink-0 cursor-pointer"
            >
              Request Partnership
            </a>
          ) : (
            <Link
              href={`/book?kind=firm&id=${firm.id}&name=${encodeURIComponent(firm.name)}`}
              className="px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors flex-shrink-0"
            >
              Book with Firm
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: firm.member_count ?? lawyers.length },
          { label: 'Available Now', value: availableLawyers.length },
          { label: 'Practice Areas', value: specializations.length },
          { label: 'Avg. Consultation Fee', value: avgFee ? `${Math.round(avgFee).toLocaleString()} XAF` : 'Varies' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-neutral-700/30 bg-primary-800/30 p-4 text-center">
            <p className="text-xl font-bold text-gold-400">{stat.value}</p>
            <p className="text-neutral-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Practice Areas */}
      {specializations.length > 0 && (
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
          <h2 className="font-heading text-body-lg text-neutral-50 mb-3">Areas of Practice</h2>
          <div className="flex flex-wrap gap-2">
            {specializations.map(s => (
              <span key={s} className="px-3 py-1 rounded-full border border-neutral-700/40 bg-primary-800/40 text-neutral-300 text-xs">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="space-y-4">
        <h2 className="font-display text-display-xs text-neutral-50">Our Team ({lawyers.length})</h2>
        {lawyers.length === 0 ? (
          <div className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-8 text-center text-neutral-400">
            No team members found for this firm yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lawyers.map(lawyer => (
              <LawyerMiniCard key={lawyer.id} lawyer={lawyer} firmId={String(firm.id)} isStaff={isStaff} />
            ))}
          </div>
        )}
      </div>

      {/* Partnership — shown to own firm admins (to edit policy) and other staff (to request) */}
      {(isStaff || isOwnAdmin) && token && (
        <div ref={partnershipRef}>
          <PartnershipSection firm={firm} policy={policy} token={token} isOwnAdmin={isOwnAdmin} />
        </div>
      )}

      {/* Reviews placeholder */}
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
        <h2 className="font-heading text-body-lg text-neutral-50 mb-3">Client Reviews</h2>
        <p className="text-neutral-500 text-sm">Reviews are collected from completed consultations and will appear here.</p>
      </div>
    </div>
  )
}
