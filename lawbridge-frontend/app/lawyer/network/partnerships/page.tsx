'use client'

import React, { useEffect, useState } from 'react'
import { api } from '../../../../lib/api'
import { searchFirms, getMyFirmMemberships, type FirmDiscovery } from '../../../../lib/firmsApi'
import { toastSuccess, toastError } from '../../../../lib/toast'
import { Badge } from '../../../../components/ui/Badge'
import { SkeletonCard } from '../../../../components/ui/Skeleton'
import { HandshakeIcon, PlusIcon, SearchIcon, CheckIcon } from '../../../../components/icons/Icons'

type PartnershipRequest = {
  id: string
  firm: string
  firm_name?: string
  message: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  created_at: string
}

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
  pending: 'warning', under_review: 'info', approved: 'success', rejected: 'danger',
}

export default function PartnershipsPage() {
  const [requests, setRequests] = useState<PartnershipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [myFirmId, setMyFirmId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Firm picker
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FirmDiscovery[]>([])
  const [searching, setSearching] = useState(false)
  const [picked, setPicked] = useState<FirmDiscovery | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }
    getMyFirmMemberships(token)
      .then(res => {
        const memberships = Array.isArray(res) ? res : (res as { results?: { firm: string }[] }).results ?? []
        const fid = (memberships[0] as { firm?: string })?.firm || ''
        setMyFirmId(fid)
        if (fid) return api.get<PartnershipRequest[]>('firms', `/firms/${fid}/partnership-requests/`, token)
        return []
      })
      .then(r => setRequests(Array.isArray(r) ? r : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function search(q: string) {
    setQuery(q); setPicked(null)
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const token = localStorage.getItem('access')
      const res = await searchFirms(q, token)
      setResults((res.results ?? []).filter(f => String(f.id) !== String(myFirmId)).slice(0, 6))
    } catch { setResults([]) }
    finally { setSearching(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = localStorage.getItem('access')
    if (!token || !picked) { toastError('Pick a firm to partner with first'); return }
    setSubmitting(true)
    try {
      await api.post('firms', `/firms/${picked.id}/partnership-request/`, { message }, token)
      toastSuccess(`Partnership request sent to ${picked.name}`)
      setShowForm(false); setMessage(''); setPicked(null); setQuery(''); setResults([])
    } catch { toastError('Could not send partnership request') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-display-md">Partnerships</h2>
          <p className="mt-1 text-sm text-neutral-400">Partner with other firms to take on complex, multi-discipline matters together.</p>
        </div>
        {myFirmId && (
          <button onClick={() => setShowForm(v => !v)}
            className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 px-4 py-2.5 text-sm font-bold text-primary-900 shadow-lg hover:from-gold-300 hover:to-gold-400 transition-all active:scale-95">
            <PlusIcon className="w-4 h-4" />New Request
          </button>
        )}
      </header>

      {/* You need a firm to send partnership requests */}
      {!loading && !myFirmId && (
        <div className="rounded-2xl border border-dashed border-white/12 bg-primary-800/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-portal-soft text-portal"><HandshakeIcon width={22} height={22} /></div>
            <div>
              <h3 className="font-semibold text-neutral-200">Partnerships are firm-to-firm</h3>
              <p className="text-xs text-neutral-500">You need to belong to a firm before you can request a partnership.</p>
            </div>
          </div>
          <ol className="space-y-2 mb-5">
            {['Create your firm or join one from the Firm section', 'Come back here and tap “New Request”', 'Search for a firm to partner with and send your proposal'].map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-neutral-400">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-portal-soft text-portal text-[11px] font-bold">{i + 1}</span>{s}
              </li>
            ))}
          </ol>
          <a href="/lawyer/team" className="inline-flex items-center gap-2 rounded-xl border border-portal bg-portal-soft px-5 py-2.5 text-sm font-semibold text-portal hover:opacity-90 transition-colors">Go to your firm →</a>
        </div>
      )}

      {showForm && myFirmId && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gold-400/20 bg-gold-500/[0.03] p-6 space-y-4">
          <h3 className="font-semibold text-neutral-100">Send Partnership Request</h3>

          {/* Firm search picker — no more raw UUIDs */}
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Find a firm to partner with<span className="text-crimson-400 ml-0.5">*</span></label>
            {picked ? (
              <div className="flex items-center gap-3 rounded-xl border border-portal bg-portal-soft px-4 py-2.5">
                <CheckIcon width={16} height={16} className="text-portal" />
                <span className="flex-1 text-sm font-medium text-neutral-100">{picked.name}</span>
                <button type="button" onClick={() => { setPicked(null); setQuery('') }} className="text-xs text-neutral-500 hover:text-neutral-300">Change</button>
              </div>
            ) : (
              <div className="relative">
                <SearchIcon width={15} height={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input value={query} onChange={e => search(e.target.value)} placeholder="Search firms by name…"
                  className="w-full rounded-xl bg-primary-900/60 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-500/40" />
                {searching && <p className="text-[11px] text-neutral-500 mt-1.5">Searching…</p>}
                {results.length > 0 && (
                  <div className="mt-1.5 rounded-xl border border-white/8 bg-primary-900/70 divide-y divide-white/5 overflow-hidden">
                    {results.map(f => (
                      <button type="button" key={f.id} onClick={() => { setPicked(f); setResults([]) }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors">
                        <p className="text-sm font-medium text-neutral-200">{f.name}</p>
                        {(f.city || f.member_count != null) && <p className="text-[11px] text-neutral-600">{[f.city, f.member_count != null ? `${f.member_count} members` : ''].filter(Boolean).join(' · ')}</p>}
                      </button>
                    ))}
                  </div>
                )}
                {query.trim().length >= 2 && !searching && results.length === 0 && (
                  <p className="text-[11px] text-neutral-500 mt-1.5">No firms match “{query}”. Try another name.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
              placeholder="Describe the partnership you're proposing — the kind of matters, how you'd collaborate…"
              className="w-full rounded-xl bg-primary-900/60 border border-white/10 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-500/40 resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting || !picked}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 text-primary-900 text-sm font-bold disabled:opacity-50 hover:from-gold-300 transition-all">
              {submitting ? 'Sending…' : 'Send Request'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-neutral-400 text-sm hover:border-white/20 hover:text-neutral-200 transition-all">Cancel</button>
          </div>
        </form>
      )}

      {loading && <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} lines={2} />)}</div>}

      {!loading && myFirmId && requests.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-white/12 bg-primary-800/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-portal-soft text-portal"><HandshakeIcon width={22} height={22} /></div>
            <div>
              <h3 className="font-semibold text-neutral-200">No partnership requests yet</h3>
              <p className="text-xs text-neutral-500">Team up with another firm to serve clients neither of you could alone.</p>
            </div>
          </div>
          <ol className="space-y-2 mb-5">
            {['Tap “New Request” above', 'Search for the firm you want to partner with and select it', 'Add a short proposal and send — they review and respond'].map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-neutral-400">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-portal-soft text-portal text-[11px] font-bold">{i + 1}</span>{s}
              </li>
            ))}
          </ol>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl border border-portal bg-portal-soft px-5 py-2.5 text-sm font-semibold text-portal hover:opacity-90 transition-colors">
            <PlusIcon width={15} height={15} />Send your first request
          </button>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((r, i) => (
            <div key={r.id} className="rounded-2xl border border-white/8 bg-primary-800/20 p-5 stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-100 truncate">{r.firm_name || `Firm #${r.firm.slice(0, 8)}`}</p>
                  {r.message && <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{r.message}</p>}
                  <p className="text-xs text-neutral-700 mt-2">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <Badge variant={STATUS_VARIANT[r.status] ?? 'neutral'} size="md" className="flex-shrink-0 capitalize">{r.status.replace('_', ' ')}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
