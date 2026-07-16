'use client'

import React, { useEffect, useRef, useState } from 'react'
import FileUpload from '../../components/ui/FileUpload'
import { getMyCases, type CaseItem } from '../../lib/casesApi'
import { uploadDocument } from '../../lib/documentsApi'

type UploadStatus =
  | { type: 'idle' }
  | { type: 'uploading' }
  | { type: 'success'; filename: string; size: number; matterTitle: string }
  | { type: 'error'; text: string }

const DOC_TYPES = [
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'identity', label: 'ID Document' },
  { value: 'court_filing', label: 'Court Filing' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'other', label: 'Other' },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function parseUploadError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('503') || msg.toLowerCase().includes('unavailable') || msg.includes('service_error')) {
    return 'The document service is temporarily unavailable. Please try again in a moment.'
  }
  if (msg.includes('413') || msg.toLowerCase().includes('too large')) {
    return 'File is too large. Maximum upload size is 50 MB.'
  }
  if (msg.includes('400') || msg.toLowerCase().includes('file required')) {
    return 'No file was received. Please select a file and try again.'
  }
  if (msg.includes('403') || msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('access') || msg.toLowerCase().includes('matter')) {
    return "You don't have access to this matter, or the matter no longer exists."
  }
  return 'Upload failed. Please try again or contact support if the issue persists.'
}

export default function UploadPage() {
  const [statusState, setStatusState] = useState<UploadStatus>({ type: 'idle' })
  const [cases, setCases] = useState<CaseItem[]>([])
  const [caseId, setCaseId] = useState('')
  const [docType, setDocType] = useState('other')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileUploadKey = useRef(0)

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) return
      try {
        const response = await getMyCases(access)
        setCases(response.results)
        if (response.results[0]) setCaseId(response.results[0].id)
      } catch {
        setCases([])
      }
    }
    void run()
  }, [])

  const selectedCase = cases.find(c => c.id === caseId)

  const handleFile = (file: File) => {
    setPendingFile(file)
    setStatusState({ type: 'idle' })
  }

  const handleUpload = async () => {
    const access = localStorage.getItem('access')
    if (!access) {
      setStatusState({ type: 'error', text: 'Please sign in before uploading.' })
      return
    }
    if (!caseId) {
      setStatusState({ type: 'error', text: 'Please select a matter first.' })
      return
    }
    if (!pendingFile) {
      setStatusState({ type: 'error', text: 'Please select a file to upload.' })
      return
    }

    setStatusState({ type: 'uploading' })
    try {
      await uploadDocument(caseId, pendingFile, docType, access, password || undefined)
      setStatusState({
        type: 'success',
        filename: pendingFile.name,
        size: pendingFile.size,
        matterTitle: selectedCase?.title ?? 'Selected matter',
      })
      setPendingFile(null)
      fileUploadKey.current += 1
      setPassword('')
      setShowPassword(false)
    } catch (err) {
      setStatusState({ type: 'error', text: parseUploadError(err) })
    }
  }

  const reset = () => {
    setStatusState({ type: 'idle' })
    setPendingFile(null)
    fileUploadKey.current += 1
    setPassword('')
    setShowPassword(false)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-neutral-50">Upload Document</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Securely store files against a matter. Only case-linked accounts can access uploaded documents.
        </p>
      </div>

      {/* Success state */}
      {statusState.type === 'success' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-300">Document uploaded successfully</p>
              <p className="mt-0.5 truncate text-sm text-neutral-400">{statusState.filename}</p>
              <p className="mt-0.5 text-xs text-neutral-600">
                {formatBytes(statusState.size)} · Stored in <span className="text-neutral-400">{statusState.matterTitle}</span>
              </p>
            </div>
          </div>
          <button
            onClick={reset}
            className="mt-4 w-full rounded-xl border border-emerald-500/25 bg-emerald-500/10 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
          >
            Upload another document
          </button>
        </div>
      )}

      {/* Upload form */}
      {statusState.type !== 'success' && (
        <div className="space-y-5">
          {/* Matter selector */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-5">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Select Matter
            </label>
            {cases.length === 0 ? (
              <p className="text-sm text-neutral-500 italic">No active matters found. Create a matter first.</p>
            ) : (
              <div className="relative">
                <select
                  value={caseId}
                  onChange={e => setCaseId(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-primary-900/60 px-4 py-3 pr-10 text-sm text-neutral-100 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 transition-colors"
                >
                  <option value="">Choose a matter…</option>
                  {cases.map(item => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            )}
          </div>

          {/* Document type */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-5">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
              Document Type
            </label>
            <div className="flex flex-wrap gap-2">
              {DOC_TYPES.map(dt => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => setDocType(dt.value)}
                  className={[
                    'rounded-xl border px-3.5 py-2 text-sm font-medium transition-all duration-150',
                    docType === dt.value
                      ? 'border-gold-500/50 bg-gold-500/15 text-gold-300'
                      : 'border-white/8 bg-white/4 text-neutral-400 hover:border-white/15 hover:text-neutral-300',
                  ].join(' ')}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* File drop zone */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-5">
            <label className="mb-3 block text-xs font-semibold uppercase tracking-widest text-neutral-500">
              File
            </label>
            <FileUpload
              key={fileUploadKey.current}
              onFile={handleFile}
              disabled={statusState.type === 'uploading'}
            />
          </div>

          {/* Password toggle */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/40 p-5">
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="flex w-full items-center justify-between text-sm text-neutral-400 hover:text-neutral-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>Password protect this document</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-600">
                  Optional
                </span>
              </div>
              <svg
                className={`transition-transform duration-200 ${showPassword ? 'rotate-180' : ''}`}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showPassword && (
              <div className="mt-4">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Set a password for this document"
                  className="w-full rounded-xl border border-white/10 bg-primary-900/60 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-gold-500/50 focus:outline-none focus:ring-1 focus:ring-gold-500/30 transition-colors"
                />
                <p className="mt-2 text-xs text-neutral-600">
                  Anyone downloading this file will need to enter this password. Make sure to save it securely.
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {statusState.type === 'error' && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/8 px-4 py-4">
              <svg className="mt-0.5 flex-shrink-0 text-red-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm text-red-300">{statusState.text}</p>
            </div>
          )}

          {/* Upload button */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={!pendingFile || !caseId || statusState.type === 'uploading'}
            className={[
              'flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold transition-all duration-200',
              !pendingFile || !caseId || statusState.type === 'uploading'
                ? 'cursor-not-allowed bg-white/5 text-neutral-600'
                : 'bg-gradient-to-r from-gold-500 to-gold-600 text-primary-900 shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30 hover:from-gold-400 hover:to-gold-500',
            ].join(' ')}
          >
            {statusState.type === 'uploading' ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Uploading…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 16 12 12 8 16"/>
                  <line x1="12" y1="12" x2="12" y2="21"/>
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                </svg>
                Upload Document
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
