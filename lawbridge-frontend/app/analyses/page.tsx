"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../components/ui/Card'
import { getCaseProgress, type CaseProgressItem } from '../../lib/monitoringApi'

export default function AnalysesPage(){
  const [items,setItems]=useState<CaseProgressItem[]>([])
  const [error,setError]=useState('')

  useEffect(()=>{
    const run = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        setError('Sign in to view updates.')
        return
      }
      try {
        const response = await getCaseProgress(access)
        setItems(response.results ?? [])
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to load updates')
      }
    }
    void run()
  }, [])
  return (
    <div>
      <h2 className="font-display text-display-md">Updates</h2>
      <p className="mt-2 text-sm text-primary-300">Live progress data from the monitoring service.</p>
      {error && <Card className="mt-4 border border-crimson-500/30 text-crimson-200">{error}</Card>}
      <div className="mt-4 space-y-3">
        {items.length===0 && !error && <div className="text-sm text-primary-300">No updates yet.</div>}
        {items.map(a=> (<div key={a.id} className="p-3 bg-primary-800 rounded"><Link href={`/analysis/${a.id}`} className="text-white">{a.case_type} — {a.status}</Link></div>))}
      </div>
    </div>
  )
}
