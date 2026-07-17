'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { getMyCases, type CaseItem } from '../../../lib/casesApi'
import { listDocuments, fetchDocumentBlob, downloadDocument, signDocument, type DocumentItem, uploadDocument } from '../../../lib/documentsApi'
import { toastError, toastSuccess } from '../../../lib/toast'

type DocFilter = 'all' | 'evidence' | 'photo' | 'contract' | 'motion' | 'other'
type SigTab   = 'draw' | 'typed' | 'stamp'

const STAMP_OPTIONS = [
  { key: 'reviewed',     label: 'REVIEWED' },
  { key: 'approved',     label: 'APPROVED' },
  { key: 'certified',    label: 'CERTIFIED' },
  { key: 'confidential', label: 'CONFIDENTIAL' },
  { key: 'court_filed',  label: 'COURT FILED' },
  { key: 'original_copy',label: 'ORIGINAL COPY' },
]

function filterDoc(doc: DocumentItem, filter: DocFilter) {
  if (filter === 'all')      return true
  if (filter === 'evidence') return doc.document_type === 'evidence'
  if (filter === 'photo')    return doc.mime_type?.startsWith('image/')
  if (filter === 'contract') return doc.document_type === 'contract'
  if (filter === 'motion')   return doc.document_type === 'motion'
  if (filter === 'other')    return !['evidence','contract','motion'].includes(doc.document_type) && !doc.mime_type?.startsWith('image/')
  return true
}

// ── Signature modal ───────────────────────────────────────────────────────────
function SignatureModal({ doc, onClose, onSigned }: {
  doc: DocumentItem
  onClose: () => void
  onSigned: (docId: string) => void
}) {
  const [tab, setTab] = useState<SigTab>('draw')
  const [typedSig, setTypedSig] = useState('')
  const [stamp, setStamp] = useState(STAMP_OPTIONS[0].key)
  const [saving, setSaving] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing   = useRef(false)
  const lastPos   = useRef<{ x: number; y: number } | null>(null)

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const src  = 'touches' in e ? e.touches[0] : e
    return { x: src.clientX - rect.left, y: src.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    drawing.current = true
    const canvas = canvasRef.current!
    lastPos.current = getPos(e, canvas)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e, canvas)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  function stopDraw() { drawing.current = false; lastPos.current = null }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
  }

  async function submit() {
    const token = localStorage.getItem('access')
    if (!token) return
    const signerName = localStorage.getItem('fullName') ?? ''

    let sig_data = ''
    if (tab === 'draw') {
      const canvas = canvasRef.current!
      sig_data = canvas.toDataURL('image/png')
      if (sig_data === canvas.toDataURL('image/png').replace(/data:image\/png;base64,/, '') || sig_data.length < 200) {
        toastError('Please draw your signature first', 'No signature')
        return
      }
    } else if (tab === 'typed') {
      if (!typedSig.trim()) { toastError('Please type your signature', 'No signature'); return }
      sig_data = typedSig.trim()
    } else {
      sig_data = stamp
    }

    setSaving(true)
    try {
      await signDocument(doc.id, {
        signature_type: tab,
        signature_data: sig_data,
        stamp_type: tab === 'stamp' ? stamp : '',
        signer_name: signerName,
      }, token)
      toastSuccess('Document signed successfully')
      onSigned(doc.id)
      onClose()
    } catch (err) {
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

        {/* Tabs */}
        <div className="flex border-b border-white/8">
          {(['draw','typed','stamp'] as SigTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-gold-500 text-gold-400' : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t === 'draw' ? 'Draw' : t === 'typed' ? 'Type' : 'Stamp'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'draw' && (
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-dashed border-neutral-700 bg-white overflow-hidden" style={{ height: 160 }}>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={160}
                  className="w-full h-full cursor-crosshair"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                  style={{ touchAction: 'none' }}
                />
              </div>
              <button onClick={clearCanvas} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">Clear</button>
            </div>
          )}

          {tab === 'typed' && (
            <div className="space-y-3">
              <input
                type="text"
                value={typedSig}
                onChange={e => setTypedSig(e.target.value)}
                placeholder="Type your full name"
                className="w-full rounded-xl bg-primary-900/50 border border-white/10 px-4 py-3 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-gold-500/40"
              />
              {typedSig && (
                <div className="rounded-xl border border-neutral-700 bg-white p-4 text-center">
                  <p className="text-neutral-900 text-2xl" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{typedSig}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'stamp' && (
            <div className="grid grid-cols-2 gap-2">
              {STAMP_OPTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setStamp(s.key)}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold tracking-widest transition-all ${
                    stamp === s.key
                      ? 'border-gold-500 bg-gold-500/10 text-gold-400'
                      : 'border-neutral-700 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-neutral-400 hover:text-neutral-100 hover:border-white/20 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => void submit()}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Signing…' : 'Apply Signature'}
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
  const [file, setFile] = useState<File | null>(null)
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
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full py-8 border-2 border-dashed border-neutral-700 rounded-xl text-sm text-neutral-500 hover:border-gold-500/40 hover:text-neutral-300 transition-colors"
          >
            {file ? file.name : 'Click to choose file'}
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-neutral-400 hover:text-neutral-100 transition-colors">Cancel</button>
            <button
              onClick={() => void upload()}
              disabled={!file || saving}
              className="flex-1 py-2.5 rounded-xl bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Uploading…' : 'Upload v' + (doc.version + 1)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type DocGroup = { caseId: string; title: string; items: DocumentItem[] }

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
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="11" x2="11" y2="11"/>
      </svg>
    </div>
  )
  if (mime?.includes('word') || mime?.includes('document')) return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/12 text-blue-400">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    </div>
  )
  if (mime?.includes('image')) return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-400">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>
  )
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gold-500/12 text-gold-400">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
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
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13 2 13 9 20 9"/>
        </svg>
      </div>
      <div>
        <p className="text-neutral-400 text-xs font-medium">No files in this matter yet</p>
        <p className="text-neutral-600 text-[11px] mt-0.5">Your client can upload evidence from their portal. You can also add court filings.</p>
      </div>
    </div>
  )
}

function EmptyVault() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
          <polyline points="13 2 13 9 20 9"/>
        </svg>
      </div>
      <h3 className="mt-4 font-semibold text-neutral-200 text-base">No documents yet</h3>
      <p className="mt-1.5 max-w-sm text-sm text-neutral-500 leading-relaxed">
        Documents for your active cases will appear here, grouped by matter. Here&apos;s how to get started:
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
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LawyerDocumentsPage() {
  const [groups, setGroups] = useState<DocGroup[]>([])
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewMime, setPreviewMime] = useState('')
  const [previewName, setPreviewName] = useState('')
  const [previewDocId, setPreviewDocId] = useState('')
  const [previewToken, setPreviewToken] = useState('')

  const [filter, setFilter]           = useState<DocFilter>('all')
  const [signingDoc, setSigningDoc]   = useState<DocumentItem | null>(null)
  const [newVerDoc, setNewVerDoc]     = useState<{ doc: DocumentItem; caseId: string } | null>(null)

  const filteredGroups = filter === 'all'
    ? groups
    : groups.map(g => ({ ...g, items: g.items.filter(d => filterDoc(d, filter)) }))
             .filter(g => g.items.length > 0)

  const totalDocs = groups.reduce((n, g) => n + g.items.length, 0)
  const photoItems = groups.flatMap(g => g.items.filter(d => filterDoc(d, 'photo')))

  const reload = useCallback(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) return
      const result = await getMyCases(access)
      const allCases = result.results ?? []
      const nextGroups = await Promise.all(
        allCases.map(async (c): Promise<DocGroup> => {
          try {
            const { results } = await listDocuments(c.id, access)
            return { caseId: c.id, title: c.title, items: results }
          } catch {
            return { caseId: c.id, title: c.title, items: [] }
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
  }, [previewUrl])

  const handleOpen = useCallback(async (doc: DocumentItem) => {
    const token = localStorage.getItem('access')
    if (!token) return
    try {
      const blob = await fetchDocumentBlob(doc.id, token)
      closePreview()
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setPreviewMime(blob.type || doc.mime_type || 'application/pdf')
      setPreviewName(doc.filename)
      setPreviewDocId(doc.id)
      setPreviewToken(token)
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Unable to open document', 'Open failed')
    }
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

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { setError('Sign in as a lawyer to view documents.'); setLoading(false); return }
      try {
        const result = await getMyCases(access)
        const allCases = result.results ?? []
        setCases(allCases)

        const nextGroups = await Promise.all(
          allCases.map(async (c): Promise<DocGroup> => {
            try {
              const { results } = await listDocuments(c.id, access)
              return { caseId: c.id, title: c.title, items: results }
            } catch {
              return { caseId: c.id, title: c.title, items: [] }
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
        <Link
          href="/upload"
          className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-primary-900 hover:bg-gold-400 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
          Upload
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {([ 'all', 'evidence', 'photo', 'contract', 'motion', 'other'] as DocFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? 'bg-gold-500 text-primary-900'
                : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300 border border-white/8'
            }`}
          >
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
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl border border-white/6 bg-primary-800/30 p-5">
              <div className="h-4 w-40 rounded bg-white/8 animate-pulse mb-4" />
              {[1, 2].map(j => (
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

      {!loading && !error && cases.length > 0 && groups.every(g => g.items.length === 0) && (
        <EmptyVault />
      )}

      {/* Photo grid view */}
      {!loading && !error && filter === 'photo' && (
        photoItems.length === 0
          ? (
            <div className="rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-12 text-center">
              <p className="text-neutral-500 text-sm">No photos or images found in your case documents.</p>
            </div>
          )
          : (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-neutral-600 mb-3">{photoItems.length} image{photoItems.length !== 1 ? 's' : ''}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photoItems.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => void handleOpen(doc)}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-white/8 bg-primary-800/40 hover:border-gold-500/30 transition-all"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 gap-1">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-600">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <p className="text-[10px] text-neutral-600 text-center leading-tight truncate w-full">{doc.filename}</p>
                    </div>
                    {(doc.signatures?.length ?? 0) > 0 && (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        ✓ Signed
                      </span>
                    )}
                    {doc.version > 1 && (
                      <span className="absolute top-1.5 left-1.5 rounded-full bg-gold-500/90 px-1.5 py-0.5 text-[9px] font-bold text-black">
                        v{doc.version}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gold-500/0 group-hover:bg-gold-500/5 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )
      )}

      {/* Document list view (all non-photo filters) */}
      {!loading && !error && filter !== 'photo' && filteredGroups.map(group => (
        <div key={group.caseId} className="rounded-2xl border border-white/8 bg-primary-800/30">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <p className="font-semibold text-neutral-100 truncate flex-1 min-w-0">{group.title}</p>
            <span className="ml-3 flex-shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
              {group.items.length} {group.items.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {group.items.length === 0
              ? <NoDocumentsYet />
              : group.items.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-4 hover:bg-primary-700/20 transition-colors">
                  <FileIcon mime={doc.mime_type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate text-sm font-medium text-neutral-100">{doc.filename}</p>
                      {doc.version > 1 && (
                        <span className="flex-shrink-0 rounded-full bg-gold-500/15 px-2 py-0.5 text-[10px] font-bold text-gold-400">
                          v{doc.version}
                        </span>
                      )}
                      {(doc.signatures?.length ?? 0) > 0 && (
                        <span className="flex-shrink-0 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          ✓ Signed
                        </span>
                      )}
                      {doc.is_password_protected && (
                        <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                          Protected
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                      <StatusBadge status={doc.status} />
                      <span className="text-[11px] text-neutral-600 capitalize">{doc.document_type?.replace(/_/g, ' ')}</span>
                      {doc.file_size > 0 && <span className="text-[11px] text-neutral-600">{formatBytes(doc.file_size)}</span>}
                      {doc.created_at && <span className="text-[11px] text-neutral-600">{formatDate(doc.created_at)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5 flex-wrap justify-end">
                    <button
                      onClick={() => void handleOpen(doc)}
                      className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-neutral-100 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Open
                    </button>
                    <button
                      onClick={() => setSigningDoc(doc)}
                      className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-purple-500/25 bg-purple-500/8 px-3 py-1.5 text-xs font-medium text-purple-400 hover:bg-purple-500/15 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                      </svg>
                      Sign
                    </button>
                    <button
                      onClick={() => setNewVerDoc({ doc, caseId: group.caseId })}
                      className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-300 hover:bg-white/8 transition-colors"
                      title="Upload new version"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                      v+
                    </button>
                    <button
                      onClick={() => void handleDownload(doc)}
                      className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border border-gold-500/25 bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-400 hover:bg-gold-500/20 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      ))}

      {/* No results for active filter */}
      {!loading && !error && filter !== 'photo' && filter !== 'all' && filteredGroups.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-12 text-center">
          <p className="text-neutral-500 text-sm capitalize">No {filter} documents found across your cases.</p>
        </div>
      )}

      {/* Signature modal */}
      {signingDoc && (
        <SignatureModal
          doc={signingDoc}
          onClose={() => setSigningDoc(null)}
          onSigned={() => { setSigningDoc(null); reload() }}
        />
      )}

      {/* New version modal */}
      {newVerDoc && (
        <NewVersionModal
          doc={newVerDoc.doc}
          caseId={newVerDoc.caseId}
          onClose={() => setNewVerDoc(null)}
          onUploaded={() => { setNewVerDoc(null); reload() }}
        />
      )}

      {/* Document preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex w-full max-w-6xl flex-col rounded-2xl border border-white/10 bg-primary-950 shadow-2xl" style={{ height: 'calc(100dvh - 6rem)', maxHeight: '90dvh' }}>
            <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-widest text-neutral-600">Preview</p>
                <p className="truncate font-semibold text-neutral-100">{previewName}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2 ml-4">
                <button
                  onClick={() => void downloadDocument(previewDocId, previewToken, undefined, previewName)}
                  className="min-h-[40px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-300 hover:bg-white/10 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={closePreview}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-gold-500 text-sm font-semibold text-primary-900 hover:bg-gold-400 transition-colors px-3"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 rounded-b-2xl bg-white">
              <object data={previewUrl} type={previewMime || 'application/pdf'} className="h-full w-full">
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-700">
                  <div>
                    <p className="font-semibold">Preview unavailable in this browser.</p>
                    <p className="mt-2">Use the Download button to save the file.</p>
                  </div>
                </div>
              </object>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
