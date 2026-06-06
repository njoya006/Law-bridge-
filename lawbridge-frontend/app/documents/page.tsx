"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { getMyCases } from '../../lib/casesApi'
import { listDocuments, fetchDocumentBlob, downloadDocument, type DocumentItem } from '../../lib/documentsApi'

type DocumentGroup = { caseId: string; title: string; items: DocumentItem[] }

export default function DocumentsPage(){
  const [groups, setGroups] = useState<DocumentGroup[]>([])
  const [error, setError] = useState('')
  const [pendingDocument, setPendingDocument] = useState<DocumentItem | null>(null)
  const [pendingAction, setPendingAction] = useState<'open' | 'download' | null>(null)
  const [password, setPassword] = useState('')
  const [previewDocument, setPreviewDocument] = useState<DocumentItem | null>(null)
  const [previewPassword, setPreviewPassword] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewMimeType, setPreviewMimeType] = useState('')
  const [previewName, setPreviewName] = useState('')
  const [portalRole, setPortalRole] = useState('client')
  const audienceLabel = portalRole === 'lawyer' ? 'lawyer and firm' : 'client'

  const passwordRequired = useMemo(() => Boolean(pendingDocument?.is_password_protected), [pendingDocument])

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewMimeType('')
    setPreviewName('')
    setPreviewDocument(null)
    setPreviewPassword('')
  }

  const resetPasswordPrompt = () => {
    setPendingDocument(null)
    setPendingAction(null)
    setPassword('')
  }

  const runDocumentAction = async (doc: DocumentItem, action: 'open' | 'download', passwordValue?: string) => {
    const token = localStorage.getItem('access')
    if (!token) throw new Error('Not signed in')

    const blob = await fetchDocumentBlob(doc.id, token, passwordValue || undefined)

    if (action === 'open') {
      closePreview()
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setPreviewMimeType(blob.type || doc.mime_type || 'application/pdf')
      setPreviewName(doc.filename)
      setPreviewDocument(doc)
      setPreviewPassword(passwordValue || '')
      return
    }

    const url = URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')
    anchor.href = url
    anchor.download = doc.filename || doc.id
    anchor.rel = 'noopener noreferrer'
    window.document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  const handleAction = (document: DocumentItem, action: 'open' | 'download') => {
    setError('')
    if (document.is_password_protected) {
      setPendingDocument(document)
      setPendingAction(action)
      setPassword('')
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
      if (!access) {
        setError('Sign in to see your documents.')
        return
      }
      try {
        const cases = await getMyCases(access)
        const nextGroups = await Promise.all(
          cases.results.map(async item => ({
            caseId: item.id,
            title: item.title,
            items: (await listDocuments(item.id, access).catch(() => ({ results: [] }))).results,
          }))
        )
        setGroups(nextGroups.filter(group => group.items.length > 0))
      } catch (cause) {
        const raw = cause instanceof Error ? cause.message : String(cause)
        const isHtml = raw.includes('<!DOCTYPE') || raw.includes('<html')
        const isJwt = /invalid token|token_not_valid|token has expired/i.test(raw)
        if (isJwt) {
          setError('Session expired. Please sign in again.')
        } else if (isHtml) {
          setError('The documents service is temporarily unavailable. Please try again shortly.')
        } else {
          setError(raw.slice(0, 200))
        }
      }
    }
    void run()
  }, [])

  return (
    <div>
      <h2 className="font-display text-display-md">My Documents</h2>
      <p className="mt-2 text-sm text-primary-300">Documents are grouped by case. Access is limited to case-linked {audienceLabel} accounts, and protected files still require the document password.</p>
      {error && <Card className="mt-4 border border-crimson-500/30 text-crimson-200">{error}</Card>}
      {pendingDocument && pendingAction && (
        <Card className="mt-4 border border-gold-500/30 bg-gold-500/5 text-white">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm uppercase tracking-wide text-gold-200">Document access</div>
              <div className="mt-1 font-semibold">{pendingAction === 'open' ? 'Preview' : 'Download'} {pendingDocument.filename}</div>
              <div className="mt-1 text-sm text-primary-200">{passwordRequired ? 'This document is password protected.' : 'Enter the password to continue.'}</div>
            </div>
            <div className="flex w-full max-w-md gap-2">
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="min-w-0 flex-1 rounded bg-primary-900/40 px-3 py-2 text-white placeholder:text-primary-400"
                placeholder="Document password"
              />
              <button
                className="rounded bg-gold-500 px-4 py-2 font-semibold text-black"
                onClick={async () => {
                  if (!pendingDocument || !pendingAction) return
                  try {
                    await runDocumentAction(pendingDocument, pendingAction, password)
                    resetPasswordPrompt()
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Unable to access document')
                  }
                }}
              >
                Continue
              </button>
              <button
                className="rounded border border-white/10 bg-white/5 px-4 py-2 text-white"
                onClick={resetPasswordPrompt}
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}
      <div className="mt-4 grid grid-cols-1 gap-4">
        {groups.length === 0 && !error && <Card>No documents yet.</Card>}
        {groups.map(group => (
          <Card key={group.caseId}>
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{group.title}</div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-primary-200">
                Case-linked access
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {group.items.map(doc => (
                <div key={doc.id} className="rounded border border-white/5 bg-white/5 px-4 py-3">
                  <div className="font-medium">{doc.filename}</div>
                  <div className="text-xs text-primary-300">{doc.document_type} · {doc.status}{doc.is_password_protected ? ' · 🔒' : ''}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center rounded border border-white/10 bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10"
                      onClick={() => handleAction(doc, 'open')}
                    >
                      Open
                    </button>
                    <button
                      className="inline-flex items-center rounded bg-primary-600 px-3 py-1 text-sm text-white hover:bg-primary-500"
                      onClick={() => handleAction(doc, 'download')}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="flex h-[85vh] w-full max-w-6xl flex-col rounded-xl border border-white/10 bg-primary-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <div className="text-sm uppercase tracking-wide text-primary-300">Preview</div>
                <div className="font-semibold text-white">{previewName}</div>
                <div className="text-xs text-primary-300">Preview is available only for case-linked accounts with valid document access.</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white"
                  onClick={() => {
                    const token = localStorage.getItem('access')
                    if (previewDocument && token) {
                      void downloadDocument(previewDocument.id, token, previewPassword || undefined, previewDocument.filename).catch(err => {
                        setError(err instanceof Error ? err.message : 'Unable to download document')
                      })
                    }
                  }}
                >
                  Download copy
                </button>
                <button className="rounded bg-gold-500 px-3 py-1.5 text-sm font-semibold text-black" onClick={closePreview}>
                  Close
                </button>
              </div>
            </div>
            <div className="h-full w-full rounded-b-xl bg-white">
              <object data={previewUrl} type={previewMimeType || 'application/pdf'} className="h-full w-full">
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-700">
                  <div>
                    <div className="font-semibold">Preview is unavailable in this browser.</div>
                    <div className="mt-2">Use the Download copy button to save the file locally.</div>
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
