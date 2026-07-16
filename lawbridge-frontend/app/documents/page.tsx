'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getMyCases } from '../../lib/casesApi'
import { listDocuments, fetchDocumentBlob, downloadDocument, type DocumentItem } from '../../lib/documentsApi'

type DocumentGroup = { caseId: string; title: string; items: DocumentItem[] }

function formatBytes(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
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
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
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
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/>Stored
    </span>
  )
  if (status === 'pending_scan') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400"/>Scanning
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400"/>Error
    </span>
  )
}

export default function DocumentsPage() {
  const [groups, setGroups] = useState<DocumentGroup[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pendingDocument, setPendingDocument] = useState<DocumentItem | null>(null)
  const [pendingAction, setPendingAction] = useState<'open' | 'download' | null>(null)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(null)
  const [previewPassword, setPreviewPassword] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewMimeType, setPreviewMimeType] = useState('')
  const [previewName, setPreviewName] = useState('')
  const [portalRole, setPortalRole] = useState('client')

  const passwordRequired = useMemo(() => Boolean(pendingDocument?.is_password_protected), [pendingDocument])

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null); setPreviewMimeType(''); setPreviewName('')
    setPreviewDocument(null); setPreviewPassword('')
  }

  const resetPasswordPrompt = () => {
    setPendingDocument(null); setPendingAction(null)
    setPassword(''); setPasswordError('')
  }

  const runDocumentAction = async (doc: DocumentItem, action: 'open' | 'download', passwordValue?: string) => {
    const token = localStorage.getItem('access')
    if (!token) throw new Error('Not signed in')
    const blob = await fetchDocumentBlob(doc.id, token, passwordValue || undefined)
    if (action === 'open') {
      closePreview()
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url); setPreviewMimeType(blob.type || doc.mime_type || 'application/pdf')
      setPreviewName(doc.filename); setPreviewDocument(doc); setPreviewPassword(passwordValue || '')
      return
    }
    const url = URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = url; anchor.download = doc.filename || doc.id; anchor.rel = 'noopener noreferrer'
    window.document.body.appendChild(anchor); anchor.click(); anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const handleAction = (document: DocumentItem, action: 'open' | 'download') => {
    setError('')
    // Lawyers and firm staff skip the password modal — backend grants access without it
    if (document.is_password_protected && portalRole !== 'lawyer') {
      setPendingDocument(document); setPendingAction(action); setPassword(''); setPasswordError('')
      return
    }
    void runDocumentAction(document, action).catch(err => {
      setError(err instanceof Error ? err.message : 'Unable to open document')
    })
  }

  useEffect(() => {
    setPortalRole(localStorage.getItem('portalRole') || 'client')
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) { setError('Sign in to see your documents.'); setLoading(false); return }
      try {
        const cases = await getMyCases(access)
        const nextGroups = await Promise.all(
          cases.results.map(async item => ({
            caseId: item.id, title: item.title,
            items: (await listDocuments(item.id, access).catch(() => ({ results: [] }))).results,
          }))
        )
        setGroups(nextGroups.filter(g => g.items.length > 0))
      } catch (cause) {
        const raw = cause instanceof Error ? cause.message : String(cause)
        const isJwt = /invalid token|token_not_valid|token has expired/i.test(raw)
        if (isJwt) setError('Session expired. Please sign in again.')
        else if (raw.includes('<!DOCTYPE') || raw.includes('<html')) setError('The documents service is temporarily unavailable. Please try again shortly.')
        else setError(raw.slice(0, 200))
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])

  return (
    <div className="space-y-6 pb-24">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-neutral-50">My Documents</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Documents are grouped by matter. Access is limited to {portalRole === 'lawyer' ? 'lawyer and firm' : 'case-linked'} accounts.
            </p>
          </div>
          {portalRole !== 'lawyer' && (
            <Link
              href="/upload"
              className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-primary-950 hover:bg-gold-400 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="16 16 12 12 8 16"/>
                <line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              Upload
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/8 px-4 py-4">
          <svg className="mt-0.5 flex-shrink-0 text-red-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Loading skeletons */}
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

      {/* Groups */}
      {!loading && groups.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13 2 13 9 20 9"/>
            </svg>
          </div>
          <h3 className="mt-4 font-semibold text-neutral-200 text-base">Your document vault is empty</h3>
          <p className="mt-1.5 max-w-sm text-sm text-neutral-500 leading-relaxed">
            Every file you share with your lawyer is stored here, organized by case. Uploads are end-to-end secure.
          </p>
          <div className="mt-6 w-full max-w-sm space-y-3 text-left">
            {[
              { step: '1', text: 'Book a lawyer from the Lawyers page — this opens your first case', href: '/lawyers', label: 'Find a Lawyer' },
              { step: '2', text: 'Once your case is active, use the Upload button above to share evidence, contracts, or identity documents', href: '/upload', label: 'Upload Now' },
              { step: '3', text: 'Your lawyer gets notified instantly and can view files from their portal', href: null, label: null },
            ].map(({ step, text, href, label }) => (
              <div key={step} className="flex items-start gap-3 rounded-xl border border-white/6 bg-primary-900/40 px-4 py-3">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-400">{step}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-400 leading-relaxed">{text}</p>
                  {href && label && (
                    <Link href={href} className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors">
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
      )}

      {!loading && groups.map(group => (
        <div key={group.caseId} className="rounded-2xl border border-white/8 bg-primary-800/30">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <p className="font-semibold text-neutral-100">{group.title}</p>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
              {group.items.length} {group.items.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {group.items.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-4 hover:bg-primary-700/20 transition-colors">
                <FileIcon mime={doc.mime_type} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="truncate text-sm font-medium text-neutral-100">{doc.filename}</p>
                    {doc.is_password_protected && (
                      <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
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
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    onClick={() => handleAction(doc, 'open')}
                    className="min-h-[36px] rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-neutral-100 transition-colors"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleAction(doc, 'download')}
                    className="min-h-[36px] flex items-center justify-center rounded-xl border border-gold-500/25 bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-400 hover:bg-gold-500/20 transition-colors"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Password modal */}
      {pendingDocument && pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-primary-900 shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-neutral-100">Document Access</p>
                <p className="mt-0.5 text-sm text-neutral-400 truncate">{pendingDocument.filename}</p>
              </div>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setPasswordError('') }}
              onKeyDown={async e => {
                if (e.key === 'Enter' && pendingDocument && pendingAction) {
                  try { await runDocumentAction(pendingDocument, pendingAction, password); resetPasswordPrompt() }
                  catch (err) { setPasswordError(err instanceof Error ? err.message : 'Access denied') }
                }
              }}
              className="w-full rounded-xl border border-white/10 bg-primary-800/60 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 transition-colors"
              placeholder="Enter document password"
              autoFocus
            />
            {passwordError && <p className="mt-2 text-xs text-red-400">{passwordError}</p>}
            <div className="mt-4 flex gap-3">
              <button
                onClick={async () => {
                  if (!pendingDocument || !pendingAction) return
                  try { await runDocumentAction(pendingDocument, pendingAction, password); resetPasswordPrompt() }
                  catch (err) { setPasswordError(err instanceof Error ? err.message : 'Access denied') }
                }}
                className="flex-1 rounded-xl bg-gold-500 py-2.5 text-sm font-semibold text-primary-950 hover:bg-gold-400 transition-colors"
              >
                {pendingAction === 'open' ? 'Open' : 'Download'}
              </button>
              <button
                onClick={resetPasswordPrompt}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
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
                  onClick={() => {
                    const token = localStorage.getItem('access')
                    if (previewDocument && token) {
                      void downloadDocument(previewDocument.id, token, previewPassword || undefined, previewDocument.filename)
                        .catch(err => setError(err instanceof Error ? err.message : 'Unable to download'))
                    }
                  }}
                  className="min-h-[40px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-300 hover:bg-white/10 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={closePreview}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-gold-500 text-sm font-semibold text-primary-950 hover:bg-gold-400 transition-colors px-3"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 rounded-b-2xl bg-white">
              <object data={previewUrl} type={previewMimeType || 'application/pdf'} className="h-full w-full">
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
