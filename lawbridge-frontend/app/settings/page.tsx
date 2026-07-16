'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import AvatarUploader from '../../components/ui/AvatarUploader'
import { api } from '../../lib/api'
import { getLang, setLang, t, type Lang } from '../../lib/i18n'
import { toastSuccess, toastError } from '../../lib/toast'

type Prefs = {
  language: 'en' | 'fr'
  notify_case_updates: boolean
  notify_documents: boolean
  notify_messages: boolean
  notify_billing: boolean
  notify_reminders: boolean
  preferred_contact: 'email' | 'phone' | 'in_app'
  profile_visible: boolean
}

const DEFAULT_PREFS: Prefs = {
  language: 'en',
  notify_case_updates: true,
  notify_documents: true,
  notify_messages: true,
  notify_billing: true,
  notify_reminders: true,
  preferred_contact: 'email',
  profile_visible: true,
}

type Tab = 'account' | 'notifications' | 'language' | 'communication' | 'privacy' | 'security'

const TABS: { id: Tab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'language', label: 'Language' },
  { id: 'communication', label: 'Communication' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'security', label: 'Security' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/50
        ${checked ? 'bg-gold-500' : 'bg-neutral-700'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow
          transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

function SettingRow({
  label, description, children,
}: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-neutral-700/30 last:border-0">
      <div>
        <p className="font-heading text-body-md text-neutral-100">{label}</p>
        {description && <p className="text-neutral-400 text-body-sm mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function ClientSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [lang, setLangState] = useState<Lang>('en')
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Account tab state
  const [authMe, setAuthMe] = useState<{ id: string; email: string; full_name: string; avatar_url?: string | null } | null>(null)
  const [profileForm, setProfileForm] = useState({ full_name: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    // Read ?tab= param on client side only
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    const validTabs = TABS.map(x => x.id)
    if (tabParam && validTabs.includes(tabParam as Tab)) setActiveTab(tabParam as Tab)

    // Initialise language from localStorage
    setLangState(getLang())
    const onLangChanged = (e: Event) => {
      setLangState((e as CustomEvent<{ lang: Lang }>).detail.lang)
    }
    window.addEventListener('lawbridge:lang-changed', onLangChanged)

    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { setLoading(false); return }
      setAccessToken(access)
      try {
        const [prefsData, meData] = await Promise.allSettled([
          api.get<Prefs>('auth', '/auth/preferences/', access),
          api.get<{ id: string; email: string; full_name: string; avatar_url?: string | null }>('auth', '/auth/me/', access),
        ])
        if (prefsData.status === 'fulfilled') {
          setPrefs(prev => ({ ...prev, ...prefsData.value }))
          localStorage.setItem('userSettings', JSON.stringify({ ...prefs, ...prefsData.value }))
        }
        if (meData.status === 'fulfilled') {
          setAuthMe(meData.value)
          setProfileForm({ full_name: meData.value.full_name || '' })
          setAvatarUrl(meData.value.avatar_url || null)
        }
      } catch {
        // falls back to defaults
      } finally {
        setLoading(false)
      }
    }
    void run()
    return () => window.removeEventListener('lawbridge:lang-changed', onLangChanged)
  }, [])

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs(prev => ({ ...prev, ...patch }))
  }, [])

  const handleSave = async () => {
    const access = localStorage.getItem('access')
    if (!access) return
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    try {
      await api.patch('auth', '/auth/preferences/', prefs, access)
      localStorage.setItem('userSettings', JSON.stringify(prefs))
      setLang(prefs.language)
      setSaveSuccess(true)
      toastSuccess('Settings saved', 'Preferences updated')
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : 'Failed to save'
      setSaveError(msg)
      toastError(msg, 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="max-w-4xl w-full space-y-6">
      <div>
        <h1 className="font-display text-display-md text-neutral-50">{t('settings.title', lang)}</h1>
        <p className="text-neutral-400">{t('settings.subtitle', lang)}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab list */}
        <nav className="md:w-48 shrink-0">
          <ul className="space-y-1">
            {TABS.map(tab => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-body-sm font-heading transition-colors
                    ${activeTab === tab.id
                      ? 'bg-gold-500/15 text-gold-400 font-semibold'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/30'
                    }`}
                >
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <Card className="p-8">
              <div className="flex items-center gap-2 text-neutral-400">
                <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
                Loading settings…
              </div>
            </Card>
          ) : (
            <>
              {/* ── ACCOUNT ── */}
              {activeTab === 'account' && (
                <div className="space-y-4">
                  <Card className="p-6">
                    <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Profile Photo</h2>
                    <p className="text-neutral-400 text-body-sm mb-6">Upload a photo — lawyers will see this when reviewing your bookings.</p>
                    <div className="flex items-center gap-6">
                      <AvatarUploader
                        currentUrl={avatarUrl}
                        initials={(profileForm.full_name || authMe?.email || 'U').slice(0, 2).toUpperCase()}
                        size="lg"
                        token={accessToken}
                        onUploaded={url => {
                          setAvatarUrl(url)
                          localStorage.setItem('avatarUrl', url)
                        }}
                      />
                      <div>
                        <p className="text-neutral-200 text-sm font-semibold mb-1">Click photo to upload</p>
                        <p className="text-neutral-500 text-xs">JPEG, PNG or WebP — max 5 MB</p>
                        {avatarUrl && <p className="text-emerald-400 text-xs mt-2">Photo saved</p>}
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Personal Information</h2>
                    <p className="text-neutral-400 text-body-sm mb-6">Update your display name used across the platform.</p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Full Name <span className="text-crimson-400">*</span></label>
                        <input
                          type="text"
                          value={profileForm.full_name}
                          onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                          placeholder="Your full legal name"
                          className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-400 font-body text-body-md"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Email Address</label>
                        <input
                          type="email"
                          value={authMe?.email || ''}
                          disabled
                          className="w-full rounded-lg px-4 py-3 bg-neutral-800/30 text-neutral-500 border border-neutral-700/30 cursor-not-allowed font-body text-body-md"
                        />
                        <p className="text-neutral-600 text-xs mt-1">Email cannot be changed. Contact support if needed.</p>
                      </div>
                      {profileError && <p className="text-crimson-300 text-sm">{profileError}</p>}
                      {profileSuccess && <p className="text-emerald-400 text-sm">Profile updated successfully.</p>}
                      <Button
                        variant="gold"
                        size="sm"
                        disabled={profileSaving || !profileForm.full_name.trim()}
                        onClick={async () => {
                          if (!accessToken || !profileForm.full_name.trim()) return
                          setProfileSaving(true)
                          setProfileError('')
                          setProfileSuccess(false)
                          try {
                            await api.patch('auth', '/auth/me/', { full_name: profileForm.full_name.trim() }, accessToken)
                            localStorage.setItem('fullName', profileForm.full_name.trim())
                            setProfileSuccess(true)
                            setTimeout(() => setProfileSuccess(false), 3000)
                          } catch (e) {
                            setProfileError(e instanceof Error ? e.message : 'Failed to update profile')
                          } finally {
                            setProfileSaving(false)
                          }
                        }}
                      >
                        {profileSaving ? 'Saving…' : 'Save Profile'}
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeTab === 'notifications' && (
                <Card className="p-6">
                  <h2 className="font-heading text-body-lg text-neutral-50 mb-1">{t('settings.notifications.title', lang)}</h2>
                  <p className="text-neutral-400 text-body-sm mb-6">{t('settings.notifications.subtitle', lang)}</p>
                  <SettingRow label={t('settings.notifications.case_updates', lang)} description={t('settings.notifications.case_updates.desc', lang)}>
                    <Toggle checked={prefs.notify_case_updates} onChange={v => update({ notify_case_updates: v })} />
                  </SettingRow>
                  <SettingRow label={t('settings.notifications.documents', lang)} description={t('settings.notifications.documents.desc', lang)}>
                    <Toggle checked={prefs.notify_documents} onChange={v => update({ notify_documents: v })} />
                  </SettingRow>
                  <SettingRow label={t('settings.notifications.messages', lang)} description={t('settings.notifications.messages.desc', lang)}>
                    <Toggle checked={prefs.notify_messages} onChange={v => update({ notify_messages: v })} />
                  </SettingRow>
                  <SettingRow label={t('settings.notifications.billing', lang)} description={t('settings.notifications.billing.desc', lang)}>
                    <Toggle checked={prefs.notify_billing} onChange={v => update({ notify_billing: v })} />
                  </SettingRow>
                  <SettingRow label={t('settings.notifications.reminders', lang)} description={t('settings.notifications.reminders.desc', lang)}>
                    <Toggle checked={prefs.notify_reminders} onChange={v => update({ notify_reminders: v })} />
                  </SettingRow>
                </Card>
              )}

              {/* ── LANGUAGE ── */}
              {activeTab === 'language' && (
                <Card className="p-6">
                  <h2 className="font-heading text-body-lg text-neutral-50 mb-1">{t('settings.language.title', lang)}</h2>
                  <p className="text-neutral-400 text-body-sm mb-6">{t('settings.language.subtitle', lang)}</p>
                  <SettingRow label={t('settings.language.platform', lang)} description={t('settings.language.platform.desc', lang)}>
                    <select
                      value={prefs.language}
                      onChange={e => {
                        const newLang = e.target.value as 'en' | 'fr'
                        update({ language: newLang })
                        setLang(newLang)
                      }}
                      className="rounded-lg px-4 py-2 bg-primary-800/40 text-neutral-50
                       border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                       focus:border-gold-400 font-body text-body-sm"
                    >
                      <option value="en" className="bg-primary-900">English</option>
                      <option value="fr" className="bg-primary-900">Français</option>
                    </select>
                  </SettingRow>
                  <div className="mt-6 p-4 rounded-lg bg-primary-800/20 border border-neutral-700/30">
                    <p className="text-neutral-400 text-body-sm">
                      <strong className="text-neutral-200">
                        {lang === 'fr' ? 'Remarque :' : 'Note:'}
                      </strong>{' '}
                      {t('settings.language.note', lang)}
                    </p>
                  </div>
                </Card>
              )}

              {/* ── COMMUNICATION ── */}
              {activeTab === 'communication' && (
                <Card className="p-6">
                  <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Communication Preferences</h2>
                  <p className="text-neutral-400 text-body-sm mb-6">
                    How you prefer your lawyer and the platform to reach you.
                  </p>
                  <SettingRow label="Preferred Contact Method" description="Your lawyer will be informed of this preference">
                    <select
                      value={prefs.preferred_contact}
                      onChange={e => update({ preferred_contact: e.target.value as Prefs['preferred_contact'] })}
                      className="rounded-lg px-4 py-2 bg-primary-800/40 text-neutral-50
                       border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                       focus:border-gold-400 font-body text-body-sm"
                    >
                      <option value="email" className="bg-primary-900">Email</option>
                      <option value="phone" className="bg-primary-900">Phone Call</option>
                      <option value="in_app" className="bg-primary-900">In-App Messaging Only</option>
                    </select>
                  </SettingRow>
                </Card>
              )}

              {/* ── PRIVACY ── */}
              {activeTab === 'privacy' && (
                <Card className="p-6">
                  <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Privacy</h2>
                  <p className="text-neutral-400 text-body-sm mb-6">
                    Control what information is visible to lawyers and the public.
                  </p>
                  <SettingRow
                    label="Profile Visibility"
                    description="Allow lawyers and the platform to see your profile information when assigned to your case"
                  >
                    <Toggle checked={prefs.profile_visible} onChange={v => update({ profile_visible: v })} />
                  </SettingRow>
                  <div className="mt-6 p-4 rounded-lg bg-primary-800/20 border border-neutral-700/30">
                    <p className="text-neutral-400 text-body-sm">
                      <strong className="text-neutral-200">Your data is protected.</strong> All case details, documents,
                      and personal information are encrypted and only accessible to parties explicitly involved in your matter.
                    </p>
                  </div>
                </Card>
              )}

              {/* ── SECURITY ── */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <Card className="p-6">
                    <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Change Password</h2>
                    <p className="text-neutral-400 text-body-sm mb-6">
                      Use a strong password — at least 8 characters with a mix of letters and numbers.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={pwForm.current}
                          onChange={e => setPwForm(prev => ({ ...prev, current: e.target.value }))}
                          className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50
                           border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                           focus:border-gold-400 font-body text-body-md"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={pwForm.next}
                          onChange={e => setPwForm(prev => ({ ...prev, next: e.target.value }))}
                          className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50
                           border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                           focus:border-gold-400 font-body text-body-md"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={pwForm.confirm}
                          onChange={e => setPwForm(prev => ({ ...prev, confirm: e.target.value }))}
                          className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50
                           border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                           focus:border-gold-400 font-body text-body-md"
                        />
                      </div>
                      {pwError && (
                        <p className="text-crimson-300 text-sm">{pwError}</p>
                      )}
                      {pwSuccess && (
                        <p className="text-emerald-400 text-sm">Password changed successfully.</p>
                      )}
                      <Button
                        variant="gold"
                        size="sm"
                        disabled={pwSaving}
                        onClick={async () => {
                          setPwError('')
                          setPwSuccess(false)
                          if (!pwForm.current) { setPwError('Enter your current password.'); return }
                          if (pwForm.next.length < 8) { setPwError('New password must be at least 8 characters.'); return }
                          if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
                          const access = localStorage.getItem('access')
                          if (!access) return
                          setPwSaving(true)
                          try {
                            await api.post('auth', '/auth/me/password/', {
                              current_password: pwForm.current,
                              new_password: pwForm.next,
                              confirm_password: pwForm.confirm,
                            }, access)
                            setPwSuccess(true)
                            setPwForm({ current: '', next: '', confirm: '' })
                          } catch (e) {
                            setPwError(e instanceof Error ? e.message.replace(/^4\d\d.*?: /, '') : 'Failed to change password')
                          } finally {
                            setPwSaving(false)
                          }
                        }}
                      >
                        {pwSaving ? 'Saving…' : 'Change Password'}
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Two-Factor Authentication</h2>
                    <p className="text-neutral-400 text-body-sm mb-4">
                      Add an extra layer of security to your account with 2FA.
                    </p>
                    <Button variant="outline" size="sm">Enable 2FA</Button>
                  </Card>

                  <Card className="p-6 border border-crimson-500/30">
                    <h2 className="font-heading text-body-lg text-crimson-400 mb-1">Danger Zone</h2>
                    <p className="text-neutral-400 text-body-sm mb-4">
                      Permanently delete your account. This cannot be undone.
                    </p>
                    <Button variant="destructive" size="sm">Delete Account</Button>
                  </Card>
                </div>
              )}

              {/* Save bar — shown for preferences tabs only */}
              {activeTab !== 'security' && activeTab !== 'account' && (
                <div className="mt-6 flex items-center gap-4">
                  <Button variant="gold" onClick={handleSave} disabled={saving}>
                    {saving ? t('settings.saving', lang) : t('settings.save', lang)}
                  </Button>
                  {saveSuccess && <span className="text-emerald-400 text-sm">{t('settings.saved', lang)}</span>}
                  {saveError && <span className="text-crimson-300 text-sm">{saveError}</span>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
