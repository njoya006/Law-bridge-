"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '../../../components/ui/Card'
import { getCaseDetail, type CaseItem } from '../../../lib/casesApi'

export default function CaseDetailPage() {
  const params = useParams()
  const caseId = params?.caseId as string | undefined
  const router = useRouter()
  const [item, setItem] = useState<CaseItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        setError('Sign in to view matter details.')
        setLoading(false)
        return
      }

      if (!caseId) {
        setError('Unable to resolve case identifier.')
        setLoading(false)
        return
      }

      try {
        const response = await getCaseDetail(caseId, access)
        setItem(response)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load matter details')
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [caseId])

  if (loading) {
    return <Card>Loading matter details…</Card>
  }

  if (error) {
    return (
      <Card className="border border-crimson-500/30 text-crimson-200">
        {error}
        <div className="mt-4">
          <button onClick={() => router.back()} className="inline-flex rounded bg-primary-700 px-4 py-2 text-sm text-white">
            Back to matters
          </button>
        </div>
      </Card>
    )
  }

  if (!item) {
    return <Card>Unable to find this matter.</Card>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary-400">Matter details</p>
          <h2 className="font-display text-display-md">{item.title}</h2>
          <p className="mt-2 text-sm text-primary-300">Case #{item.id} · {item.case_type}</p>
        </div>
        <Link href="/cases" className="inline-flex items-center rounded bg-primary-700 px-4 py-2 text-sm text-white hover:bg-primary-600">
          Back to matters
        </Link>
      </div>

      <Card className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-400">Status</p>
            <p className="mt-2 text-base font-semibold text-primary-100">{item.status || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-400">Assigned lawyer</p>
            <p className="mt-2 text-base text-primary-100">{item.assigned_lawyer_id || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-400">Circuit</p>
            <p className="mt-2 text-base text-primary-100">{item.circuit || 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-400">Language</p>
            <p className="mt-2 text-base text-primary-100">{item.language || 'Not set'}</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary-400">Description</p>
          <p className="mt-2 text-sm leading-7 text-primary-200">{item.description || 'No description available.'}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-400">Tradition</p>
            <p className="mt-2 text-base text-primary-100">{item.legal_tradition || 'Not set'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-400">Created</p>
            <p className="mt-2 text-base text-primary-100">{new Date(item.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary-400">Updated</p>
            <p className="mt-2 text-base text-primary-100">{new Date(item.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-primary-100">Timeline</p>
          <span className="rounded-full border border-primary-600/40 px-2 py-1 text-xs text-primary-200">
            {item.timeline?.length ?? 0} updates
          </span>
        </div>
        {item.timeline && item.timeline.length > 0 ? (
          <div className="space-y-3">
            {item.timeline.slice().reverse().map((event, index) => (
              <div key={`${event.timestamp}-${index}`} className="rounded-lg border border-primary-700/50 bg-primary-950/40 p-4">
                <div className="flex items-center justify-between gap-4 text-xs text-primary-400">
                  <span>{new Date(event.timestamp).toLocaleDateString()}</span>
                  <span className="font-medium text-primary-100">{event.status}</span>
                </div>
                <p className="mt-2 text-sm text-primary-200">{event.notes || 'No additional notes.'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-primary-300">No timeline entries are available yet.</p>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-primary-100">Case notes</p>
          <span className="rounded-full border border-primary-600/40 px-2 py-1 text-xs text-primary-200">
            {item.notes?.length ?? 0} notes
          </span>
        </div>
        {item.notes && item.notes.length > 0 ? (
          <div className="space-y-3">
            {item.notes.map(note => (
              <div key={note.id} className="rounded-lg border border-primary-700/50 bg-primary-950/40 p-4">
                <div className="flex items-center justify-between gap-4 text-xs text-primary-400">
                  <span>{note.is_private ? 'Private note' : 'Shared note'}</span>
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm text-primary-200">{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-primary-300">No case notes have been added yet.</p>
        )}
      </Card>
    </div>
  )
}
