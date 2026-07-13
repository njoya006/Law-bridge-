'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFirms, getInterviewsByFirm, getContactsByFirm, syncFirmsFromApi, syncInterviewsFromApi, syncContactsFromApi, OutreachFirm, Interview, Contact } from '../../../../lib/outreachStore'

type CouncilMember = {
  firm: OutreachFirm
  contact?: Contact
  interviews: Interview[]
  completedInterviews: number
  avgInterest: number
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return iso }
}

function InitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const sz = size === 'lg' ? 'h-14 w-14 text-lg' : size === 'md' ? 'h-11 w-11 text-sm' : 'h-8 w-8 text-xs'
  return (
    <span className={`inline-flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-400/20 to-gold-500/20 font-bold text-gold-400 ring-2 ring-gold-500/20 ${sz}`}>
      {initials}
    </span>
  )
}

export default function FoundingCouncilPage() {
  const [members, setMembers] = useState<CouncilMember[]>([])

  function buildMembers() {
    const firms = getFirms().filter(f => f.status === 'founding_council_member')
    const data = firms.map(firm => {
      const interviews = getInterviewsByFirm(firm.id)
      const contacts = getContactsByFirm(firm.id)
      const completed = interviews.filter(i => i.status === 'completed')
      const interests = completed.map(i => i.overallInterestLevel ?? 0).filter(n => n > 0)
      const avg = interests.length ? Math.round(interests.reduce((a, b) => a + b, 0) / interests.length) : 0
      return { firm, contact: contacts.find(c => c.isPrimary) ?? contacts[0], interviews, completedInterviews: completed.length, avgInterest: avg }
    })
    setMembers(data)
  }

  useEffect(() => {
    buildMembers()
    Promise.all([syncFirmsFromApi(), syncInterviewsFromApi(), syncContactsFromApi()]).then(([f, i, c]) => {
      if (f || i || c) buildMembers()
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-neutral-500 mb-1"><Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link> › Founding Council</div>
        <h1 className="font-display text-2xl font-bold text-neutral-50">Founding Council</h1>
        <p className="text-sm text-neutral-500 mt-1">{members.length} law firms have joined the LawBridge Founding Council</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gold-500/20 bg-gold-500/5 p-4 text-center">
          <p className="font-display font-bold text-3xl text-gold-400">{members.length}</p>
          <p className="text-xs text-neutral-500 mt-1">Council Members</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-4 text-center">
          <p className="font-display font-bold text-3xl text-neutral-100">{members.reduce((a, m) => a + m.completedInterviews, 0)}</p>
          <p className="text-xs text-neutral-500 mt-1">Interviews Done</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-4 text-center">
          <p className="font-display font-bold text-3xl text-emerald-400">
            {members.length ? Math.round(members.reduce((a, m) => a + m.avgInterest, 0) / members.length) : 0}%
          </p>
          <p className="text-xs text-neutral-500 mt-1">Avg Interest Score</p>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 py-20 text-center">
          <p className="text-neutral-500 text-sm">No founding council members yet.</p>
          <p className="text-neutral-600 text-xs mt-2">
            Change a firm&apos;s status to &quot;Founding Council Member&quot; in the{' '}
            <Link href="/admin/outreach/firms" className="text-gold-400 hover:text-gold-300">Firms CRM</Link>.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {members.map(({ firm, contact, interviews, completedInterviews, avgInterest }) => (
            <Link key={firm.id} href={`/admin/outreach/firms/${firm.id}`} className="block rounded-2xl border border-white/8 bg-primary-800/30 p-5 hover:border-gold-500/20 hover:bg-primary-800/50 transition-all group">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <InitialsAvatar name={firm.firmName} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-100 group-hover:text-gold-400 transition-colors truncate">{firm.firmName}</p>
                  <p className="text-xs text-neutral-500">{firm.city}, {firm.country}</p>
                  {contact && <p className="text-xs text-neutral-400 mt-0.5">{contact.name} · {contact.position}</p>}
                </div>
                <span className="flex-shrink-0 rounded-full bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 text-[10px] font-semibold text-gold-400">Council</span>
              </div>

              {/* Practice areas */}
              {firm.practiceAreas.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {firm.practiceAreas.slice(0, 3).map(pa => (
                    <span key={pa} className="rounded-lg bg-primary-900/60 border border-white/8 px-2 py-0.5 text-[10px] text-neutral-400">{pa}</span>
                  ))}
                  {firm.practiceAreas.length > 3 && <span className="text-[10px] text-neutral-600">+{firm.practiceAreas.length - 3}</span>}
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
                <div className="text-center">
                  <p className="font-bold text-neutral-100">{completedInterviews}</p>
                  <p className="text-[10px] text-neutral-600">Interviews</p>
                </div>
                <div className="text-center">
                  <p className={`font-bold ${avgInterest >= 70 ? 'text-emerald-400' : avgInterest >= 40 ? 'text-amber-400' : 'text-neutral-400'}`}>{avgInterest || '—'}{avgInterest ? '%' : ''}</p>
                  <p className="text-[10px] text-neutral-600">Interest</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-neutral-400">{fmtDate(firm.lastContact)}</p>
                  <p className="text-[10px] text-neutral-600">Last Contact</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
