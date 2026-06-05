"use client"

import React, { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { getFirmMembers, getMyFirmMemberships, type FirmMembership } from '../../../lib/firmsApi'

export default function LawyerTeamPage() {
  const [members, setMembers] = useState<FirmMembership[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        setError('Sign in as a lawyer to view the team.')
        return
      }

      try {
        const memberships = await getMyFirmMemberships(access)
        const primary = memberships[0]
        if (!primary) {
          setMembers([])
          return
        }
        setMembers(await getFirmMembers(primary.firm, access))
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load team')
      }
    }

    void run()
  }, [])

  return (
    <div>
      <h2 className="font-display text-display-md">Team</h2>
      <p className="mt-2 text-sm text-primary-300">Live firm members from the firms service.</p>
      {error && <Card className="mt-4 border border-crimson-500/30 text-crimson-200">{error}</Card>}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.length === 0 && !error && <Card>No team members yet.</Card>}
        {members.map(member => (
          <Card key={member.id}>
            <div className="font-semibold">User #{member.user}</div>
            <div className="mt-2 text-xs text-primary-300">{member.user_email ?? 'No email'}</div>
            <div className="mt-2 text-sm text-primary-200">{member.role}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}