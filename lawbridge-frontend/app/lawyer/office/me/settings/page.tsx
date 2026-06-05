'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '../../../../../components/ui/Card'
import { api } from '../../../../../lib/api'
import { getMyFirmMemberships } from '../../../../../lib/firmsApi'

export default function MyOfficeSettingsPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [firmLabel, setFirmLabel] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) return

      try {
        const me = await api.get<{ email: string; full_name: string; role: string }>('auth', '/auth/me/', access)
        setName(me.full_name || me.email)
        setEmail(me.email)

        const memberships = await getMyFirmMemberships(access)
        const current = memberships[0]
        if (current) {
          setFirmLabel(`Firm #${current.firm} · ${current.role}`)
        }
      } catch {
        setFirmLabel('No active firm membership')
      }
    }

    void run()
  }, [])

  return (
    <div>
      <h2 className="font-display text-display-md">Office Settings</h2>
      <div className="mt-4">
        <Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-primary-300">Name</p>
              <p>{name || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-primary-300">Email</p>
              <p>{email || 'Loading...'}</p>
            </div>
            <div>
              <p className="text-primary-300">Firm membership</p>
              <p>{firmLabel || 'Loading...'}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
