'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { toastSuccess, toastError } from '../../lib/toast'
import * as cf from '../../lib/caseFileApi'
import {
  Countdown, fmtDate, fmtXAF, daysBetween, SectionHeader, EmptyRow, AddButton,
  Field, TextInput, Select, Textarea, InlineForm, DeleteBtn,
} from './primitives'
import {
  BuildingIcon, UsersIcon, GavelIcon, ClockIcon, PaymentIcon, ShieldIcon,
  HandshakeIcon, ClipboardIcon, AlertTriangleIcon, CheckIcon, BookOpenIcon, SearchIcon,
} from '../icons/Icons'
import { listBooks, type BookItem } from '../../lib/libraryApi'

type Props = { caseId: string; caseType: string; token: string }

const TABS = [
  { key: 'court',        label: 'Court',        Icon: BuildingIcon },
  { key: 'parties',      label: 'Parties',      Icon: UsersIcon },
  { key: 'hearings',     label: 'Hearings',     Icon: GavelIcon },
  { key: 'deadlines',    label: 'Deadlines',    Icon: ClockIcon },
  { key: 'disbursements',label: 'Expenses',     Icon: PaymentIcon },
  { key: 'detention',    label: 'Detention',    Icon: ShieldIcon },
  { key: 'conciliation', label: 'Conciliation', Icon: HandshakeIcon },
  { key: 'authorities',  label: 'Authorities',  Icon: BookOpenIcon },
  { key: 'procedures',   label: 'Procedures',   Icon: ClipboardIcon },
] as const

type TabKey = typeof TABS[number]['key']

export default function CaseFileWorkspace({ caseId, caseType, token }: Props) {
  const [tab, setTab] = useState<TabKey>('court')

  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-soft text-portal">
          <ClipboardIcon width={16} height={16} />
        </div>
        <div>
          <h3 className="font-heading text-sm font-semibold text-neutral-100">Case File</h3>
          <p className="text-[11px] text-neutral-500">Court record, parties, deadlines &amp; procedure — the working file</p>
        </div>
      </div>

      {/* Sub-tab nav */}
      <div className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-white/6 bg-primary-900/30">
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                active ? 'bg-portal-soft text-portal' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/4'
              }`}
            >
              <Icon width={14} height={14} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Section body */}
      <div className="p-5">
        {tab === 'court' && <CourtSection caseId={caseId} token={token} />}
        {tab === 'parties' && <PartiesSection caseId={caseId} token={token} />}
        {tab === 'hearings' && <HearingsSection caseId={caseId} token={token} />}
        {tab === 'deadlines' && <DeadlinesSection caseId={caseId} token={token} />}
        {tab === 'disbursements' && <DisbursementsSection caseId={caseId} token={token} />}
        {tab === 'detention' && <DetentionSection caseId={caseId} token={token} />}
        {tab === 'conciliation' && <ConciliationSection caseId={caseId} token={token} />}
        {tab === 'authorities' && <AuthoritiesSection caseId={caseId} token={token} />}
        {tab === 'procedures' && <ProceduresSection caseId={caseId} caseType={caseType} token={token} />}
      </div>
    </div>
  )
}

// ═══ COURT & REGISTRY ═══════════════════════════════════════════════════════════

function CourtSection({ caseId, token }: { caseId: string; token: string }) {
  const [form, setForm] = useState<cf.CourtInfo | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    // Court info is part of the case object; fetch fresh case detail
    import('../../lib/api').then(({ api }) => {
      api.get<cf.CourtInfo>('case', `/cases/${caseId}/`, token)
        .then(c => setForm({
          court_level: c.court_level || '', court_name: c.court_name || '',
          court_location: c.court_location || '', chamber: c.chamber || '',
          judge_name: c.judge_name || '', suit_number: c.suit_number || '',
          relation_type: c.relation_type || '', parent_case: c.parent_case || null,
        }))
        .catch(() => setForm({ court_level: '', court_name: '', court_location: '', chamber: '', judge_name: '', suit_number: '', relation_type: '', parent_case: null }))
    })
  }, [caseId, token])

  const set = (k: keyof cf.CourtInfo, v: string) => {
    setForm(f => f ? { ...f, [k]: v } : f)
    setDirty(true)
  }

  const save = async () => {
    if (!form) return
    setSaving(true)
    try {
      await cf.updateCourtInfo(caseId, form, token)
      toastSuccess('Court information saved')
      setDirty(false)
    } catch { toastError('Could not save court information') }
    finally { setSaving(false) }
  }

  if (!form) return <EmptyRow text="Loading…" />

  return (
    <div className="space-y-4">
      <SectionHeader title="Court & Registry" subtitle="Where the matter lives in the court system" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Court Level">
          <Select value={form.court_level} onChange={e => set('court_level', e.target.value)}>
            <option value="">Select court…</option>
            {cf.COURT_LEVELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Suit Number / Numéro de Rôle">
          <TextInput value={form.suit_number} onChange={e => set('suit_number', e.target.value)} placeholder="e.g. RG 234/2026" />
        </Field>
        <Field label="Court Name">
          <TextInput value={form.court_name} onChange={e => set('court_name', e.target.value)} placeholder="e.g. TPI Douala-Bonanjo" />
        </Field>
        <Field label="Location">
          <TextInput value={form.court_location} onChange={e => set('court_location', e.target.value)} placeholder="e.g. Douala, Littoral" />
        </Field>
        <Field label="Chamber / Section">
          <TextInput value={form.chamber} onChange={e => set('chamber', e.target.value)} placeholder="e.g. Chambre civile" />
        </Field>
        <Field label="Presiding Judge">
          <TextInput value={form.judge_name} onChange={e => set('judge_name', e.target.value)} placeholder="Judge name" />
        </Field>
      </div>
      {dirty && (
        <button onClick={save} disabled={saving}
          className="rounded-lg bg-portal-accent px-5 py-2 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
          {saving ? 'Saving…' : 'Save Court Information'}
        </button>
      )}
    </div>
  )
}

// ═══ PARTIES (+ conflict check) ═════════════════════════════════════════════════

function PartiesSection({ caseId, token }: { caseId: string; token: string }) {
  const [parties, setParties] = useState<cf.CaseParty[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<cf.CaseParty>>({ role: 'defendant', name: '' })
  const [conflict, setConflict] = useState<cf.ConflictResult[] | null>(null)
  const [checking, setChecking] = useState(false)

  const load = useCallback(() => {
    cf.getParties(caseId, token).then(setParties).catch(() => {}).finally(() => setLoading(false))
  }, [caseId, token])
  useEffect(load, [load])

  const runConflictCheck = async (name: string) => {
    if (name.trim().length < 3) { setConflict(null); return }
    setChecking(true)
    try {
      const res = await cf.checkConflict(name, token)
      setConflict(res.results)
    } catch { setConflict(null) }
    finally { setChecking(false) }
  }

  const add = async () => {
    if (!draft.name?.trim()) { toastError('Party name is required'); return }
    setSaving(true)
    try {
      await cf.addParty(caseId, draft, token)
      toastSuccess('Party added')
      setAdding(false); setDraft({ role: 'defendant', name: '' }); setConflict(null)
      load()
    } catch { toastError('Could not add party') }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    try { await cf.deleteParty(caseId, id, token); setParties(p => p.filter(x => x.id !== id)) }
    catch { toastError('Could not remove party') }
  }

  const grouped = parties.reduce<Record<string, cf.CaseParty[]>>((acc, p) => {
    (acc[p.role_label] ||= []).push(p); return acc
  }, {})

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Parties & Counsel"
        subtitle="Everyone attached to the matter — basis for conflict checks"
        action={!adding && <AddButton onClick={() => setAdding(true)} label="Add Party" />}
      />

      {adding && (
        <InlineForm onSave={add} onCancel={() => { setAdding(false); setConflict(null) }} saving={saving} saveLabel="Add Party">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Role">
              <Select value={draft.role} onChange={e => setDraft(d => ({ ...d, role: e.target.value }))}>
                {cf.PARTY_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </Field>
            <Field label="Name">
              <TextInput value={draft.name ?? ''} placeholder="Full name"
                onChange={e => { setDraft(d => ({ ...d, name: e.target.value })); runConflictCheck(e.target.value) }} />
            </Field>
            <Field label="Organization"><TextInput value={draft.organization ?? ''} onChange={e => setDraft(d => ({ ...d, organization: e.target.value }))} placeholder="Firm / company (optional)" /></Field>
            <Field label="Phone"><TextInput value={draft.phone ?? ''} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} placeholder="Optional" /></Field>
          </div>

          {/* Live conflict-of-interest signal */}
          {checking && <p className="text-[11px] text-neutral-500">Checking for conflicts…</p>}
          {conflict && conflict.length > 0 && (
            <div className="rounded-lg border border-crimson-500/30 bg-crimson-500/10 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <AlertTriangleIcon width={13} height={13} className="text-crimson-400" />
                <p className="text-[11px] font-bold text-crimson-300">
                  Possible conflict — this name appears in {conflict.length} of your other matter{conflict.length > 1 ? 's' : ''}
                </p>
              </div>
              {conflict.slice(0, 3).map((c, i) => (
                <p key={i} className="text-[10px] text-neutral-400">
                  {c.is_opposing ? '⚠ opposing' : 'same-side'} · {c.party_name} in “{c.case_title}”
                </p>
              ))}
            </div>
          )}
          {conflict && conflict.length === 0 && draft.name && draft.name.trim().length >= 3 && !checking && (
            <p className="flex items-center gap-1 text-[11px] text-emerald-400"><CheckIcon width={12} height={12} />No conflicts found in your matters</p>
          )}
        </InlineForm>
      )}

      {loading ? <EmptyRow text="Loading…" /> : parties.length === 0 && !adding ? (
        <EmptyRow text="No parties recorded yet. Add plaintiffs, defendants, opposing counsel and witnesses." />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([roleLabel, list]) => (
            <div key={roleLabel}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">{roleLabel}</p>
              <div className="space-y-1.5">
                {list.map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-lg border border-white/6 bg-primary-900/30 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-100 truncate">{p.name}
                        {p.organization && <span className="text-neutral-500"> · {p.organization}</span>}
                      </p>
                      {p.phone && <p className="text-[11px] text-neutral-600">{p.phone}</p>}
                    </div>
                    <DeleteBtn onClick={() => remove(p.id)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ HEARINGS (outcomes + adjournment history) ══════════════════════════════════

function HearingsSection({ caseId, token }: { caseId: string; token: string }) {
  const [outcomes, setOutcomes] = useState<cf.HearingOutcome[]>([])
  const [adjournments, setAdjournments] = useState<cf.Adjournment[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<cf.HearingOutcome>>({
    outcome: 'held_proceeded', hearing_date: new Date().toISOString().slice(0, 10),
  })

  const load = useCallback(() => {
    Promise.all([cf.getHearingOutcomes(caseId, token), cf.getAdjournments(caseId, token)])
      .then(([o, a]) => { setOutcomes(o); setAdjournments(a) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [caseId, token])
  useEffect(load, [load])

  const add = async () => {
    if (!draft.hearing_date) { toastError('Hearing date is required'); return }
    setSaving(true)
    try {
      await cf.addHearingOutcome(caseId, draft, token)
      toastSuccess('Hearing recorded — timeline and deadlines updated')
      setAdding(false)
      setDraft({ outcome: 'held_proceeded', hearing_date: new Date().toISOString().slice(0, 10) })
      load()
    } catch { toastError('Could not record hearing') }
    finally { setSaving(false) }
  }

  const isAdjourned = draft.outcome === 'adjourned'
  const seedsDeadline = draft.outcome === 'judgment_delivered' || draft.outcome === 'ruling_delivered'

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Hearings & Adjournments"
        subtitle={`${outcomes.length} hearing${outcomes.length !== 1 ? 's' : ''} · ${adjournments.length} adjournment${adjournments.length !== 1 ? 's' : ''} logged`}
        action={!adding && <AddButton onClick={() => setAdding(true)} label="Record Hearing" />}
      />

      {/* Adjournment streak — the pulse of Cameroonian litigation */}
      {adjournments.length >= 3 && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 flex items-center gap-2">
          <AlertTriangleIcon width={14} height={14} className="text-amber-400" />
          <p className="text-[11px] text-amber-300">
            This matter has been adjourned <span className="font-bold">{adjournments.length} times</span> — consider flagging for case-management attention.
          </p>
        </div>
      )}

      {adding && (
        <InlineForm onSave={add} onCancel={() => setAdding(false)} saving={saving} saveLabel="Record Hearing">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Hearing Date">
              <TextInput type="date" value={draft.hearing_date ?? ''} onChange={e => setDraft(d => ({ ...d, hearing_date: e.target.value }))} />
            </Field>
            <Field label="Outcome">
              <Select value={draft.outcome} onChange={e => setDraft(d => ({ ...d, outcome: e.target.value }))}>
                {cf.HEARING_OUTCOMES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
            {isAdjourned && (
              <Field label="Adjournment Reason">
                <Select value={draft.adjournment_reason ?? 'other'} onChange={e => setDraft(d => ({ ...d, adjournment_reason: e.target.value }))}>
                  {cf.ADJOURNMENT_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Select>
              </Field>
            )}
            <Field label="Next Hearing Date">
              <TextInput type="date" value={draft.next_hearing_date ?? ''} onChange={e => setDraft(d => ({ ...d, next_hearing_date: e.target.value }))} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="What happened"><Textarea rows={2} value={draft.summary ?? ''} onChange={e => setDraft(d => ({ ...d, summary: e.target.value }))} placeholder="Brief note of the hearing…" /></Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Next action before next hearing"><TextInput value={draft.next_action ?? ''} onChange={e => setDraft(d => ({ ...d, next_action: e.target.value }))} placeholder="e.g. File conclusions in reply" /></Field>
            </div>
          </div>
          {seedsDeadline && (
            <p className="text-[11px] text-portal flex items-center gap-1">
              <ClockIcon width={12} height={12} />An appeal-window deadline will be auto-created (default 10 days — verify the statutory period).
            </p>
          )}
        </InlineForm>
      )}

      {loading ? <EmptyRow text="Loading…" /> : outcomes.length === 0 && adjournments.length === 0 && !adding ? (
        <EmptyRow text="No hearings recorded yet. Log each hearing to build the litigation history." />
      ) : (
        <div className="space-y-2">
          {outcomes.map((o, i) => (
            <div key={o.id} className="stagger-child flex gap-3 rounded-lg border border-white/6 bg-primary-900/30 p-3" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
              <div className="flex-shrink-0 w-12 text-center">
                <p className="text-xs font-bold text-neutral-200">{new Date(o.hearing_date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric' })}</p>
                <p className="text-[9px] uppercase text-neutral-600">{new Date(o.hearing_date + 'T12:00:00').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-100">{o.outcome_label}</p>
                {o.summary && <p className="text-xs text-neutral-500 mt-0.5">{o.summary}</p>}
                {o.next_hearing_date && <p className="text-[11px] text-portal mt-1">Next hearing: {fmtDate(o.next_hearing_date)}{o.next_action ? ` — ${o.next_action}` : ''}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ DEADLINES ══════════════════════════════════════════════════════════════════

function DeadlinesSection({ caseId, token }: { caseId: string; token: string }) {
  const [items, setItems] = useState<cf.CaseDeadline[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<cf.CaseDeadline>>({ deadline_type: 'custom', title: '', due_date: '' })

  const load = useCallback(() => {
    cf.getDeadlines(caseId, token).then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [caseId, token])
  useEffect(load, [load])

  const add = async () => {
    if (!draft.title?.trim() || !draft.due_date) { toastError('Title and due date are required'); return }
    setSaving(true)
    try {
      await cf.addDeadline(caseId, draft, token)
      toastSuccess('Deadline added — you will be alerted as it approaches')
      setAdding(false); setDraft({ deadline_type: 'custom', title: '', due_date: '' }); load()
    } catch { toastError('Could not add deadline') }
    finally { setSaving(false) }
  }

  const setStatus = async (id: string, status: cf.CaseDeadline['status']) => {
    try { await cf.updateDeadline(caseId, id, { status }, token); load() }
    catch { toastError('Could not update deadline') }
  }
  const remove = async (id: string) => {
    try { await cf.deleteDeadline(caseId, id, token); setItems(x => x.filter(d => d.id !== id)) }
    catch { toastError('Could not delete deadline') }
  }

  const pending = items.filter(d => d.status === 'pending').sort((a, b) => a.due_date.localeCompare(b.due_date))
  const done = items.filter(d => d.status !== 'pending')

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Procedural Deadlines"
        subtitle="Appeal windows, prescription, filing dates — with automatic alerts"
        action={!adding && <AddButton onClick={() => setAdding(true)} label="Add Deadline" />}
      />

      {adding && (
        <InlineForm onSave={add} onCancel={() => setAdding(false)} saving={saving} saveLabel="Add Deadline">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={draft.deadline_type} onChange={e => setDraft(d => ({ ...d, deadline_type: e.target.value }))}>
                {cf.DEADLINE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Due Date">
              <TextInput type="date" value={draft.due_date ?? ''} onChange={e => setDraft(d => ({ ...d, due_date: e.target.value }))} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Title"><TextInput value={draft.title ?? ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="e.g. File notice of appeal" /></Field>
            </div>
          </div>
        </InlineForm>
      )}

      {loading ? <EmptyRow text="Loading…" /> : items.length === 0 && !adding ? (
        <EmptyRow text="No deadlines tracked yet. Add appeal windows, prescription periods and filing dates." />
      ) : (
        <div className="space-y-2">
          {pending.map((d, i) => {
            const days = daysBetween(d.due_date)
            const urgent = days < 0 || days <= 3
            return (
              <div key={d.id} className={`stagger-child flex items-center gap-3 rounded-lg border p-3 ${urgent ? 'border-crimson-500/25 bg-crimson-500/5' : 'border-white/6 bg-primary-900/30'}`} style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-100 truncate">{d.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase tracking-wide text-neutral-600">{d.type_label}</span>
                    <span className="text-[10px] text-neutral-600">· due {fmtDate(d.due_date)}</span>
                    {d.source !== 'manual' && <span className="text-[9px] px-1 rounded bg-portal-soft text-portal">auto</span>}
                  </div>
                </div>
                <Countdown days={days} />
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setStatus(d.id, 'met')} title="Mark met" className="text-neutral-600 hover:text-emerald-400 p-1"><CheckIcon width={14} height={14} /></button>
                  <button onClick={() => setStatus(d.id, 'waived')} title="Waive" className="text-neutral-600 hover:text-neutral-300 p-1 text-xs">✕</button>
                  <DeleteBtn onClick={() => remove(d.id)} />
                </div>
              </div>
            )
          })}
          {done.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">Resolved ({done.length})</p>
              {done.map(d => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg px-3 py-2 opacity-50">
                  <span className="flex-1 text-sm text-neutral-400 line-through truncate">{d.title}</span>
                  <span className={`text-[10px] ${d.status === 'met' ? 'text-emerald-400' : d.status === 'missed' ? 'text-crimson-400' : 'text-neutral-500'}`}>{d.status}</span>
                  <DeleteBtn onClick={() => remove(d.id)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══ DISBURSEMENTS ══════════════════════════════════════════════════════════════

function DisbursementsSection({ caseId, token }: { caseId: string; token: string }) {
  const [items, setItems] = useState<cf.Disbursement[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<cf.Disbursement>>({
    category: 'court_fees', amount: '', incurred_on: new Date().toISOString().slice(0, 10), billable: true,
  })

  const load = useCallback(() => {
    cf.getDisbursements(caseId, token).then(r => { setItems(r.results); setTotal(r.total_xaf) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [caseId, token])
  useEffect(load, [load])

  const add = async () => {
    if (!draft.amount || Number(draft.amount) <= 0) { toastError('A positive amount is required'); return }
    setSaving(true)
    try {
      await cf.addDisbursement(caseId, draft, token)
      toastSuccess('Expense recorded')
      setAdding(false)
      setDraft({ category: 'court_fees', amount: '', incurred_on: new Date().toISOString().slice(0, 10), billable: true })
      load()
    } catch { toastError('Could not record expense') }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    try { await cf.deleteDisbursement(caseId, id, token); load() }
    catch { toastError('Could not delete expense') }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Disbursements & Expenses"
        subtitle="Court fees, stamp duty, bailiff and expert costs billed to the client"
        action={!adding && <AddButton onClick={() => setAdding(true)} label="Add Expense" />}
      />

      <div className="rounded-lg border border-white/8 bg-primary-900/40 px-4 py-3 flex items-center justify-between">
        <span className="text-xs text-neutral-500">Total recorded disbursements</span>
        <span className="font-display text-lg font-bold text-portal stat-num">{fmtXAF(total)}</span>
      </div>

      {adding && (
        <InlineForm onSave={add} onCancel={() => setAdding(false)} saving={saving} saveLabel="Add Expense">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}>
                {cf.DISBURSEMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Amount (XAF)">
              <TextInput type="number" value={draft.amount ?? ''} onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))} placeholder="0" />
            </Field>
            <Field label="Date Incurred">
              <TextInput type="date" value={draft.incurred_on ?? ''} onChange={e => setDraft(d => ({ ...d, incurred_on: e.target.value }))} />
            </Field>
            <Field label="Description">
              <TextInput value={draft.description ?? ''} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Optional detail" />
            </Field>
          </div>
        </InlineForm>
      )}

      {loading ? <EmptyRow text="Loading…" /> : items.length === 0 && !adding ? (
        <EmptyRow text="No expenses recorded yet." />
      ) : (
        <div className="space-y-1.5">
          {items.map((d, i) => (
            <div key={d.id} className="stagger-child flex items-center gap-3 rounded-lg border border-white/6 bg-primary-900/30 px-3 py-2" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-100">{d.category_label}{d.description ? <span className="text-neutral-500"> · {d.description}</span> : ''}</p>
                <p className="text-[11px] text-neutral-600">{fmtDate(d.incurred_on)}{!d.billable ? ' · not billable' : ''}</p>
              </div>
              <span className="text-sm font-semibold text-neutral-200 tabular-nums">{fmtXAF(d.amount)}</span>
              <DeleteBtn onClick={() => remove(d.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ DETENTION ══════════════════════════════════════════════════════════════════

function DetentionSection({ caseId, token }: { caseId: string; token: string }) {
  const [items, setItems] = useState<cf.DetentionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<cf.DetentionRecord>>({
    detention_type: 'garde_a_vue', person_name: '', start_date: new Date().toISOString().slice(0, 10),
    statutory_limit_days: 2, extensions_days: 0,
  })

  const load = useCallback(() => {
    cf.getDetentionRecords(caseId, token).then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [caseId, token])
  useEffect(load, [load])

  const onTypeChange = (v: string) => {
    const preset = cf.DETENTION_TYPES.find(t => t.value === v)
    setDraft(d => ({ ...d, detention_type: v, statutory_limit_days: preset?.defaultDays ?? d.statutory_limit_days }))
  }

  const add = async () => {
    if (!draft.person_name?.trim()) { toastError('Detainee name is required'); return }
    setSaving(true)
    try {
      await cf.addDetentionRecord(caseId, draft, token)
      toastSuccess('Detention tracked — you will be alerted before the limit expires')
      setAdding(false)
      setDraft({ detention_type: 'garde_a_vue', person_name: '', start_date: new Date().toISOString().slice(0, 10), statutory_limit_days: 2, extensions_days: 0 })
      load()
    } catch { toastError('Could not add detention record') }
    finally { setSaving(false) }
  }
  const markReleased = async (id: string) => {
    try { await cf.updateDetentionRecord(caseId, id, { released: true, released_on: new Date().toISOString().slice(0, 10) }, token); load() }
    catch { toastError('Could not update record') }
  }
  const remove = async (id: string) => {
    try { await cf.deleteDetentionRecord(caseId, id, token); setItems(x => x.filter(r => r.id !== id)) }
    catch { toastError('Could not delete record') }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Detention Tracker"
        subtitle="Garde à vue & détention provisoire — statutory limits to the day"
        action={!adding && <AddButton onClick={() => setAdding(true)} label="Add Detainee" />}
      />

      {adding && (
        <InlineForm onSave={add} onCancel={() => setAdding(false)} saving={saving} saveLabel="Track Detention">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Detention Type">
              <Select value={draft.detention_type} onChange={e => onTypeChange(e.target.value)}>
                {cf.DETENTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Detainee Name">
              <TextInput value={draft.person_name ?? ''} onChange={e => setDraft(d => ({ ...d, person_name: e.target.value }))} placeholder="Full name" />
            </Field>
            <Field label="Start Date">
              <TextInput type="date" value={draft.start_date ?? ''} onChange={e => setDraft(d => ({ ...d, start_date: e.target.value }))} />
            </Field>
            <Field label="Statutory Limit (days)">
              <TextInput type="number" value={String(draft.statutory_limit_days ?? '')} onChange={e => setDraft(d => ({ ...d, statutory_limit_days: Number(e.target.value) }))} />
            </Field>
            <Field label="Extension Days (renewal orders)">
              <TextInput type="number" value={String(draft.extensions_days ?? 0)} onChange={e => setDraft(d => ({ ...d, extensions_days: Number(e.target.value) }))} />
            </Field>
            <Field label="Facility">
              <TextInput value={draft.facility ?? ''} onChange={e => setDraft(d => ({ ...d, facility: e.target.value }))} placeholder="Optional" />
            </Field>
          </div>
        </InlineForm>
      )}

      {loading ? <EmptyRow text="Loading…" /> : items.length === 0 && !adding ? (
        <EmptyRow text="No detention records. Add one for criminal matters to track custody limits." />
      ) : (
        <div className="space-y-2">
          {items.map((r, i) => {
            const expired = r.days_remaining !== null && r.days_remaining < 0
            return (
              <div key={r.id} className={`stagger-child rounded-lg border p-3 ${r.released ? 'border-white/6 bg-primary-900/30 opacity-60' : expired ? 'border-crimson-500/30 bg-crimson-500/8' : 'border-white/6 bg-primary-900/30'}`} style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-100">{r.person_name}</p>
                    <p className="text-[11px] text-neutral-600">{r.type_label} · from {fmtDate(r.start_date)}{r.facility ? ` · ${r.facility}` : ''}</p>
                  </div>
                  {r.released ? (
                    <span className="text-[11px] text-emerald-400">Released {fmtDate(r.released_on)}</span>
                  ) : (
                    <div className="text-right">
                      <Countdown days={r.days_remaining} overdueLabel="LIMIT EXCEEDED" />
                      <p className="text-[10px] text-neutral-600">expires {fmtDate(r.expiry_date)}</p>
                    </div>
                  )}
                </div>
                {!r.released && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-white/6">
                    <button onClick={() => markReleased(r.id)} className="text-[11px] text-emerald-400 hover:text-emerald-300">Mark released</button>
                    <button onClick={() => remove(r.id)} className="text-[11px] text-neutral-600 hover:text-crimson-400 ml-auto">Delete</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══ CONCILIATION ═══════════════════════════════════════════════════════════════

function ConciliationSection({ caseId, token }: { caseId: string; token: string }) {
  const [items, setItems] = useState<cf.ConciliationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<cf.ConciliationRecord>>({ forum: 'labour_inspector', status: 'not_started', required: true })

  const load = useCallback(() => {
    cf.getConciliation(caseId, token).then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [caseId, token])
  useEffect(load, [load])

  const add = async () => {
    setSaving(true)
    try {
      await cf.addConciliation(caseId, draft, token)
      toastSuccess('Conciliation record added')
      setAdding(false); setDraft({ forum: 'labour_inspector', status: 'not_started', required: true }); load()
    } catch { toastError('Could not add record') }
    finally { setSaving(false) }
  }
  const setStatus = async (id: string, status: string) => {
    try { await cf.updateConciliation(caseId, id, { status }, token); load() }
    catch { toastError('Could not update record') }
  }
  const remove = async (id: string) => {
    try { await cf.deleteConciliation(caseId, id, token); setItems(x => x.filter(r => r.id !== id)) }
    catch { toastError('Could not delete record') }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Pre-Litigation Conciliation"
        subtitle="Mandatory conciliation before labour / family disputes reach court"
        action={!adding && <AddButton onClick={() => setAdding(true)} label="Add Record" />}
      />

      {adding && (
        <InlineForm onSave={add} onCancel={() => setAdding(false)} saving={saving} saveLabel="Add Record">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Forum">
              <Select value={draft.forum} onChange={e => setDraft(d => ({ ...d, forum: e.target.value }))}>
                {cf.CONCILIATION_FORUMS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={draft.status} onChange={e => setDraft(d => ({ ...d, status: e.target.value }))}>
                {cf.CONCILIATION_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </Field>
            <Field label="Scheduled Date">
              <TextInput type="date" value={draft.scheduled_date ?? ''} onChange={e => setDraft(d => ({ ...d, scheduled_date: e.target.value }))} />
            </Field>
            <Field label="PV Reference">
              <TextInput value={draft.pv_reference ?? ''} onChange={e => setDraft(d => ({ ...d, pv_reference: e.target.value }))} placeholder="Non-conciliation PV no." />
            </Field>
          </div>
        </InlineForm>
      )}

      {loading ? <EmptyRow text="Loading…" /> : items.length === 0 && !adding ? (
        <EmptyRow text="No conciliation records. Required before filing labour and divorce matters." />
      ) : (
        <div className="space-y-2">
          {items.map((r, i) => (
            <div key={r.id} className="stagger-child rounded-lg border border-white/6 bg-primary-900/30 p-3" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-100">{r.forum_label}</p>
                  {r.pv_reference && <p className="text-[11px] text-neutral-600">PV: {r.pv_reference}</p>}
                </div>
                <select value={r.status} onChange={e => setStatus(r.id, e.target.value)}
                  className="rounded-md bg-primary-900/60 border border-white/10 px-2 py-1 text-[11px] text-neutral-300 focus:outline-none">
                  {cf.CONCILIATION_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <DeleteBtn onClick={() => remove(r.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ AUTHORITIES (knowledge-in-context) ═════════════════════════════════════════

function AuthoritiesSection({ caseId, token }: { caseId: string; token: string }) {
  const [items, setItems] = useState<cf.CaseAuthority[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<cf.CaseAuthority>>({ source_type: 'statute', title: '', reference: '' })
  const [libQuery, setLibQuery] = useState('')
  const [libResults, setLibResults] = useState<BookItem[]>([])
  const [searching, setSearching] = useState(false)

  const load = useCallback(() => {
    cf.getAuthorities(caseId, token).then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [caseId, token])
  useEffect(load, [load])

  async function searchLibrary(q: string) {
    setLibQuery(q)
    if (q.trim().length < 3) { setLibResults([]); return }
    setSearching(true)
    try {
      const books = await listBooks(token, { search: q })
      setLibResults(Array.isArray(books) ? books.slice(0, 6) : [])
    } catch { setLibResults([]) }
    finally { setSearching(false) }
  }

  function pickLibrary(b: BookItem) {
    setDraft(d => ({ ...d, source_type: 'library_book', title: b.title, library_id: b.id, url: `/library/${b.id}` }))
    setLibResults([]); setLibQuery('')
  }

  const add = async () => {
    if (!draft.title?.trim()) { toastError('An authority title is required'); return }
    setSaving(true)
    try {
      await cf.addAuthority(caseId, draft, token)
      toastSuccess('Authority attached to the matter')
      setAdding(false); setDraft({ source_type: 'statute', title: '', reference: '' }); load()
    } catch { toastError('Could not attach authority') }
    finally { setSaving(false) }
  }
  const remove = async (id: string) => {
    try { await cf.deleteAuthority(caseId, id, token); setItems(x => x.filter(a => a.id !== id)) }
    catch { toastError('Could not remove authority') }
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Authorities & Citations"
        subtitle="Attach the statutes, OHADA acts, judgments and CamLex references this matter turns on"
        action={!adding && <AddButton onClick={() => setAdding(true)} label="Add Authority" />}
      />

      {adding && (
        <InlineForm onSave={add} onCancel={() => setAdding(false)} saving={saving} saveLabel="Attach Authority">
          {/* Search CamLex to attach a real library item */}
          <Field label="Search the CamLex library (optional)">
            <div className="relative">
              <SearchIcon width={14} height={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input value={libQuery} onChange={e => searchLibrary(e.target.value)}
                placeholder="Find a book to cite…"
                className="w-full rounded-lg bg-primary-900/60 border border-white/10 pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-portal-solid" />
            </div>
          </Field>
          {searching && <p className="text-[11px] text-neutral-500">Searching…</p>}
          {libResults.length > 0 && (
            <div className="rounded-lg border border-white/8 bg-primary-900/40 divide-y divide-white/5">
              {libResults.map(b => (
                <button key={b.id} onClick={() => pickLibrary(b)} className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors">
                  <p className="text-xs font-medium text-neutral-200 truncate">{b.title}</p>
                  <p className="text-[10px] text-neutral-600">{b.author_name}</p>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Type">
              <Select value={draft.source_type} onChange={e => setDraft(d => ({ ...d, source_type: e.target.value }))}>
                {cf.AUTHORITY_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
            </Field>
            <Field label="Pinpoint Reference">
              <TextInput value={draft.reference ?? ''} onChange={e => setDraft(d => ({ ...d, reference: e.target.value }))} placeholder='e.g. AUDSC Art. 200-204' />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Title"><TextInput value={draft.title ?? ''} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Authority name" /></Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Why it's relevant"><Textarea rows={2} value={draft.note ?? ''} onChange={e => setDraft(d => ({ ...d, note: e.target.value }))} placeholder="How this authority applies to the matter…" /></Field>
            </div>
          </div>
        </InlineForm>
      )}

      {loading ? <EmptyRow text="Loading…" /> : items.length === 0 && !adding ? (
        <div className="rounded-2xl border border-dashed border-white/12 bg-primary-800/20 p-6">
          <p className="text-sm font-semibold text-neutral-200 mb-3">No authorities cited yet</p>
          <ol className="space-y-2">
            {['Click “Add Authority” above', 'Search the CamLex library to attach a book, or type a statute / OHADA act / judgment', 'Add the pinpoint reference and why it applies — it stays with the matter'].map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-neutral-400">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-portal-soft text-portal text-[11px] font-bold">{i + 1}</span>{s}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((a, i) => (
            <div key={a.id} className="stagger-child flex items-start gap-3 rounded-lg border border-white/6 bg-primary-900/30 p-3" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-portal-soft text-portal"><BookOpenIcon width={15} height={15} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-100">{a.title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wide text-neutral-600">{a.source_label}</span>
                  {a.reference && <span className="text-[11px] font-mono text-portal">{a.reference}</span>}
                </div>
                {a.note && <p className="text-xs text-neutral-500 mt-1">{a.note}</p>}
                {a.url && <a href={a.url} className="text-[11px] text-portal hover:opacity-80 mt-1 inline-block">Open reference →</a>}
              </div>
              <DeleteBtn onClick={() => remove(a.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══ PROCEDURES ═════════════════════════════════════════════════════════════════

function ProceduresSection({ caseId, caseType, token }: { caseId: string; caseType: string; token: string }) {
  const [templates, setTemplates] = useState<cf.ProcedureTemplate[]>([])
  const [steps, setSteps] = useState<cf.ProcedureStep[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState('')

  const load = useCallback(() => {
    Promise.all([cf.getProcedureTemplates(token), cf.getProcedureSteps(caseId, token)])
      .then(([t, s]) => { setTemplates(t.templates); setSteps(s) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [caseId, token])
  useEffect(load, [load])

  const apply = async (key: string) => {
    setApplying(key)
    try {
      await cf.applyProcedure(caseId, key, token)
      toastSuccess('Procedure applied — checklist and deadlines created')
      load()
    } catch (e) {
      toastError(e instanceof Error && e.message.includes('already') ? 'Already applied to this case' : 'Could not apply procedure')
    } finally { setApplying('') }
  }

  const toggleStep = async (step: cf.ProcedureStep) => {
    const next = step.status === 'done' ? 'pending' : 'done'
    try {
      await cf.updateProcedureStep(caseId, step.id, { status: next }, token)
      setSteps(s => s.map(x => x.id === step.id ? { ...x, status: next } : x))
    } catch { toastError('Could not update step') }
  }

  const appliedKeys = new Set(steps.map(s => s.template_key))
  const stepsByTemplate = steps.reduce<Record<string, cf.ProcedureStep[]>>((acc, s) => {
    (acc[s.template_key] ||= []).push(s); return acc
  }, {})
  // Suggest templates matching this case type first
  const suggested = templates.filter(t => t.applicable_case_types.some(ct => caseType.toLowerCase().includes(ct) || ct.includes(caseType.toLowerCase())))
  const other = templates.filter(t => !suggested.includes(t))

  return (
    <div className="space-y-4">
      <SectionHeader title="Procedure Templates" subtitle="OHADA & Cameroonian procedures — apply to seed a checklist with deadlines" />

      {loading ? <EmptyRow text="Loading…" /> : (
        <div className="space-y-5">
          {/* Applied procedures with their checklists */}
          {Object.entries(stepsByTemplate).map(([key, tSteps]) => {
            const tmpl = templates.find(t => t.key === key)
            const doneCount = tSteps.filter(s => s.status === 'done').length
            return (
              <div key={key} className="rounded-xl border border-portal/25 bg-portal-soft/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-neutral-100">{tmpl?.name ?? key}</p>
                  <span className="text-[11px] text-portal font-semibold">{doneCount}/{tSteps.length} done</span>
                </div>
                <div className="space-y-1.5">
                  {tSteps.sort((a, b) => a.step_order - b.step_order).map(s => (
                    <button key={s.id} onClick={() => toggleStep(s)}
                      className="w-full flex items-start gap-2.5 text-left rounded-lg px-2 py-1.5 hover:bg-white/4 transition-colors">
                      <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${s.status === 'done' ? 'bg-portal-accent border-portal-solid' : 'border-neutral-600'}`}>
                        {s.status === 'done' && <CheckIcon width={10} height={10} className="text-white" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-xs ${s.status === 'done' ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>{s.step_order}. {s.title}</span>
                        {s.due_date && <span className="text-[10px] text-neutral-600">due {fmtDate(s.due_date)}</span>}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Available templates to apply */}
          {(suggested.length > 0 || other.length > 0) && (
            <div>
              {suggested.filter(t => !appliedKeys.has(t.key)).length > 0 && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-portal mb-2">Suggested for this case type</p>
              )}
              <div className="space-y-2">
                {[...suggested, ...other].filter(t => !appliedKeys.has(t.key)).map(t => (
                  <div key={t.key} className="flex items-center gap-3 rounded-lg border border-white/6 bg-primary-900/30 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-100">{t.name}</p>
                      <p className="text-[11px] text-neutral-500 mt-0.5">{t.description}</p>
                      <p className="text-[10px] text-neutral-600 mt-1">{t.step_count} steps · {t.applicable_case_types.join(', ')}</p>
                    </div>
                    <button onClick={() => apply(t.key)} disabled={!!applying}
                      className="flex-shrink-0 rounded-lg border border-portal bg-portal-soft px-3 py-1.5 text-xs font-semibold text-portal hover:opacity-90 disabled:opacity-50">
                      {applying === t.key ? 'Applying…' : 'Apply'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
