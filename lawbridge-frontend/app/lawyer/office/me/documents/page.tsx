'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { getMyCases, type CaseItem } from '../../../../../lib/casesApi'
import { listDocuments, fetchDocumentBlob, downloadDocument, type DocumentItem } from '../../../../../lib/documentsApi'
import { toastError } from '../../../../../lib/toast'

function formatBytes(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

function FileIcon({ mime }: { mime: string }) {
  const base = 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg'
  if (mime?.includes('pdf')) return <div className={`${base} bg-red-500/12 text-red-400`}>📄</div>
  if (mime?.includes('image')) return <div className={`${base} bg-emerald-500/12 text-emerald-400`}>🖼️</div>
  if (mime?.includes('word') || mime?.includes('document')) return <div className={`${base} bg-blue-500/12 text-blue-400`}>📝</div>
  if (mime?.includes('sheet') || mime?.includes('excel')) return <div className={`${base} bg-green-500/12 text-green-400`}>📊</div>
  return <div className={`${base} bg-gold-500/12 text-gold-400`}>📎</div>
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'stored'
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : status === 'pending_scan'
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30'
  return (
    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full border ${cls}`}>
      {status === 'pending_scan' ? 'scanning' : status}
    </span>
  )
}

function EmptyVault() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-primary-800/20 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/10 text-gold-400 text-2xl">
        📁
      </div>
      <h3 className="mt-4 font-semibold text-neutral-200">No documents yet</h3>
      <p className="mt-1.5 max-w-xs text-sm text-neutral-500 leading-relaxed">
        Documents from all your active matters appear here once clients or you upload files.
      </p>
      <div className="mt-5 flex flex-col sm:flex-row gap-3 text-sm">
        <Link
          href="/lawyer/bookings"
          className="inline-flex items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-5 py-2.5 font-semibold text-gold-400 hover:bg-gold-500/20 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          View Bookings
        </Link>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 font-medium text-neutral-300 hover:bg-white/10 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
          Upload a File
        </Link>
      </div>
    </div>
  )
}

export default function MyOfficeDocumentsPage() {
  const [groups, setGroups] = useState<{ caseId: string; title: string; items: DocumentItem[] }[]>([])
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
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        if (mounted) { setError('Sign in as a lawyer to view documents.'); setLoading(false) }
        return
      }
      try {
        const result = await getMyCases(access)
        const allCases = result.results ?? []
        if (mounted) setCases(allCases)

        const nextGroups = await Promise.all(
          allCases.map(async (c) => {
            try {
              const { results } = await listDocuments(c.id, access)
              return { caseId: c.id, title: c.title, items: results }
            } catch {
              return { caseId: c.id, title: c.title, items: [] }
            }
          })
        )
        if (mounted) setGroups(nextGroups)
      } catch (cause) {
        if (mounted) setError(cause instanceof Error ? cause.message : 'Unable to load documents')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void run()
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-display-md text-neutral-50">Documents</h2>
          <p className="mt-1 text-neutral-400 text-sm">
            {loading ? 'Loading…' : `${cases.length} matter${cases.length !== 1 ? 's' : ''} · ${totalDocs} document${totalDocs !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/upload"
          className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2.5 text-sm font-semibold text-gold-400 hover:bg-gold-500/20 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
          Upload
        </Link>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-12 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading documents…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-4">
          <svg className="mt-0.5 flex-shrink-0 text-red-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {!loading && !error && cases.length === 0 && <EmptyVault />}

      {!loading && !error && cases.length > 0 && groups.every(g => g.items.length === 0) && (
        <EmptyVault />
      )}

      {!loading && !error && groups.map(group => (
        <div key={group.caseId} className="rounded-xl border border-white/8 bg-primary-800/30 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/6 bg-primary-800/40">
            <p className="text-sm font-semibold text-neutral-100 truncate">{group.title}</p>
            <span className="ml-3 flex-shrink-0 text-[10px] uppercase tracking-wider text-neutral-500">
              {group.items.length} {group.items.length === 1 ? 'file' : 'files'}
            </span>
          </div>
          {group.items.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-4 text-xs text-neutral-500">
              <span className="opacity-50">📄</span>
              No files yet — your client can upload from their portal, or add one yourself.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {group.items.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <FileIcon mime={doc.mime_type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-100 truncate">{doc.filename}</p>
                    <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                      <StatusBadge status={doc.status} />
                      <span className="text-[11px] text-neutral-500 capitalize">{doc.document_type?.replace(/_/g, ' ')}</span>
                      <span className="text-[11px] text-neutral-600">{formatBytes(doc.file_size)}</span>
                      {doc.created_at && <span className="text-[11px] text-neutral-600">{formatDate(doc.created_at)}</span>}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {doc.is_encrypted && (
                      <span className="text-[10px] text-gold-400 border border-gold-500/30 rounded px-1.5 py-0.5">encrypted</span>
                    )}
                    <button
                      onClick={() => void handleOpen(doc)}
                      className="min-h-[32px] inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:bg-white/10 hover:text-neutral-100 transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Open
                    </button>
                    <button
                      onClick={() => void handleDownload(doc)}
                      className="min-h-[32px] inline-flex items-center gap-1.5 rounded-lg border border-gold-500/25 bg-gold-500/10 px-2.5 py-1 text-xs font-medium text-gold-400 hover:bg-gold-500/20 transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                      </svg>
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex w-full max-w-5xl flex-col rounded-2xl border border-white/10 bg-primary-950 shadow-2xl" style={{ height: 'calc(100dvh - 6rem)', maxHeight: '90dvh' }}>
            <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="truncate font-semibold text-neutral-100 flex-1 min-w-0">{previewName}</p>
              <div className="flex flex-shrink-0 items-center gap-2 ml-4">
                <button
                  onClick={() => void downloadDocument(previewDocId, previewToken, undefined, previewName)}
                  className="min-h-[38px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-300 hover:bg-white/10 transition-colors"
                >
                  Download
                </button>
                <button onClick={closePreview} className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl bg-gold-500 text-sm font-semibold text-primary-900 hover:bg-gold-400 transition-colors px-3">
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 rounded-b-2xl bg-white">
              <object data={previewUrl} type={previewMime || 'application/pdf'} className="h-full w-full">
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-700">
                  <div>
                    <p className="font-semibold">Preview unavailable.</p>
                    <p className="mt-2">Use Download to save the file.</p>
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
