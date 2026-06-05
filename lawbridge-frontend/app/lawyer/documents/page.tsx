"use client"

import React, { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { getCaseProgress } from '../../../lib/monitoringApi'
import { listDocuments, type DocumentItem } from '../../../lib/documentsApi'

export default function LawyerDocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([])

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      const lawyerId = localStorage.getItem('authUserId')
      if (!access || !lawyerId) return
      try {
        const progress = await getCaseProgress(access)
        const cases = (progress.results ?? []).filter(item => item.assigned_lawyer_id === lawyerId).map(item => item.case_id)
        const lists = await Promise.all(cases.map(caseId => listDocuments(caseId, access)))
        setDocs(lists.flatMap(item => item.results))
      } catch {
        setDocs([])
      }
    }
    void run()
  }, [])

  return (
    <div>
      <h2 className="font-display text-display-md">Documents</h2>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {docs.length === 0 && <Card>No documents yet.</Card>}
        {docs.map(doc => <Card key={doc.id}>{doc.filename} — {doc.status}</Card>)}
      </div>
    </div>
  )
}