'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  getMyVerificationStatus,
  submitVerificationRequest,
  type VerificationRequest,
} from '../../../lib/verificationApi'

function StatusBanner({ request, isVerified }: { request: VerificationRequest | null; isVerified: boolean }) {
  if (isVerified) {
    return (
      <div className="rounded-2xl bg-emerald-500/8 border border-emerald-500/20 p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-emerald-400">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-emerald-400">Verified</p>
          <p className="text-sm text-white/50 mt-0.5">Your profile displays the verified badge and is prioritised in search results.</p>
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
            Your request was submitted on {new Date(request.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
            Our team will review it within 2–3 business days.
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
          <p className="text-xs text-white/35 mt-1">You can resubmit a corrected request below.</p>
        </div>
      </div>
    )
  }

  return null
}

export default function VerifyPage() {
  const [loading, setLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [existingRequest, setExistingRequest] = useState<VerificationRequest | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [barNumber, setBarNumber] = useState('')
  const [barCouncil, setBarCouncil] = useState('Cameroon Bar Association')
  const [yearCalled, setYearCalled] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem('access') || ''
        const data = await getMyVerificationStatus(token)
        setIsVerified(data.is_verified)
        setExistingRequest(data.request)
        if (data.request) {
          setBarNumber(data.request.bar_number)
          setBarCouncil(data.request.bar_council)
          setYearCalled(String(data.request.year_called))
          setNotes(data.request.notes || '')
        } else {
          const savedBarNumber = localStorage.getItem('barNumber') || ''
          if (savedBarNumber) setBarNumber(savedBarNumber)
        }
      } catch {
        setError('Failed to load verification status.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const handleSubmit = async () => {
    setError(''); setSuccess('')
    if (!barNumber.trim()) { setError('Bar number is required'); return }
    const year = parseInt(yearCalled)
    if (!yearCalled || isNaN(year) || year < 1950 || year > new Date().getFullYear()) {
      setError('Enter a valid year you were called to the bar')
      return
    }
    setSaving(true)
    try {
      const token = localStorage.getItem('access') || ''
      const result = await submitVerificationRequest({
        bar_number: barNumber.trim(),
        bar_council: barCouncil.trim(),
        year_called: year,
        notes: notes.trim(),
      }, token)
      setExistingRequest(result)
      setSuccess('Verification request submitted. Our team will review it shortly.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setSaving(false)
    }
  }

  const canResubmit = !isVerified && (!existingRequest || existingRequest.status === 'rejected')
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
            <Link href="/lawyer/profile" className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Profile
            </Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white/20">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs text-white/50">Verification</span>
          </div>
          <h1 className="text-xl font-bold text-white">Get Verified</h1>
          <p className="text-sm text-white/40 mt-1">
            Verified lawyers get a badge on their profile, appear higher in search, and build client trust faster.
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
                <label className="text-xs text-white/40 mb-1.5 block">Bar Number <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={barNumber}
                  onChange={e => setBarNumber(e.target.value)}
                  placeholder="e.g. CAM/2019/0123"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/40"
                />
                <p className="text-xs text-white/25 mt-1">As registered with the Cameroon Bar Association</p>
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Bar Council</label>
                <input
                  type="text"
                  value={barCouncil}
                  onChange={e => setBarCouncil(e.target.value)}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500/40"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Year Called to Bar <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  value={yearCalled}
                  onChange={e => setYearCalled(e.target.value)}
                  placeholder="e.g. 2015"
                  min={1950}
                  max={new Date().getFullYear()}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/40"
                />
              </div>

              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Additional Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any additional information to support your verification…"
                  rows={3}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/40 resize-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/6">
              <p className="text-xs text-white/30 mb-4">
                By submitting, you confirm that all information is accurate and you are a licensed legal practitioner.
                False submissions may result in account suspension.
              </p>
              <button
                onClick={handleSubmit}
                disabled={saving || !canResubmit}
                className="w-full rounded-xl bg-gold-500 py-3 text-sm font-semibold text-primary-950 hover:bg-gold-400 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Submitting…' : existingRequest?.status === 'rejected' ? 'Resubmit Request' : 'Submit Verification Request'}
              </button>
            </div>
          </div>
        )}

        {/* What verification unlocks */}
        {!isVerified && (
          <div className="rounded-2xl bg-white/[0.02] border border-white/8 p-5">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Benefits of Verification</p>
            <div className="space-y-3">
              {[
                ['Verified badge', 'Gold checkmark on your profile and in search results'],
                ['Higher discovery ranking', 'Verified lawyers appear before unverified in browse results'],
                ['Client trust signal', 'Clients are more likely to book verified lawyers'],
                ['Access to premium cases', 'Some case types are only matched to verified lawyers'],
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
