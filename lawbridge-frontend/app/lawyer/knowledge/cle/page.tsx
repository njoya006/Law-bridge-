'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { getCLESummary, completeBook, listBooks, type CLESummary, type BookItem } from '../../../../lib/libraryApi'
import { toastSuccess, toastError } from '../../../../lib/toast'
import { SkeletonStat, SkeletonCard } from '../../../../components/ui/Skeleton'
import { BookOpenIcon, CheckIcon, PrinterIcon, TrophyIcon, PencilIcon } from '../../../../components/icons/Icons'

const CAT_ICON: Record<string, React.ComponentType<{ width?: number; height?: number }>> = {
  reading: BookOpenIcon, authorship: PencilIcon, article: PencilIcon, contribution: TrophyIcon,
}

export default function CLEPage() {
  const [summary, setSummary] = useState<CLESummary | null>(null)
  const [books, setBooks] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState('')
  const [name, setName] = useState('')

  const load = useCallback(async () => {
    const token = localStorage.getItem('access')
    setName(localStorage.getItem('fullName') || '')
    if (!token) { setLoading(false); return }
    const [s, b] = await Promise.allSettled([getCLESummary(token), listBooks(token, {})])
    if (s.status === 'fulfilled') setSummary(s.value)
    if (b.status === 'fulfilled') setBooks(Array.isArray(b.value) ? b.value : [])
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])

  async function markComplete(b: BookItem) {
    const token = localStorage.getItem('access')
    if (!token) return
    setCompleting(b.id)
    try {
      const res = await completeBook(b.id, token)
      if (res.newly) toastSuccess(`+${res.credits} CLE credits earned`)
      await load()
    } catch { toastError('Could not record completion') }
    finally { setCompleting('') }
  }

  const done = new Set(summary?.completed_book_ids ?? [])
  const target = summary?.annual_target ?? 20
  const yearCredits = summary?.this_year_credits ?? 0
  const pct = Math.min(100, Math.round((yearCredits / target) * 100))
  const circ = 2 * Math.PI * 34
  const uncompleted = books.filter(b => !done.has(b.id))

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-display-md">Continuing Legal Education</h2>
          <p className="mt-1 text-sm text-neutral-400">Earn CLE credit by reading CamLex books and publishing to the library. Track your annual progress and download a certificate.</p>
        </div>
        {(summary?.total_credits ?? 0) > 0 && (
          <button onClick={() => window.print()} className="flex-shrink-0 flex items-center gap-2 rounded-xl border border-portal bg-portal-soft px-4 py-2.5 text-sm font-semibold text-portal hover:opacity-90">
            <PrinterIcon width={16} height={16} />Certificate
          </button>
        )}
      </header>

      {loading ? (
        <><div className="grid grid-cols-2 gap-4">{[1,2].map(i => <SkeletonStat key={i} />)}</div><SkeletonCard lines={3} /></>
      ) : (
        <>
          {/* Progress ring + breakdown */}
          <div className="rounded-2xl border border-white/8 bg-primary-800/30 p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex-shrink-0">
              <svg width="88" height="88" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="7" className="text-white/6" />
                <circle cx="40" cy="40" r="34" fill="none" strokeWidth="7" strokeLinecap="round"
                  strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
                  transform="rotate(-90 40 40)" className="text-portal transition-all duration-700" stroke="currentColor" />
                <text x="40" y="37" textAnchor="middle" className="fill-neutral-100 font-display" fontSize="20" fontWeight="700">{yearCredits}</text>
                <text x="40" y="52" textAnchor="middle" className="fill-neutral-500" fontSize="9">/ {target}</text>
              </svg>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-semibold text-neutral-100">{yearCredits} of {target} annual credits</p>
              <p className="text-xs text-neutral-500 mt-0.5">{summary?.total_credits ?? 0} credits earned all-time</p>
              {summary && summary.by_category.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {summary.by_category.map(c => {
                    const Icon = CAT_ICON[c.category] ?? BookOpenIcon
                    return (
                      <span key={c.category} className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-neutral-300">
                        <Icon width={12} height={12} />{c.label}: <span className="font-semibold text-neutral-100">{c.credits}</span>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* How to earn — always visible, so it's never a dead end */}
          {(summary?.total_credits ?? 0) === 0 && (
            <div className="rounded-2xl border border-dashed border-white/12 bg-primary-800/20 p-6">
              <p className="text-sm font-semibold text-neutral-200 mb-3">Start earning CLE credits</p>
              <ol className="space-y-2">
                {['Read a CamLex book below and click “Mark complete” to earn 2 credits', 'Publish your own treatise or article to the library to earn 5 credits', 'Your progress builds toward the annual target and your certificate'].map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-neutral-400">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-portal-soft text-portal text-[11px] font-bold">{i + 1}</span>{s}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Earn reading credit */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-300 mb-3">Earn reading credit</h3>
            {uncompleted.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-primary-800/20 p-6 text-center">
                <CheckIcon width={24} height={24} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-sm text-neutral-300">You've completed every available CamLex book.</p>
                <p className="text-xs text-neutral-500 mt-1">New titles appear here as they're published — publish your own to earn authorship credit.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {uncompleted.slice(0, 12).map(b => (
                  <div key={b.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-primary-800/20 p-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-portal-soft text-portal"><BookOpenIcon width={16} height={16} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-100 truncate">{b.title}</p>
                      <p className="text-xs text-neutral-500">{b.author_name}</p>
                    </div>
                    <button onClick={() => markComplete(b)} disabled={completing === b.id}
                      className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-portal bg-portal-soft px-3 py-1.5 text-xs font-semibold text-portal hover:opacity-90 disabled:opacity-50">
                      {completing === b.id ? '…' : <><CheckIcon width={12} height={12} />Mark complete (+2)</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* History / certificate content */}
          {summary && summary.history.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-neutral-300 mb-3">Credit history</h3>
              <div className="rounded-2xl border border-white/8 bg-primary-800/20 divide-y divide-white/5">
                {summary.history.map(h => (
                  <div key={h.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex-1 text-sm text-neutral-200 truncate">{h.title}</span>
                    <span className="text-[11px] text-neutral-600">{h.label}</span>
                    <span className="text-xs font-semibold text-portal w-12 text-right">+{h.credits}</span>
                    <span className="text-[10px] text-neutral-700 w-20 text-right">{new Date(h.earned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-neutral-600 text-center">
                {name ? `Certificate of ${summary.total_credits} CLE credits for ${name}` : `Certificate of ${summary.total_credits} CLE credits`} · LawBridge · print for your records.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  )
}
