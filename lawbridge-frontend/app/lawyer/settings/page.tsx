'use client'
import React, { useEffect, useState, useCallback } from 'react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { api } from '../../../lib/api'
import { toastSuccess, toastError } from '../../../lib/toast'

// ── Types ──────────────────────────────────────────────────────────────────

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

type AvailabilitySlot = {
  id?: string
  day_of_week: number
  day_name?: string
  start_time: string
  end_time: string
  is_available: boolean
}

type CasePrefs = {
  max_active_cases: number
  practice_circuit: string
  accepted_case_types: string
  accepts_urgent_cases: boolean
  consultation_mode: 'in_person' | 'virtual' | 'both'
  availability_status: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const CIRCUITS = [
  'Adamawa', 'Centre', 'East', 'Far North', 'Littoral',
  'North', 'Northwest', 'South', 'Southwest', 'West', 'National',
]

const CASE_TYPES = [
  'Family Law', 'Criminal Law', 'Civil Law', 'Labor Law', 'Commercial Law',
  'Real Estate Law', 'Immigration Law', 'Tax Law', 'Constitutional Law',
  'Administrative Law', 'Intellectual Property', 'Banking & Finance',
]

const CONSULTATION_MODES = [
  { value: 'in_person', label: 'In Person Only' },
  { value: 'virtual', label: 'Virtual Only' },
  { value: 'both', label: 'Both In-Person & Virtual' },
]

const AVAILABILITY_STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
]

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

const DEFAULT_CASE_PREFS: CasePrefs = {
  max_active_cases: 20,
  practice_circuit: '',
  accepted_case_types: '',
  accepts_urgent_cases: true,
  consultation_mode: 'both',
  availability_status: 'available',
}

type Tab = 'availability' | 'caseprefs' | 'fees' | 'notifications' | 'language' | 'security'

const TABS: { id: Tab; label: string }[] = [
  { id: 'availability', label: 'Availability Schedule' },
  { id: 'caseprefs', label: 'Case Preferences' },
  { id: 'fees', label: 'Fees' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'language', label: 'Language & Locale' },
  { id: 'security', label: 'Security' },
]

// ── Shared components ──────────────────────────────────────────────────────

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

function SettingRow({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode
}) {
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

// ── Availability Schedule tab ──────────────────────────────────────────────

function AvailabilityTab({
  slots, setSlots, onSave, saving, saveError, saveSuccess,
}: {
  slots: AvailabilitySlot[]
  setSlots: React.Dispatch<React.SetStateAction<AvailabilitySlot[]>>
  onSave: () => void
  saving: boolean
  saveError: string
  saveSuccess: boolean
}) {
  const addSlot = (dayIndex: number) => {
    setSlots(prev => [...prev, {
      day_of_week: dayIndex,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
    }])
  }

  const removeSlot = (idx: number) => {
    setSlots(prev => prev.filter((_, i) => i !== idx))
  }

  const updateSlot = (idx: number, patch: Partial<AvailabilitySlot>) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Weekly Availability Schedule</h2>
        <p className="text-neutral-400 text-body-sm mb-6">
          Set the hours you are available for consultations each day. Clients will see this when booking appointments.
        </p>

        <div className="space-y-3">
          {DAYS.map((day, dayIndex) => {
            const daySlots = slots
              .map((s, i) => ({ ...s, _idx: i }))
              .filter(s => s.day_of_week === dayIndex)

            return (
              <div key={day} className="rounded-lg border border-neutral-700/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading text-body-md text-neutral-200">{day}</span>
                  <button
                    onClick={() => addSlot(dayIndex)}
                    className="text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors"
                  >
                    + Add slot
                  </button>
                </div>

                {daySlots.length === 0 ? (
                  <p className="text-neutral-500 text-body-sm">No slots — not available this day</p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map(slot => (
                      <div key={slot._idx} className="flex flex-wrap items-center gap-3">
                        <input
                          type="time"
                          value={slot.start_time}
                          onChange={e => updateSlot(slot._idx, { start_time: e.target.value })}
                          className="rounded-lg px-3 py-1.5 bg-primary-800/40 text-neutral-100
                           border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                           focus:border-gold-400 text-sm"
                        />
                        <span className="text-neutral-500 text-sm">to</span>
                        <input
                          type="time"
                          value={slot.end_time}
                          onChange={e => updateSlot(slot._idx, { end_time: e.target.value })}
                          className="rounded-lg px-3 py-1.5 bg-primary-800/40 text-neutral-100
                           border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                           focus:border-gold-400 text-sm"
                        />
                        <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={slot.is_available}
                            onChange={e => updateSlot(slot._idx, { is_available: e.target.checked })}
                            className="rounded border-neutral-600 accent-gold-500"
                          />
                          Available
                        </label>
                        <button
                          onClick={() => removeSlot(slot._idx)}
                          className="text-crimson-400 hover:text-crimson-300 text-sm transition-colors ml-auto"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <Button variant="gold" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Schedule'}
        </Button>
        {saveSuccess && <span className="text-emerald-400 text-sm">Schedule saved.</span>}
        {saveError && <span className="text-crimson-300 text-sm">{saveError}</span>}
      </div>
    </div>
  )
}

// ── Case Preferences tab ───────────────────────────────────────────────────

function CasePrefsTab({
  casePrefs, setCasePrefs, onSave, saving, saveError, saveSuccess,
}: {
  casePrefs: CasePrefs
  setCasePrefs: React.Dispatch<React.SetStateAction<CasePrefs>>
  onSave: () => void
  saving: boolean
  saveError: string
  saveSuccess: boolean
}) {
  const selectedTypes = casePrefs.accepted_case_types
    ? casePrefs.accepted_case_types.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const toggleType = (type: string) => {
    const updated = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type]
    setCasePrefs(prev => ({ ...prev, accepted_case_types: updated.join(', ') }))
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Case Preferences</h2>
        <p className="text-neutral-400 text-body-sm mb-6">
          Control which cases you accept and how the matching algorithm assigns matters to you.
        </p>

        <div className="space-y-6">
          {/* Availability status */}
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">
              Current Availability Status
            </label>
            <select
              value={casePrefs.availability_status}
              onChange={e => setCasePrefs(prev => ({ ...prev, availability_status: e.target.value }))}
              className="w-full sm:w-64 rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50
               border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
               focus:border-gold-400 font-body text-body-md"
            >
              {AVAILABILITY_STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-primary-900">{o.label}</option>
              ))}
            </select>
          </div>

          {/* Max active cases */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">
                Maximum Active Cases
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={casePrefs.max_active_cases}
                onChange={e => setCasePrefs(prev => ({ ...prev, max_active_cases: parseInt(e.target.value, 10) || 1 }))}
                className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50
                 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                 focus:border-gold-400 font-body text-body-md"
              />
              <p className="text-neutral-500 text-xs mt-1">The system will stop assigning new cases when this limit is reached.</p>
            </div>

            {/* Practice Circuit */}
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">
                Primary Legal Circuit
              </label>
              <select
                value={casePrefs.practice_circuit}
                onChange={e => setCasePrefs(prev => ({ ...prev, practice_circuit: e.target.value }))}
                className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50
                 border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                 focus:border-gold-400 font-body text-body-md"
              >
                <option value="" className="bg-primary-900">Select circuit…</option>
                {CIRCUITS.map(c => (
                  <option key={c} value={c} className="bg-primary-900">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Consultation mode */}
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">
              Consultation Mode
            </label>
            <div className="flex flex-wrap gap-3">
              {CONSULTATION_MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setCasePrefs(prev => ({ ...prev, consultation_mode: m.value as CasePrefs['consultation_mode'] }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                    ${casePrefs.consultation_mode === m.value
                      ? 'border-gold-400 bg-gold-500/15 text-gold-300'
                      : 'border-neutral-700/50 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urgent cases */}
          <SettingRow
            label="Accept Urgent Cases"
            description="Allow the system to assign time-sensitive matters to you outside normal hours"
          >
            <Toggle
              checked={casePrefs.accepts_urgent_cases}
              onChange={v => setCasePrefs(prev => ({ ...prev, accepts_urgent_cases: v }))}
            />
          </SettingRow>

          {/* Accepted case types */}
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-3">
              Accepted Case Types
            </label>
            <p className="text-neutral-500 text-xs mb-3">
              Select the areas of law you practice. Leave empty to accept all types.
            </p>
            <div className="flex flex-wrap gap-2">
              {CASE_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors
                    ${selectedTypes.includes(type)
                      ? 'border-gold-400 bg-gold-500/15 text-gold-300'
                      : 'border-neutral-700/50 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {selectedTypes.length > 0 && (
              <p className="text-neutral-500 text-xs mt-3">
                Selected: {selectedTypes.join(', ')}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <Button variant="gold" onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Preferences'}
        </Button>
        {saveSuccess && <span className="text-emerald-400 text-sm">Saved.</span>}
        {saveError && <span className="text-crimson-300 text-sm">{saveError}</span>}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function LawyerSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('availability')
  const [loading, setLoading] = useState(true)
  const [noLawyerProfile, setNoLawyerProfile] = useState(false)

  // Preferences state
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [prefsError, setPrefsError] = useState('')
  const [prefsSuccess, setPrefsSuccess] = useState(false)

  // Availability state
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [availSaving, setAvailSaving] = useState(false)
  const [availError, setAvailError] = useState('')
  const [availSuccess, setAvailSuccess] = useState(false)

  // Case preferences state
  const [casePrefs, setCasePrefs] = useState<CasePrefs>(DEFAULT_CASE_PREFS)
  const [caseSaving, setCaseSaving] = useState(false)
  const [caseError, setCaseError] = useState('')
  const [caseSuccess, setCaseSuccess] = useState(false)

  // Fee state
  const [fees, setFees] = useState({ consultation_fee: '', procedural_fee: '', professional_fee: '' })
  const [feesSaving, setFeesSaving] = useState(false)
  const [feesError, setFeesError] = useState('')
  const [feesSuccess, setFeesSuccess] = useState(false)

  // Password state
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { setLoading(false); return }

      await Promise.allSettled([
        // Load user preferences
        api.get<Prefs>('auth', '/auth/preferences/', access)
          .then(data => setPrefs(prev => ({ ...prev, ...data })))
          .catch(() => {}),

        // Load lawyer profile for case preferences and fees
        api.get<{ availability_status: string; max_active_cases: number; practice_circuit: string; accepted_case_types: string; accepts_urgent_cases: boolean; consultation_mode: string; consultation_fee?: string; procedural_fee?: string; professional_fee?: string }>(
          'lawyer', '/lawyers/me/', access
        ).then(p => {
          setCasePrefs({
            max_active_cases: p.max_active_cases ?? 20,
            practice_circuit: p.practice_circuit ?? '',
            accepted_case_types: p.accepted_case_types ?? '',
            accepts_urgent_cases: p.accepts_urgent_cases ?? true,
            consultation_mode: (p.consultation_mode ?? 'both') as CasePrefs['consultation_mode'],
            availability_status: p.availability_status ?? 'available',
          })
          setFees({
            consultation_fee: p.consultation_fee ?? '',
            procedural_fee: p.procedural_fee ?? '',
            professional_fee: p.professional_fee ?? '',
          })
        }).catch(() => setNoLawyerProfile(true)),

        // Load availability slots
        api.get<AvailabilitySlot[]>('lawyer', '/lawyers/me/availability/', access)
          .then(data => setSlots(Array.isArray(data) ? data : []))
          .catch(() => {}),
      ])

      setLoading(false)
    }
    void run()
  }, [])

  const handleSavePrefs = async () => {
    const access = localStorage.getItem('access')
    if (!access) return
    setPrefsSaving(true)
    setPrefsError('')
    setPrefsSuccess(false)
    try {
      await api.patch('auth', '/auth/preferences/', prefs, access)
      setPrefsSuccess(true)
      setTimeout(() => setPrefsSuccess(false), 3000)
    } catch (cause) {
      setPrefsError(cause instanceof Error ? cause.message : 'Failed to save')
    } finally {
      setPrefsSaving(false)
    }
  }

  const handleSaveAvailability = async () => {
    if (noLawyerProfile) {
      setAvailError('Create your professional profile in Office Settings before configuring availability.')
      return
    }
    const access = localStorage.getItem('access')
    if (!access) return
    setAvailSaving(true)
    setAvailError('')
    setAvailSuccess(false)
    try {
      const clean = slots.map(({ day_of_week, start_time, end_time, is_available }) => ({
        day_of_week, start_time, end_time, is_available,
      }))
      const updated = await api.put<AvailabilitySlot[]>('lawyer', '/lawyers/me/availability/', clean, access)
      setSlots(Array.isArray(updated) ? updated : [])
      setAvailSuccess(true)
      toastSuccess('Availability schedule saved')
      setTimeout(() => setAvailSuccess(false), 3000)
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : 'Failed to save schedule'
      setAvailError(msg.includes('404') ? 'Professional profile not found. Create it in Office Settings first.' : msg)
    } finally {
      setAvailSaving(false)
    }
  }

  const handleSaveCasePrefs = async () => {
    if (noLawyerProfile) {
      setCaseError('Create your professional profile in Office Settings before setting case preferences.')
      return
    }
    const access = localStorage.getItem('access')
    if (!access) return
    setCaseSaving(true)
    setCaseError('')
    setCaseSuccess(false)
    try {
      await api.put('lawyer', '/lawyers/me/', casePrefs, access)
      setCaseSuccess(true)
      toastSuccess('Case preferences saved')
      setTimeout(() => setCaseSuccess(false), 3000)
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : 'Failed to save'
      setCaseError(msg.includes('404') ? 'Professional profile not found. Create it in Office Settings first.' : msg)
    } finally {
      setCaseSaving(false)
    }
  }

  const handleSaveFees = async () => {
    if (noLawyerProfile) {
      setFeesError('Create your professional profile in Office Settings before setting fees.')
      return
    }
    const access = localStorage.getItem('access')
    if (!access) return
    setFeesSaving(true); setFeesError(''); setFeesSuccess(false)
    try {
      await api.put('lawyer', '/lawyers/me/', fees, access)
      setFeesSuccess(true)
      toastSuccess('Fee structure saved')
      setTimeout(() => setFeesSuccess(false), 3000)
    } catch (cause) {
      const feesMsg = cause instanceof Error ? cause.message : 'Failed to save fees'
      setFeesError(feesMsg)
      toastError(feesMsg, 'Could not save fees')
    } finally {
      setFeesSaving(false)
    }
  }

  return (
    <div className="max-w-4xl w-full space-y-6">
      <div>
        <h1 className="font-display text-display-md text-neutral-50">Settings</h1>
        <p className="text-neutral-400">Manage your availability, case preferences, and account security</p>
      </div>

      {noLawyerProfile && (
        <div className="rounded-xl border border-gold-400/30 bg-gold-500/10 px-4 py-3 text-sm text-gold-200">
          You don&apos;t have a professional profile yet. Visit{' '}
          <a href="/lawyer/office/me/settings" className="underline hover:text-gold-100">Office Settings</a>{' '}
          to create one before configuring case preferences.
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab list */}
        <nav className="md:w-52 shrink-0">
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
              {activeTab === 'availability' && (
                <AvailabilityTab
                  slots={slots}
                  setSlots={setSlots}
                  onSave={handleSaveAvailability}
                  saving={availSaving}
                  saveError={availError}
                  saveSuccess={availSuccess}
                />
              )}

              {activeTab === 'caseprefs' && (
                <CasePrefsTab
                  casePrefs={casePrefs}
                  setCasePrefs={setCasePrefs}
                  onSave={handleSaveCasePrefs}
                  saving={caseSaving}
                  saveError={caseError}
                  saveSuccess={caseSuccess}
                />
              )}

              {activeTab === 'fees' && (
                <Card className="p-6 space-y-6">
                  <div>
                    <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Fee Structure</h2>
                    <p className="text-neutral-400 text-body-sm">Set the fees you charge clients. Consultation and procedural fees are compulsory and shown upfront. Professional fees are negotiable and indicated as a starting point.</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">
                        Consultation Fee (XAF) <span className="text-amber-400 ml-1">Compulsory</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={fees.consultation_fee}
                        onChange={e => setFees(f => ({ ...f, consultation_fee: e.target.value }))}
                        placeholder="e.g. 25000"
                        className="w-full max-w-xs rounded-lg px-4 py-3 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50"
                      />
                      <p className="text-xs text-neutral-500 mt-1">Charged at booking time. Refunded if you decline the booking.</p>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">
                        Procedural Fee (XAF) <span className="text-amber-400 ml-1">Compulsory</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={fees.procedural_fee}
                        onChange={e => setFees(f => ({ ...f, procedural_fee: e.target.value }))}
                        placeholder="e.g. 10000"
                        className="w-full max-w-xs rounded-lg px-4 py-3 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50"
                      />
                      <p className="text-xs text-neutral-500 mt-1">Court filing fees, process server costs, etc. Charged at booking time.</p>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">
                        Professional Fee (XAF) <span className="text-emerald-400 ml-1">Negotiable</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={fees.professional_fee}
                        onChange={e => setFees(f => ({ ...f, professional_fee: e.target.value }))}
                        placeholder="e.g. 150000 (indicative)"
                        className="w-full max-w-xs rounded-lg px-4 py-3 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50"
                      />
                      <p className="text-xs text-neutral-500 mt-1">Ongoing legal representation fee. Shown as indicative — agreed directly with the client after acceptance. Leave 0 if fully negotiable.</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gold-500/20 bg-gold-500/5 p-4 text-sm text-neutral-300">
                    <p className="font-medium text-gold-300 mb-1">How fees work</p>
                    <ul className="space-y-1 text-xs text-neutral-400 list-disc pl-4">
                      <li><strong className="text-amber-300">Consultation + Procedural fees</strong> — collected at booking time via Mobile Money or bank transfer.</li>
                      <li><strong className="text-emerald-300">Professional fee</strong> — discussed and agreed with the client after you accept the booking.</li>
                      <li>The secretary can view and verify all payment records.</li>
                    </ul>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={handleSaveFees} disabled={feesSaving}>
                      {feesSaving ? 'Saving…' : 'Save Fees'}
                    </Button>
                    {feesSuccess && <span className="text-emerald-400 text-sm">Fees saved ✓</span>}
                    {feesError && <span className="text-crimson-300 text-sm">{feesError}</span>}
                  </div>
                </Card>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <Card className="p-6">
                    <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Notification Preferences</h2>
                    <p className="text-neutral-400 text-body-sm mb-6">
                      Choose which events send you notifications.
                    </p>
                    <SettingRow label="Case Assignments & Updates" description="New case assigned, status changes, hearing dates">
                      <Toggle checked={prefs.notify_case_updates} onChange={v => setPrefs(p => ({ ...p, notify_case_updates: v }))} />
                    </SettingRow>
                    <SettingRow label="Document Activity" description="When clients upload documents or sign agreements">
                      <Toggle checked={prefs.notify_documents} onChange={v => setPrefs(p => ({ ...p, notify_documents: v }))} />
                    </SettingRow>
                    <SettingRow label="Client Messages" description="When a client sends you a message">
                      <Toggle checked={prefs.notify_messages} onChange={v => setPrefs(p => ({ ...p, notify_messages: v }))} />
                    </SettingRow>
                    <SettingRow label="Billing & Payments" description="Invoice payments, overdue reminders">
                      <Toggle checked={prefs.notify_billing} onChange={v => setPrefs(p => ({ ...p, notify_billing: v }))} />
                    </SettingRow>
                    <SettingRow label="Calendar Reminders" description="Appointment and court date reminders">
                      <Toggle checked={prefs.notify_reminders} onChange={v => setPrefs(p => ({ ...p, notify_reminders: v }))} />
                    </SettingRow>
                  </Card>
                  <div className="flex items-center gap-4">
                    <Button variant="gold" onClick={handleSavePrefs} disabled={prefsSaving}>
                      {prefsSaving ? 'Saving…' : 'Save'}
                    </Button>
                    {prefsSuccess && <span className="text-emerald-400 text-sm">Saved.</span>}
                    {prefsError && <span className="text-crimson-300 text-sm">{prefsError}</span>}
                  </div>
                </div>
              )}

              {activeTab === 'language' && (
                <div className="space-y-4">
                  <Card className="p-6">
                    <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Language & Locale</h2>
                    <p className="text-neutral-400 text-body-sm mb-6">
                      Set your preferred working language. This affects the platform interface and document defaults.
                    </p>
                    <SettingRow label="Platform Language" description="Interface language for Lawbridge">
                      <select
                        value={prefs.language}
                        onChange={e => setPrefs(p => ({ ...p, language: e.target.value as 'en' | 'fr' }))}
                        className="rounded-lg px-4 py-2 bg-primary-800/40 text-neutral-50
                         border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                         focus:border-gold-400 font-body text-body-sm"
                      >
                        <option value="en" className="bg-primary-900">English</option>
                        <option value="fr" className="bg-primary-900">Français</option>
                      </select>
                    </SettingRow>
                    <SettingRow label="Preferred Contact Method" description="How clients should reach you by default">
                      <select
                        value={prefs.preferred_contact}
                        onChange={e => setPrefs(p => ({ ...p, preferred_contact: e.target.value as Prefs['preferred_contact'] }))}
                        className="rounded-lg px-4 py-2 bg-primary-800/40 text-neutral-50
                         border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                         focus:border-gold-400 font-body text-body-sm"
                      >
                        <option value="email" className="bg-primary-900">Email</option>
                        <option value="phone" className="bg-primary-900">Phone</option>
                        <option value="in_app" className="bg-primary-900">In-App Only</option>
                      </select>
                    </SettingRow>
                    <SettingRow
                      label="Profile Searchable"
                      description="Appear in client search results and the public lawyer directory"
                    >
                      <Toggle
                        checked={prefs.profile_visible}
                        onChange={v => setPrefs(p => ({ ...p, profile_visible: v }))}
                      />
                    </SettingRow>
                  </Card>
                  <div className="flex items-center gap-4">
                    <Button variant="gold" onClick={handleSavePrefs} disabled={prefsSaving}>
                      {prefsSaving ? 'Saving…' : 'Save'}
                    </Button>
                    {prefsSuccess && <span className="text-emerald-400 text-sm">Saved.</span>}
                    {prefsError && <span className="text-crimson-300 text-sm">{prefsError}</span>}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  <Card className="p-6">
                    <h2 className="font-heading text-body-lg text-neutral-50 mb-1">Change Password</h2>
                    <p className="text-neutral-400 text-body-sm mb-6">
                      Keep your account secure with a strong password.
                    </p>
                    <div className="space-y-4">
                      {(['current', 'next', 'confirm'] as const).map((field, i) => (
                        <div key={field}>
                          <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">
                            {['Current Password', 'New Password', 'Confirm New Password'][i]}
                          </label>
                          <input
                            type="password"
                            value={pwForm[field]}
                            onChange={e => setPwForm(prev => ({ ...prev, [field]: e.target.value }))}
                            className="w-full rounded-lg px-4 py-3 bg-primary-800/40 text-neutral-50
                             border border-neutral-700/50 focus:outline-none focus:ring-2 focus:ring-gold-500/50
                             focus:border-gold-400 font-body text-body-md"
                          />
                        </div>
                      ))}
                      {pwError && <p className="text-crimson-300 text-sm">{pwError}</p>}
                      {pwSuccess && <p className="text-emerald-400 text-sm">Password changed successfully.</p>}
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
                            toastSuccess('Password changed successfully')
                            setPwForm({ current: '', next: '', confirm: '' })
                          } catch (e) {
                            const pwMsg = e instanceof Error ? e.message.replace(/^4\d\d.*?: /, '') : 'Failed to change password'
                            setPwError(pwMsg)
                            toastError(pwMsg, 'Password change failed')
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
                      Protect client data and your account with 2FA verification.
                    </p>
                    <Button variant="outline" size="sm">Enable 2FA</Button>
                  </Card>

                  <Card className="p-6 border border-crimson-500/30">
                    <h2 className="font-heading text-body-lg text-crimson-400 mb-1">Danger Zone</h2>
                    <p className="text-neutral-400 text-body-sm mb-4">
                      Permanently delete your lawyer account. Active matters must be resolved before deletion.
                    </p>
                    <Button variant="destructive" size="sm">Delete Account</Button>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
