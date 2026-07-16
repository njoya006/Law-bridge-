'use client'

import React, { useCallback, useRef, useState } from 'react'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function FileTypeIcon({ mime }: { mime: string }) {
  if (mime.includes('pdf')) {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
          <line x1="9" y1="11" x2="11" y2="11"/>
        </svg>
      </div>
    )
  }
  if (mime.includes('word') || mime.includes('document')) {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
    )
  }
  if (mime.includes('image')) {
    return (
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
    )
  }
  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
      </svg>
    </div>
  )
}

interface FileUploadProps {
  onFile: (file: File) => void
  accept?: string
  disabled?: boolean
}

export default function FileUpload({ onFile, accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.txt', disabled = false }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFile = useCallback((file: File) => {
    setSelectedFile(file)
    onFile(file)
  }, [onFile])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  if (selectedFile) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-4">
        <FileTypeIcon mime={selectedFile.type} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-100">{selectedFile.name}</p>
          <p className="mt-0.5 text-xs text-neutral-500">{formatBytes(selectedFile.size)}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedFile(null)
            if (inputRef.current) inputRef.current.value = ''
          }}
          className="flex-shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/10 transition-colors"
        >
          Change
        </button>
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200',
        disabled
          ? 'cursor-not-allowed border-white/8 bg-white/3 opacity-50'
          : dragging
            ? 'border-gold-400/70 bg-gold-500/8 scale-[1.01]'
            : 'border-white/15 bg-white/3 hover:border-gold-400/30',
      ].join(' ')}
    >
      {/* Cloud icon */}
      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200 ${dragging ? 'bg-gold-500/20 text-gold-300 scale-110' : 'bg-white/6 text-neutral-400'}`}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="16 16 12 12 8 16"/>
          <line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
      </div>

      {/* Text */}
      <div className="space-y-1">
        <p className={`text-sm font-semibold transition-colors ${dragging ? 'text-gold-300' : 'text-neutral-200'}`}>
          {dragging ? 'Release to upload' : 'Drag & drop your file here'}
        </p>
        <p className="text-xs text-neutral-500">
          {dragging ? 'Your file will be attached to this matter' : 'or use the button below to browse from your device'}
        </p>
      </div>

      {/* Browse button */}
      {!disabled && !dragging && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/7 px-5 py-2.5 text-sm font-medium text-neutral-300 hover:border-gold-400/30 hover:bg-gold-500/8 hover:text-gold-300 transition-all duration-150"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Browse Files
        </button>
      )}

      {/* Accepted formats */}
      <div className="flex items-center gap-2 text-[11px] text-neutral-600">
        <span className="rounded-md bg-white/4 border border-white/6 px-1.5 py-0.5">PDF</span>
        <span className="rounded-md bg-white/4 border border-white/6 px-1.5 py-0.5">DOC</span>
        <span className="rounded-md bg-white/4 border border-white/6 px-1.5 py-0.5">DOCX</span>
        <span className="rounded-md bg-white/4 border border-white/6 px-1.5 py-0.5">JPG</span>
        <span className="rounded-md bg-white/4 border border-white/6 px-1.5 py-0.5">PNG</span>
        <span className="text-neutral-700">· max 50 MB</span>
      </div>

      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" disabled={disabled} />
    </div>
  )
}
