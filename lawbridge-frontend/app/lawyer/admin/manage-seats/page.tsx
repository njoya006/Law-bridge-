'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '../../../../components/ui/Card'
import {
  getFirmMembers,
  getMyFirmMemberships,
  inviteFirmMember,
  removeFirmMember,
  unassignFirmMember,
  updateFirmMemberRole,
  type FirmMembership,
} from '../../../../lib/firmsApi'

const roleOptions = [
  { label: 'Associate', value: 'associate' },
  { label: 'Partner', value: 'partner' },
  { label: 'Firm Admin', value: 'firm_admin' },
]

export default function ManageSeatsPage() {
  const [firmId, setFirmId] = useState<number | null>(null)
  const [members, setMembers] = useState<FirmMembership[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('associate')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const refreshMembers = async (firm: number, accessToken: string) => {
    const nextMembers = await getFirmMembers(firm, accessToken)
    setMembers(nextMembers)
  }

  useEffect(() => {
    const accessToken = localStorage.getItem('access')
    setToken(accessToken)

    if (!accessToken) {
      setError('Sign in again to manage firm seats.')
      setLoading(false)
      return
    }

    let cancelled = false

    const loadData = async () => {
      try {
        const memberships = await getMyFirmMemberships(accessToken)
        if (cancelled) return

        const primary = memberships.find(membership => ['owner', 'firm_admin', 'partner'].includes(membership.role)) ?? memberships[0] ?? null
        if (!primary) {
          setFirmId(null)
          setMembers([])
          setError('You are not assigned to a firm.')
          return
        }

        setFirmId(primary.firm)
        setError(null)
        await refreshMembers(primary.firm, accessToken)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load firm members.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [])

  const changeRole = async (memberId: number, role: string) => {
    if (!token || !firmId) return
    await updateFirmMemberRole(memberId, role, token)
    await refreshMembers(firmId, token)
  }

  const unassign = async (memberId: number) => {
    if (!token || !firmId) return
    await unassignFirmMember(memberId, token)
    await refreshMembers(firmId, token)
  }

  const remove = async (memberId: number) => {
    if (!token || !firmId) return
    if (!confirm('Remove this user from the workspace? This will unassign their matters.')) return
    await removeFirmMember(memberId, token)
    await refreshMembers(firmId, token)
  }

  const exportCSV = () => {
    const rows = [['id', 'user', 'email', 'role', 'firm']]
    for (const member of members) rows.push([String(member.id), String(member.user), member.user_email ?? '', member.role ?? '', String(member.firm)])
    const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `firm-${firmId}-members.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const invite = async () => {
    if (!token || !firmId || !inviteEmail.trim()) return
    await inviteFirmMember(firmId, { email: inviteEmail.trim(), role: inviteRole }, token)
    setInviteEmail('')
    setInviteRole('associate')
    await refreshMembers(firmId, token)
  }

  if (loading) {
    return <div>Loading firm seats...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  if (!firmId) {
    return <div>You are not assigned to a firm.</div>
  }

  return (
    <div>
      <h1 className="font-display text-2xl">Manage Seats</h1>
      <p className="text-sm text-primary-300">Invite associates, change roles, and manage firm seats.</p>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Current Members</h3>
              <button onClick={exportCSV} className="rounded bg-primary-900/20 px-3 py-1 text-sm">Export CSV</button>
            </div>

            <div className="mt-4 space-y-3">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/5 px-4 py-3">
                  <div>
                    <div className="font-medium">User #{member.user}</div>
                    <div className="text-xs text-primary-300">{member.user_email ?? 'No email'}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={event => void changeRole(member.id, event.target.value)}
                      className="rounded border bg-primary-900/10 p-2 text-sm"
                    >
                      {roleOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => void unassign(member.id)} className="rounded border px-2 py-1 text-sm">Unassign</button>
                    <button onClick={() => void remove(member.id)} className="rounded bg-red-600 px-2 py-1 text-sm text-white">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <h3 className="font-semibold">Invite Member</h3>
            <div className="mt-3 space-y-3">
              <input
                value={inviteEmail}
                onChange={event => setInviteEmail(event.target.value)}
                placeholder="Email"
                className="w-full rounded border p-2 bg-primary-900/10"
              />
              <select value={inviteRole} onChange={event => setInviteRole(event.target.value)} className="w-full rounded border p-2 bg-primary-900/10">
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button onClick={() => void invite()} className="w-full rounded bg-gold-500 px-3 py-2 font-semibold text-black">
                Send invite
              </button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
