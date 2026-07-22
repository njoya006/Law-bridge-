'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../../../lib/api'
import { getMyFirmMemberships, type FirmMembership } from '../../../lib/firmsApi'
import { getMyCases, type CaseItem } from '../../../lib/casesApi'
import AvatarUploader from '../../../components/ui/AvatarUploader'
import {
  PencilIcon, CheckIcon, AlertTriangleIcon, MailIcon, BriefcaseIcon, ClockIcon,
  BuildingIcon, ShieldIcon, TrophyIcon, BadgeCheckIcon,
} from '../../../components/icons/Icons'

type AuthMe = { id: string; email: string; full_name: string; role: string; avatar_url?: string | null }

type LawyerProfile = {
  id: string
  user_id: string
  specialization: string
  qualifications: string
  bio: string
  bar_number: string
  years_of_experience: number
  bijural_flag: string
  consultation_fee: string
  availability_status: string
  active_cases: number
  total_cases: number
  average_rating: string
  rating_count: number
  verified_at: string | null
}

const BIJURAL_LABELS: Record<string, string> = {
  common_law: 'Common Law · Anglophone',
  civil_law: 'Civil Law · Francophone',
  both: 'Bijural · Both Traditions',
}

function caseStatusCls(status: string) {
  if (['in_progress', 'hearing_scheduled'].includes(status)) return 'bg-primary-400/20 text-primary-100 border-primary-400/30'
  if (['awaiting_court_date', 'hearing_adjourned'].includes(status)) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  if (['closed', 'dismissed', 'archived'].includes(status)) return 'bg-neutral-700/40 text-neutral-400 border-neutral-600/30'
  if (['verdict', 'settled'].includes(status)) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  return 'bg-gold-500/20 text-gold-300 border-gold-500/30'
}

function StarRating({ rating }: { rating: string | number }) {
  const r = Number(rating) || 0
  const full = Math.floor(r)
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= full ? 'text-gold-400' : 'text-neutral-700'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

type Tab = 'overview' | 'bio' | 'activity'

// ── Profile completeness ───────────────────────────────────────────────────────

function computeCompleteness(me: AuthMe, profile: LawyerProfile | null, avatar: string | null) {
  const checks = [
    { label: 'Full name',          done: Boolean(me.full_name?.trim()),               pts: 10, prompt: 'Add your full name in settings', link: '/lawyer/office/me/settings' },
    { label: 'Profile photo',       done: Boolean(avatar),                             pts: 10, prompt: 'Upload a profile photo',        link: '' },
    { label: 'Bio',                 done: Boolean(profile?.bio?.trim()),               pts: 20, prompt: 'Add a bio — increases bookings by 40%', link: '/lawyer/office/me/settings' },
    { label: 'Specialization',      done: Boolean(profile?.specialization?.trim()),    pts: 15, prompt: 'Add your practice area',        link: '/lawyer/office/me/settings' },
    { label: 'Qualifications',      done: Boolean(profile?.qualifications?.trim()),    pts: 10, prompt: 'List your qualifications',       link: '/lawyer/office/me/settings' },
    { label: 'Bar number',          done: Boolean(profile?.bar_number?.trim()),        pts: 15, prompt: 'Add your bar registration number', link: '/lawyer/office/me/settings' },
    { label: 'Consultation fee',    done: Boolean(profile?.consultation_fee && Number(profile.consultation_fee) > 0), pts: 10, prompt: 'Set your consultation fee', link: '/lawyer/office/me/settings' },
    { label: 'Verified',            done: Boolean(profile?.verified_at),              pts: 10, prompt: 'Get verified to unlock client trust', link: '/lawyer/verify' },
  ]
  const score = checks.reduce((s, c) => s + (c.done ? c.pts : 0), 0)
  return { score, checks }
}

function ProfileCompletenessBadge({ me, profile, avatar }: { me: AuthMe; profile: LawyerProfile | null; avatar: string | null }) {
  const { score, checks } = computeCompleteness(me, profile, avatar)
  const color = score >= 80 ? 'text-emerald-400 stroke-emerald-400' : score >= 50 ? 'text-gold-400 stroke-gold-400' : 'text-amber-400 stroke-amber-400'
  const bgColor = score >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : score >= 50 ? 'bg-gold-500/10 border-gold-500/20' : 'bg-amber-500/10 border-amber-500/20'
  const label = score >= 80 ? 'Great' : score >= 50 ? 'Good' : 'Incomplete'
  const circum = 2 * Math.PI * 30
  const offset = circum * (1 - score / 100)
  const missing = checks.filter(c => !c.done)

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${bgColor}`}>
      <div className="flex items-center gap-3">
        <svg width="56" height="56" viewBox="0 0 64 64" className="flex-shrink-0">
          <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/6" />
          <circle
            cx="32" cy="32" r="30" fill="none" strokeWidth="4"
            strokeDasharray={`${circum}`} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 32 32)"
            className={`${color.split(' ')[1]} transition-all duration-700`}
          />
          <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="bold" className={color.split(' ')[0]} fill="currentColor">{score}</text>
        </svg>
        <div>
          <p className="text-xs font-bold text-neutral-200">Profile Completeness</p>
          <p className={`text-[11px] font-semibold mt-0.5 ${color.split(' ')[0]}`}>{label} · {score}/100</p>
        </div>
      </div>
      {missing.length > 0 && (
        <div className="space-y-1.5">
          {missing.slice(0, 3).map(c => (
            <div key={c.label} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-neutral-600 flex-shrink-0" />
              {c.link ? (
                <Link href={c.link} className="text-[11px] text-neutral-400 hover:text-gold-400 transition-colors">{c.prompt}</Link>
              ) : (
                <span className="text-[11px] text-neutral-500">{c.prompt}</span>
              )}
            </div>
          ))}
          {missing.length > 3 && (
            <p className="text-[10px] text-neutral-600">+{missing.length - 3} more improvements</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function LawyerProfilePage() {
  const [me, setMe] = useState<AuthMe | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [lawyerProfile, setLawyerProfile] = useState<LawyerProfile | null>(null)
  const [firm, setFirm] = useState<FirmMembership | null>(null)
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [casesLoading, setCasesLoading] = useState(true)
  const [noProfile, setNoProfile] = useState(false)
  const [availUpdating, setAvailUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { setLoading(false); return }
      setToken(access)
      try {
        const meData = await api.get<AuthMe>('auth', '/auth/me/', access)
        setMe(meData)
        setAvatarUrl(meData.avatar_url ?? null)
      } catch {
        setLoading(false)
        return
      }
      await Promise.allSettled([
        api.get<LawyerProfile>('lawyer', '/lawyers/me/', access)
          .then(p => setLawyerProfile(p))
          .catch(() => setNoProfile(true)),
        getMyFirmMemberships(access)
          .then(ms => setFirm(ms[0] ?? null))
          .catch(() => {}),
      ])
      setLoading(false)
      // Load cases for breakdown chart and activity tab
      getMyCases(access)
        .then(res => setCases(res.results ?? []))
        .catch(() => {})
        .finally(() => setCasesLoading(false))
    }
    void run()
  }, [])

  const changeAvailability = useCallback(async (newStatus: string) => {
    const access = localStorage.getItem('access')
    if (!access || !lawyerProfile || availUpdating) return
    setAvailUpdating(true)
    try {
      await api.patch('lawyer', '/lawyers/me/', { availability_status: newStatus }, access)
      setLawyerProfile(prev => prev ? { ...prev, availability_status: newStatus } : prev)
    } catch { /* ignore */ }
    finally { setAvailUpdating(false) }
  }, [lawyerProfile, availUpdating])

  const initials = me
    ? (me.full_name || me.email || 'L').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const expLevel = !lawyerProfile ? ''
    : (lawyerProfile.years_of_experience ?? 0) >= 10 ? 'Expert'
    : (lawyerProfile.years_of_experience ?? 0) >= 4 ? 'Senior'
    : 'Junior Associate'

  const caseTypeCounts = cases.reduce<Record<string, number>>((acc, c) => {
    acc[c.case_type] = (acc[c.case_type] ?? 0) + 1
    return acc
  }, {})
  const topCaseTypes = Object.entries(caseTypeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxTypeCount = topCaseTypes[0]?.[1] ?? 1

  const statsData = [
    { label: 'Active Cases', value: lawyerProfile?.active_cases ?? 0, color: 'text-gold-400' },
    { label: 'Total Cases', value: lawyerProfile?.total_cases ?? 0, color: 'text-primary-400' },
    { label: 'Avg Rating', value: Number(lawyerProfile?.average_rating ?? 0).toFixed(1), color: 'text-emerald-400' },
    { label: 'Reviews', value: lawyerProfile?.rating_count ?? 0, color: 'text-neutral-300' },
  ]

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'bio', label: 'Bio & Practice' },
    { id: 'activity', label: 'Case Activity' },
  ]

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md text-neutral-50">My Profile</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Your professional identity on LawBridge</p>
        </div>
        <Link
          href="/lawyer/office/me/settings"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-700/50 bg-white/4 px-4 py-2 text-sm font-medium text-neutral-300 hover:border-neutral-600 hover:text-neutral-100 transition-colors flex-shrink-0"
        >
          <PencilIcon width={13} height={13} />
          Edit Profile
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-neutral-400 py-20">
          <span className="animate-spin h-5 w-5 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading profile…
        </div>
      ) : !me ? (
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-8 text-center">
          <p className="text-neutral-400">Sign in as a lawyer to view your profile.</p>
        </div>
      ) : (
        <>
          {/* Hero cover strip */}
          <div className="rounded-2xl overflow-hidden mb-5 h-24 relative bg-gradient-to-br from-primary-700/80 via-primary-800 to-primary-900">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.18),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.06),transparent_60%)]" />
            <div className="absolute bottom-3 right-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400/25">LawBridge</div>
            <div className="absolute top-4 left-5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold-400/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-gold-400/25" />
              <div className="w-1 h-1 rounded-full bg-gold-400/15" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[260px_1fr_260px] items-start gap-5">

          {/* ═══ LEFT PANEL ═══ */}
          <aside className="lg:sticky lg:top-4 space-y-4">
            {/* Identity card */}
            <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-5">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="rounded-full ring-2 ring-gold-500/30 ring-offset-2 ring-offset-primary-800/40 shadow-lg shadow-gold-500/10">
                <AvatarUploader
                  currentUrl={avatarUrl}
                  initials={initials}
                  size="md"
                  token={token}
                  onUploaded={url => {
                    setAvatarUrl(url)
                    localStorage.setItem('avatarUrl', url)
                  }}
                />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-neutral-50 leading-snug">{me.full_name || me.email}</h2>
                  {lawyerProfile?.specialization && (
                    <p className="mt-1 text-xs text-gold-400/80">{lawyerProfile.specialization}</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-neutral-600 capitalize">{me.role}</p>
                </div>

                {/* Verification badge */}
                {lawyerProfile && (
                  lawyerProfile.verified_at ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                      <CheckIcon width={10} height={10} />
                      Verified Lawyer
                    </span>
                  ) : (
                    <Link href="/lawyer/verify" className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/8 px-2.5 py-1 text-[11px] text-amber-400/80 hover:bg-amber-500/15 transition-all">
                      <AlertTriangleIcon width={10} height={10} />
                      Not Verified · Get Verified
                    </Link>
                  )
                )}

                {/* Availability pills */}
                {lawyerProfile && (
                  <div className="w-full">
                    <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-2">Availability Status</p>
                    <div className="flex justify-center gap-1.5 flex-wrap">
                      {(['available', 'busy', 'on_leave'] as const).map(s => {
                        const active = lawyerProfile.availability_status === s
                        const base = 'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all disabled:cursor-default'
                        const cls = s === 'available'
                          ? `${base} ${active ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-neutral-700/40 text-neutral-600 hover:text-neutral-400'}`
                          : s === 'busy'
                          ? `${base} ${active ? 'border-gold-500/60 bg-gold-500/15 text-gold-300' : 'border-neutral-700/40 text-neutral-600 hover:text-neutral-400'}`
                          : `${base} ${active ? 'border-primary-400/60 bg-primary-400/15 text-primary-100' : 'border-neutral-700/40 text-neutral-600 hover:text-neutral-400'}`
                        return (
                          <button key={s} onClick={() => changeAvailability(s)} disabled={availUpdating || active} className={cls}>
                            {s === 'on_leave' ? 'On Leave' : s === 'available' ? 'Available' : 'Busy'}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-white/6 space-y-3">
                <div className="flex items-start gap-2.5">
                  <MailIcon width={13} height={13} className="mt-0.5 flex-shrink-0 text-neutral-600" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-neutral-600">Email</p>
                    <p className="text-xs text-neutral-300 truncate">{me.email}</p>
                  </div>
                </div>

                {lawyerProfile?.bar_number && (
                  <div className="flex items-start gap-2.5">
                    <BriefcaseIcon width={13} height={13} className="mt-0.5 flex-shrink-0 text-neutral-600" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-600">Bar Number</p>
                      <p className="text-xs text-neutral-300 font-mono">{lawyerProfile.bar_number}</p>
                    </div>
                  </div>
                )}

                {lawyerProfile?.years_of_experience !== undefined && (
                  <div className="flex items-start gap-2.5">
                    <ClockIcon width={13} height={13} className="mt-0.5 flex-shrink-0 text-neutral-600" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-600">Experience</p>
                      <p className="text-xs text-neutral-300">{lawyerProfile.years_of_experience} yrs · <span className="text-gold-400/70">{expLevel}</span></p>
                    </div>
                  </div>
                )}

                {firm && (
                  <div className="flex items-start gap-2.5">
                    <BuildingIcon width={13} height={13} className="mt-0.5 flex-shrink-0 text-neutral-600" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-600">Firm</p>
                      <p className="text-xs text-neutral-300 capitalize">Firm #{firm.firm} · {firm.role?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile completeness */}
            <ProfileCompletenessBadge me={me} profile={lawyerProfile} avatar={avatarUrl} />

            {/* Quick access */}
            <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-4">
              <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-3">Quick Access</p>
              <div className="space-y-0.5">
                {([
                  { label: 'Edit Profile Settings', href: '/lawyer/office/me/settings' },
                  { label: 'My Matters', href: '/lawyer/matters' },
                  { label: 'Calendar', href: '/lawyer/calendar' },
                  { label: 'Documents', href: '/lawyer/office/me/documents' },
                  ...(!lawyerProfile?.verified_at ? [{ label: 'Get Verified', href: '/lawyer/verify' }] : []),
                ] as { label: string; href: string }[]).map(({ label, href }) => (
                  <Link key={href} href={href} className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-neutral-400 hover:text-neutral-200 hover:bg-white/4 transition-colors">
                    <span className="w-1 h-1 rounded-full bg-neutral-700 flex-shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* ═══ CENTER PANEL ═══ */}
          <main className="min-w-0 space-y-5">
            {/* Stats row visible only below XL (XL has right panel) */}
            {lawyerProfile && (
              <div className="grid grid-cols-4 gap-3 xl:hidden">
                {statsData.map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl border border-white/8 bg-primary-800/40 p-3 text-center">
                    <p className={`text-xl font-bold tabular-nums font-display ${color}`}>{value}</p>
                    <p className="text-[10px] text-neutral-600 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Professional details grid */}
            <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-6">
              <h3 className="text-[11px] uppercase tracking-widest text-neutral-600 font-semibold mb-4">Professional Details</h3>
              {noProfile ? (
                <div className="rounded-xl border border-gold-500/25 bg-gold-500/5 p-5">
                  <h4 className="font-heading text-sm font-semibold text-neutral-100 mb-1">Professional Profile Not Set Up</h4>
                  <p className="text-neutral-400 text-xs mb-3">Create your professional profile to appear in client searches and accept cases.</p>
                  <Link href="/lawyer/office/me/settings" className="inline-flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-black hover:bg-gold-400 transition-colors">
                    Set Up Profile
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Specialization', value: lawyerProfile?.specialization || '—' },
                    { label: 'Legal Tradition', value: BIJURAL_LABELS[lawyerProfile?.bijural_flag ?? ''] ?? lawyerProfile?.bijural_flag ?? '—' },
                    { label: 'Bar Registration', value: lawyerProfile?.bar_number || '—', mono: true },
                    { label: 'Years of Practice', value: lawyerProfile ? `${lawyerProfile.years_of_experience} years` : '—' },
                    { label: 'Consultation Fee', value: lawyerProfile?.consultation_fee ? `${Number(lawyerProfile.consultation_fee).toLocaleString()} XAF / session` : '—' },
                    { label: 'Current Status', value: lawyerProfile?.availability_status?.replace(/_/g, ' ') ?? '—', capitalize: true },
                  ].map(({ label, value, mono, capitalize }) => (
                    <div key={label} className="rounded-xl bg-primary-900/50 border border-white/5 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-1">{label}</p>
                      <p className={`text-sm font-medium text-neutral-100 ${mono ? 'font-mono' : ''} ${capitalize ? 'capitalize' : ''}`}>{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabbed content */}
            <div className="rounded-2xl border border-white/8 bg-primary-800/40 overflow-hidden">
              <div className="flex border-b border-white/6">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-3.5 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-gold-400 border-b-2 border-gold-500 bg-gold-500/5'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    {lawyerProfile?.bio && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-2">About</p>
                        <p className="text-neutral-300 text-sm leading-relaxed line-clamp-4">{lawyerProfile.bio}</p>
                        <button onClick={() => setActiveTab('bio')} className="mt-2 text-xs text-gold-400/70 hover:text-gold-400 transition-colors">
                          Read full bio →
                        </button>
                      </div>
                    )}

                    {!casesLoading && topCaseTypes.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-3">Practice Breakdown</p>
                        <div className="space-y-2.5">
                          {topCaseTypes.map(([type, count]) => (
                            <div key={type} className="flex items-center gap-3">
                              <p className="text-xs text-neutral-400 w-28 flex-shrink-0 capitalize">{type.replace(/_/g, ' ')}</p>
                              <div className="flex-1 h-1.5 rounded-full bg-neutral-800/60 overflow-hidden">
                                <div className="h-full rounded-full bg-gold-500/50 transition-all duration-700" style={{ width: `${(count / maxTypeCount) * 100}%` }} />
                              </div>
                              <p className="text-xs text-neutral-600 w-4 text-right flex-shrink-0 tabular-nums">{count}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!lawyerProfile?.bio && !noProfile && (
                      <div className="text-center py-6">
                        <p className="text-neutral-500 text-sm">No bio added yet.</p>
                        <Link href="/lawyer/office/me/settings" className="text-xs text-gold-400 hover:text-gold-300 mt-1 inline-block">Add a professional bio →</Link>
                      </div>
                    )}
                  </div>
                )}

                {/* BIO & PRACTICE */}
                {activeTab === 'bio' && (
                  <div className="space-y-6">
                    {lawyerProfile?.bio ? (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-2">Professional Biography</p>
                        <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{lawyerProfile.bio}</p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-neutral-500 text-sm">No biography added yet.</p>
                        <Link href="/lawyer/office/me/settings" className="text-xs text-gold-400 hover:text-gold-300 mt-1 inline-block">Add a bio →</Link>
                      </div>
                    )}

                    {lawyerProfile?.qualifications && (
                      <div className="border-t border-white/6 pt-5">
                        <p className="text-[10px] uppercase tracking-wider text-neutral-600 mb-2">Qualifications & Education</p>
                        <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">{lawyerProfile.qualifications}</p>
                      </div>
                    )}

                    {lawyerProfile?.bijural_flag && (
                      <div className="rounded-xl border border-primary-600/25 bg-primary-900/40 px-4 py-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-600/25 flex items-center justify-center flex-shrink-0">
                          <ShieldIcon width={14} height={14} className="text-primary-400" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-neutral-600">Legal Tradition</p>
                          <p className="text-sm text-neutral-200">{BIJURAL_LABELS[lawyerProfile.bijural_flag] ?? lawyerProfile.bijural_flag}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* CASE ACTIVITY */}
                {activeTab === 'activity' && (
                  casesLoading ? (
                    <div className="flex items-center justify-center gap-2 text-neutral-500 py-8">
                      <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
                      Loading cases…
                    </div>
                  ) : cases.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-neutral-500 text-sm">No cases found.</p>
                      <Link href="/lawyer/matters" className="text-xs text-gold-400 hover:text-gold-300 mt-1 inline-block">Go to Matters →</Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cases.slice(0, 12).map((c, i) => (
                        <Link key={c.id} href={`/cases/${c.id}`} className="stagger-child flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-colors group" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-100 truncate group-hover:text-white">{c.title}</p>
                            <p className="text-xs text-neutral-600 capitalize mt-0.5">{c.case_type?.replace(/_/g, ' ')}</p>
                          </div>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${caseStatusCls(c.status)}`}>
                            {c.status?.replace(/_/g, ' ')}
                          </span>
                        </Link>
                      ))}
                      {cases.length > 12 && (
                        <Link href="/lawyer/matters" className="block text-center text-xs text-gold-400 hover:text-gold-300 pt-2">
                          View all {cases.length} matters →
                        </Link>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          </main>

          {/* ═══ RIGHT PANEL ═══ — XL screens only */}
          <aside className="hidden xl:block space-y-4">
            {/* Performance stats */}
            {lawyerProfile && (
              <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-5">
                <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-4">Performance</p>
                <div className="grid grid-cols-2 gap-3">
                  {statsData.map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl bg-primary-900/50 border border-white/5 p-3 text-center">
                      <p className={`text-2xl font-bold tabular-nums font-display ${color}`}>{value}</p>
                      <p className="text-[10px] text-neutral-600 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <StarRating rating={lawyerProfile.average_rating} />
                  <span className="text-xs text-neutral-500">{lawyerProfile.rating_count} review{lawyerProfile.rating_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}

            {/* Seniority */}
            {lawyerProfile && (
              <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-5">
                <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-3">Seniority Level</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    expLevel === 'Expert' ? 'bg-gold-500/20 text-gold-400'
                    : expLevel === 'Senior' ? 'bg-primary-500/20 text-primary-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    <TrophyIcon width={18} height={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-neutral-100">{expLevel}</p>
                    <p className="text-xs text-neutral-500">{lawyerProfile.years_of_experience} years of practice</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[10px] text-neutral-700">
                    <span>Junior</span><span>Senior</span><span>Expert</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-800/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500/50 via-primary-400/50 to-gold-500/60 transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(5, (lawyerProfile.years_of_experience / 15) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Verification status */}
            {lawyerProfile && (
              <div className={`rounded-2xl border p-5 ${lawyerProfile.verified_at ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${lawyerProfile.verified_at ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {lawyerProfile.verified_at ? <BadgeCheckIcon width={15} height={15} /> : <ShieldIcon width={15} height={15} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {lawyerProfile.verified_at ? (
                      <>
                        <p className="text-sm font-semibold text-emerald-300">Verified Lawyer</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Since {new Date(lawyerProfile.verified_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-amber-300">Not Yet Verified</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">Verify to boost visibility and client trust</p>
                        <Link href="/lawyer/verify" className="mt-2 inline-flex text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                          Start verification →
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
        </>
      )}
    </div>
  )
}
