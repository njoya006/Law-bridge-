'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { toastSuccess, toastError } from '../../../lib/toast'

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
  support:    'border-amber-500/25 bg-amber-500/10 text-amber-400',
  admin:      'border-red-500/25 bg-red-500/10 text-red-400',
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

function Initials({ name, role }: { name: string; role: string }) {
  const parts = (name || '?').trim().split(' ')
  const init = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
  const colors: Record<string, string> = {
    admin: 'from-red-600 to-red-700',
    support: 'from-amber-600 to-amber-700',
    lawyer: 'from-gold-500 to-gold-600',
    firm_admin: 'from-purple-600 to-purple-700',
    secretary: 'from-emerald-600 to-emerald-700',
    client: 'from-blue-600 to-blue-700',
  }
  return (
    <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${colors[role] ?? 'from-primary-700 to-primary-800'} text-[11px] font-bold text-white ring-1 ring-white/10`}>
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
        title="Change role"
        className="rounded-lg p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-colors"
        aria-label="Change user role"
      >
        {loading
          ? <div className="h-3 w-3 rounded-full border border-neutral-500 border-t-transparent animate-spin" />
          : <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        }
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 min-w-[160px] rounded-xl bg-primary-800 border border-white/10 shadow-xl py-1">
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

// ── Create Staff Modal ────────────────────────────────────────────────────────

type CreateStaffForm = {
  email: string
  full_name: string
  password: string
  confirm: string
  role: 'admin' | 'support'
}

function CreateStaffModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (user: User) => void
}) {
  const [form, setForm] = useState<CreateStaffForm>({
    email: '', full_name: '', password: '', confirm: '', role: 'support',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const pwStrength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const pwOk = form.password.length >= 8
  const confirmOk = form.password === form.confirm && form.confirm.length > 0
  const canSubmit = form.email.includes('@') && form.full_name.trim() && pwOk && confirmOk && !loading

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)
    try {
      const token = localStorage.getItem('access')
      const res = await fetch('/api/v1/auth/admin/users/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          full_name: form.full_name.trim(),
          password: form.password,
          role: form.role,
        }),
      })
      const data = await res.json() as User & { detail?: string }
      if (!res.ok) {
        const errMsg = data.detail || `Error ${res.status}`
        setError(errMsg)
        toastError(errMsg, 'Could not create user')
        return
      }
      toastSuccess(`${data.full_name || data.email} created successfully`, 'Staff account created')
      onCreated(data)
    } catch {
      const netErr = 'Network error. Please try again.'
      setError(netErr)
      toastError(netErr, 'Could not create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-primary-800 shadow-2xl p-6 animate-fade-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-semibold text-neutral-100 text-lg">Create Staff Account</h2>
            <p className="text-xs text-neutral-500 mt-0.5">New admin or support team member</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-500 hover:text-neutral-200 hover:bg-white/5 transition-colors" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Role selection */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-2">Role <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {(['support', 'admin'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, role: r }))}
                  className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all capitalize ${
                    form.role === r
                      ? r === 'admin'
                        ? 'border-red-500/50 bg-red-500/15 text-red-300'
                        : 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                      : 'border-white/8 bg-white/3 text-neutral-400 hover:border-white/15 hover:text-neutral-200'
                  }`}
                >
                  {r === 'admin' ? '👑 Admin' : '🎧 Support'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-neutral-600 mt-1.5">
              {form.role === 'admin' ? 'Full platform access including user management.' : 'Can view users and manage support threads.'}
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">Full Name <span className="text-red-400">*</span></label>
            <input
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              placeholder="e.g. Marie Tchamba"
              className="w-full rounded-xl px-4 py-2.5 bg-primary-900/60 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 transition-all placeholder-neutral-600"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">Email Address <span className="text-red-400">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="staff@lawbridge.cm"
              className="w-full rounded-xl px-4 py-2.5 bg-primary-900/60 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 transition-all placeholder-neutral-600"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">Password <span className="text-red-400">*</span></label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="At least 8 characters"
                className="w-full rounded-xl px-4 py-2.5 pr-12 bg-primary-900/60 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 transition-all placeholder-neutral-600"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 text-xs"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {form.password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1 h-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`flex-1 rounded-full transition-all ${i <= pwStrength ? (pwStrength >= 4 ? 'bg-emerald-400' : pwStrength >= 3 ? 'bg-gold-400' : 'bg-amber-500') : 'bg-white/10'}`} />
                  ))}
                </div>
                <p className={`text-[10px] ${pwStrength >= 4 ? 'text-emerald-400' : pwStrength >= 3 ? 'text-gold-400' : pwStrength >= 2 ? 'text-amber-400' : 'text-red-400'}`}>
                  {pwStrength >= 4 ? 'Strong password' : pwStrength >= 3 ? 'Good password' : pwStrength >= 2 ? 'Fair — add symbols or uppercase' : 'Weak — add length and variety'}
                </p>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">Confirm Password <span className="text-red-400">*</span></label>
            <input
              type="password"
              value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat password"
              className={`w-full rounded-xl px-4 py-2.5 bg-primary-900/60 border text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition-all placeholder-neutral-600 ${
                form.confirm && !confirmOk ? 'border-red-500/40 focus:border-red-500/40' : 'border-white/10 focus:border-gold-500/40'
              }`}
            />
            {form.confirm && !confirmOk && (
              <p className="text-[10px] text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-neutral-400 text-sm font-medium hover:border-white/20 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Creating…
                </span>
              ) : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [myRole, setMyRole] = useState('')
  const [myId, setMyId] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('userRole')
    const storedId = localStorage.getItem('authUserId')
    if (stored) setMyRole(stored)
    if (storedId) setMyId(storedId)

    const token = localStorage.getItem('access')
    if (!token) return
    fetch('/api/v1/auth/admin/users/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { results?: User[] } | User[]) => {
        setUsers(Array.isArray(data) ? data : (data.results ?? []))
        setLoading(false)
      })
      .catch(e => { setError(`Failed to load users (${e}). Check your session.`); setLoading(false) })
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

  function handleCreated(user: User) {
    setUsers(prev => [user, ...prev])
    setShowCreate(false)
    setToast(`Staff account created for ${user.full_name || user.email}`)
    setTimeout(() => setToast(null), 4000)
  }

  return (
    <div className="space-y-5">
      {/* Success toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300 shadow-xl animate-fade-up">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          {toast}
        </div>
      )}

      {showCreate && <CreateStaffModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-neutral-50">Users</h1>
          <p className="text-sm text-neutral-500 mt-0.5">All registered accounts on LawBridge — {users.length} total</p>
        </div>
        {myRole === 'admin' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Create Staff Account
          </button>
        )}
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
              <span className="capitalize">{r.replace('_', ' ')}</span>
              <span className="opacity-60">{counts[r] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-14 rounded-xl bg-primary-800/40 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/8 bg-primary-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 hidden md:table-cell">Joined</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-neutral-500 text-sm">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Initials name={u.full_name || u.email} role={u.role} />
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-neutral-200 block truncate">{u.full_name || '—'}</span>
                        <span className="text-xs text-neutral-500 sm:hidden truncate block">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-400 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${ROLE_COLORS[u.role] ?? 'border-neutral-700 text-neutral-400'}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500 hidden md:table-cell">{formatDate(u.date_joined ?? u.created_at)}</td>
                  <td className="px-4 py-3">
                    {myRole === 'admin' && u.id !== myId
                      ? <RoleMenu user={u} onChanged={handleRoleChanged} />
                      : u.id === myId
                        ? <span className="text-[10px] text-neutral-600 px-2 py-0.5 rounded-full border border-white/5 bg-white/3">you</span>
                        : null
                    }
                  </td>
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
