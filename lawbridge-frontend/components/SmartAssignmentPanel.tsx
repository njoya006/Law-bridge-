'use client'

import React, { useEffect, useState } from 'react'
import { assignCase, type CaseItem } from '../lib/casesApi'
import { getFirmLawyers, type FirmLawyer } from '../lib/firmsApi'
import { getLawyerStats, type LawyerStats } from '../lib/monitoringApi'

type ScoredLawyer = FirmLawyer & {
  stats: LawyerStats | null
  score: number
  badge: 'best_match' | 'available' | 'busy' | 'conflict'
  conflictRisk: boolean
}

function scoreLawyer(l: FirmLawyer, stats: LawyerStats | null, caseType?: string): ScoredLawyer {
  let score = 0
  let conflictRisk = false

  const status = l.availability_status ?? 'unknown'
  if (status === 'available') score += 40
  else if (status === 'busy') score -= 20
  else if (status === 'on_leave' || status === 'inactive') score -= 50

  const activeCases = stats?.active_cases ?? 0
  if (activeCases === 0) score += 20
  else if (activeCases <= 3) score += 10
  else if (activeCases <= 6) score += 0
  else if (activeCases <= 10) score -= 10
  else { score -= 25; conflictRisk = activeCases > 15 }

  if (caseType && l.accepted_case_types) {
    const types = l.accepted_case_types.toLowerCase()
    if (types.includes(caseType.toLowerCase())) score += 30
  }

  if (l.specialization) {
    if (caseType && l.specialization.toLowerCase().includes(caseType.toLowerCase())) score += 15
  }

  const avgDays = stats?.avg_resolution_days ?? 0
  if (avgDays > 0 && avgDays < 30) score += 10
  else if (avgDays > 0 && avgDays < 60) score += 5

  let badge: ScoredLawyer['badge'] = 'busy'
  if (conflictRisk) badge = 'conflict'
  else if (score >= 60) badge = 'best_match'
  else if (status === 'available') badge = 'available'

  return { ...l, stats, score, badge, conflictRisk }
}

const BADGE_STYLES: Record<ScoredLawyer['badge'], { cls: string; label: string }> = {
  best_match: { cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300', label: 'Best Match' },
  available:  { cls: 'border-blue-500/40 bg-blue-500/10 text-blue-300',           label: 'Available'  },
  busy:       { cls: 'border-amber-500/40 bg-amber-500/10 text-amber-300',         label: 'Busy'       },
  conflict:   { cls: 'border-red-500/40 bg-red-500/10 text-red-300',               label: 'Overloaded' },
}

interface Props {
  caseItem: CaseItem
  firmId: number
  onClose: () => void
  onAssigned: (updated: CaseItem) => void
}

export default function SmartAssignmentPanel({ caseItem, firmId, onClose, onAssigned }: Props) {
  const [lawyers, setLawyers] = useState<ScoredLawyer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [conflictWarning, setConflictWarning] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const token = localStorage.getItem('access') || ''
      try {
        const raw = await getFirmLawyers(firmId, token)
        const scored = await Promise.all(
          raw.map(async l => {
            try {
              const stats = await getLawyerStats(l.id, token)
              return scoreLawyer(l, stats, caseItem.case_type)
            } catch {
              return scoreLawyer(l, null, caseItem.case_type)
            }
          })
        )
        scored.sort((a, b) => b.score - a.score)
        if (mounted) setLawyers(scored)
      } catch {
        if (mounted) setLawyers([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [firmId, caseItem.case_type])

  const handleSelect = (l: ScoredLawyer) => {
    setSelectedId(l.id)
    setErr('')
    if (l.conflictRisk) {
      setConflictWarning(`${l.name} has ${l.stats?.active_cases ?? '?'} active cases — assignment may be difficult to manage.`)
    } else {
      setConflictWarning('')
    }
  }

  const handleAssign = async () => {
    if (!selectedId) { setErr('Select a lawyer first.'); return }
    setSaving(true); setErr('')
    const token = localStorage.getItem('access') || ''
    try {
      const updated = await assignCase(caseItem.id, selectedId, token, note || undefined)
      onAssigned(updated)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Assignment failed'
      if (msg.toLowerCase().includes('conflict')) {
        setErr('Conflict of interest detected. This lawyer already represents an opposing party in another case.')
      } else {
        setErr(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const selected = lawyers.find(l => l.id === selectedId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-primary-900 border border-neutral-700/60 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-700/40 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-gold-400 font-semibold">Smart Assignment</p>
            <h3 className="text-sm font-semibold text-neutral-100 truncate mt-0.5">{caseItem.title}</h3>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-xl leading-none ml-4 flex-shrink-0">×</button>
        </div>

        {/* Case requirements */}
        <div className="px-6 py-3 border-b border-neutral-800/50 flex-shrink-0 flex flex-wrap gap-1.5">
          {[caseItem.case_type, caseItem.legal_tradition === 'common_law' ? 'Common Law' : 'Civil Law', caseItem.circuit === 'anglophone' ? 'Anglophone' : 'Francophone'].filter(Boolean).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded-full border border-gold-400/25 bg-gold-500/8 text-gold-300 text-[10px] font-medium capitalize">{tag}</span>
          ))}
        </div>

        {/* Lawyer list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-neutral-400 py-8">
              <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
              Ranking lawyers…
            </div>
          ) : lawyers.length === 0 ? (
            <p className="text-center text-neutral-500 text-sm py-8">No lawyers found for this firm.</p>
          ) : (
            lawyers.map((l, rank) => {
              const badge = BADGE_STYLES[l.badge]
              const isSelected = selectedId === l.id
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleSelect(l)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all
                    ${isSelected ? 'border-gold-500/50 bg-gold-500/8 shadow-[0_0_16px_rgba(234,179,8,0.08)]' : 'border-neutral-700/40 hover:border-neutral-600/50 bg-primary-800/20 hover:bg-primary-800/40'}`}
                >
                  {/* Rank indicator */}
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5
                    ${rank === 0 ? 'bg-gold-500 text-black' : 'bg-neutral-800 text-neutral-400 border border-neutral-700/40'}`}>
                    {rank + 1}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-800 border border-neutral-700/50 flex items-center justify-center text-sm font-bold text-neutral-300">
                    {l.name[0]?.toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-medium text-neutral-100">{l.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">{l.specialization || 'Lawyer'}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {l.stats && (
                        <>
                          <span className="text-[10px] text-neutral-600">{l.stats.active_cases} active</span>
                          {l.stats.avg_resolution_days > 0 && (
                            <span className="text-[10px] text-neutral-600">{l.stats.avg_resolution_days}d avg resolution</span>
                          )}
                          {l.stats.cases_this_month > 0 && (
                            <span className="text-[10px] text-neutral-600">{l.stats.cases_this_month} this month</span>
                          )}
                        </>
                      )}
                      {!l.stats && <span className="text-[10px] text-neutral-700">No stats yet</span>}
                    </div>
                  </div>

                  {/* Score ring */}
                  <div className="flex-shrink-0 text-right">
                    <p className={`text-base font-bold tabular-nums ${l.score >= 50 ? 'text-emerald-400' : l.score >= 20 ? 'text-amber-400' : 'text-neutral-500'}`}>
                      {Math.max(0, l.score)}
                    </p>
                    <p className="text-[9px] text-neutral-600">score</p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-neutral-700/40 flex-shrink-0 space-y-3">
          {conflictWarning && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              {conflictWarning}
            </div>
          )}
          {selected && (
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Note to {selected.name} <span className="text-neutral-600">(optional)</span></label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any context about this case assignment…"
                className="w-full bg-primary-800/50 border border-neutral-700/40 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-500/50"
              />
            </div>
          )}
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-neutral-700/40 text-neutral-400 hover:text-neutral-200 text-sm transition-colors">Cancel</button>
            <button
              onClick={handleAssign}
              disabled={saving || !selectedId}
              className="flex-[2] py-2 rounded-lg bg-gold-500/20 border border-gold-500/30 text-gold-300 hover:bg-gold-500/30 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? 'Assigning…' : selected ? `Assign to ${selected.name}` : 'Select a lawyer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
