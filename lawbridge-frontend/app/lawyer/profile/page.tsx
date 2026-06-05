"use client"

import React, { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { getMyFirmMemberships, type FirmMembership } from '../../../lib/firmsApi'
import { Card } from '../../../components/ui/Card'

export default function LawyerProfilePage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [firm, setFirm] = useState<FirmMembership | null>(null)

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) return

      try {
        const me = await api.get<{ email: string; full_name: string; role: string }>('auth', '/auth/me/', access)
        setEmail(me.email)
        setName(me.full_name || me.email)
        setRole(me.role)

        const memberships = await getMyFirmMemberships(access)
        setFirm(memberships[0] ?? null)
      } catch {
        setFirm(null)
      }
    }

    void run()
  }, [])

  return (
    <div className="space-y-6 max-w-4xl w-full">
      <div>
        <h1 className="font-display text-display-md text-neutral-50">Firm Settings</h1>
        <p className="text-neutral-400">Manage your profile, assigned firm, and practice preferences.</p>
      </div>

      <Card className="p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
          <div>
            <p className="text-neutral-400">Name</p>
            <p className="text-neutral-200">{name || 'Loading...'}</p>
          </div>
          <div>
            <p className="text-neutral-400">Role</p>
            <p className="text-neutral-200">{role || 'Loading...'}</p>
          </div>
          <div>
            <p className="text-neutral-400">Email</p>
            <p className="text-neutral-200">{email || 'Loading...'}</p>
          </div>
          <div>
            <p className="text-neutral-400">Firm membership</p>
            <p className="text-neutral-200">{firm ? `Firm #${firm.firm} · ${firm.role}` : 'No firm membership yet'}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}