'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { PlusIcon } from '../../../components/icons/Icons'
import { getMyFirmMemberships, getFirmMembers, getFirmLawyers, inviteFirmMember, type FirmMembership, type FirmLawyer } from '../../../lib/firmsApi'

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}

function roleCls(role: string) {
  switch (role) {
    case 'owner': return 'bg-gold-500/20 text-gold-300 border-gold-500/30'
    case 'managing_partner':
    case 'partner': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'associate': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'firm_admin':
    case 'secretary': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    default: return 'bg-neutral-700/30 text-neutral-400 border-neutral-600/30'
  }
}

const ROLE_OPTIONS = [
  { value: 'partner', label: 'Partner' },
  { value: 'associate', label: 'Associate' },
  { value: 'firm_admin', label: 'Firm Administrator (Secretary)' },
  { value: 'guest', label: 'Guest / Observer' },
]

function InviteModal({ onClose, onInvited, firmId }: { onClose: () => void; onInvited: () => void; firmId: number }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('associate')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setErr('Email is required'); return }
    setSaving(true); setErr('')
    const access = localStorage.getItem('access') || ''
    try {
      await inviteFirmMember(firmId, { email: email.trim(), role, note }, access)
      onInvited()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Invite failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-primary-900 border border-neutral-700/60 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-100">Invite Firm Member</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@lawfirm.com" autoFocus
              className="w-full bg-primary-800/50 border border-neutral-700/40 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-portal" />
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full bg-primary-800/50 border border-neutral-700/40 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:border-portal">
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Personal note <span className="text-neutral-600">(optional)</span></label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Welcome message…"
              className="w-full bg-primary-800/50 border border-neutral-700/40 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-portal resize-none" />
          </div>
          {err && <p className="text-xs text-crimson-400">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-neutral-700/40 text-neutral-400 hover:text-neutral-200 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-portal-soft border border-portal-solid text-portal hover:opacity-90 text-sm font-medium disabled:opacity-50">
              {saving ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MembersPage() {
  const [members, setMembers] = useState<FirmMembership[]>([])
  const [lawyers, setLawyers] = useState<FirmLawyer[]>([])
  const [firmId, setFirmId] = useState<number | null>(null)
  const [firmName, setFirmName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const access = localStorage.getItem('access')
    if (!access) { setLoading(false); return }
    try {
      const ms = await getMyFirmMemberships(access)
      const active = ms.find(m => m.is_active !== false)
      if (active) {
        setFirmId(active.firm)
        const [memRes, lawRes] = await Promise.allSettled([
          getFirmMembers(active.firm, access),
          getFirmLawyers(active.firm, access),
        ])
        if (memRes.status === 'fulfilled') setMembers(memRes.value)
        if (lawRes.status === 'fulfilled') setLawyers(lawRes.value)
      }
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = members.filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (m.user_full_name || '').toLowerCase().includes(q) || (m.user_email || '').toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
  })

  const byRole: Record<string, FirmMembership[]> = {}
  for (const m of filtered) {
    const r = m.role || 'unknown'
    if (!byRole[r]) byRole[r] = []
    byRole[r].push(m)
  }

  const roleOrder = ['owner', 'managing_partner', 'partner', 'associate', 'firm_admin', 'secretary', 'guest']
  const sortedRoles = Object.keys(byRole).sort((a, b) => {
    const ai = roleOrder.indexOf(a); const bi = roleOrder.indexOf(b)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return (
    <div className="space-y-6">
      {showInvite && firmId && (
        <InviteModal firmId={firmId} onClose={() => setShowInvite(false)} onInvited={() => { setShowInvite(false); void load() }} />
      )}

      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-display-md text-neutral-50">Firm Members</h1>
          <p className="mt-1 text-sm text-neutral-400">{firmName || (firmId ? `Firm #${firmId}` : '')} · {members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {firmId && (
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-portal-soft border border-portal-solid text-portal text-sm font-medium hover:opacity-90 transition-colors">
            <PlusIcon width={14} height={14} />Invite Member
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 text-neutral-400 py-16">
          <span className="animate-spin h-4 w-4 border-2 border-portal-solid border-t-transparent rounded-full" />Loading…
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-primary-900/50 border border-neutral-700/40 rounded-xl p-4">
              <p className="text-3xl font-bold text-neutral-50">{members.length}</p>
              <p className="text-sm text-neutral-300 mt-0.5 font-medium">Total Members</p>
            </div>
            <div className="bg-primary-900/50 border border-neutral-700/40 rounded-xl p-4">
              <p className="text-3xl font-bold text-portal">{lawyers.length}</p>
              <p className="text-sm text-neutral-300 mt-0.5 font-medium">Lawyers</p>
              <p className="text-xs text-neutral-500 mt-0.5">With legal profiles</p>
            </div>
            <div className="bg-primary-900/50 border border-neutral-700/40 rounded-xl p-4">
              <p className="text-3xl font-bold text-emerald-400">{members.filter(m => m.is_active !== false).length}</p>
              <p className="text-sm text-neutral-300 mt-0.5 font-medium">Active</p>
            </div>
          </div>

          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, or role…"
            className="w-full bg-primary-900/40 border border-neutral-700/40 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-portal" />

          {/* Members grouped by role */}
          {members.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-neutral-400 text-sm">No members found.</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedRoles.map(role => (
                <div key={role}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide capitalize">{role.replace(/_/g, ' ')}</h3>
                    <span className="text-xs bg-neutral-800/60 text-neutral-500 px-1.5 py-0.5 rounded-full">{byRole[role].length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {byRole[role].map((m, i) => {
                      const enriched = lawyers.find(l => l.email === m.user_email)
                      const name = m.user_full_name || enriched?.name || m.user_email?.split('@')[0] || 'Unknown'
                      return (
                        <div key={m.id} className="stagger-child flex items-center gap-3 p-4 rounded-xl border border-neutral-700/40 bg-primary-900/20 hover:border-neutral-600/50 transition-colors" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                          <div className="w-10 h-10 rounded-full bg-primary-800 border border-neutral-700/40 flex items-center justify-center text-sm font-bold text-neutral-300 flex-shrink-0">
                            {name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-100 truncate">{name}</p>
                            <p className="text-xs text-neutral-500 truncate">{m.user_email || 'No email'}</p>
                            {enriched?.specialization && <p className="text-xs text-neutral-600 truncate">{enriched.specialization}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border capitalize ${roleCls(m.role)}`}>{m.role.replace(/_/g, ' ')}</span>
                            {enriched?.availability_status && (
                              <p className={`text-[10px] mt-1 ${enriched.availability_status === 'available' ? 'text-emerald-400' : 'text-neutral-500'}`}>{enriched.availability_status}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lawyers with profiles */}
          {lawyers.filter(l => !members.some(m => m.user_email === l.email)).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Lawyers with Profiles (not yet in membership)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lawyers.filter(l => !members.some(m => m.user_email === l.email)).map((l, i) => (
                  <div key={l.id} className="stagger-child flex items-center gap-3 p-4 rounded-xl border border-neutral-700/40 bg-primary-900/10" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                    <div className="w-10 h-10 rounded-full bg-primary-800 border border-neutral-700/40 flex items-center justify-center text-sm font-bold text-neutral-300">{l.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-100">{l.name}</p>
                      <p className="text-xs text-neutral-500">{l.specialization || 'Lawyer'}</p>
                    </div>
                    <Badge variant={l.availability_status === 'available' ? 'success' : 'neutral'}>
                      {l.availability_status || 'unknown'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
