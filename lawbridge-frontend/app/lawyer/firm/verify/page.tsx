'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getMyFirmVerificationStatus,
  submitFirmVerificationRequest,
  FIRM_TYPE_LABELS,
  type FirmVerificationRequest,
  type FirmType,
} from '../../../../lib/verificationApi'

const FIRM_TYPES = Object.entries(FIRM_TYPE_LABELS) as [FirmType, string][]

function StatusBanner({ request, isVerified }: { request: FirmVerificationRequest | null; isVerified: boolean }) {
  if (isVerified) {
    return (
      <div className="rounded-2xl bg-emerald-500/8 border border-emerald-500/20 p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-emerald-400">Firm Verified</p>
          <p className="text-sm text-white/50 mt-0.5">
            Your firm displays the verified badge and is prioritised in search results.
          </p>
        </div>
      </div>
    )
  }

  if (!request) return null

  if (request.status === 'pending') {
    return (
      <div className="rounded-2xl bg-amber-500/8 border border-amber-500/20 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-amber-400">
            <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
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
      <div className="rounded-2xl bg-red-500/8 border border-red-500/20 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-red-400">
            <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-red-400">Request Rejected</p>
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

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('access') || ''
        const data = await getMyFirmVerificationStatus(token)
        setIsVerified(data.is_verified)
        setExistingRequest(data.request)
        if (data.request) {
          setRegistrationNumber(data.request.registration_number)
          setFirmType(data.request.firm_type)
          setFoundingYear(String(data.request.founding_year))
          setNumberOfPartners(String(data.request.number_of_partners))
          setNotes(data.request.notes || '')
        }
      } catch {
        setError('Failed to load firm verification status.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
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
            <span className="text-xs text-white/50">Firm Verification</span>
          </div>
          <h1 className="text-xl font-bold text-white">Verify Your Firm</h1>
          <p className="text-sm text-white/40 mt-1">
            A verified firm badge builds client trust and boosts your firm&apos;s visibility across LawBridge.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <StatusBanner request={existingRequest} isVerified={isVerified} />

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
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
                  Company Registration Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={e => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. RC/2018/00456"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/40"
                />
                <p className="text-xs text-white/25 mt-1">As registered with the relevant authority</p>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Firm Type <span className="text-red-400">*</span></label>
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
                  <label className="text-xs text-white/40 mb-1.5 block">
                    Year Founded <span className="text-red-400">*</span>
                  </label>
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
                className="w-full rounded-xl bg-gold-500 py-3 text-sm font-semibold text-primary-950 hover:bg-gold-400 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Submitting…' : existingRequest?.status === 'rejected' ? 'Resubmit Request' : 'Submit Firm Verification'}
              </button>
            </div>
          </div>
        )}

        {/* Benefits */}
        {!isVerified && (
          <div className="rounded-2xl bg-white/[0.02] border border-white/8 p-5">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">What Firm Verification Unlocks</p>
            <div className="space-y-3">
              {[
                ['Verified firm badge', 'Gold checkmark on your firm profile and in search results'],
                ['Priority placement', 'Verified firms rank above unverified in all discovery pages'],
                ['Client credibility', 'Clients are more confident booking through verified firms'],
                ['Premium case access', 'Certain high-value cases are matched only to verified firms'],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-gold-400">
                      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-white/70">{title}</p>
                    <p className="text-xs text-white/35">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
