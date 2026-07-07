'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getVerificationQueue,
  approveVerification,
  rejectVerification,
  type VerificationRequest,
  type VerificationStatus,
} from '../../../lib/verificationApi'

function RequestCard({
  req,
  onApprove,
  onReject,
}: {
  req: VerificationRequest
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
}) {
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState(false)

  async function handleApprove() {
    setActing(true)
    await onApprove(req.id)
    setActing(false)
  }

  async function handleReject() {
    if (!reason.trim()) return
    setActing(true)
    await onReject(req.id, reason)
    setActing(false)
  }

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/8 p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="font-semibold text-white text-[15px]">{req.lawyer_name}</p>
          <p className="text-xs text-white/40 mt-0.5">
            Bar No: <span className="text-white/60">{req.bar_number}</span>
            {' · '}
            {req.bar_council}
            {' · '}
            Called {req.year_called}
          </p>
        </div>
        <span className="text-xs text-white/30">
          {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {req.notes && (
        <div className="mb-4 rounded-lg bg-white/[0.02] border border-white/6 px-3 py-2">
          <p className="text-xs text-white/40 leading-relaxed">{req.notes}</p>
        </div>
      )}

      {showReject ? (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for rejection (shown to the lawyer)…"
            rows={2}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/30 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={acting || !reason.trim()}
              className="flex-1 rounded-lg bg-red-500/15 border border-red-500/25 text-xs font-semibold text-red-400 py-2 hover:bg-red-500/25 disabled:opacity-50 transition-colors"
            >
              {acting ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
            <button
              onClick={() => setShowReject(false)}
              className="px-4 rounded-lg bg-white/5 text-xs text-white/40 py-2 hover:bg-white/8 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={acting}
            className="flex-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-xs font-semibold text-emerald-400 py-2 hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
          >
            {acting ? 'Processing…' : 'Approve & Verify'}
          </button>
          <button
            onClick={() => setShowReject(true)}
            className="flex-1 rounded-lg bg-white/5 border border-white/8 text-xs font-medium text-white/40 py-2 hover:bg-white/8 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<VerificationStatus>('pending')

  const load = useCallback(async (tab: VerificationStatus) => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('access') || ''
      const data = await getVerificationQueue(token, tab)
      setRequests(data.results ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(activeTab) }, [load, activeTab])

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('access') || ''
      await approveVerification(id, token)
      void load(activeTab)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to approve')
    }
  }

  const handleReject = async (id: string, reason: string) => {
    try {
      const token = localStorage.getItem('access') || ''
      await rejectVerification(id, reason, token)
      void load(activeTab)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to reject')
    }
  }

  const tabs: { key: VerificationStatus; label: string; color: string }[] = [
    { key: 'pending', label: 'Pending', color: 'text-amber-400' },
    { key: 'approved', label: 'Approved', color: 'text-emerald-400' },
    { key: 'rejected', label: 'Rejected', color: 'text-red-400' },
  ]

  return (
    <div className="min-h-screen bg-primary-950">
      <div className="border-b border-white/6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-xl font-bold text-white">Lawyer Verification</h1>
          <p className="text-sm text-white/40 mt-1">Review and action bar membership verification requests.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        <div className="flex gap-1 border-b border-white/6 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? `border-current ${tab.color}`
                  : 'border-transparent text-white/30 hover:text-white/50'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && !loading && (
                <span className="ml-2 text-xs opacity-60">({requests.length})</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl bg-white/[0.03] border border-white/8 p-5 animate-pulse">
                <div className="h-4 bg-white/8 rounded w-1/2 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <p className="text-[13px] text-white/30">No {activeTab} requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
