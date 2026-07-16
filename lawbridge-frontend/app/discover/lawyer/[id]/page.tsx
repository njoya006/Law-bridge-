'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getLawyerById, type LawyerDiscovery, type AvailabilitySlot } from '../../../../lib/discoveryApi'
import { getReviews, submitReview, type Review, type ReviewsResponse } from '../../../../lib/reviewsApi'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function StarRating({ rating, count }: { rating: number | string; count?: number }) {
  const r = Number(rating) || 0
  const stars = Math.round(r)
  return (
    <span className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-4 h-4 ${i <= stars ? 'text-gold-400' : 'text-neutral-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-neutral-400 ml-1">{r.toFixed(1)}{count !== undefined ? ` · ${count} reviews` : ''}</span>
    </span>
  )
}

function InfoChip({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 rounded-full border border-neutral-700/40 bg-primary-800/40 text-neutral-300 text-xs">{label}</span>
  )
}

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <svg className={`w-7 h-7 transition-colors ${i <= (hovered || value) ? 'text-gold-400' : 'text-neutral-700'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </button>
      ))}
    </span>
  )
}

function RatingBar({ rating, total }: { rating: number; total: number }) {
  const counts = [5, 4, 3, 2, 1].map(star => ({
    star,
    pct: total > 0 ? Math.round((rating === star ? 1 : 0) * 100) : 0,
  }))
  return null // placeholder — real histogram needs aggregated data
}

export default function LawyerDetailPage() {
  const params = useParams<{ id: string }>()
  const [lawyer, setLawyer] = useState<(LawyerDiscovery & { availability_slots?: AvailabilitySlot[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewDone, setReviewDone] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  const loadReviews = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('access')
      const data = await getReviews(id, token)
      setReviews(data)
    } catch {
      // non-fatal
    }
  }, [])

  useEffect(() => {
    const role = localStorage.getItem('portalRole')
    setIsClient(!role || role === 'client')
  }, [])

  useEffect(() => {
    const run = async () => {
      const token = localStorage.getItem('access')
      try {
        const data = await getLawyerById(params.id, token)
        setLawyer(data)
        void loadReviews(params.id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load lawyer profile')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) void run()
  }, [params.id, loadReviews])

  const handleSubmitReview = async () => {
    if (reviewRating === 0) { setReviewError('Please select a star rating'); return }
    setSubmittingReview(true); setReviewError('')
    try {
      const token = localStorage.getItem('access') || ''
      await submitReview(params.id, { rating: reviewRating, comment: reviewComment }, token)
      setReviewDone(true)
      setShowReviewForm(false)
      void loadReviews(params.id)
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="h-48 rounded-xl skeleton" />
      <div className="h-32 rounded-xl skeleton" />
    </div>
  )

  if (error || !lawyer) return (
    <div className="max-w-4xl mx-auto">
      <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 p-6 text-crimson-300">
        {error || 'Lawyer not found.'}
      </div>
      <Link href="/discover" className="mt-4 inline-block text-gold-400 hover:text-gold-300">← Back to Discover</Link>
    </div>
  )

  const initials = (lawyer.name || '?').split(' ').map((w: string) => w[0] ?? '').filter(Boolean).slice(0, 2).join('').toUpperCase() || '?'
  const fee = lawyer.consultation_fee ? `${parseFloat(lawyer.consultation_fee).toLocaleString()} XAF` : 'Fee on request'
  const procFee = parseFloat(lawyer.procedural_fee || '0') || 0
  const profFee = parseFloat(lawyer.professional_fee || '0') || 0
  const bookHref = `/book?kind=lawyer&id=${encodeURIComponent(lawyer.id)}&name=${encodeURIComponent(lawyer.name)}&fee=${lawyer.consultation_fee ?? ''}&procedural_fee=${procFee}&professional_fee=${profFee}`
  const availableSlots = (lawyer.availability_slots ?? []).filter(s => s.is_available)
  const caseTypes = lawyer.accepted_case_types ? lawyer.accepted_case_types.split(',').map(s => s.trim()).filter(Boolean) : []

  const availabilityMap: Record<string, string> = {
    available: 'Available',
    busy: 'Currently Busy',
    on_leave: 'On Leave',
    inactive: 'Not Accepting Cases',
  }

  const modeMap: Record<string, string> = {
    in_person: 'In-Person Consultations',
    virtual: 'Virtual Consultations Only',
    both: 'In-Person & Virtual',
  }

  const bijuralMap: Record<string, string> = {
    common_law: 'Common Law (Anglophone)',
    civil_law: 'Civil Law (Francophone)',
    both: 'Bijural — Common Law & Civil Law',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link href="/discover" className="inline-flex items-center gap-2 text-neutral-400 hover:text-gold-400 text-sm transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        Back to Discover
      </Link>

      {/* Profile Header */}
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gold-500/40 to-gold-600/40 border-2 border-gold-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-gold-300 text-2xl font-bold">{initials}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="font-display text-display-sm text-neutral-50">{lawyer.name}</h1>
              {lawyer.is_verified && (
                <span className="flex items-center gap-1 text-xs text-gold-400 border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  Verified
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                lawyer.availability_status === 'available' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                {availabilityMap[lawyer.availability_status] ?? lawyer.availability_status}
              </span>
            </div>
            <p className="text-gold-400 font-medium mb-2">{lawyer.specialization}</p>
            <StarRating rating={lawyer.average_rating} count={lawyer.rating_count} />
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-neutral-400">
              <span>{lawyer.years_of_experience} years of experience</span>
              <span>·</span>
              <span>{lawyer.active_cases} active cases</span>
              {lawyer.bar_number && <><span>·</span><span>Bar No. {lawyer.bar_number}</span></>}
            </div>
          </div>

          {/* Book CTA */}
          <div className="sm:text-right space-y-2">
            <div className="space-y-1 text-sm">
              <div className="flex sm:justify-end gap-2 items-baseline">
                <span className="text-xs text-neutral-500">Consultation</span>
                <span className="text-gold-400 font-bold text-lg">{fee}</span>
                <span className="text-amber-400 text-[10px]">compulsory</span>
              </div>
              {procFee > 0 && (
                <div className="flex sm:justify-end gap-2 items-baseline">
                  <span className="text-xs text-neutral-500">Procedural</span>
                  <span className="text-gold-300 font-medium">{procFee.toLocaleString()} XAF</span>
                  <span className="text-amber-400 text-[10px]">compulsory</span>
                </div>
              )}
              {profFee > 0 && (
                <div className="flex sm:justify-end gap-2 items-baseline">
                  <span className="text-xs text-neutral-500">Professional</span>
                  <span className="text-emerald-400 font-medium">{profFee.toLocaleString()} XAF</span>
                  <span className="text-emerald-400 text-[10px]">negotiable</span>
                </div>
              )}
            </div>
            {lawyer.availability_status === 'available' && (
              <Link
                href={bookHref}
                className="inline-block px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors"
              >
                Book Consultation
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {lawyer.bio && (
            <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
              <h2 className="font-heading text-body-lg text-neutral-50 mb-3">About</h2>
              <p className="text-neutral-400 text-body-sm leading-relaxed">{lawyer.bio}</p>
            </div>
          )}

          {/* Qualifications */}
          {lawyer.qualifications && (
            <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
              <h2 className="font-heading text-body-lg text-neutral-50 mb-3">Qualifications & Education</h2>
              <p className="text-neutral-400 text-body-sm leading-relaxed whitespace-pre-line">{lawyer.qualifications}</p>
            </div>
          )}

          {/* Practice Areas */}
          {caseTypes.length > 0 && (
            <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
              <h2 className="font-heading text-body-lg text-neutral-50 mb-3">Practice Areas</h2>
              <div className="flex flex-wrap gap-2">
                {caseTypes.map(t => <InfoChip key={t} label={t} />)}
              </div>
            </div>
          )}

          {/* Availability Schedule */}
          {availableSlots.length > 0 && (
            <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
              <h2 className="font-heading text-body-lg text-neutral-50 mb-4">Weekly Availability</h2>
              <div className="space-y-2">
                {availableSlots.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between py-2 border-b border-neutral-700/20 last:border-0">
                    <span className="text-neutral-300 text-sm font-medium">{slot.day_name ?? DAYS[slot.day_of_week - 1]}</span>
                    <span className="text-neutral-400 text-sm">{slot.start_time} – {slot.end_time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-body-lg text-neutral-50">Reviews</h2>
              {isClient && !reviewDone && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="text-xs text-gold-400 border border-gold-500/30 bg-gold-500/8 px-3 py-1 rounded-full hover:bg-gold-500/15 transition-colors"
                >
                  Write a review
                </button>
              )}
              {reviewDone && (
                <span className="text-xs text-emerald-400 border border-emerald-500/30 bg-emerald-500/8 px-3 py-1 rounded-full">
                  Review submitted
                </span>
              )}
            </div>

            {/* Summary */}
            {(reviews?.count ?? lawyer.rating_count) > 0 && (
              <div className="flex items-center gap-4 mb-5 pb-5 border-b border-neutral-700/30">
                <div className="text-4xl font-bold text-gold-400">
                  {(reviews?.average_rating ?? Number(lawyer.average_rating) ?? 0).toFixed(1)}
                </div>
                <div>
                  <StarRating rating={reviews?.average_rating ?? lawyer.average_rating} />
                  <p className="text-neutral-500 text-xs mt-1">
                    {reviews?.count ?? lawyer.rating_count} review{(reviews?.count ?? lawyer.rating_count) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Review submission form */}
            {showReviewForm && (
              <div className="mb-5 rounded-xl bg-white/3 border border-white/8 p-4 space-y-3">
                <p className="text-sm font-medium text-white/70">Your review</p>
                <StarPicker value={reviewRating} onChange={setReviewRating} />
                <textarea
                  placeholder="Share your experience (optional)…"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-white/5 border border-white/8 px-3 py-2 text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-gold-500/30 resize-none"
                />
                {reviewError && <p className="text-xs text-red-400">{reviewError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="flex-1 rounded-lg bg-gold-500 text-primary-900 text-sm font-semibold py-2 hover:bg-gold-400 disabled:opacity-50 transition-colors"
                  >
                    {submittingReview ? 'Submitting…' : 'Submit Review'}
                  </button>
                  <button
                    onClick={() => { setShowReviewForm(false); setReviewError('') }}
                    className="px-4 rounded-lg bg-white/5 text-sm text-white/40 py-2 hover:bg-white/8 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Individual reviews */}
            {reviews && reviews.results.length > 0 ? (
              <div className="space-y-4">
                {reviews.results.map(review => (
                  <div key={review.id} className="border-b border-neutral-700/20 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-600/30 flex items-center justify-center text-[10px] font-bold text-gold-400 flex-shrink-0">
                          {(review.client_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-neutral-300">
                          {review.client_name || 'Client'}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-600 flex-shrink-0">
                        {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <StarRating rating={review.rating} />
                    {review.comment && (
                      <p className="text-sm text-neutral-400 mt-2 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : reviews && reviews.count === 0 ? (
              <p className="text-neutral-500 text-sm">No reviews yet. Be the first to work with this lawyer.</p>
            ) : (
              <p className="text-neutral-500 text-sm">
                {lawyer.rating_count > 0
                  ? `${lawyer.rating_count} review${lawyer.rating_count !== 1 ? 's' : ''}`
                  : 'No reviews yet. Be the first to work with this lawyer.'}
              </p>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-5 space-y-4">
            <h3 className="font-heading text-body-md text-neutral-50">Practice Details</h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Legal Tradition</p>
                <p className="text-neutral-300">{bijuralMap[lawyer.bijural_flag] ?? lawyer.bijural_flag}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Circuit</p>
                <p className="text-neutral-300 capitalize">{lawyer.practice_circuit} Circuit</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Consultation Mode</p>
                <p className="text-neutral-300">{modeMap[lawyer.consultation_mode] ?? lawyer.consultation_mode}</p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Urgent Cases</p>
                <p className={lawyer.accepts_urgent_cases ? 'text-emerald-400' : 'text-neutral-500'}>
                  {lawyer.accepts_urgent_cases ? '✓ Accepts urgent cases' : 'Not accepting urgent cases'}
                </p>
              </div>
              <div>
                <p className="text-neutral-500 text-xs uppercase tracking-wide mb-1">Case Capacity</p>
                <p className="text-neutral-300">{lawyer.active_cases} active / {lawyer.total_cases} total</p>
              </div>
            </div>
          </div>

          {/* Fee card */}
          <div className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-5">
            <h3 className="font-heading text-body-md text-gold-400 mb-3">Booking Fee</h3>
            <p className="text-2xl font-bold text-neutral-50 mb-1">{fee}</p>
            <p className="text-neutral-500 text-xs mb-4">
              This is the consultation/booking fee. Full legal service fees are discussed and agreed separately with the lawyer.
            </p>
            {lawyer.availability_status === 'available' ? (
              <Link
                href={bookHref}
                className="w-full block text-center px-4 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors"
              >
                Book Consultation
              </Link>
            ) : (
              <p className="text-amber-400 text-sm text-center">Not currently accepting bookings</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
