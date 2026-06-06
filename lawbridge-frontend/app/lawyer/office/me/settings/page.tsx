'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '../../../../../components/ui/Card'
import Button from '../../../../../components/ui/Button'
import Input from '../../../../../components/ui/Input'
import { api } from '../../../../../lib/api'
import { getMyFirmMemberships, type FirmMembership } from '../../../../../lib/firmsApi'

type Me = { id: string; email: string; full_name: string; role: string }

export default function MyOfficeSettingsPage() {
  const [me, setMe] = useState<Me | null>(null)
  const [membership, setMembership] = useState<FirmMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { setLoading(false); return }
      try {
        const meData = await api.get<Me>('auth', '/auth/me/', access)
        if (!mounted) return
        setMe(meData)
        setName(meData.full_name || '')

        const memberships = await getMyFirmMemberships(access)
        const userId = localStorage.getItem('authUserId')
        const current = memberships.find(m => String(m.user) === userId) ?? memberships[0] ?? null
        if (mounted) setMembership(current)
      } catch {
        // non-fatal
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => { mounted = false }
  }, [])

  const handleSave = async () => {
    const access = localStorage.getItem('access')
    if (!access) return
    setSaveLoading(true)
    setSaveError('')
    setSaveSuccess(false)
    try {
      await api.patch<Me>('auth', '/auth/me/', { full_name: name }, access)
      setMe(prev => prev ? { ...prev, full_name: name } : prev)
      setSaveSuccess(true)
      setEditing(false)
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : 'Failed to save')
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h2 className="font-display text-display-md text-neutral-50">Office Settings</h2>
        <p className="mt-1 text-neutral-400">Your profile and firm membership details</p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-12 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading settings…
        </div>
      )}

      {!loading && me && (
        <>
          {/* Profile card */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <h3 className="font-heading text-body-lg text-neutral-50">Profile</h3>
              {!editing && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <Input
                  label="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <Input
                  label="Email"
                  value={me.email}
                  disabled
                />
                {saveError && (
                  <p className="text-crimson-300 text-sm">{saveError}</p>
                )}
                <div className="flex gap-3">
                  <Button variant="gold" size="sm" onClick={handleSave} disabled={saveLoading}>
                    {saveLoading ? 'Saving…' : 'Save changes'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditing(false); setName(me.full_name || '') }}>
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

            {saveSuccess && !editing && (
              <p className="mt-4 text-emerald-400 text-sm">Profile updated successfully.</p>
            )}
          </Card>

          {/* Firm membership card */}
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
