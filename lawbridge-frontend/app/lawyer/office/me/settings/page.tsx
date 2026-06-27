'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '../../../../../components/ui/Card'
import Button from '../../../../../components/ui/Button'
import Input from '../../../../../components/ui/Input'
import { api } from '../../../../../lib/api'
import { getMyFirmMemberships, type FirmMembership } from '../../../../../lib/firmsApi'

type Me = { id: string; email: string; full_name: string; role: string }

type LawyerProfile = {
  id: string
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

type ProfessionalForm = {
  specialization: string
  qualifications: string
  bio: string
  bar_number: string
  years_of_experience: string
  bijural_flag: string
  consultation_fee: string
  availability_status: string
}

const BIJURAL_OPTIONS = [
  { value: 'common_law', label: 'Common Law (Anglophone)' },
  { value: 'civil_law', label: 'Civil Law (Francophone)' },
  { value: 'both', label: 'Both Traditions' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
]

const EMPTY_PROF_FORM: ProfessionalForm = {
  specialization: '',
  qualifications: '',
  bio: '',
  bar_number: '',
  years_of_experience: '',
  bijural_flag: 'common_law',
  consultation_fee: '',
  availability_status: 'available',
}

function profileToForm(p: LawyerProfile): ProfessionalForm {
  return {
    specialization: p.specialization || '',
    qualifications: p.qualifications || '',
    bio: p.bio || '',
    bar_number: p.bar_number || '',
    years_of_experience: p.years_of_experience?.toString() ?? '',
    bijural_flag: p.bijural_flag || 'common_law',
    consultation_fee: p.consultation_fee || '',
    availability_status: p.availability_status || 'available',
  }
}

export default function MyOfficeSettingsPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [lawyerProfile, setLawyerProfile] = useState<LawyerProfile | null>(null)
  const [membership, setMembership] = useState<FirmMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [noLawyerProfile, setNoLawyerProfile] = useState(false)

  // Auth section
  const [editingAuth, setEditingAuth] = useState(false)
  const [authName, setAuthName] = useState('')
  const [authSaveLoading, setAuthSaveLoading] = useState(false)
  const [authSaveError, setAuthSaveError] = useState('')
  const [authSaveSuccess, setAuthSaveSuccess] = useState(false)

  // Professional profile section
  const [editingProf, setEditingProf] = useState(false)
  const [profForm, setProfForm] = useState<ProfessionalForm>(EMPTY_PROF_FORM)
  const [profSaveLoading, setProfSaveLoading] = useState(false)
  const [profSaveError, setProfSaveError] = useState('')
  const [profSaveSuccess, setProfSaveSuccess] = useState(false)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { setLoading(false); return }

      try {
        const meData = await api.get<Me>('auth', '/auth/me/', access)
        if (!mounted) return
        setMe(meData)
        setAuthName(meData.full_name || '')
      } catch {
        if (mounted) setLoading(false)
        return
      }

      await Promise.allSettled([
        api.get<LawyerProfile>('lawyer', '/lawyers/me/', access)
          .then(p => {
            if (!mounted) return
            setLawyerProfile(p)
            setProfForm(profileToForm(p))
          })
          .catch(() => {
            if (mounted) setNoLawyerProfile(true)
          }),

        getMyFirmMemberships(access)
          .then(memberships => {
            if (!mounted) return
            const userId = localStorage.getItem('authUserId')
            const current = memberships.find(m => String(m.user) === userId) ?? memberships[0] ?? null
            setMembership(current)
          })
          .catch(() => {}),
      ])

      if (mounted) setLoading(false)
    }
    void run()
    return () => { mounted = false }
  }, [])

  const handleAuthSave = async () => {
    const access = localStorage.getItem('access')
    if (!access) return
    setAuthSaveLoading(true)
    setAuthSaveError('')
    setAuthSaveSuccess(false)
    try {
      await api.patch<Me>('auth', '/auth/me/', { full_name: authName }, access)
      setMe(prev => prev ? { ...prev, full_name: authName } : prev)
      setAuthSaveSuccess(true)
      setEditingAuth(false)
    } catch (cause) {
      setAuthSaveError(cause instanceof Error ? cause.message : 'Failed to save')
    } finally {
      setAuthSaveLoading(false)
    }
  }

  const handleProfSave = async () => {
    const access = localStorage.getItem('access')
    if (!access) return
    setProfSaveLoading(true)
    setProfSaveError('')
    setProfSaveSuccess(false)

    const payload = {
      ...profForm,
      years_of_experience: parseInt(profForm.years_of_experience, 10) || 0,
      consultation_fee: profForm.consultation_fee || '0',
    }

    try {
      if (noLawyerProfile) {
        const created = await api.post<LawyerProfile>('lawyer', '/lawyers/me/', payload, access)
        setLawyerProfile(created)
        setNoLawyerProfile(false)
      } else {
        const updated = await api.put<LawyerProfile>('lawyer', '/lawyers/me/', payload, access)
        setLawyerProfile(updated)
      }
      setProfSaveSuccess(true)
      setEditingProf(false)
    } catch (cause) {
      setProfSaveError(cause instanceof Error ? cause.message : 'Failed to save')
    } finally {
      setProfSaveLoading(false)
    }
  }

  const handleProfChange = (field: keyof ProfessionalForm, value: string) => {
    setProfForm(prev => ({ ...prev, [field]: value }))
  }

  const startEditingProf = () => {
    if (lawyerProfile) setProfForm(profileToForm(lawyerProfile))
    else setProfForm(EMPTY_PROF_FORM)
    setProfSaveError('')
    setProfSaveSuccess(false)
    setEditingProf(true)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h2 className="font-display text-display-md text-neutral-50">Office Settings</h2>
        <p className="mt-1 text-neutral-400">Manage your account and professional profile</p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-12 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading settings…
        </div>
      )}

      {!loading && me && (
        <>
          {/* ── Account Card ── */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <h3 className="font-heading text-body-lg text-neutral-50">Account</h3>
              {!editingAuth && (
                <Button variant="outline" size="sm" onClick={() => { setEditingAuth(true); setAuthSaveSuccess(false) }}>
                  Edit
                </Button>
              )}
            </div>

            {editingAuth ? (
              <div className="space-y-4">
                <Input
                  label="Full name"
                  value={authName}
                  onChange={e => setAuthName(e.target.value)}
                />
                <Input label="Email" value={me.email} disabled />
                {authSaveError && <p className="text-crimson-300 text-sm">{authSaveError}</p>}
                <div className="flex gap-3">
                  <Button variant="gold" size="sm" onClick={handleAuthSave} disabled={authSaveLoading}>
                    {authSaveLoading ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditingAuth(false); setAuthName(me.full_name || '') }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Full name</p>
                  <p className="text-neutral-100">{me.full_name || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Email</p>
                  <p className="text-neutral-100">{me.email}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Role</p>
                  <p className="text-neutral-100 capitalize">{me.role}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">User ID</p>
                  <p className="text-neutral-100 font-mono text-xs">{me.id}</p>
                </div>
              </div>
            )}

            {authSaveSuccess && !editingAuth && (
              <p className="mt-4 text-emerald-400 text-sm">Account updated successfully.</p>
            )}
          </Card>

          {/* ── Professional Profile Card ── */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-heading text-body-lg text-neutral-50">Professional Profile</h3>
                {noLawyerProfile && !editingProf && (
                  <p className="text-neutral-400 text-sm mt-1">
                    No professional profile yet — create one to appear in client searches.
                  </p>
                )}
              </div>
              {!editingProf && (
                <Button
                  variant={noLawyerProfile ? 'gold' : 'outline'}
                  size="sm"
                  onClick={startEditingProf}
                >
                  {noLawyerProfile ? 'Create Profile' : 'Edit'}
                </Button>
              )}
            </div>

            {editingProf ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Specialization"
                    value={profForm.specialization}
                    onChange={e => handleProfChange('specialization', e.target.value)}
                    placeholder="e.g. Family Law, Criminal Law"
                  />
                  <Input
                    label="Bar Number"
                    value={profForm.bar_number}
                    onChange={e => handleProfChange('bar_number', e.target.value)}
                    placeholder="e.g. CMR-2023-001"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Years of Experience"
                    type="number"
                    value={profForm.years_of_experience}
                    onChange={e => handleProfChange('years_of_experience', e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label="Consultation Fee (XAF)"
                    type="number"
                    value={profForm.consultation_fee}
                    onChange={e => handleProfChange('consultation_fee', e.target.value)}
                    placeholder="e.g. 25000"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2.5 text-label-md text-neutral-200 font-semibold tracking-wide block text-xs uppercase">
                      Legal Tradition
                    </label>
                    <select
                      value={profForm.bijural_flag}
                      onChange={e => handleProfChange('bijural_flag', e.target.value)}
                      className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50
                       border border-neutral-700/50 transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-400
                       hover:border-neutral-600/50 font-body text-body-md"
                    >
                      {BIJURAL_OPTIONS.map(o => (
                        <option key={o.value} value={o.value} className="bg-primary-900">{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2.5 text-label-md text-neutral-200 font-semibold tracking-wide block text-xs uppercase">
                      Availability
                    </label>
                    <select
                      value={profForm.availability_status}
                      onChange={e => handleProfChange('availability_status', e.target.value)}
                      className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50
                       border border-neutral-700/50 transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-400
                       hover:border-neutral-600/50 font-body text-body-md"
                    >
                      {AVAILABILITY_OPTIONS.map(o => (
                        <option key={o.value} value={o.value} className="bg-primary-900">{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2.5 text-label-md text-neutral-200 font-semibold tracking-wide block text-xs uppercase">
                    Bio
                  </label>
                  <textarea
                    value={profForm.bio}
                    onChange={e => handleProfChange('bio', e.target.value)}
                    rows={4}
                    placeholder="Brief description of your practice and approach..."
                    className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50 placeholder:text-neutral-500
                     border border-neutral-700/50 transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-400
                     hover:border-neutral-600/50 font-body text-body-md"
                  />
                </div>

                <div>
                  <label className="mb-2.5 text-label-md text-neutral-200 font-semibold tracking-wide block text-xs uppercase">
                    Qualifications
                  </label>
                  <textarea
                    value={profForm.qualifications}
                    onChange={e => handleProfChange('qualifications', e.target.value)}
                    rows={3}
                    placeholder="Degrees, certifications, and professional memberships..."
                    className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50 placeholder:text-neutral-500
                     border border-neutral-700/50 transition-all duration-200
                     focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-400
                     hover:border-neutral-600/50 font-body text-body-md"
                  />
                </div>

                {profSaveError && (
                  <div className="rounded-xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-200">
                    {profSaveError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="gold" size="sm" onClick={handleProfSave} disabled={profSaveLoading}>
                    {profSaveLoading ? 'Saving…' : noLawyerProfile ? 'Create Profile' : 'Save changes'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProf(false)
                      setProfSaveError('')
                      if (lawyerProfile) setProfForm(profileToForm(lawyerProfile))
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : lawyerProfile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Specialization</p>
                    <p className="text-neutral-100">{lawyerProfile.specialization || '—'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Bar Number</p>
                    <p className="text-neutral-100 font-mono">{lawyerProfile.bar_number || '—'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Years of Experience</p>
                    <p className="text-neutral-100">{lawyerProfile.years_of_experience ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Consultation Fee</p>
                    <p className="text-neutral-100">
                      {lawyerProfile.consultation_fee
                        ? `${Number(lawyerProfile.consultation_fee).toLocaleString()} XAF`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Legal Tradition</p>
                    <p className="text-neutral-100">
                      {BIJURAL_OPTIONS.find(o => o.value === lawyerProfile.bijural_flag)?.label ?? lawyerProfile.bijural_flag}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Availability</p>
                    <p className="text-neutral-100 capitalize">
                      {lawyerProfile.availability_status?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Active Cases</p>
                    <p className="text-neutral-100">{lawyerProfile.active_cases}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Average Rating</p>
                    <p className="text-neutral-100">
                      {Number(lawyerProfile.average_rating).toFixed(1)} ({lawyerProfile.rating_count} reviews)
                    </p>
                  </div>
                  {lawyerProfile.verified_at && (
                    <div>
                      <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Verified</p>
                      <p className="text-emerald-400 text-xs">{new Date(lawyerProfile.verified_at).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {lawyerProfile.bio && (
                  <div className="pt-2 border-t border-neutral-700/30">
                    <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Bio</p>
                    <p className="text-neutral-300 text-sm whitespace-pre-wrap">{lawyerProfile.bio}</p>
                  </div>
                )}

                {lawyerProfile.qualifications && (
                  <div className="pt-2 border-t border-neutral-700/30">
                    <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Qualifications</p>
                    <p className="text-neutral-300 text-sm whitespace-pre-wrap">{lawyerProfile.qualifications}</p>
                  </div>
                )}
              </div>
            ) : null}

            {profSaveSuccess && !editingProf && (
              <p className="mt-4 text-emerald-400 text-sm">Professional profile saved successfully.</p>
            )}
          </Card>

          {/* ── Firm Membership Card ── */}
          {membership && (
            <Card className="p-6">
              <h3 className="font-heading text-body-lg text-neutral-50 mb-4">Firm Membership</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Firm</p>
                  <p className="text-neutral-100">Firm #{membership.firm}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Role in firm</p>
                  <p className="text-neutral-100 capitalize">{membership.role?.replace(/_/g, ' ')}</p>
                </div>
                {membership.user_email && (
                  <div>
                    <p className="text-neutral-400 text-xs uppercase tracking-wide mb-1">Work email</p>
                    <p className="text-neutral-100">{membership.user_email}</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
