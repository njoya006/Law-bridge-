'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  getMentorshipPrefs, updateMentorshipPrefs, getMentorshipMatches, getMentorshipRequests,
  requestMentorship, respondMentorship,
  type MentorshipPrefs, type MentorshipMatches, type MentorshipRequest, type MentorCard,
} from '../../../../lib/mentorshipApi'
import { Badge } from '../../../../components/ui/Badge'
import { ReputationBadge } from '../../../../components/ui/ReputationBadge'
import { SkeletonCard } from '../../../../components/ui/Skeleton'
import { UserPlusIcon, CheckIcon, MapPinIcon, ClockIcon } from '../../../../components/icons/Icons'

export default function MentorshipPage() {
  const [prefs, setPrefs] = useState<MentorshipPrefs | null>(null)
  const [matches, setMatches] = useState<MentorshipMatches | null>(null)
  const [reqs, setReqs] = useState<{ sent: MentorshipRequest[]; received: MentorshipRequest[] }>({ sent: [], received: [] })
  const [loading, setLoading] = useState(true)
  const [savingPref, setSavingPref] = useState(false)
  const [requesting, setRequesting] = useState('')

  const loadAll = useCallback(async () => {
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }
    const [p, m, r] = await Promise.allSettled([
      getMentorshipPrefs(token), getMentorshipMatches(token), getMentorshipRequests(token),
    ])
    if (p.status === 'fulfilled') setPrefs(p.value)
    if (m.status === 'fulfilled') setMatches(m.value)
    if (r.status === 'fulfilled') setReqs(r.value)
    setLoading(false)
  }, [])

  useEffect(() => { void loadAll() }, [loadAll])

  async function togglePref(key: 'open_to_mentoring' | 'seeking_mentor') {
    const token = localStorage.getItem('access')
    if (!token || !prefs) return
    setSavingPref(true)
    try {
      const updated = await updateMentorshipPrefs({ [key]: !prefs[key] }, token)
      setPrefs(updated)
      const m = await getMentorshipMatches(token).catch(() => null)
      if (m) setMatches(m)
    } catch { /* ignore */ }
    finally { setSavingPref(false) }
  }

  async function sendRequest(mentor: MentorCard) {
    const token = localStorage.getItem('access')
    if (!token) return
    setRequesting(mentor.user_id)
    try {
      await requestMentorship(mentor.user_id, '', mentor.specialization, token)
      await loadAll()
    } catch { /* ignore */ }
    finally { setRequesting('') }
  }

  async function respond(id: string, status: 'accepted' | 'declined') {
    const token = localStorage.getItem('access')
    if (!token) return
    await respondMentorship(id, status, token).catch(() => null)
    await loadAll()
  }

  const requestedIds = new Set(reqs.sent.map(r => r.mentor_id))
  const pendingReceived = reqs.received.filter(r => r.status === 'pending')

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h2 className="font-display text-display-md">Mentorship</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Juniors find senior guidance; seniors build the next generation. Matches are ranked by reputation, practice area and circuit.
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} lines={2} />)}</div>
      ) : (
        <>
          {/* Opt-in — the how-to for the whole page */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Your mentorship status</p>
            <p className="text-sm text-neutral-400">Turn these on to appear in matches and get matched. You can be both.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => togglePref('seeking_mentor')} disabled={savingPref}
                className={`flex-1 flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${prefs?.seeking_mentor ? 'border-portal bg-portal-soft' : 'border-white/10 hover:border-white/20'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${prefs?.seeking_mentor ? 'bg-portal-accent border-portal-solid' : 'border-neutral-600'}`}>
                  {prefs?.seeking_mentor && <CheckIcon width={12} height={12} className="text-white" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-neutral-100">I'm seeking a mentor</span>
                  <span className="block text-xs text-neutral-500">Get matched to senior lawyers in your area</span>
                </span>
              </button>
              <button onClick={() => togglePref('open_to_mentoring')} disabled={savingPref}
                className={`flex-1 flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${prefs?.open_to_mentoring ? 'border-portal bg-portal-soft' : 'border-white/10 hover:border-white/20'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${prefs?.open_to_mentoring ? 'bg-portal-accent border-portal-solid' : 'border-neutral-600'}`}>
                  {prefs?.open_to_mentoring && <CheckIcon width={12} height={12} className="text-white" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-neutral-100">I'm open to mentoring</span>
                  <span className="block text-xs text-neutral-500">Receive requests from rising lawyers</span>
                </span>
              </button>
            </div>
          </div>

          {/* Requests received (mentor) */}
          {pendingReceived.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-neutral-300 mb-3">Requests for you ({pendingReceived.length})</h3>
              <div className="space-y-2">
                {pendingReceived.map(r => (
                  <div key={r.id} className="rounded-2xl border border-portal/30 bg-portal-soft/40 p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-100">{r.mentee_name}</p>
                      {r.focus_area && <p className="text-xs text-neutral-500 mt-0.5">Wants guidance on {r.focus_area}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => respond(r.id, 'accepted')} className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25">Accept</button>
                      <button onClick={() => respond(r.id, 'declined')} className="text-xs px-3 py-1.5 rounded-lg bg-crimson-500/10 text-crimson-400 border border-crimson-500/20 hover:bg-crimson-500/20">Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Mentor matches (mentee) */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-300 mb-3">Recommended mentors</h3>
            {!prefs?.seeking_mentor ? (
              <InstructionCard
                title="You're not seeking a mentor yet"
                steps={['Toggle “I\'m seeking a mentor” above', 'We match you to senior lawyers by reputation, practice area and circuit', 'Send a request — they\'re notified and can accept']}
              />
            ) : (matches?.mentors.length ?? 0) === 0 ? (
              <InstructionCard
                title="No mentor matches right now"
                steps={['Matches appear as senior lawyers opt in to mentoring', 'Make sure your specialization and circuit are set on your profile — they drive matching', 'Check back soon; the pool grows daily']}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matches!.mentors.map(m => (
                  <MentorTile key={m.user_id} m={m} requested={requestedIds.has(m.user_id)}
                    busy={requesting === m.user_id} onRequest={() => sendRequest(m)} />
                ))}
              </div>
            )}
          </section>

          {/* Mentee matches (mentor) */}
          {prefs?.open_to_mentoring && (
            <section>
              <h3 className="text-sm font-semibold text-neutral-300 mb-3">Rising lawyers seeking guidance</h3>
              {(matches?.mentees.length ?? 0) === 0 ? (
                <InstructionCard
                  title="No mentees to show yet"
                  steps={['Juniors appear here when they toggle “seeking a mentor”', 'They\'re prioritised by matching specialization and circuit', 'When one requests you, you\'ll get a notification to accept']}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matches!.mentees.map(m => (
                    <div key={m.user_id} className="rounded-2xl border border-white/8 bg-primary-800/20 p-4">
                      <p className="text-sm font-semibold text-neutral-100">{m.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{m.specialization || 'Lawyer'} · {m.years_of_experience}yr</p>
                      {m.mentorship_note && <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{m.mentorship_note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Active connections */}
          {reqs.sent.filter(r => r.status === 'accepted').length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-neutral-300 mb-3">Your mentors</h3>
              <div className="space-y-2">
                {reqs.sent.filter(r => r.status === 'accepted').map(r => (
                  <div key={r.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-3">
                    <CheckIcon width={16} height={16} className="text-emerald-400" />
                    <p className="text-sm text-neutral-200">{r.mentor_name}</p>
                    <Badge variant="success" size="sm" className="ml-auto">Active</Badge>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function MentorTile({ m, requested, busy, onRequest }: { m: MentorCard; requested: boolean; busy: boolean; onRequest: () => void }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-100 truncate">{m.name}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{m.specialization || 'Lawyer'}</p>
        </div>
        <ReputationBadge score={m.reputation_score} size="sm" showLabel={false} />
      </div>
      <div className="flex items-center gap-3 text-[11px] text-neutral-500">
        <span className="inline-flex items-center gap-1"><ClockIcon width={11} height={11} />{m.years_of_experience}yr</span>
        {m.practice_circuit && <span className="inline-flex items-center gap-1"><MapPinIcon width={11} height={11} />{m.practice_circuit}</span>}
      </div>
      <button onClick={onRequest} disabled={requested || busy}
        className={`mt-auto flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${requested ? 'border border-white/10 text-neutral-500 cursor-default' : 'bg-portal-soft border border-portal text-portal hover:opacity-90'}`}>
        {requested ? 'Request sent' : busy ? 'Sending…' : <><UserPlusIcon width={13} height={13} />Request mentorship</>}
      </button>
    </div>
  )
}

function InstructionCard({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 bg-primary-800/20 p-6">
      <p className="text-sm font-semibold text-neutral-200 mb-3">{title}</p>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-neutral-400">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-portal-soft text-portal text-[11px] font-bold">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  )
}
