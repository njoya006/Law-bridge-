'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { LogoutIcon } from '../../components/icons/Icons'
import AvatarUploader from '../../components/ui/AvatarUploader'
import { api } from '../../lib/api'
import { clearSession } from '../../lib/authSession'
import { getMyCases } from '../../lib/casesApi'
import { listDocuments } from '../../lib/documentsApi'
import { unreadNotificationCount } from '../../lib/notificationsApi'

type AuthMe = {
  id: string
  email: string
  full_name: string
  role: string
  avatar_url?: string | null
}

type ClientProfile = {
  id: string
  user_id: string
  full_name_en: string
  full_name_fr: string
  phone: string
  organization: string
  location: string
  monthly_income: string | null
  dependants: number
  employment_status: string
  eligibility_score: number | null
  case_count: number
  qualifies_for_aid: boolean
}

const EMPLOYMENT_OPTIONS = [
  { value: 'employed', label: 'Employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'student', label: 'Student' },
  { value: 'other', label: 'Other' },
]

export default function ProfilePage() {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [openMatters, setOpenMatters] = useState<number | null>(null)
  const [sharedFiles, setSharedFiles] = useState<number | null>(null)
  const [unreadUpdates, setUnreadUpdates] = useState<number | null>(null)
  const [clientProfileExists, setClientProfileExists] = useState(false)

  const [authData, setAuthData] = useState({ id: '', email: '', full_name: '', role: '' })
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    location: '',
    monthly_income: '',
    dependants: 0,
    employment_status: 'other',
  })
  const [eligibility, setEligibility] = useState<{
    score: number | null
    qualifies: boolean
  }>({ score: null, qualifies: false })

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        setError('Please sign in to view your profile.')
        setLoading(false)
        return
      }

      setAccessToken(access)
      try {
        const me = await api.get<AuthMe>('auth', '/auth/me/', access)
        const parts = (me.full_name || '').trim().split(/\s+/)
        setAuthData({ id: me.id, email: me.email, full_name: me.full_name, role: me.role })
        setAvatarUrl(me.avatar_url ?? null)
        setForm(prev => ({
          ...prev,
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' '),
          email: me.email,
        }))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load profile')
        setLoading(false)
        return
      }

      // Load client profile from client-service
      try {
        const cp = await api.get<ClientProfile>('client', '/clients/me/', access)
        setClientProfileExists(true)
        setForm(prev => ({
          ...prev,
          phone: cp.phone || '',
          organization: cp.organization || '',
          location: cp.location || '',
          monthly_income: cp.monthly_income ?? '',
          dependants: cp.dependants ?? 0,
          employment_status: cp.employment_status || 'other',
        }))
        setEligibility({ score: cp.eligibility_score, qualifies: cp.qualifies_for_aid })
      } catch {
        // 404 means no client profile yet — that's fine, we'll create on first save
        setClientProfileExists(false)
      }

      setLoading(false)

      // Load activity stats independently
      void getMyCases(access).then(data => {
        const open = data.results.filter(c => c.status !== 'closed').length
        setOpenMatters(open)
        void Promise.all(data.results.map(c => listDocuments(c.id, access).catch(() => ({ count: 0 }))))
          .then(docs => setSharedFiles(docs.reduce((sum, d) => sum + (d.count ?? 0), 0)))
      }).catch(() => {})

      void unreadNotificationCount(access)
        .then(data => setUnreadUpdates(data.unread ?? (data as unknown as {unread_count?: number}).unread_count ?? 0))
        .catch(() => {})
    }

    void run()
  }, [])

  const initials = useMemo(() => {
    const first = form.firstName?.[0] || form.email?.[0] || 'U'
    const last = form.lastName?.[0] || ''
    return `${first}${last}`.toUpperCase()
  }, [form.firstName, form.lastName, form.email])

  const displayName = `${form.firstName} ${form.lastName}`.trim() || form.email

  const handleChange = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const access = localStorage.getItem('access')
    if (!access) return
    setSaveLoading(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      // Update name/email in auth-service
      await api.patch('auth', '/auth/me/', {
        full_name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
      }, access)

      // Upsert contact/eligibility data in client-service
      const clientPayload = {
        full_name_en: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone,
        organization: form.organization,
        location: form.location,
        monthly_income: form.monthly_income === '' ? null : form.monthly_income,
        dependants: form.dependants,
        employment_status: form.employment_status,
      }

      if (clientProfileExists) {
        await api.put('client', '/clients/me/', clientPayload, access)
      } else {
        await api.post('client', '/clients/me/', clientPayload, access)
        setClientProfileExists(true)
      }

      setSaveSuccess(true)
      setEditing(false)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Failed to save changes')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleLogout = () => {
    clearSession()
    router.push('/auth/login')
  }

  const employmentLabel = EMPLOYMENT_OPTIONS.find(o => o.value === form.employment_status)?.label ?? form.employment_status

  return (
    <main className="space-y-8 max-w-4xl w-full">
      {loading && (
        <Card className="p-6">
          <div className="flex items-center gap-2 text-neutral-400">
            <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
            Loading your profile...
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card className="p-6 border border-crimson-500/30">
          <p className="text-crimson-300">{error}</p>
        </Card>
      )}

      {/* Header */}
      {!loading && !error && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-display-md text-neutral-50">Client Account</h1>
            <p className="text-neutral-400">Manage your matters, documents, and contact details</p>
          </div>
          {!editing && (
            <Button variant="primary" onClick={() => setEditing(true)}>
              Edit Account
            </Button>
          )}
        </div>
      )}

      {/* Profile Overview Card */}
      {!loading && !error && (
        <Card className="p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex-shrink-0 self-center sm:self-auto">
              <AvatarUploader
                currentUrl={avatarUrl}
                initials={initials}
                size="md"
                token={accessToken}
                onUploaded={(url) => {
                  setAvatarUrl(url)
                  localStorage.setItem('avatarUrl', url)
                }}
              />
              <p className="text-center text-xs text-neutral-500 mt-2">Click to change photo</p>
            </div>

            <div className="flex-1">
              <h2 className="font-display text-display-sm text-neutral-50 mb-1">{displayName}</h2>
              <p className="text-gold-400 text-body-lg mb-4">Client Account</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
                <div>
                  <p className="text-neutral-400">Email</p>
                  <p className="text-neutral-200">{form.email}</p>
                </div>
                <div>
                  <p className="text-neutral-400">Phone</p>
                  <p className="text-neutral-200">{form.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-400">Organization</p>
                  <p className="text-neutral-200">{form.organization || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-400">Location</p>
                  <p className="text-neutral-200">{form.location || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-400">Employment</p>
                  <p className="text-neutral-200">{employmentLabel}</p>
                </div>
                {form.monthly_income !== '' && (
                  <div>
                    <p className="text-neutral-400">Monthly Income</p>
                    <p className="text-neutral-200">
                      {form.monthly_income ? `${Number(form.monthly_income).toLocaleString()} XAF` : '—'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Form */}
      {!loading && !error && editing && (
        <Card className="p-8 border-gold-400/50">
          <h3 className="font-heading text-body-lg text-neutral-50 mb-6">Edit Account Details</h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
              />
              <Input
                label="Last Name"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
              <Input
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Organization"
                value={form.organization}
                onChange={(e) => handleChange('organization', e.target.value)}
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(e) => handleChange('location', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-2.5 text-label-md text-neutral-200 font-semibold tracking-wide block">
                  Employment Status
                </label>
                <select
                  value={form.employment_status}
                  onChange={(e) => handleChange('employment_status', e.target.value)}
                  className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50
                   border border-neutral-700/50 transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-400
                   hover:border-neutral-600/50 font-body text-body-md"
                >
                  {EMPLOYMENT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value} className="bg-primary-900">{o.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Monthly Income (XAF)"
                type="number"
                value={form.monthly_income?.toString() ?? ''}
                onChange={(e) => handleChange('monthly_income', e.target.value)}
                placeholder="e.g. 150000"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Dependants"
                type="number"
                value={form.dependants.toString()}
                onChange={(e) => handleChange('dependants', parseInt(e.target.value, 10) || 0)}
                placeholder="0"
              />
            </div>

            {saveError && (
              <div className="rounded-xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-200">
                {saveError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button variant="gold" onClick={handleSave} disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(false); setSaveError('') }}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {saveSuccess && !editing && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Profile updated successfully.
        </div>
      )}

      {/* Stats Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/cases" className="block group">
            <Card className="p-6 text-center transition-colors group-hover:border-gold-400/40">
              <div className="font-display text-display-sm text-gold-400 mb-2">
                {openMatters === null ? '—' : openMatters}
              </div>
              <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Open Matters</p>
            </Card>
          </Link>
          <Link href="/documents" className="block group">
            <Card className="p-6 text-center transition-colors group-hover:border-emerald-500/40">
              <div className="font-display text-display-sm text-emerald-500 mb-2">
                {sharedFiles === null ? '—' : sharedFiles}
              </div>
              <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Shared Files</p>
            </Card>
          </Link>
          <Link href="/analyses" className="block group">
            <Card className="p-6 text-center transition-colors group-hover:border-primary-400/40">
              <div className="font-display text-display-sm text-primary-400 mb-2">
                {unreadUpdates === null ? '—' : unreadUpdates}
              </div>
              <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Unread Updates</p>
            </Card>
          </Link>
        </div>
      )}

      {/* Legal Aid Eligibility */}
      {!loading && !error && clientProfileExists && (
        <Card className="p-8">
          <h3 className="font-heading text-body-lg text-neutral-50 mb-4">Legal Aid Eligibility</h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
              <div>
                <p className="text-neutral-400">Eligibility Score</p>
                <p className="text-neutral-200 font-display text-xl">
                  {eligibility.score !== null ? `${eligibility.score} / 100` : '—'}
                </p>
              </div>
              <div>
                <p className="text-neutral-400">Status</p>
                {eligibility.score === null ? (
                  <p className="text-neutral-400 text-sm">Not yet computed</p>
                ) : eligibility.qualifies ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-300">
                    Qualifies for Legal Aid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-700/50 px-3 py-1 text-sm font-medium text-neutral-300">
                    Does Not Qualify
                  </span>
                )}
              </div>
            </div>
            {eligibility.score === null && (
              <p className="text-neutral-500 text-sm">
                Fill in your income and employment details to compute your eligibility score.
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Account Settings */}
      {!loading && !error && (
        <Card className="p-8">
          <h3 className="font-heading text-body-lg text-neutral-50 mb-6">Account Security & Settings</h3>

          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border border-neutral-700/30 rounded-lg hover:border-neutral-600/50 transition-colors">
              <div>
                <p className="font-heading text-body-md text-neutral-50">Password</p>
                <p className="text-neutral-400 text-body-sm">Update your login password</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/settings?tab=security')}>Change</Button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border border-neutral-700/30 rounded-lg hover:border-neutral-600/50 transition-colors">
              <div>
                <p className="font-heading text-body-md text-neutral-50">Email Notifications</p>
                <p className="text-neutral-400 text-body-sm">Receive matter updates and important reminders</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/settings')}>Configure</Button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border border-neutral-700/30 rounded-lg hover:border-neutral-600/50 transition-colors">
              <div>
                <p className="font-heading text-body-md text-neutral-50">Language & Privacy</p>
                <p className="text-neutral-400 text-body-sm">Set your preferred language and privacy preferences</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/settings?tab=language')}>Manage</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Danger Zone */}
      {!loading && !error && (
        <Card className="p-8 border border-crimson-500/30">
          <h3 className="font-heading text-body-lg text-crimson-400 mb-6">Danger Zone</h3>

          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border border-crimson-500/20 rounded-lg">
              <div>
                <p className="font-heading text-body-md text-neutral-50">Delete Account</p>
                <p className="text-neutral-400 text-body-sm">Permanently delete this client account and all data</p>
              </div>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Logout */}
      {!loading && !error && (
        <div className="flex justify-center">
          <Button variant="destructive" size="lg" onClick={handleLogout}>
            <LogoutIcon width={18} height={18} />
            Logout
          </Button>
        </div>
      )}
    </main>
  )
}
