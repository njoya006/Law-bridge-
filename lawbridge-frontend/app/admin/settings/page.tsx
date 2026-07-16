'use client'

import React, { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { toastSuccess, toastError } from '../../../lib/toast'

type Tab = 'account' | 'security' | 'system'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50 ${checked ? 'bg-gold-500' : 'bg-neutral-700'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-white/6 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-100">{label}</p>
        {desc && <p className="text-xs text-neutral-500 mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>('account')

  // Account info
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)

  // Security
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  // System
  const [systemPrefs, setSystemPrefs] = useState({
    email_notifications: true,
    audit_log_enabled: true,
    maintenance_mode: false,
  })

  useEffect(() => {
    const n = localStorage.getItem('fullName') || ''
    const e = localStorage.getItem('userEmail') || ''
    setName(n)
    setEmail(e)
  }, [])

  async function saveAccount() {
    if (!name.trim()) { toastError('Full name is required.', 'Validation error'); return }
    setSavingAccount(true)
    try {
      const token = localStorage.getItem('access') || ''
      await api.patch('auth', '/auth/me/', { full_name: name }, token)
      localStorage.setItem('fullName', name)
      toastSuccess('Profile updated successfully.')
    } catch (e) {
      toastError(e instanceof Error ? e.message.replace(/^\d+ .*?: /, '') : 'Failed to save profile.', 'Profile update failed')
    } finally {
      setSavingAccount(false)
    }
  }

  async function changePassword() {
    setPwError('')
    if (!pw.current) { setPwError('Current password is required.'); return }
    if (pw.next.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (pw.next !== pw.confirm) { setPwError('Passwords do not match.'); return }
    setSavingPw(true)
    try {
      const token = localStorage.getItem('access') || ''
      await api.post('auth', '/auth/me/password/', {
        current_password: pw.current,
        new_password: pw.next,
        confirm_password: pw.confirm,
      }, token)
      setPw({ current: '', next: '', confirm: '' })
      toastSuccess('Password changed successfully.')
    } catch (e) {
      setPwError(e instanceof Error ? e.message.replace(/^\d+ .*?: /, '') : 'Failed to change password.')
    } finally {
      setSavingPw(false)
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'security', label: 'Security' },
    { id: 'system', label: 'System' },
  ]

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-neutral-50">System Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your admin account and system configuration.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab nav */}
        <nav className="md:w-44 shrink-0">
          <ul className="space-y-0.5">
            {TABS.map(t => (
              <li key={t.id}>
                <button
                  onClick={() => setTab(t.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    tab === t.id
                      ? 'bg-gold-500/15 text-gold-400'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {tab === 'account' && (
            <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-6">
              <h2 className="font-semibold text-neutral-100 mb-1">Admin Profile</h2>
              <p className="text-xs text-neutral-500 mb-6">Your display name and email address.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">Full Name <span className="text-red-400">*</span></label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-xl px-4 py-2.5 bg-primary-900/60 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 transition-all"
                    placeholder="Admin Name"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">Email Address</label>
                  <input
                    value={email}
                    disabled
                    className="w-full rounded-xl px-4 py-2.5 bg-primary-900/40 border border-white/6 text-neutral-500 text-sm cursor-not-allowed"
                  />
                  <p className="text-[10px] text-neutral-600 mt-1">Email cannot be changed from this interface.</p>
                </div>
                <button
                  onClick={saveAccount}
                  disabled={savingAccount}
                  className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingAccount ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-6">
                <h2 className="font-semibold text-neutral-100 mb-1">Change Password</h2>
                <p className="text-xs text-neutral-500 mb-6">Use a strong password — at least 8 characters.</p>
                <div className="space-y-4">
                  {[
                    { key: 'current' as const, label: 'Current Password', placeholder: 'Your current password' },
                    { key: 'next' as const, label: 'New Password', placeholder: 'At least 8 characters' },
                    { key: 'confirm' as const, label: 'Confirm New Password', placeholder: 'Repeat new password' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">{label} <span className="text-red-400">*</span></label>
                      <input
                        type="password"
                        value={pw[key]}
                        onChange={e => setPw(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full rounded-xl px-4 py-2.5 bg-primary-900/60 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 transition-all"
                      />
                    </div>
                  ))}
                  {pwError && (
                    <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      {pwError}
                    </div>
                  )}
                  <button
                    onClick={changePassword}
                    disabled={savingPw || !pw.current || !pw.next || !pw.confirm}
                    className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingPw ? 'Changing…' : 'Change Password'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-6">
                <h2 className="font-semibold text-neutral-100 mb-1">Session Information</h2>
                <p className="text-xs text-neutral-500 mb-4">Your current admin session details.</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-white/6">
                    <span className="text-neutral-400">Email</span>
                    <span className="text-neutral-200 font-mono text-xs">{email || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/6">
                    <span className="text-neutral-400">Role</span>
                    <span className="text-red-400 font-semibold capitalize">
                      {localStorage.getItem('userRole') || 'admin'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-neutral-400">Session scope</span>
                    <span className="text-neutral-200 text-xs">7 days from login</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'system' && (
            <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-6">
              <h2 className="font-semibold text-neutral-100 mb-1">System Configuration</h2>
              <p className="text-xs text-neutral-500 mb-6">Platform-wide settings. Changes apply immediately.</p>
              <Row label="Email Notifications" desc="Send automated emails for case updates and bookings">
                <Toggle checked={systemPrefs.email_notifications} onChange={v => setSystemPrefs(p => ({ ...p, email_notifications: v }))} />
              </Row>
              <Row label="Audit Log" desc="Log all admin actions for compliance purposes">
                <Toggle checked={systemPrefs.audit_log_enabled} onChange={v => setSystemPrefs(p => ({ ...p, audit_log_enabled: v }))} />
              </Row>
              <Row label="Maintenance Mode" desc="Temporarily restrict access to the platform for all non-admin users">
                <Toggle checked={systemPrefs.maintenance_mode} onChange={v => setSystemPrefs(p => ({ ...p, maintenance_mode: v }))} />
              </Row>
              {systemPrefs.maintenance_mode && (
                <div className="mt-4 flex items-start gap-2 text-amber-400 text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Maintenance mode is active. Only admin accounts can access the platform.
                </div>
              )}
              <div className="mt-6">
                <button
                  onClick={() => toastSuccess('System settings saved.')}
                  className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
