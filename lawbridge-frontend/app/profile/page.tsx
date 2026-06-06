'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card from '../../components/ui/Card'
import { LogoutIcon, UserIcon } from '../../components/icons/Icons'
import { api } from '../../lib/api'
import { clearSession } from '../../lib/authSession'

type AuthMe = {
  id: string
  email: string
  full_name: string
  role: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    accountType: 'Client',
    bio: 'Client account for tracking matters, receiving updates, and managing documents securely.',
    location: '',
  })

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        setError('Please sign in to view your profile.')
        setLoading(false)
        return
      }

      try {
        const me = await api.get<AuthMe>('auth', '/auth/me/', access)
        const parts = (me.full_name || '').trim().split(/\s+/)
        setProfile(prev => ({
          ...prev,
          firstName: parts[0] || me.full_name || 'Client',
          lastName: parts.slice(1).join(' '),
          email: me.email,
          accountType: me.role?.toLowerCase() === 'client' ? 'Client' : me.role,
        }))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load profile')
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [])

  const initials = useMemo(() => {
    const first = profile.firstName?.[0] || profile.email?.[0] || 'U'
    const last = profile.lastName?.[0] || ''
    return `${first}${last}`.toUpperCase()
  }, [profile.firstName, profile.lastName, profile.email])

  const handleChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const access = localStorage.getItem('access')
    if (!access) return
    setSaveLoading(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      await api.patch('auth', '/auth/me/', {
        full_name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
      }, access)
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

  return (
    <main className="space-y-8 max-w-4xl w-full">
      {loading && (
        <Card className="p-6">
          <p className="text-neutral-300">Loading your profile...</p>
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
            <p className="text-neutral-400">Manage your matters, documents, and communication preferences</p>
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
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-neutral-900 text-2xl sm:text-3xl font-display">
                {initials}
              </div>
            </div>

            <div className="flex-1">
              <h2 className="font-display text-display-sm text-neutral-50 mb-1">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gold-400 text-body-lg mb-4">{profile.accountType} Account</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
                <div>
                  <p className="text-neutral-400">Email</p>
                  <p className="text-neutral-200">{profile.email}</p>
                </div>
                <div>
                  <p className="text-neutral-400">Phone</p>
                  <p className="text-neutral-200">{profile.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-400">Organization</p>
                  <p className="text-neutral-200">{profile.organization || '—'}</p>
                </div>
                <div>
                  <p className="text-neutral-400">Location</p>
                  <p className="text-neutral-200">{profile.location || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Form */}
      {!loading && !error && editing && (
        <Card className="p-8 border-gold-400/50">
          <h3 className="font-heading text-body-lg text-neutral-50 mb-6">Edit Client Account</h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={profile.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
              />
              <Input
                label="Last Name"
                value={profile.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
              <Input
                label="Phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Organization"
                value={profile.organization}
                onChange={(e) => handleChange('organization', e.target.value)}
              />
              <Input
                label="Location"
                value={profile.location}
                onChange={(e) => handleChange('location', e.target.value)}
              />
            </div>

            <div>
              <label className="mb-2.5 text-label-md text-neutral-200 font-semibold tracking-wide block">
                Account Notes
              </label>
              <textarea
                value={profile.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                rows={4}
                className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50 placeholder:text-neutral-500
                 border border-neutral-700/50 transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-400
                 hover:border-neutral-600/50 hover:bg-primary-800/50 font-body text-body-md"
                placeholder="Add notes about your preferred communication style..."
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
          <Card className="p-6 text-center">
            <div className="font-display text-display-sm text-gold-400 mb-2">3</div>
            <p className="text-neutral-400">Open Matters</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="font-display text-display-sm text-emerald-500 mb-2">18</div>
            <p className="text-neutral-400">Shared Files</p>
          </Card>
          <Card className="p-6 text-center">
            <div className="font-display text-display-sm text-primary-400 mb-2">12</div>
            <p className="text-neutral-400">Unread Updates</p>
          </Card>
        </div>
      )}

      {/* Account Settings */}
      {!loading && !error && (
        <Card className="p-8">
          <h3 className="font-heading text-body-lg text-neutral-50 mb-6">Client Preferences</h3>

          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border border-neutral-700/30 rounded-lg hover:border-neutral-600/50 transition-colors">
              <div>
                <p className="font-heading text-body-md text-neutral-50">Password</p>
                <p className="text-neutral-400 text-body-sm">Update your login password for account security</p>
              </div>
              <Button variant="outline" size="sm">Change</Button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border border-neutral-700/30 rounded-lg hover:border-neutral-600/50 transition-colors">
              <div>
                <p className="font-heading text-body-md text-neutral-50">Two-Factor Authentication</p>
                <p className="text-neutral-400 text-body-sm">Protect your account with an extra verification step</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 border border-neutral-700/30 rounded-lg hover:border-neutral-600/50 transition-colors">
              <div>
                <p className="font-heading text-body-md text-neutral-50">Email Notifications</p>
                <p className="text-neutral-400 text-body-sm">Receive matter updates and important reminders</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
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

      {/* Logout Button */}
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
