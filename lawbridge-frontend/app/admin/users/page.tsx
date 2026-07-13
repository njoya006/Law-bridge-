'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

type User = {
  id: string
  email: string
  full_name: string
  role: string
  date_joined?: string
  created_at?: string
}

const ROLE_COLORS: Record<string, string> = {
  client:     'border-blue-500/25 bg-blue-500/10 text-blue-400',
  lawyer:     'border-gold-500/25 bg-gold-500/10 text-gold-400',
  firm_admin: 'border-purple-500/25 bg-purple-500/10 text-purple-400',
  secretary:  'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
  support:    'border-red-500/25 bg-red-500/10 text-red-400',
  admin:      'border-red-500/25 bg-red-500/10 text-red-400',
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

function Initials({ name }: { name: string }) {
  const parts = (name || '?').trim().split(' ')
  const init = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
  return (
    <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-800 text-[11px] font-bold text-neutral-300 ring-1 ring-white/10">
      {init.toUpperCase() || '?'}
    </span>
  )
}

const ROLES = ['all', 'client', 'lawyer', 'firm_admin', 'secretary', 'support', 'admin']
const ASSIGNABLE_ROLES = ['client', 'lawyer', 'firm_admin', 'secretary', 'support', 'admin']

function RoleMenu({ user, onChanged }: { user: User; onChanged: (id: string, role: string) => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function changeRole(role: string) {
    setOpen(false)
    if (role === user.role) return
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await fetch(`/api/v1/auth/admin/users/${user.id}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (res.ok) onChanged(user.id, role)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className="rounded-lg p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-colors"
        title="Change role"
      >
        {loading
          ? <div className="h-3 w-3 rounded-full border border-neutral-500 border-t-transparent animate-spin" />
          : <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        }
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 min-w-[140px] rounded-xl bg-primary-800 border border-white/10 shadow-xl py-1">
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-neutral-600 font-semibold">Change role to</p>
          {ASSIGNABLE_ROLES.filter(r => r !== user.role).map(r => (
            <button
              key={r}
              onClick={() => changeRole(r)}
              className="w-full text-left px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/5 capitalize transition-colors"
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) return
    fetch('/api/v1/auth/admin/users/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { results?: User[] } | User[]) => {
        setUsers(Array.isArray(data) ? data : (data.results ?? []))
        setLoading(false)
      })
      .catch(e => { setError(`Failed to load users (${e})`); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(u => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter
      const matchSearch = !q || u.email.toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q)
      return matchRole && matchSearch
    })
  }, [users, search, roleFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: users.length }
    users.forEach(u => { c[u.role] = (c[u.role] ?? 0) + 1 })
    return c
  }, [users])

  function handleRoleChanged(id: string, role: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-neutral-50">Users</h1>
        <p className="text-sm text-neutral-500 mt-1">All registered accounts on LawBridge</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border border-white/10 bg-primary-900/60 py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-gold-500/40 transition-all"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                roleFilter === r
                  ? 'bg-gold-500/15 border border-gold-500/30 text-gold-300'
                  : 'bg-primary-800/40 border border-white/8 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span className="capitalize">{r}</span>
              <span className="opacity-60">{counts[r] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-14 rounded-xl skeleton" />)}
        </div>
      ) : (
        <div className="rounded-xl border border-white/8 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/8 bg-primary-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Joined</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-500 text-sm">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Initials name={u.full_name || u.email} />
                      <span className="text-sm font-medium text-neutral-200">{u.full_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${ROLE_COLORS[u.role] ?? 'border-neutral-700 text-neutral-400'}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{formatDate(u.date_joined ?? u.created_at)}</td>
                  <td className="px-4 py-3"><RoleMenu user={u} onChanged={handleRoleChanged} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-600">{filtered.length} of {users.length} users shown</p>
    </div>
  )
}
