"use client"

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api } from '../../../lib/api'
import { getMyFirmMemberships, type FirmMembership } from '../../../lib/firmsApi'
import { Card } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import AvatarUploader from '../../../components/ui/AvatarUploader'

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
  common_law: 'Common Law (Anglophone)',
  civil_law: 'Civil Law (Francophone)',
  both: 'Both Traditions',
}

const AVAILABILITY_COLORS: Record<string, string> = {
  available: 'text-emerald-400 bg-emerald-500/20',
  busy: 'text-gold-400 bg-gold-500/20',
  on_leave: 'text-primary-400 bg-primary-500/20',
  inactive: 'text-neutral-400 bg-neutral-700/40',
}

export default function LawyerProfilePage() {
  const [me, setMe] = useState<AuthMe | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [lawyerProfile, setLawyerProfile] = useState<LawyerProfile | null>(null)
  const [firm, setFirm] = useState<FirmMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [noProfile, setNoProfile] = useState(false)
  const [availUpdating, setAvailUpdating] = useState(false)

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
          .then(memberships => setFirm(memberships[0] ?? null))
          .catch(() => {}),
      ])

      setLoading(false)
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
    } catch { /* silently ignore — badge stays unchanged */ }
    finally { setAvailUpdating(false) }
  }, [lawyerProfile, availUpdating])

  const initials = me
    ? (me.full_name || me.email || 'L')
        .split(/\s+/)
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?'

  const availColor = lawyerProfile
    ? (AVAILABILITY_COLORS[lawyerProfile.availability_status] ?? 'text-neutral-400 bg-neutral-700/40')
    : ''
  const availLabel = lawyerProfile?.availability_status?.replace(/_/g, ' ') ?? ''

  return (
    <div className="space-y-6 max-w-4xl w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-display-md text-neutral-50">My Profile</h1>
          <p className="text-neutral-400">Your public professional profile on Lawbridge</p>
        </div>
        <Link href="/lawyer/office/me/settings">
          <Button variant="outline">Edit Profile</Button>
        </Link>
      </div>

      {loading && (
        <Card className="p-8">
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
            Loading profile...
          </div>
        </Card>
      )}

      {!loading && me && (
        <>
          {/* Identity card */}
          <Card className="p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex-shrink-0 self-center sm:self-auto">
                <AvatarUploader
                  currentUrl={avatarUrl}
                  initials={initials}
                  size="md"
                  token={token}
                  onUploaded={(url) => {
                    setAvatarUrl(url)
                    // Persist so sidebar picks it up immediately
                    localStorage.setItem('avatarUrl', url)
                  }}
                />
                <p className="text-center text-xs text-neutral-500 mt-2">Click to change photo</p>
              </div>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                  <div>
                    <h2 className="font-display text-display-sm text-neutral-50">
                      {me.full_name || me.email}
                    </h2>
                    <p className="text-primary-400 text-body-lg capitalize">{me.role}</p>
                    {lawyerProfile && (
                      <div className="mt-2">
                        {lawyerProfile.verified_at ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Verified Lawyer · since {new Date(lawyerProfile.verified_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <Link href="/lawyer/verify" className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/25 bg-gold-500/8 px-3 py-1 text-xs text-gold-400 hover:bg-gold-500/15 transition-all">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            Get Verified — boost your visibility
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                  {lawyerProfile && (
                    <div className="flex flex-col items-end gap-1.5 self-start flex-shrink-0">
                      <div className="flex gap-1">
                        {(['available', 'busy', 'on_leave'] as const).map(status => {
                          const isActive = lawyerProfile.availability_status === status
                          const statusColors: Record<string, string> = {
                            available: isActive ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-neutral-700/40 text-neutral-500 hover:border-neutral-600/60 hover:text-neutral-300',
                            busy:      isActive ? 'border-gold-500/60 bg-gold-500/15 text-gold-300'           : 'border-neutral-700/40 text-neutral-500 hover:border-neutral-600/60 hover:text-neutral-300',
                            on_leave:  isActive ? 'border-blue-500/60 bg-blue-500/15 text-blue-300'           : 'border-neutral-700/40 text-neutral-500 hover:border-neutral-600/60 hover:text-neutral-300',
                          }
                          return (
                            <button
                              key={status}
                              onClick={() => changeAvailability(status)}
                              disabled={availUpdating || isActive}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize transition-all disabled:cursor-default ${statusColors[status]}`}
                            >
                              {status.replace(/_/g, ' ')}
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-[10px] text-neutral-600">Your availability status</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm mt-4">
                  <div>
                    <p className="text-neutral-400">Email</p>
                    <p className="text-neutral-200">{me.email}</p>
                  </div>
                  {lawyerProfile && (
                    <>
                      <div>
                        <p className="text-neutral-400">Specialization</p>
                        <p className="text-neutral-200">{lawyerProfile.specialization || '—'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400">Bar Number</p>
                        <p className="text-neutral-200 font-mono">{lawyerProfile.bar_number || '—'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400">Years of Experience</p>
                        <p className="text-neutral-200">{lawyerProfile.years_of_experience ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-neutral-400">Legal Tradition</p>
                        <p className="text-neutral-200">
                          {BIJURAL_LABELS[lawyerProfile.bijural_flag] ?? lawyerProfile.bijural_flag}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-400">Consultation Fee</p>
                        <p className="text-neutral-200">
                          {lawyerProfile.consultation_fee
                            ? `${Number(lawyerProfile.consultation_fee).toLocaleString()} XAF`
                            : '—'}
                        </p>
                      </div>
                    </>
                  )}
                  {firm && (
                    <div>
                      <p className="text-neutral-400">Firm</p>
                      <p className="text-neutral-200">Firm #{firm.firm} · {firm.role?.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Bio & Qualifications */}
          {lawyerProfile && (lawyerProfile.bio || lawyerProfile.qualifications) && (
            <Card className="p-8">
              <div className="space-y-6">
                {lawyerProfile.bio && (
                  <div>
                    <h3 className="font-heading text-body-lg text-neutral-50 mb-2">Bio</h3>
                    <p className="text-neutral-300 text-body-sm whitespace-pre-wrap">{lawyerProfile.bio}</p>
                  </div>
                )}
                {lawyerProfile.qualifications && (
                  <div>
                    <h3 className="font-heading text-body-lg text-neutral-50 mb-2">Qualifications</h3>
                    <p className="text-neutral-300 text-body-sm whitespace-pre-wrap">{lawyerProfile.qualifications}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Stats */}
          {lawyerProfile && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-6 text-center">
                <div className="font-display text-display-sm text-gold-400 mb-1">{lawyerProfile.active_cases}</div>
                <p className="text-neutral-400 text-body-sm">Active Cases</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="font-display text-display-sm text-primary-400 mb-1">{lawyerProfile.total_cases}</div>
                <p className="text-neutral-400 text-body-sm">Total Cases</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="font-display text-display-sm text-emerald-400 mb-1">
                  {Number(lawyerProfile.average_rating).toFixed(1)}
                </div>
                <p className="text-neutral-400 text-body-sm">Avg Rating</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="font-display text-display-sm text-neutral-200 mb-1">{lawyerProfile.rating_count}</div>
                <p className="text-neutral-400 text-body-sm">Reviews</p>
              </Card>
            </div>
          )}

          {/* No profile prompt */}
          {noProfile && (
            <Card className="p-8 border border-gold-400/30">
              <h3 className="font-heading text-body-lg text-neutral-50 mb-2">Professional Profile Not Set Up</h3>
              <p className="text-neutral-400 text-body-sm mb-4">
                Create your professional profile to appear in client searches and accept cases.
              </p>
              <Link href="/lawyer/office/me/settings">
                <Button variant="gold">Set Up Professional Profile</Button>
              </Link>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
