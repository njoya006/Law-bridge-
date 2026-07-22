'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  getMyFirmVerificationStatus,
  submitFirmVerificationRequest,
  FIRM_TYPE_LABELS,
  type FirmVerificationRequest,
  type FirmType,
} from '../../../../lib/verificationApi'
import { getMyFirmMemberships, getFirmGallery, deleteFirmGalleryImage, type FirmGalleryImage } from '../../../../lib/firmsApi'
import { uploadFirmGalleryImage, validateImageFile } from '../../../../lib/avatarApi'
import { CheckIcon, ClockIcon } from '../../../../components/icons/Icons'

const FIRM_TYPES = Object.entries(FIRM_TYPE_LABELS) as [FirmType, string][]

const ALLOWED_ROLES = ['owner', 'firm_admin', 'secretary']

const BENEFITS = [
  {
    title: 'Verified firm badge',
    desc: 'Gold checkmark on your firm profile, in all search results, and on your lawyers\' individual profiles',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" />,
    extra: <polyline points="9 12 11 14 15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  },
  {
    title: 'Priority discovery ranking',
    desc: 'Verified firms appear above unverified in every browse, filter, and search page across LawBridge',
    icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />,
    extra: null,
  },
  {
    title: 'Client trust & booking rate',
    desc: 'Clients book verified firms significantly more — the badge signals your practice is legitimate and reviewed',
    icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" /></>,
    extra: null,
  },
  {
    title: 'Premium & regulated case access',
    desc: 'High-value cases and government-regulated matters are matched exclusively to verified firms',
    icon: <><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
    extra: null,
  },
  {
    title: 'Attract top legal talent',
    desc: 'Lawyers prefer joining verified firms — it signals a credible, professional practice environment',
    icon: <><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.5" /><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" /></>,
    extra: null,
  },
  {
    title: 'Partnership advantages',
    desc: 'Verified firms are prioritised in inter-firm partnership requests and the LawBridge Founding Network',
    icon: <><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" /><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></>,
    extra: null,
  },
]

function StatusBanner({ request, isVerified }: { request: FirmVerificationRequest | null; isVerified: boolean }) {
  if (isVerified) {
    return (
      <div className="rounded-2xl bg-emerald-500/8 border border-emerald-500/20 p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <CheckIcon width={18} height={18} className="text-emerald-400" />
        </div>
        <div>
          <p className="font-semibold text-emerald-400">Firm Verified</p>
          <p className="text-sm text-white/50 mt-0.5">Your firm displays the verified badge and is prioritised in search results.</p>
        </div>
      </div>
    )
  }
  if (!request) return null
  if (request.status === 'pending') {
    return (
      <div className="rounded-2xl bg-amber-500/8 border border-amber-500/20 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
          <ClockIcon width={18} height={18} className="text-amber-400" />
        </div>
        <div>
          <p className="font-semibold text-amber-400">Under Review</p>
          <p className="text-sm text-white/50 mt-0.5">
            Submitted {new Date(request.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
            Our team will review your firm&apos;s details within 3–5 business days.
          </p>
        </div>
      </div>
    )
  }
  if (request.status === 'rejected') {
    return (
      <div className="rounded-2xl bg-crimson-500/8 border border-crimson-500/20 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-crimson-500/15 border border-crimson-500/30 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-crimson-400">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-crimson-400">Request Rejected</p>
          {request.rejection_reason && (
            <p className="text-sm text-white/50 mt-0.5">Reason: {request.rejection_reason}</p>
          )}
          <p className="text-xs text-white/35 mt-1">You may correct the details and resubmit below.</p>
        </div>
      </div>
    )
  }
  return null
}

export default function FirmVerifyPage() {
  const [loading, setLoading] = useState(true)
  const [myRole, setMyRole] = useState<string | null>(null)
  const [firmId, setFirmId] = useState<number | null>(null)
  const [noFirm, setNoFirm] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [existingRequest, setExistingRequest] = useState<FirmVerificationRequest | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [registrationNumber, setRegistrationNumber] = useState('')
  const [firmType, setFirmType] = useState<FirmType>('partnership')
  const [foundingYear, setFoundingYear] = useState('')
  const [numberOfPartners, setNumberOfPartners] = useState('1')
  const [notes, setNotes] = useState('')

  // Gallery state
  const [gallery, setGallery] = useState<FirmGalleryImage[]>([])
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [galleryError, setGalleryError] = useState('')
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('access') || ''

        const [membershipsRes, verifyRes] = await Promise.allSettled([
          getMyFirmMemberships(token),
          getMyFirmVerificationStatus(token),
        ])

        if (membershipsRes.status === 'fulfilled') {
          const primary = membershipsRes.value[0] ?? null
          if (!primary) {
            setNoFirm(true)
            setLoading(false)
            return
          }
          setMyRole(primary.role)
          setFirmId(primary.firm)
          if (!ALLOWED_ROLES.includes(primary.role)) {
            setLoading(false)
            return
          }
          // Load gallery for this firm
          try {
            const galleryData = await getFirmGallery(primary.firm, token)
            setGallery(galleryData)
          } catch { /* gallery is non-critical */ }
        } else {
          setError('Could not load your firm membership.')
          setLoading(false)
          return
        }

        if (verifyRes.status === 'fulfilled') {
          const data = verifyRes.value
          setIsVerified(data.is_verified)
          setExistingRequest(data.request)
          if (data.request) {
            setRegistrationNumber(data.request.registration_number)
            setFirmType(data.request.firm_type)
            setFoundingYear(String(data.request.founding_year))
            setNumberOfPartners(String(data.request.number_of_partners))
            setNotes(data.request.notes || '')
          }
        } else {
          setError('Failed to load firm verification status.')
        }
      } catch {
        setError('Failed to load data.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !firmId) return
    setGalleryError('')
    const token = localStorage.getItem('access') || ''
    setGalleryUploading(true)
    const toUpload = Array.from(files).slice(0, 20 - gallery.length)
    const results: FirmGalleryImage[] = []
    const errors: string[] = []
    for (const file of toUpload) {
      const validErr = validateImageFile(file)
      if (validErr) { errors.push(`${file.name}: ${validErr}`); continue }
      try {
        const img = await uploadFirmGalleryImage(firmId, file, token)
        results.push({ ...img, firm: firmId })
      } catch (e: unknown) {
        errors.push(`${file.name}: ${e instanceof Error ? e.message : 'Upload failed'}`)
      }
    }
    setGallery(prev => [...prev, ...results])
    if (errors.length) setGalleryError(errors.join('\n'))
    setGalleryUploading(false)
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  const handleGalleryDelete = async (imageId: number) => {
    if (!firmId) return
    const token = localStorage.getItem('access') || ''
    try {
      await deleteFirmGalleryImage(firmId, imageId, token)
      setGallery(prev => prev.filter(img => img.id !== imageId))
    } catch (e: unknown) {
      setGalleryError(e instanceof Error ? e.message : 'Failed to delete image')
    }
  }

  const handleSubmit = async () => {
    setError(''); setSuccess('')
    if (!registrationNumber.trim()) { setError('Registration number is required'); return }
    const year = parseInt(foundingYear)
    if (!foundingYear || isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      setError('Enter a valid founding year'); return
    }
    const partners = parseInt(numberOfPartners)
    if (isNaN(partners) || partners < 1) { setError('Number of partners must be at least 1'); return }
    setSaving(true)
    try {
      const token = localStorage.getItem('access') || ''
      const result = await submitFirmVerificationRequest({
        registration_number: registrationNumber.trim(),
        firm_type: firmType,
        founding_year: year,
        number_of_partners: partners,
        notes: notes.trim(),
      }, token)
      setExistingRequest(result)
      setSuccess('Firm verification request submitted. Our team will review it within 3–5 business days.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSaving(false)
    }
  }

  const canSubmit = !isVerified && (!existingRequest || existingRequest.status === 'rejected')
  const isPending = existingRequest?.status === 'pending'
  const isAuthorized = myRole !== null && ALLOWED_ROLES.includes(myRole)

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (noFirm) {
    return (
      <div className="min-h-screen bg-primary-950">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-neutral-800/60 border border-white/8 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold text-white mb-2">Not Part of a Firm</h1>
          <p className="text-sm text-white/40 mb-6">
            You need to belong to a law firm before you can request firm verification.
            Ask your firm owner to send you an invitation, or create a new firm first.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/lawyer/team" className="inline-flex items-center gap-2 rounded-xl bg-gold-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-gold-400 transition-colors">
              Create or Join a Firm
            </Link>
            <Link href="/lawyer/profile" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-colors">
              Back to Profile
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-primary-950">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-sm text-white/40 mb-2">
            Only the firm owner or administrator can request firm verification.
          </p>
          <p className="text-xs text-white/25 mb-6">
            Your current role is <span className="text-white/40 font-medium capitalize">{myRole?.replace(/_/g, ' ')}</span>.
            Contact your firm owner if you need this changed.
          </p>
          <Link href="/lawyer/profile" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:border-white/20 transition-colors">
            ← Back to Profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-950">
      <div className="border-b border-white/6">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/lawyer/profile" className="text-xs text-white/30 hover:text-white/50 transition-colors">Profile</Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white/20">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <Link href="/lawyer/team" className="text-xs text-white/30 hover:text-white/50 transition-colors">Team</Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white/20">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs text-white/50">Firm Verification</span>
          </div>
          <h1 className="font-display text-xl font-bold text-white">Verify Your Firm</h1>
          <p className="text-sm text-white/40 mt-1">
            A verified firm badge builds client trust, boosts visibility, and unlocks premium features across LawBridge.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <StatusBanner request={existingRequest} isVerified={isVerified} />

        {/* Benefits — always visible */}
        <div className="rounded-2xl border border-white/8 p-5 bg-white/[0.015]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gold-500/15 border border-gold-500/25 flex items-center justify-center flex-shrink-0">
              <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor" className="text-gold-400">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              {isVerified ? 'Your Firm\'s Verification Benefits' : 'Why Verify Your Firm?'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BENEFITS.map((b, bi) => (
              <div key={b.title} className="flex items-start gap-3 rounded-xl bg-primary-900/30 border border-white/5 p-3.5 stagger-child" style={{ '--i': bi } as React.CSSProperties}>
                <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gold-400">
                    {b.icon}
                    {b.extra}
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white/80">{b.title}</p>
                  <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Firm Gallery */}
        <div className="rounded-2xl border border-white/8 p-5 bg-white/[0.015]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center flex-shrink-0">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/50">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Firm Gallery</p>
              {gallery.length > 0 && (
                <span className="text-[10px] text-white/25 font-medium">{gallery.length}/20</span>
              )}
            </div>
            {gallery.length < 20 && (
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={galleryUploading}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white hover:border-white/20 transition-colors disabled:opacity-40"
              >
                {galleryUploading ? (
                  <div className="w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin" />
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                )}
                {galleryUploading ? 'Uploading…' : 'Add Photos'}
              </button>
            )}
          </div>

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={e => { void handleGalleryUpload(e.target.files) }}
          />

          {galleryError && (
            <p className="text-xs text-crimson-400 mb-3 whitespace-pre-wrap">{galleryError}</p>
          )}

          {gallery.length === 0 ? (
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-white/10 p-8 flex flex-col items-center gap-3 hover:border-white/20 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center group-hover:border-white/15 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white/40 group-hover:text-white/60 transition-colors">Upload firm photos</p>
                <p className="text-xs text-white/20 mt-0.5">Office, team, events — up to 20 images, 10 MB each</p>
              </div>
            </button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {gallery.map((img, gi) => (
                <div key={img.id} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/8 stagger-child" style={{ '--i': Math.min(gi, 8) } as React.CSSProperties}>
                  <img
                    src={`/api/v1/firms/gallery/${img.id}/`}
                    alt={img.caption || 'Firm photo'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => { void handleGalleryDelete(img.id) }}
                      className="w-8 h-8 rounded-full bg-crimson-500/80 hover:bg-crimson-500 flex items-center justify-center transition-colors"
                      title="Remove photo"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  {img.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                      <p className="text-[10px] text-white/70 truncate">{img.caption}</p>
                    </div>
                  )}
                </div>
              ))}
              {gallery.length < 20 && (
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-[4/3] rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-white/20 transition-colors group"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20 group-hover:text-white/40 transition-colors">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  <span className="text-[10px] text-white/20 group-hover:text-white/40 transition-colors">Add more</span>
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl bg-crimson-500/10 border border-crimson-500/20 px-4 py-3 text-sm text-crimson-400">{error}</div>
        )}
        {success && (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">{success}</div>
        )}

        {!isVerified && !isPending && (
          <div className="rounded-2xl bg-white/[0.02] border border-white/8 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white/70">
              {existingRequest?.status === 'rejected' ? 'Resubmit Verification Request' : 'Submit Verification Request'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">
                  Company Registration Number <span className="text-crimson-400">*</span>
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. RC/2018/00456"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/40"
                />
                <p className="text-xs text-white/25 mt-1">As registered with the relevant authority in Cameroon</p>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Firm Type <span className="text-crimson-400">*</span></label>
                <select
                  value={firmType}
                  onChange={e => setFirmType(e.target.value as FirmType)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500/40 appearance-none"
                >
                  {FIRM_TYPES.map(([value, label]) => (
                    <option key={value} value={value} className="bg-primary-900">{label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Year Founded <span className="text-crimson-400">*</span></label>
                  <input
                    type="number"
                    value={foundingYear}
                    onChange={e => setFoundingYear(e.target.value)}
                    placeholder="e.g. 2005"
                    min={1900}
                    max={new Date().getFullYear()}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1.5 block">Number of Partners</label>
                  <input
                    type="number"
                    value={numberOfPartners}
                    onChange={e => setNumberOfPartners(e.target.value)}
                    min={1}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Additional Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any additional information — accreditations, notable cases, practice areas…"
                  rows={3}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/40 resize-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/6">
              <p className="text-xs text-white/30 mb-4">
                By submitting, you confirm that your firm is a legitimately registered legal practice.
                Fraudulent submissions will result in firm suspension.
              </p>
              <button
                onClick={handleSubmit}
                disabled={saving || !canSubmit}
                className="w-full rounded-xl bg-gold-500 py-3 text-sm font-semibold text-primary-900 hover:bg-gold-400 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Submitting…' : existingRequest?.status === 'rejected' ? 'Resubmit Request' : 'Submit Firm Verification'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
