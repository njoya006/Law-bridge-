'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getInterviewById, saveInterview, syncInterviewsFromApi, Interview, NextStep, generateId } from '../../../../../lib/outreachStore'

function fmtDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return iso }
}

type Tab = 'overview' | 'notes' | 'takeaways' | 'activity'

export default function InterviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [iv, setIv] = useState<Interview | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Interview>>({})
  const [newTakeaway, setNewTakeaway] = useState('')
  const [newStep, setNewStep] = useState('')
  const [newStepDate, setNewStepDate] = useState('')
  const [editingSummary, setEditingSummary] = useState(false)
  const [summaryVal, setSummaryVal] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesVal, setNotesVal] = useState('')

  useEffect(() => {
    const cached = getInterviewById(id)
    if (cached) {
      setIv(cached); setSummaryVal(cached.summary ?? ''); setNotesVal(cached.notes ?? '')
      setEditForm({ status: cached.status, overallInterestLevel: cached.overallInterestLevel, interviewerName: cached.interviewerName, location: cached.location })
    }
    syncInterviewsFromApi().then(() => {
      const fresh = getInterviewById(id)
      if (fresh) { setIv(fresh); setSummaryVal(fresh.summary ?? ''); setNotesVal(fresh.notes ?? '') }
      else if (!cached) router.replace('/admin/outreach/interviews')
    })
  }, [id, router])

  function update(patch: Partial<Interview>) {
    if (!iv) return
    const updated = { ...iv, ...patch }
    saveInterview(updated)
    setIv(updated)
  }

  function saveSummary() { update({ summary: summaryVal }); setEditingSummary(false) }
  function saveNotes() { update({ notes: notesVal }); setEditingNotes(false) }

  function addTakeaway() {
    if (!newTakeaway.trim() || !iv) return
    update({ takeaways: [...iv.takeaways, newTakeaway.trim()] })
    setNewTakeaway('')
  }

  function removeTakeaway(i: number) {
    if (!iv) return
    const arr = [...iv.takeaways]
    arr.splice(i, 1)
    update({ takeaways: arr })
  }

  function addStep() {
    if (!newStep.trim() || !iv) return
    const step: NextStep = { id: generateId(), text: newStep.trim(), dueDate: newStepDate || undefined, status: 'pending' }
    update({ nextSteps: [...iv.nextSteps, step] })
    setNewStep(''); setNewStepDate('')
  }

  function toggleStep(stepId: string) {
    if (!iv) return
    const steps = iv.nextSteps.map(s => s.id === stepId ? { ...s, status: s.status === 'done' ? 'pending' as const : 'done' as const } : s)
    update({ nextSteps: steps })
  }

  function updateFieldsFromForm() {
    update({ ...editForm })
    setEditing(false)
  }

  if (!iv) return null

  const completedSteps = iv.nextSteps.filter(s => s.status === 'done').length
  const TABS = [
    { key: 'overview' as Tab, label: 'Overview' },
    { key: 'notes' as Tab, label: 'Notes' },
    { key: 'takeaways' as Tab, label: `Takeaways (${iv.takeaways.length})` },
    { key: 'activity' as Tab, label: 'Next Steps' },
  ]

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Breadcrumb */}
      <div className="text-xs text-neutral-500">
        <Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link>
        {' › '}
        <Link href="/admin/outreach/interviews" className="hover:text-neutral-300">Interviews</Link>
        {' › '}
        <span className="text-neutral-300">{iv.firmName}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-50">{iv.firmName}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {iv.type.replace('_', ' ')} · {fmtDate(iv.date)}{iv.time ? ` at ${iv.time}` : ''}
            {iv.interviewerName ? ` · ${iv.interviewerName}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Interest level ring */}
          {iv.overallInterestLevel != null && (
            <div className="flex flex-col items-center">
              <svg width={56} height={56} viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke={iv.overallInterestLevel >= 70 ? '#22c55e' : iv.overallInterestLevel >= 40 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="5"
                  strokeDasharray={`${(iv.overallInterestLevel / 100) * 138.2} 138.2`}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
                <text x="28" y="28" textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="white">{iv.overallInterestLevel}%</text>
              </svg>
              <span className="text-[10px] text-neutral-500 mt-0.5">Interest</span>
            </div>
          )}
          <div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${
              iv.status === 'completed' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' :
              iv.status === 'scheduled' ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' :
              'border-neutral-600/40 bg-neutral-600/10 text-neutral-400'
            }`}>{iv.status}</span>
          </div>
        </div>
      </div>

      {/* Quick meta bar */}
      <div className="flex flex-wrap gap-4 rounded-2xl border border-white/8 bg-primary-800/30 p-4 text-sm">
        {[
          ['Contact', iv.contactName],
          ['Location', iv.location],
          ['Duration', iv.duration ? `${iv.duration} min` : undefined],
          ['Next Steps', `${completedSteps}/${iv.nextSteps.length} done`],
        ].map(([k, v]) => v ? (
          <div key={k as string}>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">{k}</p>
            <p className="text-neutral-200">{v}</p>
          </div>
        ) : null)}
      </div>

      {/* Edit quick fields */}
      {editing ? (
        <div className="rounded-2xl border border-gold-500/30 bg-primary-800/30 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-200">Edit Interview Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-xs">Status</label>
              <select className="field mt-1 w-full" value={editForm.status ?? iv.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as Interview['status'] }))}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            </div>
            <div>
              <label className="label-xs">Overall Interest Level (0–100)</label>
              <input type="number" min={0} max={100} className="field mt-1 w-full" value={editForm.overallInterestLevel ?? ''} onChange={e => setEditForm(p => ({ ...p, overallInterestLevel: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label-xs">Interviewer</label>
              <input className="field mt-1 w-full" value={editForm.interviewerName ?? ''} onChange={e => setEditForm(p => ({ ...p, interviewerName: e.target.value }))} />
            </div>
            <div>
              <label className="label-xs">Location</label>
              <input className="field mt-1 w-full" value={editForm.location ?? ''} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
            <button onClick={updateFieldsFromForm} className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-primary-900 hover:bg-gold-400">Save</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="text-xs text-neutral-500 hover:text-neutral-300">✏ Edit interview details</button>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-white/8 overflow-x-auto -mx-1 px-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key ? 'border-gold-500 text-gold-400' : 'border-transparent text-neutral-500 hover:text-neutral-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-200">Meeting Summary</h3>
              {!editingSummary && <button onClick={() => setEditingSummary(true)} className="text-xs text-gold-400 hover:text-gold-300">Edit</button>}
            </div>
            {editingSummary ? (
              <div className="space-y-3">
                <textarea className="field w-full resize-none" rows={6} value={summaryVal} onChange={e => setSummaryVal(e.target.value)} placeholder="Describe what was discussed in this meeting…" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingSummary(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
                  <button onClick={saveSummary} className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-primary-900 hover:bg-gold-400">Save</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">
                {iv.summary ?? <span className="text-neutral-600 italic">No summary yet. Click Edit to add.</span>}
              </p>
            )}
          </div>

          {iv.takeaways.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5">
              <h3 className="text-sm font-semibold text-neutral-200 mb-3">Key Takeaways</h3>
              <ul className="space-y-2">
                {iv.takeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold-400 flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200">Private Notes</h3>
            {!editingNotes && <button onClick={() => setEditingNotes(true)} className="text-xs text-gold-400 hover:text-gold-300">Edit</button>}
          </div>
          {editingNotes ? (
            <div className="space-y-3">
              <textarea className="field w-full resize-none" rows={8} value={notesVal} onChange={e => setNotesVal(e.target.value)} placeholder="Private notes not included in interview summary…" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setEditingNotes(false)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
                <button onClick={saveNotes} className="rounded-xl bg-gold-500 px-4 py-2 text-sm font-semibold text-primary-900 hover:bg-gold-400">Save</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed">
              {iv.notes ?? <span className="text-neutral-600 italic">No private notes. Click Edit to add.</span>}
            </p>
          )}
        </div>
      )}

      {tab === 'takeaways' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-200">Key Takeaways</h3>
            {iv.takeaways.length === 0 ? (
              <p className="text-sm text-neutral-600 italic">No takeaways logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {iv.takeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold-400 flex-shrink-0" />
                    <span className="flex-1 text-sm text-neutral-300">{t}</span>
                    <button onClick={() => removeTakeaway(i)} className="text-neutral-600 hover:text-red-400 transition-colors flex-shrink-0">
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 pt-2">
              <input
                className="field flex-1"
                value={newTakeaway}
                onChange={e => setNewTakeaway(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTakeaway() } }}
                placeholder="Add a key takeaway…"
              />
              <button onClick={addTakeaway} className="rounded-xl bg-primary-700 border border-white/10 px-4 py-2 text-sm text-neutral-200 hover:bg-primary-600">Add</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-200">Next Steps</h3>
              <span className="text-xs text-neutral-500">{completedSteps}/{iv.nextSteps.length} done</span>
            </div>
            {iv.nextSteps.length === 0 ? (
              <p className="text-sm text-neutral-600 italic">No next steps defined yet.</p>
            ) : (
              <ul className="space-y-2">
                {iv.nextSteps.map(step => (
                  <li key={step.id} className="flex items-center gap-3">
                    <button
                      onClick={() => toggleStep(step.id)}
                      className={`h-5 w-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${step.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 hover:border-white/40'}`}
                    >
                      {step.status === 'done' && <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                    <span className={`flex-1 text-sm ${step.status === 'done' ? 'line-through text-neutral-600' : 'text-neutral-300'}`}>{step.text}</span>
                    {step.dueDate && <span className="text-xs text-neutral-500 flex-shrink-0">{step.dueDate}</span>}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 pt-2">
              <input className="field flex-1" value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Add a next step…" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStep() } }} />
              <input type="date" className="field w-36" value={newStepDate} onChange={e => setNewStepDate(e.target.value)} />
              <button onClick={addStep} className="rounded-xl bg-primary-700 border border-white/10 px-4 py-2 text-sm text-neutral-200 hover:bg-primary-600">Add</button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2">
        <Link href="/admin/outreach/interviews" className="text-sm text-neutral-500 hover:text-neutral-300">← Back to Interviews</Link>
      </div>
    </div>
  )
}
