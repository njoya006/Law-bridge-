'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../../lib/api'
import { getFirmLawyers, type LawyerDiscovery } from '../../../../lib/discoveryApi'
import {
  type FirmDiscovery,
  type PartnershipPolicy,
  type FirmGalleryImage,
  getPartnershipPolicy,
  getMyFirmMemberships,
  sendPartnershipRequest,
  updatePartnershipPolicy,
  getFirmGallery,
} from '../../../../lib/firmsApi'

function isStaffPortal(): boolean {
  try { return localStorage.getItem('portalRole') === 'lawyer' } catch { return false }
}

function StarRating({ rating }: { rating: number | string }) {
  const r = Number(rating) || 0
  const full = Math.floor(r)
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= full ? 'text-gold-400' : 'text-neutral-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-neutral-500 text-xs ml-0.5">{r.toFixed(1)}</span>
    </span>
  )
}

function LawyerCard({ lawyer, firmId, isStaff }: { lawyer: LawyerDiscovery; firmId: string; isStaff: boolean }) {
  const initials = (lawyer.name || '?').split(' ').map((w: string) => w[0] ?? '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
  const fee = lawyer.consultation_fee ? `${parseFloat(lawyer.consultation_fee).toLocaleString()} XAF` : 'On request'
  const isStub = Boolean(lawyer.is_stub)

  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${isStub ? 'border-neutral-700/20 bg-primary-800/20 opacity-75' : 'border-white/8 bg-primary-800/30 hover:border-gold-500/25 hover:bg-primary-800/50'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-600/20 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-gold-300 text-xs font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-sm text-neutral-100 truncate">{lawyer.name}</p>
          <p className="text-gold-400/70 text-xs truncate mt-0.5">{lawyer.specialization || '—'}</p>
        </div>
        {!isStub && lawyer.is_verified && (
          <svg className="w-4 h-4 text-gold-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      {!isStub && (
        <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
          <StarRating rating={lawyer.average_rating} />
          <span>{lawyer.years_of_experience}yr exp</span>
          <span className={lawyer.availability_status === 'available' ? 'text-emerald-400' : 'text-amber-400'}>
            {lawyer.availability_status === 'available' ? '● Available' : '● Busy'}
          </span>
        </div>
      )}

      {isStub ? (
        <p className="text-neutral-600 text-xs">No public profile set up yet.</p>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-gold-400 text-xs font-semibold">{fee}</span>
          <div className="flex gap-1.5">
            <Link
              href={isStaff ? `/lawyer/discover/lawyer/${lawyer.id}` : `/discover/lawyer/${lawyer.id}`}
              className="px-2.5 py-1 rounded-lg border border-neutral-600/40 text-neutral-400 text-xs hover:text-gold-400 transition-colors"
            >
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
  firm, policy: initialPolicy, token, isOwnAdmin,
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

  const inputCls = 'w-full rounded-lg px-3 py-2.5 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50 text-sm'

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
    setSaving(true); setSaveErr('')
    try {
      const updated = await updatePartnershipPolicy(firm.id, draft, token)
      setPolicy(updated); setEditing(false)
    } catch (e) { setSaveErr(e instanceof Error ? e.message : 'Failed to save') }
    setSaving(false)
  }

  async function handleSend() {
    setSending(true); setError('')
    try {
      await sendPartnershipRequest(firm.id, message, token)
      setSent(true)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to send request') }
    setSending(false)
  }

  if (isOwnAdmin && editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-wider text-neutral-600">Edit Partnership Policy</p>
          <button onClick={() => setEditing(false)} className="text-neutral-500 hover:text-neutral-300 text-xs">Cancel</button>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div onClick={() => setDraft(d => ({ ...d, is_open: !d.is_open }))}
            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${draft.is_open ? 'bg-emerald-500' : 'bg-neutral-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${draft.is_open ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-sm text-neutral-200">{draft.is_open ? 'Open to partnership requests' : 'Not accepting partnerships'}</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Min. Years Experience</label>
            <input type="number" min={0} max={50} value={draft.min_years_experience ?? 0}
              onChange={e => setDraft(d => ({ ...d, min_years_experience: Number(e.target.value) }))}
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Revenue Share % (firm's cut)</label>
            <input type="number" min={0} max={100} value={draft.revenue_share_percentage ?? 0}
              onChange={e => setDraft(d => ({ ...d, revenue_share_percentage: e.target.value }))}
              className={inputCls} />
          </div>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={draft.requires_specialization_overlap ?? false}
            onChange={e => setDraft(d => ({ ...d, requires_specialization_overlap: e.target.checked }))}
            className="w-4 h-4 accent-gold-500" />
          <span className="text-sm text-neutral-200">Require specialization overlap</span>
        </label>
        <div>
          <label className="text-xs text-neutral-500 block mb-1">Partnership Process</label>
          <textarea value={draft.process_description ?? ''} onChange={e => setDraft(d => ({ ...d, process_description: e.target.value }))}
            rows={3} placeholder="Describe how partnerships work at your firm…"
            className={`${inputCls} resize-none`} />
        </div>
        <div>
          <label className="text-xs text-neutral-500 block mb-1">Additional Requirements</label>
          <textarea value={draft.additional_requirements ?? ''} onChange={e => setDraft(d => ({ ...d, additional_requirements: e.target.value }))}
            rows={2} placeholder="Any other requirements for partners…"
            className={`${inputCls} resize-none`} />
        </div>
        {saveErr && <p className="text-crimson-400 text-xs">{saveErr}</p>}
        <button onClick={savePolicy} disabled={saving}
          className="px-5 py-2 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Save Policy'}
        </button>
      </div>
    )
  }

  if (isOwnAdmin) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${policy?.is_open ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
            {policy?.is_open ? '● Open to Partners' : '● Closed'}
          </span>
          <button onClick={startEdit} className="text-xs px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 hover:bg-gold-500/20 transition-colors">
            Edit Policy
          </button>
        </div>
        {!policy ? (
          <p className="text-neutral-500 text-sm">No policy set yet. Click &quot;Edit Policy&quot; to configure your partnership settings.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Min. Experience', value: `${policy.min_years_experience} years` },
              { label: 'Specialization Overlap', value: policy.requires_specialization_overlap ? 'Required' : 'Not required' },
              { label: 'Revenue Share', value: `${policy.revenue_share_percentage}%` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-primary-900/40 border border-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-1">{label}</p>
                <p className="text-sm text-neutral-100 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!policy) {
    return <p className="text-neutral-500 text-sm">This firm has not published a partnership policy yet.</p>
  }

  if (!policy.is_open) {
    return (
      <div className="flex items-center gap-2 text-amber-400 text-sm">
        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
        This firm is not currently accepting partnership requests.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <span className="inline-flex text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">● Open to Partners</span>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Min. Experience', value: `${policy.min_years_experience} years` },
          { label: 'Specialization Overlap', value: policy.requires_specialization_overlap ? 'Required' : 'Not required' },
          { label: 'Revenue Share', value: `${policy.revenue_share_percentage}%` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-primary-900/40 border border-white/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-1">{label}</p>
            <p className="text-sm text-neutral-100 font-semibold">{value}</p>
          </div>
        ))}
      </div>
      {policy.process_description && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-1">Partnership Process</p>
          <p className="text-neutral-300 text-sm whitespace-pre-line">{policy.process_description}</p>
        </div>
      )}
      {policy.additional_requirements && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-1">Additional Requirements</p>
          <p className="text-neutral-300 text-sm">{policy.additional_requirements}</p>
        </div>
      )}
      {sent ? (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-400 text-sm">
          Partnership request sent. {firm.name} will review your request.
        </div>
      ) : (
        <div className="space-y-3 border-t border-white/6 pt-4">
          <p className="text-sm font-medium text-neutral-200">Send Partnership Request</p>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
            placeholder={`Introduce your firm and explain why you'd like to partner with ${firm.name}…`}
            className="w-full rounded-xl bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-600 focus:outline-none focus:border-gold-500/50"
          />
          {error && <p className="text-crimson-400 text-xs">{error}</p>}
          <button onClick={handleSend} disabled={sending || !message.trim()}
            className="px-5 py-2 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors">
            {sending ? 'Sending…' : 'Send Partnership Request'}
          </button>
        </div>
      )}
    </div>
  )
}

type FirmWithCount = FirmDiscovery & { member_count?: number }
type FirmTab = 'team' | 'about' | 'partnership' | 'gallery'

export default function FirmDetailPage() {
  const params = useParams<{ id: string }>()
  const [firm, setFirm] = useState<FirmWithCount | null>(null)
  const [lawyers, setLawyers] = useState<LawyerDiscovery[]>([])
  const [policy, setPolicy] = useState<PartnershipPolicy | null>(null)
  const [gallery, setGallery] = useState<FirmGalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isStaff, setIsStaff] = useState(false)
  const [isOwnAdmin, setIsOwnAdmin] = useState(false)
  const [token, setToken] = useState('')
  const [activeTab, setActiveTab] = useState<FirmTab>('team')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const partnershipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const run = async () => {
      const tk = localStorage.getItem('access') ?? ''
      setToken(tk)
      setIsStaff(isStaffPortal())

      try {
        const [firmData, lawyersData, policyData, membershipsData, galleryData] = await Promise.allSettled([
          api.get<FirmWithCount>('firms', `/${params.id}/`, tk || null),
          getFirmLawyers(params.id, tk || null),
          tk ? getPartnershipPolicy(Number(params.id), tk) : Promise.reject('no token'),
          tk ? getMyFirmMemberships(tk) : Promise.reject('no token'),
          getFirmGallery(Number(params.id), tk || null),
        ])
        if (firmData.status === 'fulfilled') setFirm(firmData.value)
        else throw new Error('Firm not found')
        if (lawyersData.status === 'fulfilled') setLawyers(Array.isArray(lawyersData.value) ? lawyersData.value : [])
        if (policyData.status === 'fulfilled') setPolicy(policyData.value)
        if (membershipsData.status === 'fulfilled') {
          const myMems = membershipsData.value ?? []
          setIsOwnAdmin(myMems.some(m => String(m.firm) === params.id && ['owner', 'firm_admin'].includes(m.role)))
        }
        if (galleryData.status === 'fulfilled') setGallery(Array.isArray(galleryData.value) ? galleryData.value : [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load firm')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) void run()
  }, [params.id])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#partnership' && partnershipRef.current) {
      partnershipRef.current.scrollIntoView({ behavior: 'smooth' })
      setActiveTab('partnership')
    }
  }, [loading])

  if (loading) return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="h-8 w-32 rounded-lg bg-primary-800/30" />
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr_260px] gap-5">
        <div className="space-y-4">
          <div className="h-72 rounded-2xl bg-primary-800/30" />
          <div className="h-32 rounded-2xl bg-primary-800/30" />
        </div>
        <div className="space-y-4">
          <div className="h-48 rounded-2xl bg-primary-800/30" />
          <div className="h-64 rounded-2xl bg-primary-800/30" />
        </div>
        <div className="hidden xl:block space-y-4">
          <div className="h-48 rounded-2xl bg-primary-800/30" />
          <div className="h-32 rounded-2xl bg-primary-800/30" />
        </div>
      </div>
    </div>
  )

  if (error || !firm) return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 p-6 text-crimson-300">{error || 'Firm not found.'}</div>
      <Link href={isStaffPortal() ? '/lawyer/discover' : '/discover'} className="inline-block text-gold-400 hover:text-gold-300 text-sm">← Back to Discover</Link>
    </div>
  )

  const initials = (firm.name || '?').split(' ').map((w: string) => w[0] ?? '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
  const availableLawyers = lawyers.filter(l => l.availability_status === 'available')
  const specializations = firm.specializations?.length
    ? firm.specializations
    : [...new Set(lawyers.map(l => l.specialization).filter(Boolean))]
  const avgFee = lawyers.filter(l => l.consultation_fee).length > 0
    ? lawyers.filter(l => l.consultation_fee).reduce((s, l) => s + parseFloat(l.consultation_fee!), 0) / lawyers.filter(l => l.consultation_fee).length
    : null
  const memberCount = firm.member_count ?? lawyers.length

  const tabs: { id: FirmTab; label: string; count?: number }[] = [
    { id: 'team', label: 'Team', count: lawyers.length },
    { id: 'about', label: 'About & Practice Areas' },
    ...(gallery.length > 0 ? [{ id: 'gallery' as FirmTab, label: 'Gallery', count: gallery.length }] : []),
    ...(isStaff || isOwnAdmin ? [{ id: 'partnership' as FirmTab, label: 'Partnership' }] : []),
  ]

  return (
    <div className="max-w-6xl mx-auto w-full">
      <Link
        href={isStaff ? '/lawyer/discover' : '/discover'}
        className="inline-flex items-center gap-1.5 text-neutral-500 hover:text-gold-400 text-sm transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Back to Discover
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr_260px] items-start gap-5">

        {/* ═══ LEFT PANEL ═══ */}
        <aside className="lg:sticky lg:top-4 space-y-4">
          {/* Firm identity card */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-6">
            {/* Logo / initials */}
            <div className="flex flex-col items-center text-center gap-4">
              {firm.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firm.logo_url} alt={firm.name} className="h-20 w-20 rounded-2xl object-cover border border-white/10" />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-600/50 to-primary-700/40 border border-white/10 flex items-center justify-center">
                  <span className="text-neutral-200 text-2xl font-bold font-display">{initials}</span>
                </div>
              )}

              <div>
                <h1 className="font-display text-xl font-semibold text-neutral-50 leading-snug">{firm.name}</h1>
                {firm.year_established && (
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-neutral-700/40 bg-neutral-800/40 px-2.5 py-0.5 text-[11px] text-neutral-500">
                    Est. {firm.year_established}
                  </span>
                )}
              </div>

              {/* Partnership status */}
              {(isStaff || isOwnAdmin) && (
                <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold ${policy?.is_open ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-neutral-700/30 border-neutral-700/40 text-neutral-500'}`}>
                  {policy?.is_open ? '● Open to Partners' : '● Not Accepting Partners'}
                </span>
              )}

              {/* CTA */}
              {isOwnAdmin ? (
                <Link href="/lawyer/team" className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2.5 text-sm font-semibold text-gold-400 hover:bg-gold-500/20 transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  Manage Firm
                </Link>
              ) : isStaff ? (
                <button
                  onClick={() => { setActiveTab('partnership'); partnershipRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-600/50 bg-primary-700/40 hover:bg-primary-600/50 px-4 py-2.5 text-sm font-semibold text-neutral-200 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  Request Partnership
                </button>
              ) : (
                <Link
                  href={`/book?kind=firm&id=${firm.id}&name=${encodeURIComponent(firm.name)}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gold-500 hover:bg-gold-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Book with Firm
                </Link>
              )}
            </div>

            {/* Contact info */}
            <div className="mt-5 pt-4 border-t border-white/6 space-y-3">
              {(firm.city || firm.country) && (
                <div className="flex items-start gap-2.5">
                  <svg className="mt-0.5 flex-shrink-0 text-neutral-600" width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-600">Location</p>
                    <p className="text-xs text-neutral-300">{[firm.office_address, firm.city, firm.country].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
              )}
              {firm.contact_email && (
                <div className="flex items-start gap-2.5">
                  <svg className="mt-0.5 flex-shrink-0 text-neutral-600" width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-600">Email</p>
                    <p className="text-xs text-neutral-300 truncate">{firm.contact_email}</p>
                  </div>
                </div>
              )}
              {firm.phone && (
                <div className="flex items-start gap-2.5">
                  <svg className="mt-0.5 flex-shrink-0 text-neutral-600" width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-600">Phone</p>
                    <p className="text-xs text-neutral-300">{firm.phone}</p>
                  </div>
                </div>
              )}
              {firm.website && (
                <div className="flex items-start gap-2.5">
                  <svg className="mt-0.5 flex-shrink-0 text-neutral-600" width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-600">Website</p>
                    <a href={firm.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-400/80 hover:text-gold-400 truncate block transition-colors">{firm.website.replace(/^https?:\/\//, '')}</a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Availability summary */}
          {availableLawyers.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">{availableLawyers.length} available now</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">Ready to take on new matters</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ═══ CENTER PANEL ═══ */}
        <main className="min-w-0 space-y-5">
          {/* Stats row — visible below XL */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 xl:hidden">
            {[
              { label: 'Team Members', value: memberCount, color: 'text-gold-400' },
              { label: 'Available Now', value: availableLawyers.length, color: 'text-emerald-400' },
              { label: 'Practice Areas', value: specializations.length, color: 'text-primary-400' },
              { label: 'Avg. Fee (XAF)', value: avgFee ? `${Math.round(avgFee).toLocaleString()}` : '—', color: 'text-neutral-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-white/8 bg-primary-800/40 p-3 text-center">
                <p className={`text-xl font-bold tabular-nums font-display ${color}`}>{value}</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/40 overflow-hidden" ref={partnershipRef}>
            <div className="flex border-b border-white/6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'text-gold-400 border-b-2 border-gold-500 bg-gold-500/5'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-gold-500/20 text-gold-400' : 'bg-neutral-700/50 text-neutral-500'}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* TEAM TAB */}
              {activeTab === 'team' && (
                lawyers.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-neutral-500 text-sm">No team members found for this firm yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {lawyers.map(lawyer => (
                      <LawyerCard key={lawyer.id} lawyer={lawyer} firmId={String(firm.id)} isStaff={isStaff} />
                    ))}
                  </div>
                )
              )}

              {/* ABOUT TAB */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  {firm.description && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-2">About</p>
                      <p className="text-neutral-300 text-sm leading-relaxed">{firm.description}</p>
                    </div>
                  )}

                  {specializations.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-3">Areas of Practice</p>
                      <div className="flex flex-wrap gap-2">
                        {specializations.map(s => (
                          <span key={s} className="px-3 py-1.5 rounded-full border border-neutral-700/40 bg-primary-900/50 text-neutral-300 text-xs">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!firm.description && specializations.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 text-sm">No additional information available for this firm.</p>
                    </div>
                  )}

                  {/* Client reviews placeholder */}
                  <div className="border-t border-white/6 pt-5">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-2">Client Reviews</p>
                    <p className="text-neutral-600 text-sm">Reviews are collected from completed consultations and will appear here.</p>
                  </div>
                </div>
              )}

              {/* GALLERY TAB */}
              {activeTab === 'gallery' && (
                gallery.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-neutral-500 text-sm">No gallery photos available for this firm.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {gallery.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setLightboxIndex(idx)}
                        className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-primary-900/50 border border-white/8 hover:border-white/20 transition-all"
                      >
                        <img
                          src={`/api/v1/firms/gallery/${img.id}/`}
                          alt={img.caption || `${firm.name} photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {img.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-white/80 truncate">{img.caption}</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )
              )}

              {/* PARTNERSHIP TAB */}
              {activeTab === 'partnership' && (isStaff || isOwnAdmin) && token && (
                <PartnershipSection firm={firm} policy={policy} token={token} isOwnAdmin={isOwnAdmin} />
              )}
            </div>
          </div>
        </main>

        {/* ═══ RIGHT PANEL ═══ — XL only */}
        <aside className="hidden xl:block space-y-4">
          {/* Stats */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-5">
            <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-4">Firm Overview</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Members', value: memberCount, color: 'text-gold-400' },
                { label: 'Available', value: availableLawyers.length, color: 'text-emerald-400' },
                { label: 'Practice Areas', value: specializations.length, color: 'text-primary-400' },
                { label: 'Avg Fee', value: avgFee ? `${Math.round(avgFee / 1000)}K` : '—', color: 'text-neutral-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl bg-primary-900/50 border border-white/5 p-3 text-center">
                  <p className={`text-2xl font-bold tabular-nums font-display ${color}`}>{value}</p>
                  <p className="text-[10px] text-neutral-600 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick facts */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-5 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-neutral-600">Quick Facts</p>
            {firm.year_established && (
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 flex-shrink-0" />
                <p className="text-xs text-neutral-400">Founded in <span className="text-neutral-200">{firm.year_established}</span></p>
              </div>
            )}
            {(firm.city || firm.country) && (
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 flex-shrink-0" />
                <p className="text-xs text-neutral-400">Based in <span className="text-neutral-200">{[firm.city, firm.country].filter(Boolean).join(', ')}</span></p>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 flex-shrink-0" />
              <p className="text-xs text-neutral-400"><span className="text-neutral-200">{memberCount}</span> active member{memberCount !== 1 ? 's' : ''}</p>
            </div>
            {avgFee && (
              <div className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-700 flex-shrink-0" />
                <p className="text-xs text-neutral-400">Avg. fee <span className="text-neutral-200">{Math.round(avgFee).toLocaleString()} XAF</span></p>
              </div>
            )}
          </div>

          {/* Partnership status highlight */}
          {(isStaff || isOwnAdmin) && (
            <div className={`rounded-2xl border p-5 ${policy?.is_open ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-neutral-700/40 bg-primary-800/30'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${policy?.is_open ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700/30 text-neutral-500'}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${policy?.is_open ? 'text-emerald-300' : 'text-neutral-400'}`}>
                    {policy?.is_open ? 'Accepting Partners' : 'Partnerships Closed'}
                  </p>
                  {policy?.is_open && policy.min_years_experience > 0 && (
                    <p className="text-[11px] text-neutral-500 mt-0.5">Min. {policy.min_years_experience}yr experience required</p>
                  )}
                  {!isOwnAdmin && policy?.is_open && (
                    <button
                      onClick={() => { setActiveTab('partnership'); partnershipRef.current?.scrollIntoView({ behavior: 'smooth' }) }}
                      className="mt-2 text-[11px] font-semibold text-gold-400 hover:text-gold-300 transition-colors"
                    >
                      Send request →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && gallery[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxIndex(null)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i ?? 0) - 1) }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
          {lightboxIndex < gallery.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i ?? 0) + 1) }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
          <div onClick={e => e.stopPropagation()} className="max-w-4xl max-h-[80vh] flex flex-col items-center gap-3">
            <img
              src={`/api/v1/firms/gallery/${gallery[lightboxIndex].id}/`}
              alt={gallery[lightboxIndex].caption || `${firm?.name ?? ''} photo`}
              className="max-w-full max-h-[72vh] rounded-xl object-contain"
            />
            {gallery[lightboxIndex].caption && (
              <p className="text-white/60 text-sm text-center">{gallery[lightboxIndex].caption}</p>
            )}
            <p className="text-white/30 text-xs">{lightboxIndex + 1} / {gallery.length}</p>
          </div>
        </div>
      )}
    </div>
  )
}
