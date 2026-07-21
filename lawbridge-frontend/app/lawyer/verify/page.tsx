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
          <h1 className="font-display text-xl font-bold text-white">Get Verified</h1>
          <p className="text-sm text-white/40 mt-1">
            Verified lawyers get a badge on their profile, appear higher in search, and build client trust faster.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <StatusBanner request={existingRequest} isVerified={isVerified} />

        {/* Benefits — shown before the form so lawyers understand the value first */}
        <div className="rounded-2xl border border-white/8 p-5 bg-white/[0.015]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-6 h-6 rounded-lg bg-gold-500/15 border border-gold-500/25 flex items-center justify-center flex-shrink-0">
              <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor" className="text-gold-400">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              {isVerified ? 'Your Verification Benefits' : 'Why Get Verified?'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Verified badge on your profile',
                desc: 'Gold checkmark on your profile card, in all search results, and on your firm\'s team listing',
                d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
              },
              {
                title: 'Higher discovery ranking',
                desc: 'Verified lawyers consistently appear above unverified in every browse, filter, and keyword search page',
                d: 'M22 12h-4l-3 9L9 3l-3 9H2',
              },
              {
                title: 'Greater client booking rate',
                desc: 'Clients are significantly more likely to contact and book verified lawyers — the badge builds instant trust',
                d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
              },
              {
                title: 'Premium & complex case access',
                desc: 'High-value matters, regulated sectors, and government cases are matched exclusively to verified lawyers',
                d: 'M2 3h20v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3zM8 21h8M12 17v4',
              },
              {
                title: 'Early access to new features',
                desc: 'Verified lawyers are the first cohort for new platform tools, AI features, and revenue programmes',
                d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
              },
              {
                title: 'Referral & case priority',
                desc: 'When LawBridge suggests lawyers to clients or firms, verified lawyers are always listed first',
                d: 'M5 12h14M12 5l7 7-7 7',
              },
            ].map(({ title, desc, d }) => (
              <div key={title} className="flex items-start gap-3 rounded-xl bg-primary-900/30 border border-white/5 p-3.5">
                <div className="w-7 h-7 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gold-400">
                    <path d={d} />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white/80">{title}</p>
                  <p className="text-[11px] text-white/35 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
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
                <label className="text-xs text-white/40 mb-1.5 block">Bar Number <span className="text-crimson-400">*</span></label>
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
                <label className="text-xs text-white/40 mb-1.5 block">Year Called to Bar <span className="text-crimson-400">*</span></label>
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
                className="w-full rounded-xl bg-gold-500 py-3 text-sm font-semibold text-primary-900 hover:bg-gold-400 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Submitting…' : existingRequest?.status === 'rejected' ? 'Resubmit Request' : 'Submit Verification Request'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
