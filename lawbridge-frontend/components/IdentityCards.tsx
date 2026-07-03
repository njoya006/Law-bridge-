'use client'

import React, { useEffect, useState } from 'react'
import { getUserById, getLawyerProfile, type UserProfile, type LawyerProfile } from '../lib/casesApi'
import { getFirmDetail, type FirmDiscovery } from '../lib/firmsApi'
import { SERVICE_URLS } from '../lib/serviceUrls'

function avatarUrl(userId: string) {
  return `${SERVICE_URLS.auth.replace(/\/$/, '')}/auth/avatars/${userId}/`
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const init = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : (parts[0]?.[0] ?? '?')
  return <span className="font-bold text-neutral-200 text-base uppercase">{init}</span>
}

function Avatar({ userId, name, hasAvatar }: { userId: string; name: string; hasAvatar: boolean }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const src = avatarUrl(userId)

  return (
    <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden border border-neutral-700/50 bg-primary-800/60 flex items-center justify-center">
      {hasAvatar && !failed ? (
        <>
          {!loaded && <Initials name={name} />}
          <img
            src={src}
            alt={name}
            className={`h-full w-full object-cover ${loaded ? 'block' : 'hidden'}`}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>
      ) : (
        <Initials name={name} />
      )}
    </div>
  )
}

// ── Client identity card (shown to lawyers) ────────────────────────────────────

export function ClientCard({
  clientId,
  clientEmail,
}: {
  clientId: string
  clientEmail?: string
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!clientId) { setLoading(false); return }
    const access = typeof window !== 'undefined' ? localStorage.getItem('access') : null
    if (!access) { setLoading(false); return }
    getUserById(clientId, access)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [clientId])

  const name = profile?.full_name || '—'
  const email = profile?.email || clientEmail || '—'
  const hasAvatar = Boolean(profile?.avatar)

  return (
    <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-4">
      <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-3">Your Client</p>

      {loading ? (
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-12 w-12 rounded-full bg-primary-700/50 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-1/2 rounded bg-primary-700/50" />
            <div className="h-3 w-3/4 rounded bg-primary-700/40" />
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <Avatar userId={clientId} name={name} hasAvatar={hasAvatar} />
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-semibold text-neutral-100 truncate">{name}</p>
            <p className="text-xs text-neutral-400 truncate mt-0.5">{email}</p>
            <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-neutral-600/40 bg-neutral-800/30 text-neutral-400 uppercase tracking-wide">
              Client
            </span>
          </div>
          {email !== '—' && (
            <a
              href={`mailto:${email}`}
              className="flex-shrink-0 p-2 rounded-lg border border-neutral-700/30 bg-neutral-800/20 text-neutral-400 hover:text-gold-400 hover:border-gold-500/30 transition-colors"
              title={`Email ${name}`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  )
}

// ── Firm identity card (shown to clients when booking is with a firm) ──────────

export function FirmCard({
  firmId,
  fallbackName,
}: {
  firmId: number
  fallbackName?: string
}) {
  const [firm, setFirm] = useState<FirmDiscovery | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firmId) { setLoading(false); return }
    getFirmDetail(firmId)
      .then(setFirm)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [firmId])

  const name = firm?.name || fallbackName || '—'

  return (
    <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-4">
      <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-3">Your Firm</p>

      {loading ? (
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-12 w-12 rounded-xl bg-primary-700/50 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-1/2 rounded bg-primary-700/50" />
            <div className="h-3 w-3/4 rounded bg-primary-700/40" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-700/50 bg-primary-800/60 flex items-center justify-center">
            {firm?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={firm.logo_url} alt={name} className="h-full w-full object-cover" />
            ) : (
              <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-sm font-semibold text-neutral-100 truncate">{name}</p>
            {(firm?.city || firm?.country) && (
              <p className="text-xs text-neutral-400 truncate mt-0.5">
                {[firm.city, firm.country].filter(Boolean).join(', ')}
              </p>
            )}
            <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-neutral-600/40 bg-neutral-800/30 text-neutral-400 uppercase tracking-wide">
              Law Firm
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Lawyer identity card (shown to clients) ────────────────────────────────────

const BIJURAL_LABELS: Record<string, string> = {
  common_law: 'Common Law',
  civil_law:  'Civil Law',
  both:       'Bijural',
}

const CONSULT_MODE_LABELS: Record<string, string> = {
  in_person: 'In-person',
  virtual:   'Virtual',
  both:      'In-person & Virtual',
}

export function LawyerCard({
  lawyerUserId,
  fallbackName,
}: {
  lawyerUserId: string
  fallbackName?: string
}) {
  const [profile, setProfile] = useState<LawyerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lawyerUserId) { setLoading(false); return }
    getLawyerProfile(lawyerUserId)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lawyerUserId])

  const name = profile?.full_name || fallbackName || '—'
  const isVerified = Boolean(profile?.verified_at)

  return (
    <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Your Lawyer</p>
        {isVerified && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-12 w-12 rounded-full bg-primary-700/50 flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-3.5 w-1/2 rounded bg-primary-700/50" />
            <div className="h-3 w-3/4 rounded bg-primary-700/40" />
            <div className="h-3 w-2/3 rounded bg-primary-700/30" />
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <Avatar userId={lawyerUserId} name={name} hasAvatar={false} />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="font-heading text-sm font-semibold text-neutral-100 truncate">{name}</p>
            {profile?.specialization && (
              <p className="text-xs text-gold-400 font-medium">{profile.specialization}</p>
            )}
            {profile?.bar_number && (
              <p className="text-[11px] text-neutral-500">
                Bar No. <span className="text-neutral-300 font-mono">{profile.bar_number}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-neutral-500">
              {profile?.years_of_experience !== undefined && (
                <span>{profile.years_of_experience} yr{profile.years_of_experience !== 1 ? 's' : ''} experience</span>
              )}
              {profile?.bijural_flag && BIJURAL_LABELS[profile.bijural_flag] && (
                <span>{BIJURAL_LABELS[profile.bijural_flag]}</span>
              )}
              {profile?.practice_circuit && (
                <span>{profile.practice_circuit} Circuit</span>
              )}
            </div>
            {profile?.consultation_mode && (
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border border-neutral-600/40 bg-neutral-800/30 text-neutral-400 uppercase tracking-wide">
                {CONSULT_MODE_LABELS[profile.consultation_mode] ?? profile.consultation_mode}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
