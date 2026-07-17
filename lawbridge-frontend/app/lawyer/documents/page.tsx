'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { getMyCases, type CaseItem } from '../../../lib/casesApi'
import {
  listDocuments,
  fetchDocumentBlob,
  downloadDocument,
  signDocument,
  deleteDocument,
  type DocumentItem,
  uploadDocument,
} from '../../../lib/documentsApi'
import { toastError, toastSuccess } from '../../../lib/toast'
import { bakeSignatureIntoDocument } from '../../../lib/signatureUtils'
import { SERVICE_URLS } from '../../../lib/serviceUrls'

type DocFilter = 'all' | 'evidence' | 'photo' | 'contract' | 'motion' | 'other'
type SigTab = 'draw' | 'typed' | 'stamp'
type DocChain = { tip: DocumentItem; history: DocumentItem[] }
type DocGroup = { caseId: string; title: string; chains: DocChain[] }

const STAMP_OPTIONS = [
  { key: 'reviewed', label: 'REVIEWED' },
  { key: 'approved', label: 'APPROVED' },
  { key: 'certified', label: 'CERTIFIED' },
  { key: 'confidential', label: 'CONFIDENTIAL' },
  { key: 'court_filed', label: 'COURT FILED' },
  { key: 'original_copy', label: 'ORIGINAL COPY' },
]

const WORD_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
])

function filterDoc(doc: DocumentItem, filter: DocFilter) {
  if (filter === 'all') return true
  if (filter === 'evidence') return doc.document_type === 'evidence'
  if (filter === 'photo') return doc.mime_type?.startsWith('image/')
  if (filter === 'contract') return doc.document_type === 'contract'
  if (filter === 'motion') return doc.document_type === 'motion'
  if (filter === 'other')
    return !['evidence', 'contract', 'motion'].includes(doc.document_type) && !doc.mime_type?.startsWith('image/')
  return true
}

// Group a flat doc list into version chains — each chain has a "tip" (latest version)
// and a history array (older versions, most-recent first).
function buildVersionChains(docs: DocumentItem[]): DocChain[] {
  const parentIds = new Set(docs.filter(d => d.parent_document_id).map(d => d.parent_document_id!))
  const tips = docs.filter(d => !parentIds.has(d.id))
  const docMap = new Map(docs.map(d => [d.id, d]))

  return tips.map(tip => {
    const history: DocumentItem[] = []
    let current: DocumentItem = tip
    while (current.parent_document_id) {
      const parent = docMap.get(current.parent_document_id)
      if (!parent) break
      history.push(parent)
      current = parent
    }
    return { tip, history }
  })
}

// ── Signature auth session cache (5 minutes) ──────────────────────────────────
const SIG_AUTH_KEY = 'lawbridge_sig_auth'
function sigAuthRecent(): boolean {
  try {
    const t = sessionStorage.getItem(SIG_AUTH_KEY)
    return !!t && Date.now() - parseInt(t, 10) < 5 * 60 * 1000
  } catch { return false }
}
function markSigAuth() {
  try { sessionStorage.setItem(SIG_AUTH_KEY, String(Date.now())) } catch {}
}
function decodeJwtField(token: string, field: string): string {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64)) as Record<string, unknown>
    return String(payload[field] || '')
  } catch { return '' }
}

// ── Canvas drawing hook ───────────────────────────────────────────────────────
function useCanvas() {
  const ref  = useRef<HTMLCanvasElement>(null)
  const down = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  function pos(e: React.MouseEvent | React.TouchEvent) {
    const rect = ref.current!.getBoundingClientRect()
    const src  = 'touches' in e ? e.touches[0] : e
    return { x: (src.clientX - rect.left) * (ref.current!.width / rect.width),
             y: (src.clientY - rect.top)  * (ref.current!.height / rect.height) }
  }
  const onDown = (e: React.MouseEvent | React.TouchEvent) => { down.current = true; last.current = pos(e) }
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!down.current || !last.current) return
    e.preventDefault()
    const ctx = ref.current!.getContext('2d')!
    const p   = pos(e)
    ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke()
    last.current = p
  }
  const onUp    = () => { down.current = false; last.current = null }
  const clear   = () => { const c = ref.current; if (c) c.getContext('2d')!.clearRect(0, 0, c.width, c.height) }
  const getData = () => ref.current?.toDataURL('image/png') ?? ''
  const isEmpty = () => {
    const c = ref.current; if (!c) return true
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
    return !d.some((v, i) => i % 4 === 3 && v > 10)
  }
  return { ref, onDown, onMove, onUp, clear, getData, isEmpty }
}

// ── Identity confirmation before signing ─────────────────────────────────────
function LawyerAuthModal({ onConfirmed, onClose }: {
  onConfirmed: () => void
  onClose: () => void
}) {
  const [pw, setPw]     = useState('')
  const [err, setErr]   = useState('')
  const [busy, setBusy] = useState(false)

  async function verify() {
    if (!pw.trim()) { setErr('Enter your account password'); return }
    setBusy(true); setErr('')
    try {
      const access = localStorage.getItem('access') ?? ''
      const email  = decodeJwtField(access, 'email')
      if (!email) { setErr('Unable to identify your account. Please sign out and sign back in.'); return }
      const resp = await fetch(`${SERVICE_URLS.auth.replace(/\/$/, '')}/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      })
      if (!resp.ok) throw new Error('invalid')
      markSigAuth()
      onConfirmed()
    } catch {
      setErr('Incorrect password. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-primary-800 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/12 text-purple-400">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-neutral-100 text-sm">Confirm Your Identity</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">Authentication required before signing</p>
            </div>
          </div>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && void verify()}
            autoFocus
            placeholder="Your account password"
            className="w-full rounded-xl bg-primary-900/50 border border-white/10 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500/40"
          />
          {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-neutral-400 hover:text-neutral-100 transition-colors">Cancel</button>
          <button onClick={() => void verify()} disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-400 disabled:opacity-50 transition-colors">
            {busy ? 'Verifying…' : 'Confirm & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Signature management (edit / revert) for signed docs ─────────────────────
function SignatureManageModal({ chain, caseId, onClose, onReload, onAddSignature }: {
  chain: DocChain
  caseId: string
  onClose: () => void
  onReload: () => void
  onAddSignature: (doc: DocumentItem, caseId: string) => void
}) {
  const { tip } = chain
  const [reverting, setReverting] = useState(false)

  async function revert() {
    if (!tip.parent_document_id) return
    const token = localStorage.getItem('access')
    if (!token) return
    setReverting(true)
    try {
      await deleteDocument(tip.id, token)
      toastSuccess(`Signed version removed. Reverted to v${tip.version - 1}.`)
      onReload()
      onClose()
    } catch (e) {
      toastError(e instanceof Error ? e.message : 'Revert failed', 'Revert failed')
      setReverting(false)
    }
  }

  const sigTypeLabel = (t: string) =>
    t === 'draw' ? 'Handwritten' : t === 'typed' ? 'Typed' : 'Stamp'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-primary-800 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <p className="font-semibold text-neutral-100 text-sm">Signature Management</p>
            <p className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-xs">{tip.filename}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-100 hover:bg-white/8 transition-colors">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current signatures */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-2">
              Signatures on Current Version (v{tip.version})
            </p>
            {(tip.signatures?.length ?? 0) === 0 ? (
              <p className="text-xs text-neutral-500">No signatures on this version.</p>
            ) : (
              <div className="space-y-2">
                {tip.signatures!.map(sig => (
                  <div key={sig.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-primary-900/30 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-400 flex-shrink-0">
                      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-neutral-200">{sig.signer_name || 'Unknown'}</p>
                      <p className="text-[11px] text-neutral-500">
                        {sigTypeLabel(sig.signature_type)}
                        {sig.stamp_type ? ` · ${sig.stamp_type.replace(/_/g, ' ').toUpperCase()}` : ''}
                      </p>
                    </div>
                    <p className="text-[10px] text-neutral-600 flex-shrink-0">
                      {new Date(sig.signed_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Version chain breadcrumb */}
          {chain.history.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-neutral-600 mb-2">Version Chain</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[...chain.history].reverse().map(h => (
                  <span key={h.id} className="rounded-full bg-white/5 border border-white/8 px-2.5 py-0.5 text-[10px] text-neutral-500">
                    v{h.version}
                  </span>
                ))}
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neutral-600 mx-0.5">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span className="rounded-full bg-gold-500/15 border border-gold-500/30 px-2.5 py-0.5 text-[10px] font-bold text-gold-400">
                  v{tip.version} (current)
                </span>
              </div>
              <p className="mt-2 text-[11px] text-neutral-600">
                Reverting permanently deletes v{tip.version} and restores v{tip.version - 1} as active.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          {tip.parent_document_id && (
            <button
              onClick={() => void revert()}
              disabled={reverting}
              className="flex-1 py-2.5 rounded-xl border border-red-500/25 bg-red-500/8 text-sm font-semibold text-red-400 hover:bg-red-500/15 disabled:opacity-50 transition-colors"
            >
              {reverting ? 'Reverting…' : `Revert to v${tip.version - 1}`}
            </button>
          )}
          <button
            onClick={() => { onClose(); onAddSignature(tip, caseId) }}
            className="flex-1 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-400 transition-colors"
          >
            Add New Signature
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Signature modal ───────────────────────────────────────────────────────────
function SignatureModal({ doc, caseId, onClose, onSigned }: {
  doc: DocumentItem
  caseId: string
  onClose: () => void
  onSigned: () => void
}) {
  const [tab, setTab]       = useState<SigTab>('draw')
  const [typedSig, setTyped] = useState('')
  const [stamp, setStamp]   = useState(STAMP_OPTIONS[0].key)
  const [saving, setSaving]  = useState(false)
  const [step, setStep]      = useState<'choose' | 'baking'>('choose')

  const sigCanvas   = useCanvas()
  const stampCanvas = useCanvas()

  async function submit() {
    const token      = localStorage.getItem('access')
    if (!token) return
    const signerName = localStorage.getItem('fullName') ?? ''

    let sig_data = ''
    let drawOnStamp: string | undefined

    if (tab === 'draw') {
      if (sigCanvas.isEmpty()) { toastError('Please draw your signature first', 'No signature'); return }
      sig_data = sigCanvas.getData()
    } else if (tab === 'typed') {
      if (!typedSig.trim()) { toastError('Please type your signature', 'No signature'); return }
      sig_data = typedSig.trim()
    } else {
      sig_data = stamp
      if (!stampCanvas.isEmpty()) drawOnStamp = stampCanvas.getData()
    }

    setSaving(true); setStep('baking')

    try {
      await signDocument(doc.id, {
        signature_type: tab,
        signature_data: sig_data,
        stamp_type:     tab === 'stamp' ? stamp : '',
        signer_name:    signerName,
      }, token)

      const originalBlob = await fetchDocumentBlob(doc.id, token)
      const bakedBlob    = await bakeSignatureIntoDocument(originalBlob, signerName, tab, sig_data, stamp, drawOnStamp)

      if (bakedBlob) {
        const ext     = doc.filename.split('.').pop() ?? 'pdf'
        const base    = doc.filename.replace(/\.[^.]+$/, '')
        const newName = `${base}_signed_v${doc.version + 1}.${ext}`
        const newFile = new File([bakedBlob], newName, { type: bakedBlob.type })
        await uploadDocument(caseId, newFile, doc.document_type, token, undefined, doc.id)
      }

      toastSuccess('Signature applied — new version created')
      onSigned()
      onClose()
    } catch (err) {
      setStep('choose')
      toastError(err instanceof Error ? err.message : 'Failed to sign document', 'Sign failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-primary-800 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <p className="font-semibold text-neutral-100 text-sm">Sign Document</p>
            <p className="text-[11px] text-neutral-500 truncate mt-0.5 max-w-xs">{doc.filename}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-100 hover:bg-white/8 transition-colors">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex border-b border-white/8">
          {(['draw','typed','stamp'] as SigTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-gold-500 text-gold-400' : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}>
              {t === 'draw' ? 'Draw' : t === 'typed' ? 'Type' : 'Stamp'}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {tab === 'draw' && (
            <div className="space-y-2">
              <p className="text-[11px] text-neutral-500">Draw your signature — it appears at the bottom-left of every page.</p>
              <div className="rounded-xl border-2 border-dashed border-neutral-700 bg-white overflow-hidden" style={{ height: 150 }}>
                <canvas ref={sigCanvas.ref} width={420} height={150} className="w-full h-full cursor-crosshair"
                  onMouseDown={sigCanvas.onDown} onMouseMove={sigCanvas.onMove} onMouseUp={sigCanvas.onUp} onMouseLeave={sigCanvas.onUp}
                  onTouchStart={sigCanvas.onDown} onTouchMove={sigCanvas.onMove} onTouchEnd={sigCanvas.onUp}
                  style={{ touchAction: 'none' }} />
              </div>
              <button onClick={sigCanvas.clear} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">Clear</button>
            </div>
          )}

          {tab === 'typed' && (
            <div className="space-y-3">
              <p className="text-[11px] text-neutral-500">Your typed name appears in italic script at the bottom-left of every page.</p>
              <input type="text" value={typedSig} onChange={e => setTyped(e.target.value)} placeholder="Type your full name"
                className="w-full rounded-xl bg-primary-900/50 border border-white/10 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-gold-500/40" />
              {typedSig && (
                <div className="rounded-xl border border-neutral-700 bg-white p-4 text-center">
                  <p className="text-neutral-900 text-2xl" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{typedSig}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'stamp' && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-neutral-500 mb-2">Choose a legal stamp — it appears as a coloured box on every page.</p>
                <div className="grid grid-cols-2 gap-2">
                  {STAMP_OPTIONS.map(s => (
                    <button key={s.key} onClick={() => setStamp(s.key)}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold tracking-widest transition-all ${
                        stamp === s.key ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] text-neutral-500 mb-2">Optional — draw your signature on top of the stamp:</p>
                <div className="rounded-xl border border-neutral-700 bg-white overflow-hidden" style={{ height: 100 }}>
                  <canvas ref={stampCanvas.ref} width={420} height={100} className="w-full h-full cursor-crosshair"
                    onMouseDown={stampCanvas.onDown} onMouseMove={stampCanvas.onMove} onMouseUp={stampCanvas.onUp} onMouseLeave={stampCanvas.onUp}
                    onTouchStart={stampCanvas.onDown} onTouchMove={stampCanvas.onMove} onTouchEnd={stampCanvas.onUp}
                    style={{ touchAction: 'none' }} />
                </div>
                <button onClick={stampCanvas.clear} className="mt-1 text-xs text-neutral-600 hover:text-neutral-400 transition-colors">Clear</button>
              </div>
            </div>
          )}

          {step === 'baking' && (
            <div className="flex items-center gap-2 rounded-xl bg-gold-500/8 border border-gold-500/20 px-4 py-3 text-xs text-gold-400">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Baking signature into document and uploading new version…
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-neutral-400 hover:text-neutral-100 hover:border-white/20 transition-colors">Cancel</button>
          <button onClick={() => void submit()} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors">
            {saving ? 'Processing…' : 'Apply & Save New Version'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Password prompt ───────────────────────────────────────────────────────────
function PasswordModal({ doc, onClose, onUnlocked }: {
  doc: DocumentItem
  onClose: () => void
  onUnlocked: (password: string) => void
}) {
  const [pw, setPw]     = useState('')
  const [err, setErr]   = useState('')
  const [busy, setBusy] = useState(false)

  async function tryOpen() {
    if (!pw) { setErr('Enter the document password'); return }
    const token = localStorage.getItem('access')
    if (!token) return
    setBusy(true); setErr('')
    try {
      await fetchDocumentBlob(doc.id, token, pw)
      onUnlocked(pw)
    } catch (e) {
      setErr(e instanceof Error && e.message === 'invalid_password' ? 'Incorrect password' : 'Access denied')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-primary-800 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/12 text-amber-400">
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-neutral-100 text-sm">Password Protected</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">Enter the document password to open</p>
            </div>
          </div>
          <p className="text-[11px] text-neutral-600 truncate mb-4">{doc.filename}</p>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && void tryOpen()}
            autoFocus
            placeholder="Document password"
            className="w-full rounded-xl bg-primary-900/50 border border-white/10 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500/40"
          />
          {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-neutral-400 hover:text-neutral-100 transition-colors">Cancel</button>
          <button onClick={() => void tryOpen()} disabled={busy}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors">
            {busy ? 'Verifying…' : 'Open Document'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── New version upload ────────────────────────────────────────────────────────
function NewVersionModal({ doc, caseId, onClose, onUploaded }: {
  doc: DocumentItem
  caseId: string
  onClose: () => void
  onUploaded: () => void
}) {
  const [file, setFile]   = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload() {
    if (!file) return
    const token = localStorage.getItem('access')
    if (!token) return
    setSaving(true)
    try {
      await uploadDocument(caseId, file, doc.document_type, token, undefined, doc.id)
      toastSuccess('New version uploaded')
      onUploaded()
      onClose()
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Upload failed', 'Upload failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-primary-800 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-4">
          <p className="font-semibold text-neutral-100 text-sm mb-0.5">Upload New Version</p>
          <p className="text-[11px] text-neutral-500">Replaces <span className="text-neutral-300">{doc.filename}</span> (v{doc.version} → v{doc.version + 1})</p>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <button onClick={() => inputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-neutral-700 rounded-xl text-sm text-neutral-500 hover:border-gold-500/40 hover:text-neutral-300 transition-colors">
            {file ? file.name : 'Click to choose file'}
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-neutral-400 hover:text-neutral-100 transition-colors">Cancel</button>
            <button onClick={() => void upload()} disabled={!file || saving}
              className="flex-1 py-2.5 rounded-xl bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-40 transition-colors">
              {saving ? 'Uploading…' : 'Upload v' + (doc.version + 1)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}
function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '' }
}

function FileIcon({ mime }: { mime: string }) {
  if (mime?.includes('pdf')) return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/12 text-red-400">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="11" y2="11"/>
      </svg>
    </div>
  )
  if (mime?.includes('word') || mime?.includes('document')) return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/12 text-blue-400">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    </div>
  )
  if (mime?.includes('image')) return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-400">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  )
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gold-500/12 text-gold-400">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
      </svg>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'stored') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Stored
    </span>
  )
  if (status === 'pending_scan') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />Scanning
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />{status}
    </span>
  )
}

function NoDocumentsYet() {
  return (
    <div className="flex items-center gap-3 px-5 py-5 text-sm">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/4 text-neutral-600">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
        </svg>
      </div>
      <div>
        <p className="text-neutral-400 text-xs font-medium">No files in this matter yet</p>
        <p className="text-neutral-600 text-[11px] mt-0.5">Your client can upload evidence from their portal.</p>
      </div>
    </div>
  )
}

function EmptyVault() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
        </svg>
      </div>
      <h3 className="mt-4 font-semibold text-neutral-200 text-base">No documents yet</h3>
      <p className="mt-1.5 max-w-sm text-sm text-neutral-500 leading-relaxed">
        Documents for your active cases will appear here, grouped by matter.
      </p>
      <div className="mt-6 w-full max-w-sm space-y-3 text-left">
        {[
          { step: '1', text: 'Accept a client booking from the Bookings page to create an active case', href: '/lawyer/bookings', label: 'Go to Bookings' },
          { step: '2', text: 'Your client can upload evidence, identity documents, and forms from their portal', href: null, label: null },
          { step: '3', text: 'You can also upload court filings, motions, or evidence to any active case', href: '/upload', label: 'Upload a file' },
        ].map(({ step, text, href, label }) => (
          <div key={step} className="flex items-start gap-3 rounded-xl border border-white/6 bg-primary-900/40 px-4 py-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-xs font-bold text-gold-400">{step}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-neutral-400 leading-relaxed">{text}</p>
              {href && label && (
                <Link href={href} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-gold-400 hover:text-gold-300 transition-colors">
                  {label}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LawyerDocumentsPage() {
  const [groups, setGroups]         = useState<DocGroup[]>([])
  const [cases, setCases]           = useState<CaseItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null)
  const [previewMime, setPreviewMime] = useState('')
  const [previewName, setPreviewName] = useState('')
  const [previewDocId, setPreviewDocId] = useState('')
  const [previewToken, setPreviewToken] = useState('')
  const [previewHtml, setPreviewHtml]   = useState<string | null>(null)
  const [filter, setFilter]         = useState<DocFilter>('all')

  // Sign flow state
  const [pendingSign, setPendingSign] = useState<{ doc: DocumentItem; caseId: string } | null>(null)
  const [authOpen, setAuthOpen]       = useState(false)
  const [signingDoc, setSigningDoc]   = useState<{ doc: DocumentItem; caseId: string } | null>(null)
  const [manageDoc, setManageDoc]     = useState<{ chain: DocChain; caseId: string } | null>(null)

  const [newVerDoc, setNewVerDoc]     = useState<{ doc: DocumentItem; caseId: string } | null>(null)
  const [passwordDoc, setPasswordDoc] = useState<DocumentItem | null>(null)
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set())

  const filteredGroups = filter === 'all'
    ? groups
    : groups.map(g => ({ ...g, chains: g.chains.filter(c => filterDoc(c.tip, filter)) }))
             .filter(g => g.chains.length > 0)

  const totalDocs  = groups.reduce((n, g) => n + g.chains.length, 0)
  const photoItems = groups.flatMap(g => g.chains.filter(c => filterDoc(c.tip, 'photo')).map(c => c.tip))

  const reload = useCallback(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) return
      const result   = await getMyCases(access)
      const allCases = result.results ?? []
      const nextGroups = await Promise.all(
        allCases.map(async (c): Promise<DocGroup> => {
          try {
            const { results } = await listDocuments(c.id, access)
            return { caseId: c.id, title: c.title, chains: buildVersionChains(results) }
          } catch {
            return { caseId: c.id, title: c.title, chains: [] }
          }
        })
      )
      setGroups(nextGroups)
    }
    void run()
  }, [])

  const closePreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null); setPreviewMime(''); setPreviewName(''); setPreviewDocId('')
    setPreviewHtml(null)
  }, [previewUrl])

  const handleOpen = useCallback(async (doc: DocumentItem, password?: string) => {
    const token = localStorage.getItem('access')
    if (!token) return
    try {
      const blob = await fetchDocumentBlob(doc.id, token, password)
      closePreview()
      const mime = blob.type || doc.mime_type || 'application/pdf'

      if (WORD_MIMES.has(mime) || doc.filename.match(/\.docx?$/i)) {
        const mammoth = (await import('mammoth')).default
        const arrayBuffer = await blob.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })
        const html = `<!doctype html><html><head><meta charset="utf-8">
          <style>body{font-family:Georgia,serif;font-size:13px;line-height:1.7;max-width:780px;margin:32px auto;padding:0 24px;color:#1a1a1a}
          h1,h2,h3{font-weight:700;margin-top:1.2em}p{margin:.5em 0}
          table{border-collapse:collapse;width:100%;margin:1em 0}td,th{border:1px solid #ccc;padding:6px 8px}</style>
          </head><body>${result.value}</body></html>`
        setPreviewHtml(html); setPreviewUrl(null)
      } else {
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url); setPreviewHtml(null)
      }
      setPreviewMime(mime); setPreviewName(doc.filename); setPreviewDocId(doc.id); setPreviewToken(token)
      setPasswordDoc(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'password_required') setPasswordDoc(doc)
      else toastError(msg || 'Unable to open document', 'Open failed')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closePreview])

  const handleDownload = useCallback(async (doc: DocumentItem) => {
    const token = localStorage.getItem('access')
    if (!token) return
    try {
      await downloadDocument(doc.id, token, undefined, doc.filename)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Unable to download', 'Download failed')
    }
  }, [])

  function startSign(doc: DocumentItem, caseId: string) {
    if (sigAuthRecent()) {
      setSigningDoc({ doc, caseId })
    } else {
      setPendingSign({ doc, caseId })
      setAuthOpen(true)
    }
  }

  function handleSignClick(chain: DocChain, caseId: string) {
    if ((chain.tip.signatures?.length ?? 0) > 0) {
      setManageDoc({ chain, caseId })
    } else {
      startSign(chain.tip, caseId)
    }
  }

  function onAuthConfirmed() {
    setAuthOpen(false)
    if (pendingSign) {
      setSigningDoc(pendingSign)
      setPendingSign(null)
    }
  }

  function toggleHistory(docId: string) {
    setExpandedHistory(prev => {
      const next = new Set(prev)
      if (next.has(docId)) next.delete(docId)
      else next.add(docId)
      return next
    })
  }

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { setError('Sign in as a lawyer to view documents.'); setLoading(false); return }
      try {
        const result   = await getMyCases(access)
        const allCases = result.results ?? []
        setCases(allCases)

        const nextGroups = await Promise.all(
          allCases.map(async (c): Promise<DocGroup> => {
            try {
              const { results } = await listDocuments(c.id, access)
              return { caseId: c.id, title: c.title, chains: buildVersionChains(results) }
            } catch {
              return { caseId: c.id, title: c.title, chains: [] }
            }
          })
        )
        setGroups(nextGroups)
      } catch (cause) {
        const msg = cause instanceof Error ? cause.message : String(cause)
        if (/invalid token|token_not_valid|expired/i.test(msg)) {
          setError('Session expired. Please sign in again.')
        } else if (msg.includes('<!DOCTYPE') || msg.includes('<html')) {
          setError('The case service is temporarily unavailable. Please try again shortly.')
        } else {
          setError(msg.slice(0, 200))
        }
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-50">Case Documents</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {loading ? 'Loading…' : `${cases.length} matter${cases.length !== 1 ? 's' : ''} · ${totalDocs} document${totalDocs !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/upload" className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-primary-900 hover:bg-gold-400 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
          Upload
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {(['all','evidence','photo','contract','motion','other'] as DocFilter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === f ? 'bg-gold-500 text-primary-900' : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300 border border-white/8'
            }`}>
            {f === 'all' ? 'All Documents' : f === 'photo' ? 'Photos & Images' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/8 px-4 py-4">
          <svg className="mt-0.5 flex-shrink-0 text-red-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {[1,2].map(i => (
            <div key={i} className="rounded-2xl border border-white/6 bg-primary-800/30 p-5">
              <div className="h-4 w-40 rounded bg-white/8 animate-pulse mb-4" />
              {[1,2].map(j => (
                <div key={j} className="flex items-center gap-3 py-3">
                  <div className="h-9 w-9 rounded-xl bg-white/6 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-48 rounded bg-white/6 animate-pulse" />
                    <div className="h-2.5 w-32 rounded bg-white/5 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && cases.length === 0 && <EmptyVault />}
      {!loading && !error && cases.length > 0 && groups.every(g => g.chains.length === 0) && <EmptyVault />}

      {/* Photo grid */}
      {!loading && !error && filter === 'photo' && (
        photoItems.length === 0
          ? (
            <div className="rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-12 text-center">
              <p className="text-neutral-500 text-sm">No photos or images found in your case documents.</p>
            </div>
          ) : (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-neutral-600 mb-3">{photoItems.length} image{photoItems.length !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photoItems.map(doc => (
                  <button key={doc.id} onClick={() => void handleOpen(doc)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/8 bg-primary-800/40 hover:border-gold-500/30 transition-all">
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 gap-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-600">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <p className="text-[10px] text-neutral-600 text-center leading-tight truncate w-full">{doc.filename}</p>
                    </div>
                    {(doc.signatures?.length ?? 0) > 0 && (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">✓ Signed</span>
                    )}
                    {doc.version > 1 && (
                      <span className="absolute top-1.5 left-1.5 rounded-full bg-gold-500/90 px-1.5 py-0.5 text-[9px] font-bold text-black">v{doc.version}</span>
                    )}
                    <div className="absolute inset-0 bg-gold-500/0 group-hover:bg-gold-500/5 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )
      )}

      {/* Document list — version-chain aware */}
      {!loading && !error && filter !== 'photo' && filteredGroups.map(group => (
        <div key={group.caseId} className="rounded-2xl border border-white/8 bg-primary-800/30">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <p className="font-semibold text-neutral-100 truncate flex-1 min-w-0">{group.title}</p>
            <span className="ml-3 flex-shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
              {group.chains.length} {group.chains.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {group.chains.length === 0
              ? <NoDocumentsYet />
              : group.chains.map(chain => {
                  const { tip, history } = chain
                  const isSigned     = (tip.signatures?.length ?? 0) > 0
                  const isExpanded   = expandedHistory.has(tip.id)

                  return (
                    <div key={tip.id}>
                      {/* Tip row */}
                      <div className="flex items-center gap-3 px-5 py-4 hover:bg-primary-700/20 transition-colors">
                        <FileIcon mime={tip.mime_type} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="truncate text-sm font-medium text-neutral-100">{tip.filename}</p>
                            {tip.version > 1 && (
                              <span className="flex-shrink-0 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold text-gold-400">v{tip.version}</span>
                            )}
                            {isSigned && (
                              <span className="flex-shrink-0 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">✓ Signed</span>
                            )}
                            {tip.is_password_protected && (
                              <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                                Protected
                              </span>
                            )}
                            {history.length > 0 && (
                              <button onClick={() => toggleHistory(tip.id)}
                                className="flex-shrink-0 flex items-center gap-1 rounded-full bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                                  className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
                                {history.length} older version{history.length !== 1 ? 's' : ''}
                              </button>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                            <StatusBadge status={tip.status} />
                            <span className="text-[11px] text-neutral-600 capitalize">{tip.document_type?.replace(/_/g, ' ')}</span>
                            {tip.file_size > 0 && <span className="text-[11px] text-neutral-600">{formatBytes(tip.file_size)}</span>}
                            {tip.created_at && <span className="text-[11px] text-neutral-600">{formatDate(tip.created_at)}</span>}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1.5 flex-wrap justify-end">
                          <button onClick={() => void handleOpen(tip)}
                            className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-neutral-100 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                            </svg>
                            Open
                          </button>
                          <button onClick={() => handleSignClick(chain, group.caseId)}
                            className={`min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                              isSigned
                                ? 'border-emerald-500/25 bg-emerald-500/8 text-emerald-400 hover:bg-emerald-500/15'
                                : 'border-purple-500/25 bg-purple-500/8 text-purple-400 hover:bg-purple-500/15'
                            }`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                            </svg>
                            {isSigned ? 'Manage' : 'Sign'}
                          </button>
                          <button onClick={() => setNewVerDoc({ doc: tip, caseId: group.caseId })}
                            className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-300 hover:bg-white/8 transition-colors"
                            title="Upload new version">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                            </svg>
                            v+
                          </button>
                          <button onClick={() => void handleDownload(tip)}
                            className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-gold-500/25 bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-400 hover:bg-gold-500/20 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                              <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                            </svg>
                            Download
                          </button>
                        </div>
                      </div>

                      {/* Older versions (collapsible) */}
                      {isExpanded && history.length > 0 && (
                        <div className="border-t border-white/4 bg-primary-900/20">
                          {history.map((h, idx) => (
                            <div key={h.id}
                              className={`flex items-center gap-3 px-5 py-3 pl-16 ${idx < history.length - 1 ? 'border-b border-white/4' : ''}`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-neutral-700 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-neutral-500 truncate">{h.filename}</p>
                                  <span className="flex-shrink-0 rounded-full bg-white/5 border border-white/8 px-1.5 py-0.5 text-[9px] text-neutral-600">v{h.version}</span>
                                  {(h.signatures?.length ?? 0) > 0 && <span className="text-[9px] text-emerald-600">✓ Signed</span>}
                                </div>
                                {h.created_at && <p className="text-[10px] text-neutral-700">{formatDate(h.created_at)}</p>}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={() => void handleOpen(h)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors">
                                  Open
                                </button>
                                <button onClick={() => void handleDownload(h)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors">
                                  Download
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
            }
          </div>
        </div>
      ))}

      {!loading && !error && filter !== 'photo' && filter !== 'all' && filteredGroups.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-12 text-center">
          <p className="text-neutral-500 text-sm capitalize">No {filter} documents found across your cases.</p>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {authOpen && (
        <LawyerAuthModal
          onConfirmed={onAuthConfirmed}
          onClose={() => { setAuthOpen(false); setPendingSign(null) }}
        />
      )}

      {signingDoc && (
        <SignatureModal
          doc={signingDoc.doc}
          caseId={signingDoc.caseId}
          onClose={() => setSigningDoc(null)}
          onSigned={() => { setSigningDoc(null); reload() }}
        />
      )}

      {manageDoc && (
        <SignatureManageModal
          chain={manageDoc.chain}
          caseId={manageDoc.caseId}
          onClose={() => setManageDoc(null)}
          onReload={reload}
          onAddSignature={(doc, caseId) => { setManageDoc(null); startSign(doc, caseId) }}
        />
      )}

      {newVerDoc && (
        <NewVersionModal
          doc={newVerDoc.doc}
          caseId={newVerDoc.caseId}
          onClose={() => setNewVerDoc(null)}
          onUploaded={() => { setNewVerDoc(null); reload() }}
        />
      )}

      {passwordDoc && (
        <PasswordModal
          doc={passwordDoc}
          onClose={() => setPasswordDoc(null)}
          onUnlocked={pw => void handleOpen(passwordDoc, pw)}
        />
      )}

      {(previewUrl || previewHtml) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex w-full max-w-6xl flex-col rounded-2xl border border-white/10 bg-primary-950 shadow-2xl" style={{ height: 'calc(100dvh - 6rem)', maxHeight: '90dvh' }}>
            <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-widest text-neutral-600">Preview</p>
                <p className="truncate font-semibold text-neutral-100">{previewName}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2 ml-4">
                <button onClick={() => void downloadDocument(previewDocId, previewToken, undefined, previewName)}
                  className="min-h-[40px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-300 hover:bg-white/10 transition-colors">
                  Download
                </button>
                <button onClick={closePreview}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-gold-500 text-sm font-semibold text-primary-900 hover:bg-gold-400 transition-colors px-3">
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 rounded-b-2xl bg-white">
              {previewHtml
                ? <iframe srcDoc={previewHtml} className="h-full w-full border-0" sandbox="allow-same-origin" title={previewName} />
                : <object data={previewUrl!} type={previewMime || 'application/pdf'} className="h-full w-full">
                    <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-700">
                      <div>
                        <p className="font-semibold">Preview unavailable in this browser.</p>
                        <p className="mt-2">Use the Download button to save the file.</p>
                      </div>
                    </div>
                  </object>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
