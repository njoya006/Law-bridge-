'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { getMyCases, type CaseItem } from '../../../lib/casesApi'
import { listDocuments, fetchDocumentBlob, downloadDocument, type DocumentItem } from '../../../lib/documentsApi'
import { toastError } from '../../../lib/toast'

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

  const totalDocs = groups.reduce((n, g) => n + g.items.length, 0)

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

      {!loading && !error && groups.map(group => (
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
                  <div className="flex flex-shrink-0 items-center gap-2">
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
