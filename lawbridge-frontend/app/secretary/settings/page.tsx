'use client'

import React, { useEffect, useState } from 'react'
import { api } from '../../../lib/api'
import { toastSuccess, toastError } from '../../../lib/toast'

type Tab = 'account' | 'notifications' | 'security'

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

export default function SecretarySettingsPage() {
  const [tab, setTab] = useState<Tab>('account')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [notifs, setNotifs] = useState({
    notify_case_updates: true,
    notify_documents: true,
    notify_messages: true,
    notify_billing: false,
    notify_reminders: true,
  })

  useEffect(() => {
    setName(localStorage.getItem('fullName') || '')
    setEmail(localStorage.getItem('userEmail') || '')

    const token = localStorage.getItem('access')
    if (!token) return
    api.get<{ notify_case_updates?: boolean; notify_documents?: boolean; notify_messages?: boolean; notify_billing?: boolean; notify_reminders?: boolean }>
      ('auth', '/auth/preferences/', token)
      .then(data => setNotifs(prev => ({ ...prev, ...data })))
      .catch(() => {})
  }, [])

  async function saveAccount() {
    if (!name.trim()) { toastError('Full name is required.', 'Validation error'); return }
    setSavingAccount(true)
    try {
      const token = localStorage.getItem('access') || ''
      await api.patch('auth', '/auth/me/', { full_name: name }, token)
      localStorage.setItem('fullName', name)
      toastSuccess('Profile saved successfully.')
    } catch (e) {
      toastError(e instanceof Error ? e.message.replace(/^\d+ .*?: /, '') : 'Failed to save.', 'Profile update failed')
    } finally {
      setSavingAccount(false)
    }
  }

  async function saveNotifs() {
    const token = localStorage.getItem('access')
    if (!token) return
    try {
      await api.patch('auth', '/auth/preferences/', notifs, token)
      localStorage.setItem('userSettings', JSON.stringify(notifs))
      toastSuccess('Notification preferences saved.')
    } catch {
      toastError('Failed to save notification preferences.', 'Save failed')
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

  return (
    <div className="max-w-3xl space-y-6">

      <div>
        <h1 className="font-display text-2xl text-neutral-50">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <nav className="md:w-44 shrink-0">
          <ul className="space-y-0.5">
            {[
              { id: 'account' as Tab, label: 'Account' },
              { id: 'notifications' as Tab, label: 'Notifications' },
              { id: 'security' as Tab, label: 'Security' },
            ].map(t => (
              <li key={t.id}>
                <button
                  onClick={() => setTab(t.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === t.id ? 'bg-gold-500/15 text-gold-400' : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'}`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 min-w-0 space-y-4">
          {tab === 'account' && (
            <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-6">
              <h2 className="font-semibold text-neutral-100 mb-1">My Profile</h2>
              <p className="text-xs text-neutral-500 mb-6">Update your display name and contact details.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">Full Name <span className="text-red-400">*</span></label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl px-4 py-2.5 bg-primary-900/60 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">Email Address</label>
                  <input
                    value={email}
                    disabled
                    className="w-full rounded-xl px-4 py-2.5 bg-primary-900/40 border border-white/6 text-neutral-500 text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">Phone</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+237 6 xx xxx xxx"
                    className="w-full rounded-xl px-4 py-2.5 bg-primary-900/60 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/40 transition-all"
                  />
                </div>
                <button
                  onClick={saveAccount}
                  disabled={savingAccount}
                  className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {savingAccount ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-6">
              <h2 className="font-semibold text-neutral-100 mb-1">Notification Preferences</h2>
              <p className="text-xs text-neutral-500 mb-6">Choose what you get notified about.</p>
              <Row label="Case Updates" desc="Notifications when a case status changes">
                <Toggle checked={notifs.notify_case_updates} onChange={v => setNotifs(p => ({ ...p, notify_case_updates: v }))} />
              </Row>
              <Row label="Document Uploads" desc="When a new document is added to a matter">
                <Toggle checked={notifs.notify_documents} onChange={v => setNotifs(p => ({ ...p, notify_documents: v }))} />
              </Row>
              <Row label="Messages" desc="When you receive a new message">
                <Toggle checked={notifs.notify_messages} onChange={v => setNotifs(p => ({ ...p, notify_messages: v }))} />
              </Row>
              <Row label="Billing Alerts" desc="Payment and billing notifications">
                <Toggle checked={notifs.notify_billing} onChange={v => setNotifs(p => ({ ...p, notify_billing: v }))} />
              </Row>
              <Row label="Reminders" desc="Upcoming deadlines and appointment reminders">
                <Toggle checked={notifs.notify_reminders} onChange={v => setNotifs(p => ({ ...p, notify_reminders: v }))} />
              </Row>
              <div className="mt-6">
                <button onClick={saveNotifs} className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-6">
              <h2 className="font-semibold text-neutral-100 mb-1">Change Password</h2>
              <p className="text-xs text-neutral-500 mb-6">Use a strong password — at least 8 characters.</p>
              <div className="space-y-4">
                {[
                  { key: 'current' as const, label: 'Current Password' },
                  { key: 'next' as const, label: 'New Password' },
                  { key: 'confirm' as const, label: 'Confirm New Password' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs uppercase tracking-wide text-neutral-400 font-semibold mb-1.5">{label} <span className="text-red-400">*</span></label>
                    <input
                      type="password"
                      value={pw[key]}
                      onChange={e => setPw(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full rounded-xl px-4 py-2.5 bg-primary-900/60 border border-white/10 text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 transition-all"
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
          )}
        </div>
      </div>
    </div>
  )
}
