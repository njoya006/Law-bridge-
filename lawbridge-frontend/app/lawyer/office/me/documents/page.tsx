'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '../../../../../components/ui/Card'
import { getCaseProgress } from '../../../../../lib/monitoringApi'
import { listDocuments, type DocumentItem } from '../../../../../lib/documentsApi'

function fileIcon(mime: string) {
  if (mime?.includes('pdf')) return '📄'
  if (mime?.includes('image')) return '🖼'
  if (mime?.includes('word') || mime?.includes('document')) return '📝'
  if (mime?.includes('sheet') || mime?.includes('excel')) return '📊'
  return '📎'
}

function formatBytes(bytes: number) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MyOfficeDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) {
        setError('Sign in as a lawyer to view documents.')
        setLoading(false)
        return
      }
      try {
        const progress = await getCaseProgress(access)
        const caseIds = (progress.results ?? [])
          .filter(item => item.assigned_lawyer_id === lawyerId)
          .map(item => item.case_id)
        const lists = await Promise.all(caseIds.map(caseId => listDocuments(caseId, access)))
        if (mounted) setDocuments(lists.flatMap(item => item.results))
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
      <header>
        <h2 className="font-display text-display-md text-neutral-50">Documents</h2>
        <p className="mt-1 text-neutral-400">Files linked to your assigned matters</p>
      </header>

      {loading && (
        <div className="flex items-center gap-2 text-neutral-400 py-12 justify-center">
          <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading documents…
        </div>
      )}

      {!loading && error && (
        <Card className="border border-crimson-500/30 p-4">
          <p className="text-crimson-300 text-sm">{error}</p>
        </Card>
      )}

      {!loading && !error && documents.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-neutral-400">No documents found across your assigned matters.</p>
        </Card>
      )}

      {!loading && !error && documents.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-700/40 flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-300">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y divide-neutral-700/20">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <span className="text-2xl flex-shrink-0">{fileIcon(doc.mime_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-100 truncate">{doc.filename}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {doc.document_type} · {formatBytes(doc.file_size)} · v{doc.version}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {doc.is_encrypted && (
                    <span className="text-xs text-gold-400 border border-gold-500/30 rounded px-1.5 py-0.5">encrypted</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    doc.status === 'approved'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : 'text-neutral-400 bg-neutral-700/30 border-neutral-600/30'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
