'use client'

import React, { useEffect, useState } from 'react'
import LawyerShell from '../../../components/layout/LawyerShell'
import { triageCase, type TriagedLawyer, type LawyerForTriage } from '../../../lib/aiApi'
import { getFirmLawyers, getMyFirmMemberships } from '../../../lib/firmsApi'

const CASE_TYPES = [
  'Civil / Contract Dispute', 'Criminal Defence', 'Family Law', 'Property / Land',
  'Labour / Employment', 'Commercial / Corporate', 'Immigration', 'Intellectual Property',
  'Administrative', 'Human Rights', 'Debt Recovery', 'Other',
]

const CIRCUITS = ['Anglophone', 'Francophone', 'Centre', 'Littoral', 'West', 'South West', 'North West', 'East', 'Adamawa', 'Far North', 'North', 'South']

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-gold-500' : 'bg-amber-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums min-w-[2.5rem] text-right ${score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-gold-400' : 'text-amber-400'}`}>{score}</span>
    </div>
  )
}

function LawyerMatchCard({ item, rank }: { item: TriagedLawyer; rank: number }) {
  const avail = item.availability_status
  return (
    <div className={`relative rounded-xl border p-4 transition-all hover:border-gold-400/30 ${rank === 1 ? 'border-gold-400/30 bg-gold-500/5' : 'border-neutral-700/30 bg-white/5'}`}>
      {rank === 1 && (
        <span className="absolute -top-2 -right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500 text-black border border-gold-400">Best Match</span>
      )}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/20 flex items-center justify-center text-gold-300 font-bold text-sm flex-shrink-0">
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-neutral-100 text-sm">{item.name}</p>
            {item.urgency_flag && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-crimson-500/20 text-crimson-400 border border-crimson-500/30 font-semibold">Urgent</span>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ml-auto ${avail === 'available' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-neutral-700/30 text-neutral-500 border-neutral-600/30'}`}>
              {avail === 'available' ? 'Available' : avail || 'Unknown'}
            </span>
          </div>
          {item.specialization && (
            <p className="text-xs text-neutral-400 mb-2">{item.specialization}</p>
          )}
          <ScoreBar score={item.match_score} />
          <p className="text-xs text-neutral-300 mt-2 leading-relaxed italic">&ldquo;{item.why_matched}&rdquo;</p>
        </div>
      </div>
    </div>
  )
}

export default function CaseTriagePage() {
  const [description, setDescription] = useState('')
  const [caseType, setCaseType] = useState(CASE_TYPES[0])
  const [circuit, setCircuit] = useState(CIRCUITS[0])
  const [lawyers, setLawyers] = useState<LawyerForTriage[]>([])
  const [loadingLawyers, setLoadingLawyers] = useState(true)
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<TriagedLawyer[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const access = localStorage.getItem('access')
    if (!access) { setLoadingLawyers(false); return }
    getMyFirmMemberships(access).then(async memberships => {
      const m = memberships[0]
      if (!m) { setLoadingLawyers(false); return }
      const firmLawyers = await getFirmLawyers(m.firm, access)
      setLawyers(firmLawyers.map(l => ({
        id: l.id,
        name: l.name,
        specialization: l.specialization,
        availability_status: l.availability_status ?? 'unknown',
        accepted_case_types: l.accepted_case_types ?? '',
      })))
    }).catch(() => {}).finally(() => setLoadingLawyers(false))
  }, [])

  const handleTriage = async () => {
    if (!description.trim() || lawyers.length === 0) return
    const access = localStorage.getItem('access')
    if (!access) return
    setRunning(true)
    setError('')
    setResults([])
    try {
      const result = await triageCase({ case_description: description, case_type: caseType, circuit, lawyers }, access)
      setResults(result.ranked_lawyers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Triage failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <LawyerShell>
      <div className="max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-display font-bold text-neutral-50">Smart Case Triage</h1>
            <span className="text-xs px-2.5 py-1 rounded-full bg-gold-500/15 text-gold-300 border border-gold-400/25 font-semibold">AI-Powered</span>
          </div>
          <p className="text-sm text-neutral-400 ml-9">
            Describe a new case and AI will rank your firm&apos;s lawyers by fit — specialization, circuit, workload, and availability.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input panel */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
              <h3 className="font-semibold text-neutral-100 text-sm">Case Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Case Type</label>
                  <select value={caseType} onChange={e => setCaseType(e.target.value)}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-neutral-50 focus:outline-none focus:border-gold-400/50">
                    {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-neutral-400 mb-1.5">Circuit</label>
                  <select value={circuit} onChange={e => setCircuit(e.target.value)}
                    className="w-full bg-primary-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-neutral-50 focus:outline-none focus:border-gold-400/50">
                    {CIRCUITS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5">Case Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Describe the case in as much detail as possible — parties involved, facts, urgency, legal issues, evidence available, desired outcome..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-50 placeholder-neutral-500 focus:outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/20 transition-all resize-none"
                />
              </div>

              {error && <p className="text-xs text-crimson-400">{error}</p>}

              <button
                onClick={handleTriage}
                disabled={running || !description.trim() || lawyers.length === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500/25 to-gold-400/20 border border-gold-400/30 text-gold-200 font-semibold text-sm hover:from-gold-500/35 hover:to-gold-400/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {running ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-gold-300 border-t-transparent animate-spin" />
                    AI is ranking your lawyers…
                  </>
                ) : (
                  <>⚡ Run AI Triage</>
                )}
              </button>
            </div>
          </div>

          {/* Stats sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="font-semibold text-neutral-100 text-sm mb-4">Your Lawyers</h3>
              {loadingLawyers ? (
                <p className="text-xs text-neutral-500">Loading...</p>
              ) : lawyers.length === 0 ? (
                <p className="text-xs text-neutral-500">No lawyer profiles found in your firm.</p>
              ) : (
                <div className="space-y-2">
                  {lawyers.slice(0, 6).map(l => (
                    <div key={l.id} className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-gold-500/10 flex items-center justify-center text-gold-400 text-xs font-bold flex-shrink-0">
                        {l.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-neutral-200 truncate">{l.name}</p>
                        {l.specialization && <p className="text-[10px] text-neutral-500 truncate">{l.specialization}</p>}
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${l.availability_status === 'available' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-neutral-700/30 text-neutral-500'}`}>
                        {l.availability_status === 'available' ? '●' : '○'}
                      </span>
                    </div>
                  ))}
                  {lawyers.length > 6 && <p className="text-xs text-neutral-600">+{lawyers.length - 6} more</p>}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gold-400/15 bg-gold-500/5 p-5">
              <p className="text-xs font-semibold text-gold-400 mb-2">How It Works</p>
              <ul className="space-y-1.5 text-xs text-neutral-400">
                <li>1. AI reads the case description</li>
                <li>2. Matches against each lawyer&apos;s profile</li>
                <li>3. Scores: specialization + circuit + workload</li>
                <li>4. Returns ranked list with explanations</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display font-bold text-neutral-50 text-lg">AI Recommendations</h2>
              <span className="text-xs text-neutral-500">{results.length} lawyer{results.length !== 1 ? 's' : ''} ranked</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((item, i) => (
                <LawyerMatchCard key={item.lawyer_id} item={item} rank={i + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </LawyerShell>
  )
}
