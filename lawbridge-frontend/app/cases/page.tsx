"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '../../components/ui/Card'
import { getMyCases, type CaseItem } from '../../lib/casesApi'
import { getCaseProgress } from '../../lib/monitoringApi'

export default function CasesPage(){
  const router = useRouter()
  const [items, setItems] = useState<CaseItem[]>([])
  const [monitoringMap, setMonitoringMap] = useState<Record<string, string>>({})
  const [monitoringUpdatedAt, setMonitoringUpdatedAt] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const sessionExpired = /session expired|token has expired|token_not_valid/i.test(error)

  useEffect(() => {
    if (sessionExpired) {
      router.replace('/auth/login?reason=session-expired')
    }
  }, [router, sessionExpired])

  useEffect(() => {
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        setError('Sign in to see your matters.')
        return
      }

      const [casesResult, progressResult] = await Promise.allSettled([
        getMyCases(access),
        getCaseProgress(access),
      ])

      if (casesResult.status === 'fulfilled') {
        setItems(casesResult.value.results)
      } else {
        const raw = casesResult.reason instanceof Error ? casesResult.reason.message : String(casesResult.reason)
        const isHtml = raw.includes('<!DOCTYPE') || raw.includes('<html')
        const isJwt = /invalid token|token_not_valid|token has expired/i.test(raw)
        if (isJwt) {
          setError('Session expired. Please sign in again.')
        } else if (isHtml) {
          setError('The matters service is temporarily unavailable. Please try again shortly.')
        } else {
          setError(raw.slice(0, 200))
        }
      }

      if (progressResult.status === 'fulfilled') {
        const statusMap: Record<string, string> = {}
        const updatedMap: Record<string, string> = {}
        for (const progressItem of progressResult.value.results ?? []) {
          if (progressItem.case_id) {
            statusMap[progressItem.case_id] = progressItem.status
            updatedMap[progressItem.case_id] = progressItem.updated_at
          }
        }
        setMonitoringMap(statusMap)
        setMonitoringUpdatedAt(updatedMap)
      }
    }
    void run()
  }, [])

  return (
    <div>
      <h2 className="font-display text-display-md">My Matters</h2>
      <p className="mt-2 text-sm text-primary-300">Live matters pulled from the case service.</p>
      {error && <Card className="mt-4 border border-crimson-500/30 text-crimson-200">{error}</Card>}
      {sessionExpired && (
        <Card className="mt-4 border border-gold-500/30 bg-gold-500/10 text-gold-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>Sign in again to reload your matters.</div>
            <Link href="/auth/login" className="inline-flex w-fit rounded bg-gold-500 px-4 py-2 font-medium text-black">
              Go to sign in
            </Link>
          </div>
        </Card>
      )}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.length === 0 && !error && <Card>No matters yet.</Card>}
        {items.map(item => (
          <Link key={item.id} href={`/cases/${item.id}`} className="block">
            <Card className="h-full cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{item.title}</div>
                  <div className="mt-1 text-xs text-primary-300">{item.case_type} · {item.status}</div>
                </div>
                <span className="rounded-full border border-primary-600/40 px-2 py-1 text-[11px] text-primary-200">
                  {item.status || 'Unknown'}
                </span>
              </div>
              <div className="mt-3 text-sm text-primary-200 line-clamp-3">{item.description}</div>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-xs text-primary-300 sm:grid-cols-2">
                <div>
                  <dt className="uppercase tracking-wide text-primary-400">Client</dt>
                  <dd className="mt-1 text-primary-100">{item.client_id || 'Unknown'}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide text-primary-400">Assigned Lawyer</dt>
                  <dd className="mt-1 text-primary-100">{item.assigned_lawyer_id || 'Unassigned'}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide text-primary-400">Circuit</dt>
                  <dd className="mt-1 text-primary-100">{item.circuit || 'Not set'}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wide text-primary-400">Updated</dt>
                  <dd className="mt-1 text-primary-100">{new Date(item.updated_at).toLocaleDateString()}</dd>
                </div>
              </dl>
              {monitoringMap[item.id] ? (
                <div className="mt-3 text-sm text-primary-200">Monitoring snapshot: {monitoringMap[item.id]} · updated {new Date(monitoringUpdatedAt[item.id]).toLocaleDateString()}</div>
              ) : (
                <div className="mt-3 text-sm text-primary-300">No live monitoring snapshot available yet.</div>
              )}
              <div className="mt-4 text-sm font-medium text-gold-300">View matter details</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
