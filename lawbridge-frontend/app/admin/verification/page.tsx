'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getVerificationQueue,
  approveVerification,
  rejectVerification,
  getFirmVerificationQueue,
  approveFirmVerification,
  rejectFirmVerification,
  FIRM_TYPE_LABELS,
  type VerificationRequest,
  type FirmVerificationRequest,
  type VerificationStatus,
} from '../../../lib/verificationApi'

// ── Lawyer card ────────────────────────────────────────────────────────────────

function LawyerCard({
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

  const handleApprove = async () => { setActing(true); await onApprove(req.id); setActing(false) }
  const handleReject  = async () => {
    if (!reason.trim()) return
    setActing(true); await onReject(req.id, reason); setActing(false)
  }

  const isPending = req.status === 'pending'

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/8 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white text-[15px]">{req.lawyer_name}</p>
            {req.status !== 'pending' && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                req.status === 'approved'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {req.status.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-xs text-white/40 mt-0.5">
            Bar No: <span className="text-white/60">{req.bar_number}</span>
            {' · '}
            <span className="text-white/60">{req.bar_council}</span>
            {' · '}
            Called <span className="text-white/60">{req.year_called}</span>
          </p>
        </div>
        <span className="text-xs text-white/25 flex-shrink-0">
          {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {req.notes && (
        <div className="mb-3 rounded-lg bg-white/[0.02] border border-white/6 px-3 py-2">
          <p className="text-xs text-white/40 leading-relaxed">{req.notes}</p>
        </div>
      )}

      {req.rejection_reason && (
        <div className="mb-3 rounded-lg bg-red-500/5 border border-red-500/15 px-3 py-2">
          <p className="text-[11px] text-red-400/70">Rejection reason: {req.rejection_reason}</p>
        </div>
      )}

      {isPending && (
        showReject ? (
          <div className="space-y-2">
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for rejection (shown to the lawyer)…"
              rows={2}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/30 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleReject} disabled={acting || !reason.trim()}
                className="flex-1 rounded-lg bg-red-500/15 border border-red-500/25 text-xs font-semibold text-red-400 py-2 hover:bg-red-500/25 disabled:opacity-50 transition-colors">
                {acting ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
              <button onClick={() => setShowReject(false)}
                className="px-4 rounded-lg bg-white/5 text-xs text-white/40 py-2 hover:bg-white/8 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleApprove} disabled={acting}
              className="flex-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-xs font-semibold text-emerald-400 py-2 hover:bg-emerald-500/25 disabled:opacity-50 transition-colors">
              {acting ? 'Processing…' : 'Approve & Verify'}
            </button>
            <button onClick={() => setShowReject(true)}
              className="flex-1 rounded-lg bg-white/5 border border-white/8 text-xs font-medium text-white/40 py-2 hover:bg-white/8 transition-colors">
              Reject
            </button>
          </div>
        )
      )}
    </div>
  )
}

// ── Firm card ──────────────────────────────────────────────────────────────────

function FirmCard({
  req,
  onApprove,
  onReject,
}: {
  req: FirmVerificationRequest
  onApprove: (id: string) => Promise<void>
  onReject: (id: string, reason: string) => Promise<void>
}) {
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState(false)

  const handleApprove = async () => { setActing(true); await onApprove(req.id); setActing(false) }
  const handleReject  = async () => {
    if (!reason.trim()) return
    setActing(true); await onReject(req.id, reason); setActing(false)
  }

  const isPending = req.status === 'pending'

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/8 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white text-[15px]">{req.firm_name}</p>
            {req.status !== 'pending' && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                req.status === 'approved'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {req.status.toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            <p className="text-xs text-white/40">
              Reg No: <span className="text-white/60">{req.registration_number}</span>
            </p>
            <p className="text-xs text-white/40">
              Type: <span className="text-white/60">{FIRM_TYPE_LABELS[req.firm_type] ?? req.firm_type}</span>
            </p>
            <p className="text-xs text-white/40">
              Founded: <span className="text-white/60">{req.founding_year}</span>
            </p>
            <p className="text-xs text-white/40">
              Partners: <span className="text-white/60">{req.number_of_partners}</span>
            </p>
          </div>
        </div>
        <span className="text-xs text-white/25 flex-shrink-0">
          {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {req.notes && (
        <div className="mb-3 rounded-lg bg-white/[0.02] border border-white/6 px-3 py-2">
          <p className="text-xs text-white/40 leading-relaxed">{req.notes}</p>
        </div>
      )}

      {req.rejection_reason && (
        <div className="mb-3 rounded-lg bg-red-500/5 border border-red-500/15 px-3 py-2">
          <p className="text-[11px] text-red-400/70">Rejection reason: {req.rejection_reason}</p>
        </div>
      )}

      {isPending && (
        showReject ? (
          <div className="space-y-2">
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for rejection (shown to the firm administrator)…"
              rows={2}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-red-500/30 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={handleReject} disabled={acting || !reason.trim()}
                className="flex-1 rounded-lg bg-red-500/15 border border-red-500/25 text-xs font-semibold text-red-400 py-2 hover:bg-red-500/25 disabled:opacity-50 transition-colors">
                {acting ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
              <button onClick={() => setShowReject(false)}
                className="px-4 rounded-lg bg-white/5 text-xs text-white/40 py-2 hover:bg-white/8 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleApprove} disabled={acting}
              className="flex-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-xs font-semibold text-emerald-400 py-2 hover:bg-emerald-500/25 disabled:opacity-50 transition-colors">
              {acting ? 'Processing…' : 'Approve & Verify Firm'}
            </button>
            <button onClick={() => setShowReject(true)}
              className="flex-1 rounded-lg bg-white/5 border border-white/8 text-xs font-medium text-white/40 py-2 hover:bg-white/8 transition-colors">
              Reject
            </button>
          </div>
        )
      )}
    </div>
  )
}

// ── Skeletons ──────────────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl bg-white/[0.03] border border-white/8 p-5 animate-pulse">
          <div className="h-4 bg-white/8 rounded w-1/2 mb-2" />
          <div className="h-3 bg-white/5 rounded w-2/3" />
        </div>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

type EntityTab = 'lawyers' | 'firms'
const STATUS_TABS: { key: VerificationStatus; label: string; color: string }[] = [
  { key: 'pending',  label: 'Pending',  color: 'text-amber-400' },
  { key: 'approved', label: 'Approved', color: 'text-emerald-400' },
  { key: 'rejected', label: 'Rejected', color: 'text-red-400' },
]

export default function AdminVerificationPage() {
  const [entityTab, setEntityTab] = useState<EntityTab>('lawyers')
  const [statusTab, setStatusTab] = useState<VerificationStatus>('pending')

  const [lawyerRequests, setLawyerRequests] = useState<VerificationRequest[]>([])
  const [firmRequests, setFirmRequests] = useState<FirmVerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLawyers = useCallback(async (s: VerificationStatus) => {
    setLoading(true); setError('')
    try {
      const token = localStorage.getItem('access') || ''
      const data = await getVerificationQueue(token, s)
      setLawyerRequests(data.results ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setLawyerRequests([])
    } finally { setLoading(false) }
  }, [])

  const loadFirms = useCallback(async (s: VerificationStatus) => {
    setLoading(true); setError('')
    try {
      const token = localStorage.getItem('access') || ''
      const data = await getFirmVerificationQueue(token, s)
      setFirmRequests(data.results ?? [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
      setFirmRequests([])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (entityTab === 'lawyers') void loadLawyers(statusTab)
    else void loadFirms(statusTab)
  }, [entityTab, statusTab, loadLawyers, loadFirms])

  const handleLawyerApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('access') || ''
      await approveVerification(id, token)
      void loadLawyers(statusTab)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to approve') }
  }

  const handleLawyerReject = async (id: string, reason: string) => {
    try {
      const token = localStorage.getItem('access') || ''
      await rejectVerification(id, reason, token)
      void loadLawyers(statusTab)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to reject') }
  }

  const handleFirmApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('access') || ''
      await approveFirmVerification(id, token)
      void loadFirms(statusTab)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to approve firm') }
  }

  const handleFirmReject = async (id: string, reason: string) => {
    try {
      const token = localStorage.getItem('access') || ''
      await rejectFirmVerification(id, reason, token)
      void loadFirms(statusTab)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to reject firm') }
  }

  const currentCount = entityTab === 'lawyers' ? lawyerRequests.length : firmRequests.length

  return (
    <div className="min-h-screen bg-primary-950">
      <div className="border-b border-white/6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-xl font-bold text-white">Verification Queue</h1>
          <p className="text-sm text-white/40 mt-1">
            Review and action lawyer bar membership and firm registration requests.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-5 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* Entity tabs — Lawyers / Firms */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/6 mb-6 w-fit">
          {(['lawyers', 'firms'] as EntityTab[]).map(e => (
            <button
              key={e}
              onClick={() => { setEntityTab(e); setStatusTab('pending') }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                entityTab === e
                  ? 'bg-white/8 text-white shadow-sm'
                  : 'text-white/35 hover:text-white/55'
              }`}
            >
              {e === 'lawyers' ? 'Lawyers' : 'Firms'}
            </button>
          ))}
        </div>

        {/* Status sub-tabs — Pending / Approved / Rejected */}
        <div className="flex gap-1 border-b border-white/6 mb-6">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                statusTab === tab.key
                  ? `border-current ${tab.color}`
                  : 'border-transparent text-white/30 hover:text-white/50'
              }`}
            >
              {tab.label}
              {statusTab === tab.key && !loading && (
                <span className="ml-2 text-xs opacity-60">({currentCount})</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonCards />
        ) : currentCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
            <p className="text-[13px] text-white/30">
              No {statusTab} {entityTab === 'lawyers' ? 'lawyer' : 'firm'} requests
            </p>
          </div>
        ) : entityTab === 'lawyers' ? (
          <div className="space-y-3">
            {lawyerRequests.map(req => (
              <LawyerCard
                key={req.id}
                req={req}
                onApprove={handleLawyerApprove}
                onReject={handleLawyerReject}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {firmRequests.map(req => (
              <FirmCard
                key={req.id}
                req={req}
                onApprove={handleFirmApprove}
                onReject={handleFirmReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
