'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../../lib/api'
import { getFirmLawyers, type LawyerDiscovery } from '../../../../lib/discoveryApi'
import type { FirmDiscovery } from '../../../../lib/firmsApi'

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

function LawyerMiniCard({ lawyer, firmId }: { lawyer: LawyerDiscovery; firmId: string }) {
  const initials = lawyer.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const fee = lawyer.consultation_fee ? `${parseFloat(lawyer.consultation_fee).toLocaleString()} XAF` : 'On request'

  return (
    <div className="bg-primary-800/30 border border-neutral-700/30 rounded-xl p-4 hover:border-gold-500/30 transition-all duration-200">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-600/30 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-gold-300 text-xs font-bold">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-body-sm text-neutral-100 truncate">{lawyer.name}</p>
          <p className="text-gold-400/70 text-xs truncate">{lawyer.specialization}</p>
        </div>
        {lawyer.is_verified && (
          <svg className="w-4 h-4 text-gold-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
          </svg>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-neutral-500 mb-3">
        <StarRating rating={lawyer.average_rating} />
        <span>{lawyer.years_of_experience}yr</span>
        <span className={lawyer.availability_status === 'available' ? 'text-emerald-400' : 'text-amber-400'}>
          {lawyer.availability_status === 'available' ? 'Available' : 'Busy'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-gold-400 text-xs font-semibold">{fee}</span>
        <div className="flex gap-1.5">
          <Link href={`/discover/lawyer/${lawyer.id}`} className="px-2.5 py-1 rounded-lg border border-neutral-600/40 text-neutral-400 text-xs hover:text-gold-400 transition-colors">
            Profile
          </Link>
          <Link
            href={`/book?kind=lawyer&id=${encodeURIComponent(lawyer.id)}&name=${encodeURIComponent(lawyer.name)}&fee=${lawyer.consultation_fee ?? ''}&firm_id=${firmId}`}
            className="px-2.5 py-1 rounded-lg bg-gold-500 text-black text-xs font-semibold hover:bg-gold-400 transition-colors"
          >
            Book
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function FirmDetailPage() {
  const params = useParams<{ id: string }>()
  const [firm, setFirm] = useState<FirmDiscovery & { member_count?: number } | null>(null)
  const [lawyers, setLawyers] = useState<LawyerDiscovery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const token = localStorage.getItem('access')
      try {
        const [firmData, lawyersData] = await Promise.allSettled([
          api.get<FirmDiscovery & { member_count?: number }>('firms', `/${params.id}/`, token),
          getFirmLawyers(params.id, token),
        ])
        if (firmData.status === 'fulfilled') setFirm(firmData.value)
        else throw new Error('Firm not found')
        if (lawyersData.status === 'fulfilled') setLawyers(Array.isArray(lawyersData.value) ? lawyersData.value : [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load firm')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) void run()
  }, [params.id])

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
      <Link href="/discover" className="mt-4 inline-block text-gold-400 hover:text-gold-300">← Back to Discover</Link>
    </div>
  )

  const initials = firm.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  const availableLawyers = lawyers.filter(l => l.availability_status === 'available')
  const specializations = [...new Set(lawyers.map(l => l.specialization).filter(Boolean))]
  const avgFee = lawyers.length > 0
    ? lawyers.filter(l => l.consultation_fee).reduce((sum, l) => sum + parseFloat(l.consultation_fee!), 0) / lawyers.filter(l => l.consultation_fee).length
    : null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/discover" className="inline-flex items-center gap-2 text-neutral-400 hover:text-gold-400 text-sm transition-colors">
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
            <p className="text-neutral-400 text-sm mb-3">Registered law firm on Lawbridge</p>
            <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
              <span>{firm.member_count ?? lawyers.length} active members</span>
              {availableLawyers.length > 0 && <span className="text-emerald-400">{availableLawyers.length} available now</span>}
              {avgFee && <span>Avg. fee: {avgFee.toLocaleString()} XAF</span>}
            </div>
          </div>
          <Link
            href={`/book?kind=firm&id=${firm.id}&name=${encodeURIComponent(firm.name)}`}
            className="px-5 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors flex-shrink-0"
          >
            Book with Firm
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: firm.member_count ?? lawyers.length },
          { label: 'Available Now', value: availableLawyers.length },
          { label: 'Practice Areas', value: specializations.length },
          { label: 'Avg. Consultation Fee', value: avgFee ? `${avgFee.toLocaleString()} XAF` : 'Varies' },
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
            No lawyer profiles found for this firm yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lawyers.map(lawyer => (
              <LawyerMiniCard key={lawyer.id} lawyer={lawyer} firmId={String(firm.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Reviews placeholder */}
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
        <h2 className="font-heading text-body-lg text-neutral-50 mb-3">Client Reviews</h2>
        <p className="text-neutral-500 text-sm">Reviews are collected from completed consultations and will appear here.</p>
      </div>
    </div>
  )
}
