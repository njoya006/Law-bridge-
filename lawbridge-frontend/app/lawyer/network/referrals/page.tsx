'use client'

import React, { useEffect, useState } from 'react'
import { getReferrals, createReferral, updateReferralStatus, type Referral } from '../../../../lib/networkApi'
import { Badge } from '../../../../components/ui/Badge'
import { SkeletonCard } from '../../../../components/ui/Skeleton'
import { ReferralIcon, PlusIcon } from '../../../../components/icons/Icons'

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
  pending:   'warning',
  accepted:  'success',
  declined:  'danger',
  completed: 'info',
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ referred_lawyer_id: '', client_name: '', client_email: '', case_type: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) { setLoading(false); return }
    getReferrals(token).then(setReferrals).finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = localStorage.getItem('access')
    if (!token) return
    setSubmitting(true)
    try {
      const created = await createReferral(form, token)
      setReferrals(prev => [created, ...prev])
      setShowForm(false)
      setForm({ referred_lawyer_id: '', client_name: '', client_email: '', case_type: '', notes: '' })
    } catch { /* ignore */ }
    finally { setSubmitting(false) }
  }

  async function handleStatus(id: string, status: string) {
    const token = localStorage.getItem('access')
    if (!token) return
    const updated = await updateReferralStatus(id, status, token).catch(() => null)
    if (updated) setReferrals(prev => prev.map(r => r.id === id ? updated : r))
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-display-md">Referrals</h2>
          <p className="mt-1 text-sm text-neutral-400">Client referrals you&apos;ve sent to trusted colleagues</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 px-4 py-2.5 text-sm font-bold text-primary-900 shadow-lg hover:from-gold-300 transition-all active:scale-95">
          <PlusIcon className="w-4 h-4" />
          New Referral
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-gold-400/20 bg-gold-500/[0.03] p-6 space-y-4">
          <h3 className="font-semibold text-neutral-100">Send Client Referral</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'referred_lawyer_id', label: 'Colleague Lawyer ID', placeholder: 'UUID of lawyer to refer to', required: true },
              { key: 'client_name',        label: 'Client Name',         placeholder: 'Full name',                  required: true },
              { key: 'client_email',       label: 'Client Email',        placeholder: 'client@example.com',         required: false },
              { key: 'case_type',          label: 'Case Type',           placeholder: 'e.g. Family Law',            required: false },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-neutral-400 mb-1.5">{f.label}{f.required && <span className="text-crimson-400 ml-0.5">*</span>}</label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  required={f.required}
                  className="w-full rounded-xl bg-primary-900/60 border border-white/10 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-500/40"
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              placeholder="Context for the referred lawyer…"
              className="w-full rounded-xl bg-primary-900/60 border border-white/10 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-500/40 resize-none"/>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 text-primary-900 text-sm font-bold disabled:opacity-50 hover:from-gold-300 transition-all">
              {submitting ? 'Sending…' : 'Send Referral'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-neutral-400 text-sm hover:border-white/20 hover:text-neutral-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <div className="space-y-3">{[1,2,3].map(i => <SkeletonCard key={i} lines={2} />)}</div>}

      {!loading && referrals.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-700/40 text-neutral-300">
            <ReferralIcon width={28} height={28} />
          </div>
          <h3 className="font-semibold text-neutral-200">No referrals yet</h3>
          <p className="mt-1.5 text-sm text-neutral-500">Refer clients to trusted colleagues and track outcomes here.</p>
        </div>
      )}

      {!loading && referrals.length > 0 && (
        <div className="space-y-3">
          {referrals.map((r, i) => (
            <div key={r.id} className="rounded-2xl border border-white/8 bg-primary-800/20 p-5 stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-100">{r.client_name}</p>
                  {r.case_type && <p className="text-xs text-neutral-500 mt-0.5">{r.case_type}</p>}
                  <p className="text-xs text-neutral-700 mt-1">{new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <Badge variant={STATUS_VARIANT[r.status] ?? 'neutral'} size="md" className="flex-shrink-0 capitalize">
                  {r.status}
                </Badge>
              </div>
              {r.notes && <p className="text-sm text-neutral-500 border-t border-white/5 pt-3">{r.notes}</p>}
              {r.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => void handleStatus(r.id, 'accepted')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors">
                    Accept
                  </button>
                  <button onClick={() => void handleStatus(r.id, 'declined')}
                    className="text-xs px-3 py-1.5 rounded-lg bg-crimson-500/10 text-crimson-400 border border-crimson-500/20 hover:bg-crimson-500/20 transition-colors">
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
