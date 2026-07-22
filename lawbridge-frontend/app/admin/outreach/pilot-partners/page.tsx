'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFirms, getInterviewsByFirm, getContactsByFirm, getFeatureRequestsByFirm, syncFirmsFromApi, syncInterviewsFromApi, syncContactsFromApi, syncFeatureRequestsFromApi, OutreachFirm } from '../../../../lib/outreachStore'

type PilotEntry = {
  firm: OutreachFirm
  featuresCount: number
  completedInterviews: number
  avgInterest: number
  primaryContact?: string
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}

export default function PilotPartnersPage() {
  const [pilots, setPilots] = useState<PilotEntry[]>([])

  function buildPilots() {
    const firms = getFirms().filter(f => f.status === 'pilot_partner' || f.status === 'active_partner')
    const data = firms.map(firm => {
      const ivs = getInterviewsByFirm(firm.id)
      const contacts = getContactsByFirm(firm.id)
      const frs = getFeatureRequestsByFirm(firm.id)
      const completed = ivs.filter(i => i.status === 'completed')
      const interests = completed.map(i => i.overallInterestLevel ?? 0).filter(n => n > 0)
      const avg = interests.length ? Math.round(interests.reduce((a, b) => a + b, 0) / interests.length) : 0
      const pc = contacts.find(c => c.isPrimary) ?? contacts[0]
      return { firm, featuresCount: frs.length, completedInterviews: completed.length, avgInterest: avg, primaryContact: pc?.name }
    })
    setPilots(data)
  }

  useEffect(() => {
    buildPilots()
    Promise.all([syncFirmsFromApi(), syncInterviewsFromApi(), syncContactsFromApi(), syncFeatureRequestsFromApi()]).then(([f, i, c, fr]) => {
      if (f || i || c || fr) buildPilots()
    })
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-neutral-500 mb-1"><Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link> › Pilot Partners</div>
        <h1 className="font-display text-2xl font-bold text-neutral-50">Pilot Partners</h1>
        <p className="text-sm text-neutral-500 mt-1">{pilots.length} firms currently testing LawBridge</p>
      </div>

      {pilots.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 py-20 text-center">
          <p className="text-neutral-500 text-sm">No pilot partners yet.</p>
          <p className="text-neutral-600 text-xs mt-2">Set a firm&apos;s status to &quot;Pilot Partner&quot; in the <Link href="/admin/outreach/firms" className="text-portal hover:opacity-80">Firms CRM</Link>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {pilots.map(({ firm, featuresCount, completedInterviews, avgInterest, primaryContact }, i) => (
            <Link key={firm.id} href={`/admin/outreach/firms/${firm.id}`} className="block rounded-2xl border border-white/8 bg-primary-800/30 p-5 hover:border-teal-500/20 hover:bg-primary-800/50 transition-all group stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-neutral-100 group-hover:text-teal-400 transition-colors">{firm.firmName}</p>
                  <p className="text-xs text-neutral-500">{firm.city} · {firm.firmSize ? `${firm.firmSize} lawyers` : 'Unknown size'}</p>
                  {primaryContact && <p className="text-xs text-neutral-400 mt-0.5">{primaryContact}</p>}
                </div>
                <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${firm.status === 'active_partner' ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300' : 'border-teal-500/40 bg-teal-500/10 text-teal-400'}`}>
                  {firm.status === 'active_partner' ? 'Active Partner' : 'Pilot'}
                </span>
              </div>

              {firm.practiceAreas.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {firm.practiceAreas.slice(0, 3).map(pa => (
                    <span key={pa} className="rounded-lg bg-primary-900/60 border border-white/8 px-2 py-0.5 text-[10px] text-neutral-400">{pa}</span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4 text-center">
                <div>
                  <p className="font-bold text-neutral-100">{completedInterviews}</p>
                  <p className="text-[10px] text-neutral-600">Interviews</p>
                </div>
                <div>
                  <p className={`font-bold ${avgInterest >= 70 ? 'text-emerald-400' : avgInterest > 0 ? 'text-amber-400' : 'text-neutral-500'}`}>{avgInterest > 0 ? `${avgInterest}%` : '—'}</p>
                  <p className="text-[10px] text-neutral-600">Interest</p>
                </div>
                <div>
                  <p className="font-bold text-neutral-100">{featuresCount}</p>
                  <p className="text-[10px] text-neutral-600">Requests</p>
                </div>
              </div>

              {firm.lastContact && (
                <p className="text-[10px] text-neutral-600 mt-3 text-right">Last contact: {fmtDate(firm.lastContact)}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
