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

// ── Role change modal ────────────────────────────────────────────────────────

function RoleChangeModal({
  member,
  newRole,
  onClose,
  onConfirm,
}: {
  member: FirmMembership
  newRole: string
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) { setErr('Reason is required'); return }
    setSaving(true); setErr('')
    try { await onConfirm(reason.trim()); onClose() }
    catch (ex) { setErr(ex instanceof Error ? ex.message : 'Failed to update role') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-primary-900 border border-neutral-700/60 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neutral-100">Change Role</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-neutral-400">
          Changing <span className="text-neutral-200">{member.user_full_name ?? member.user_email}</span> to <span className="text-gold-400 capitalize">{newRole.replace('_', ' ')}</span>.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Reason for change</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Briefly explain this role change…"
              className="w-full rounded-lg border border-neutral-700 bg-primary-800/50 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 resize-none focus:outline-none focus:border-gold-500/50"
            />
          </div>
          {err && <p className="text-xs text-crimson-400">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-neutral-700 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-gold-500 py-2 text-sm font-semibold text-black disabled:opacity-50">
              {saving ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Remove modal ─────────────────────────────────────────────────────────────

function RemoveModal({
  member,
  onClose,
  onConfirm,
}: {
  member: FirmMembership
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (reason.trim().length < 10) { setErr('Reason must be at least 10 characters'); return }
    setSaving(true); setErr('')
    try { await onConfirm(reason.trim()); onClose() }
    catch (ex) { setErr(ex instanceof Error ? ex.message : 'Failed to remove member') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-primary-900 border border-neutral-700/60 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neutral-100">Remove Member</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-xl leading-none">×</button>
        </div>
        <p className="text-sm text-neutral-400">
          Remove <span className="text-neutral-200">{member.user_full_name ?? member.user_email}</span> from the firm? This cannot be undone.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Reason for removal (min. 10 characters)</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Explain why this member is being removed…"
              className="w-full rounded-lg border border-neutral-700 bg-primary-800/50 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 resize-none focus:outline-none focus:border-crimson-500/50"
            />
            <p className="text-xs text-neutral-500 mt-1">{reason.length}/10 minimum</p>
          </div>
          {err && <p className="text-xs text-crimson-400">{err}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-neutral-700 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-crimson-500 hover:bg-crimson-600 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ManageSeatsPage() {
  const [firmId, setFirmId] = useState<number | null>(null)
  const [members, setMembers] = useState<FirmMembership[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('associate')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Modal state
  const [roleTarget, setRoleTarget] = useState<{ member: FirmMembership; newRole: string } | null>(null)
  const [removeTarget, setRemoveTarget] = useState<FirmMembership | null>(null)

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

    return () => { cancelled = true }
  }, [])

  const handleRoleChange = async (memberId: number, role: string) => {
    const member = members.find(m => m.id === memberId)
    if (!member) return
    setRoleTarget({ member, newRole: role })
  }

  const confirmRoleChange = async (reason: string) => {
    if (!token || !firmId || !roleTarget) return
    await updateFirmMemberRole(roleTarget.member.id, roleTarget.newRole, reason, token)
    await refreshMembers(firmId, token)
  }

  const handleRemove = (member: FirmMembership) => setRemoveTarget(member)

  const confirmRemove = async (reason: string) => {
    if (!token || !firmId || !removeTarget) return
    await removeFirmMember(removeTarget.id, reason, token)
    await refreshMembers(firmId, token)
  }

  const unassign = async (memberId: number) => {
    if (!token || !firmId) return
    await unassignFirmMember(memberId, token)
    await refreshMembers(firmId, token)
  }

  const exportCSV = () => {
    const rows = [['id', 'name', 'email', 'role', 'firm']]
    for (const member of members) rows.push([
      String(member.id),
      member.user_full_name ?? '',
      member.user_email ?? '',
      member.role ?? '',
      String(member.firm),
    ])
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
    setInviteLoading(true); setInviteMsg('')
    try {
      await inviteFirmMember(firmId, { email: inviteEmail.trim(), role: inviteRole }, token)
      setInviteEmail('')
      setInviteRole('associate')
      setInviteMsg('Invite sent successfully.')
      await refreshMembers(firmId, token)
    } catch (ex) {
      setInviteMsg(ex instanceof Error ? ex.message : 'Invite failed.')
    } finally {
      setInviteLoading(false)
    }
  }

  if (loading) return <div className="p-6 text-neutral-400">Loading firm seats…</div>
  if (error) return <div className="p-6 text-crimson-400">{error}</div>
  if (!firmId) return <div className="p-6 text-neutral-400">You are not assigned to a firm.</div>

  return (
    <div>
      {roleTarget && (
        <RoleChangeModal
          member={roleTarget.member}
          newRole={roleTarget.newRole}
          onClose={() => setRoleTarget(null)}
          onConfirm={confirmRoleChange}
        />
      )}
      {removeTarget && (
        <RemoveModal
          member={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={confirmRemove}
        />
      )}

      <h1 className="font-display text-2xl">Manage Seats</h1>
      <p className="text-sm text-primary-300">Invite associates, change roles, and manage firm seats.</p>

      <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Current Members</h3>
              <button onClick={exportCSV} className="rounded bg-primary-900/20 px-3 py-1 text-sm hover:bg-primary-900/40">Export CSV</button>
            </div>

            <div className="mt-4 space-y-3">
              {members.map((member, mi) => (
                <div key={member.id} className="flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-white/5 px-4 py-3 stagger-child" style={{ '--i': Math.min(mi, 8) } as React.CSSProperties}>
                  <div>
                    <div className="font-medium">{member.user_full_name ?? member.user_email ?? `Member #${member.id}`}</div>
                    <div className="text-xs text-primary-300">{member.user_email ?? 'No email'}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={event => void handleRoleChange(member.id, event.target.value)}
                      className="rounded border bg-primary-900/10 p-2 text-sm"
                    >
                      {roleOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => void unassign(member.id)}
                      className="rounded border border-neutral-700 px-2 py-1 text-sm hover:bg-white/5"
                    >
                      Unassign
                    </button>
                    <button
                      onClick={() => handleRemove(member)}
                      className="rounded bg-crimson-500 px-2 py-1 text-sm text-white hover:bg-crimson-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="py-4 text-center text-sm text-neutral-500">No members yet.</p>
              )}
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
                placeholder="Email address"
                type="email"
                className="w-full rounded border border-neutral-700 p-2 bg-primary-900/10 text-sm"
              />
              <select
                value={inviteRole}
                onChange={event => setInviteRole(event.target.value)}
                className="w-full rounded border border-neutral-700 p-2 bg-primary-900/10 text-sm"
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <button
                onClick={() => void invite()}
                disabled={inviteLoading || !inviteEmail.trim()}
                className="w-full rounded bg-gold-500 px-3 py-2 font-semibold text-black disabled:opacity-50 hover:bg-gold-400"
              >
                {inviteLoading ? 'Sending…' : 'Send Invite'}
              </button>
              {inviteMsg && (
                <p className={`text-xs ${inviteMsg.includes('success') ? 'text-emerald-400' : 'text-crimson-400'}`}>{inviteMsg}</p>
              )}
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
