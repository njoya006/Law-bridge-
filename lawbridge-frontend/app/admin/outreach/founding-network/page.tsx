'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFirms, getInterviewsByFirm, syncFirmsFromApi, syncInterviewsFromApi, OutreachFirm, STATUS_LABELS, STATUS_COLORS } from '../../../../lib/outreachStore'

type NetworkEntry = {
  firm: OutreachFirm
  completedInterviews: number
  avgInterest: number
  engagementScore: number
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}

export default function FoundingNetworkPage() {
  const [entries, setEntries] = useState<NetworkEntry[]>([])

  function buildEntries() {
    const NETWORK_STATUSES = ['joined_founding_network', 'founding_council_member', 'interested', 'pilot_partner', 'active_partner']
    const STATUS_WEIGHT: Record<string, number> = { interested: 30, joined_founding_network: 50, founding_council_member: 80, pilot_partner: 70, active_partner: 100 }
    const firms = getFirms().filter(f => NETWORK_STATUSES.includes(f.status))
    const data = firms.map(firm => {
      const ivs = getInterviewsByFirm(firm.id)
      const completed = ivs.filter(i => i.status === 'completed')
      const interests = completed.map(i => i.overallInterestLevel ?? 0).filter(n => n > 0)
      const avgInterest = interests.length ? Math.round(interests.reduce((a, b) => a + b, 0) / interests.length) : 0
      const engagement = Math.min(100, (STATUS_WEIGHT[firm.status] ?? 20) + completed.length * 5)
      return { firm, completedInterviews: completed.length, avgInterest, engagementScore: engagement }
    }).sort((a, b) => b.engagementScore - a.engagementScore)
    setEntries(data)
  }

  useEffect(() => {
    buildEntries()
    Promise.all([syncFirmsFromApi(), syncInterviewsFromApi()]).then(([f, i]) => {
      if (f || i) buildEntries()
    })
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs text-neutral-500 mb-1"><Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link> › Founding Network</div>
        <h1 className="font-display text-2xl font-bold text-neutral-50">Founding Network</h1>
        <p className="text-sm text-neutral-500 mt-1">{entries.length} firms engaged in the LawBridge founding network</p>
      </div>

      <div className="rounded-2xl border border-white/8 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/8 bg-primary-900/40">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Firm</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">City</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden sm:table-cell">Interviews</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden md:table-cell">Interest</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Engagement</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden lg:table-cell">Last Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {entries.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-16 text-center text-neutral-500 text-sm">No network members yet. Mark firms as &quot;Interested&quot; or above to see them here.</td></tr>
            ) : entries.map(({ firm, completedInterviews, avgInterest, engagementScore }, i) => (
              <tr key={firm.id} className="hover:bg-white/3 transition-colors stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                <td className="px-4 py-3">
                  <Link href={`/admin/outreach/firms/${firm.id}`} className="text-sm font-semibold text-neutral-100 hover:text-portal transition-colors">{firm.firmName}</Link>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {firm.practiceAreas.slice(0, 2).map(pa => (
                      <span key={pa} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-600">{pa}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-400">{firm.city}</td>
                <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[firm.status]}`}>{STATUS_LABELS[firm.status]}</span></td>
                <td className="px-4 py-3 text-sm text-neutral-300 hidden sm:table-cell">{completedInterviews}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {avgInterest > 0 ? <span className={`text-sm font-semibold ${avgInterest >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{avgInterest}%</span> : <span className="text-neutral-600 text-sm">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 w-16 overflow-hidden">
                      <div className="h-full rounded-full bg-gold-500" style={{ width: `${engagementScore}%` }} />
                    </div>
                    <span className="text-xs text-neutral-400">{engagementScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500 hidden lg:table-cell">{fmtDate(firm.lastContact)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
