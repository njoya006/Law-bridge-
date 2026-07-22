'use client'

import React, { useEffect, useState } from 'react'
import { api } from '../../../../lib/api'
import { Badge } from '../../../../components/ui/Badge'
import { SkeletonCard } from '../../../../components/ui/Skeleton'
import { HandshakeIcon, PlusIcon } from '../../../../components/icons/Icons'

type PartnershipRequest = {
  id: string
  firm: string
  firm_name?: string
  message: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  created_at: string
}

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
  pending:      'warning',
  under_review: 'info',
  approved:     'success',
  rejected:     'danger',
}

export default function PartnershipsPage() {
  const [requests, setRequests] = useState<PartnershipRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [firmId, setFirmId] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [targetFirmId, setTargetFirmId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }

    api.get<{ results?: { firm: string }[] }>('firms', '/me/', token)
      .then(res => {
        const memberships = Array.isArray(res) ? res : res.results ?? []
        const fid = (memberships[0] as { firm?: string })?.firm || ''
        setFirmId(fid)
        if (fid) {
          return api.get<PartnershipRequest[]>('firms', `/firms/${fid}/partnership-requests/`, token)
        }
        return []
      })
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = localStorage.getItem('access')
    if (!token || !targetFirmId) return
    setSubmitting(true)
    try {
      await api.post('firms', `/firms/${targetFirmId}/partnership-request/`, { message }, token)
      setShowForm(false)
      setMessage('')
      setTargetFirmId('')
    } catch { /* ignore */ }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-display-md">Partnerships</h2>
          <p className="mt-1 text-sm text-neutral-400">Firm partnership requests and collaborations</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 px-4 py-2.5 text-sm font-bold text-primary-900 shadow-lg hover:from-gold-300 hover:to-gold-400 transition-all active:scale-95"
        >
          <PlusIcon className="w-4 h-4" />
          New Request
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gold-400/20 bg-gold-500/[0.03] p-6 space-y-4">
          <h3 className="font-semibold text-neutral-100">Send Partnership Request</h3>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Target Firm ID</label>
            <input
              value={targetFirmId}
              onChange={e => setTargetFirmId(e.target.value)}
              placeholder="Firm UUID…"
              required
              className="w-full rounded-xl bg-primary-900/60 border border-white/10 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-500/40"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="Describe the nature of the partnership you're seeking…"
              className="w-full rounded-xl bg-primary-900/60 border border-white/10 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-500/40 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 text-primary-900 text-sm font-bold disabled:opacity-50 hover:from-gold-300 transition-all">
              {submitting ? 'Sending…' : 'Send Request'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-neutral-400 text-sm hover:border-white/20 hover:text-neutral-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <SkeletonCard key={i} lines={2} />)}
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-700/40 text-neutral-300">
            <HandshakeIcon width={28} height={28} />
          </div>
          <h3 className="font-semibold text-neutral-200">No partnership requests yet</h3>
          <p className="mt-1.5 text-sm text-neutral-500">Send a request to start building cross-firm collaborations.</p>
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
                <Badge variant={STATUS_VARIANT[r.status] ?? 'neutral'} size="md" className="flex-shrink-0 capitalize">
                  {r.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
