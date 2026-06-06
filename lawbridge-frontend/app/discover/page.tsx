'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '../../components/ui/Card'
import { browseLawyers, type LawyerDiscovery } from '../../lib/discoveryApi'
import { browseFirms, type FirmDiscovery, getMyFirmMemberships } from '../../lib/firmsApi'
import { search } from '../../lib/searchApi'

export default function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [lawyers, setLawyers] = useState<LawyerDiscovery[]>([])
  const [firms, setFirms] = useState<FirmDiscovery[]>([])
  const [error, setError] = useState('')
  const [centralDown, setCentralDown] = useState(false)

  const matchText = (value: string | undefined, q: string) => (value ?? '').toLowerCase().includes(q)

  const filterLawyers = async (q: string, token: string | null) => {
    const data = await browseLawyers(token)
    const query = q.toLowerCase()
    return (data.results ?? []).filter(lawyer =>
      [lawyer.name, lawyer.specialization, lawyer.bijural_flag, lawyer.bio]
        .some(field => matchText(field, query))
    )
  }

  const filterFirms = async (q: string, token: string | null) => {
    const data = await browseFirms(token)
    const query = q.toLowerCase()
    return (data.results ?? []).filter(firm =>
      [firm.name]
        .some(field => matchText(field, query))
    )
  }

  const load = async (nextQuery = '') => {
    // Fetch lawyers and firms separately to surface which endpoint failed
    setError('')
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null
    // Determine user's own firms (to hide self from firm listings)
    const ownFirmIds = new Set<string>()
    if (token) {
      try {
        const myMemberships = await getMyFirmMemberships(token)
        for (const m of myMemberships ?? []) ownFirmIds.add(String(m.firm))
      } catch {
        // ignore — fall back to public listings
      }
    }

    // If a query is provided, use the central search service and split results
    if (nextQuery) {
      try {
        const resp = await search(nextQuery, token)
        const nextLawyers: LawyerDiscovery[] = []
        const nextFirms: FirmDiscovery[] = []
        for (const item of resp.results ?? []) {
          if (item.type === 'lawyer' && item.payload) nextLawyers.push(item.payload as LawyerDiscovery)
          if (item.type === 'firm' && item.payload) nextFirms.push(item.payload as FirmDiscovery)
        }
        setLawyers(nextLawyers)
        setFirms(nextFirms.filter(f => !ownFirmIds.has(String(f.id))))
        if (nextLawyers.length === 0 && nextFirms.length === 0) {
          setCentralDown(true)
          setError('Central search returned no matches. Showing public browse fallback.')
          setLawyers(await filterLawyers(nextQuery, token))
          setFirms((await filterFirms(nextQuery, token)).filter(f => !ownFirmIds.has(String(f.id))))
        }
      } catch (cause) {
        // Central search is unavailable — fall back to individual service search endpoints.
        setCentralDown(true)
        try {
          setLawyers(await filterLawyers(nextQuery, token))
          setFirms(await filterFirms(nextQuery, token))
        } catch {
          // ignore
        }

        const causeMsg = cause instanceof Error ? cause.message : String(cause)
        const isHtml = causeMsg.includes('<!DOCTYPE') || causeMsg.includes('<html')
        const friendlyCause = isHtml ? 'service error' : causeMsg.slice(0, 120)
        if (lawyers.length === 0 && firms.length === 0) {
          setError(`Search unavailable (${friendlyCause}). Try the fallback buttons below.`)
        } else {
          setError(`Central search unavailable; showing public browse fallback.`)
        }
      }
      return
    }
    setCentralDown(false)

    try {
      const lawyerResult = await browseLawyers(token)
      setLawyers(lawyerResult.results)
    } catch (cause) {
      setLawyers([])
      const raw = cause instanceof Error ? cause.message : String(cause)
      const isHtml = raw.includes('<!DOCTYPE') || raw.includes('<html')
      const statusMatch = raw.match(/^(\d{3}) /)
      const status = statusMatch ? statusMatch[1] : ''
      const friendly = isHtml
        ? `Lawyers service is temporarily unavailable${status ? ` (${status})` : ''}.`
        : raw.slice(0, 200)
      setError(`${friendly}`)
    }

    try {
      const firmResult = await browseFirms(token)
      setFirms((firmResult.results ?? []).filter(f => !ownFirmIds.has(String(f.id))))
    } catch (cause) {
      setFirms([])
      const raw = cause instanceof Error ? cause.message : String(cause)
      const isHtml = raw.includes('<!DOCTYPE') || raw.includes('<html')
      const statusMatch = raw.match(/^(\d{3}) /)
      const status = statusMatch ? statusMatch[1] : ''
      const hint = /403|Authentication credentials were not provided/.test(raw) ? ' Sign in to view firms.' : ''
      const msg = isHtml
        ? `Firms service is temporarily unavailable${status ? ` (${status})` : ''}.${hint}`
        : `${raw.slice(0, 200)}${hint}`
      setError(prev => (prev ? `${prev} — ` : '') + msg)
    }
  }

  const searchOnly = async (kind: 'lawyers' | 'firms') => {
    setError('')
    const q = query.trim()
    if (!q) return setError('Enter a search term to search.')
    const token = typeof window !== 'undefined' ? localStorage.getItem('access') : null
    try {
      if (kind === 'lawyers') {
        setLawyers(await filterLawyers(q, token))
        setFirms([])
      } else {
        const myMemberships = token ? await getMyFirmMemberships(token).catch(() => []) : []
        const hide = new Set((myMemberships ?? []).map(m => String(m.firm)))
        setFirms((await filterFirms(q, token)).filter(f => !hide.has(String(f.id))))
        setLawyers([])
      }
      setCentralDown(true)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(`Search failed: ${msg}`)
    }
  }

  useEffect(() => {
    void load('')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-md">Discover lawyers and firms</h1>
        <p className="mt-2 text-sm text-primary-300">Browse live professionals and book a consultation.</p>
      </div>

      <div className="flex gap-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by specialization, bio, or firm name"
          className="flex-1 rounded bg-primary-800 px-4 py-3 text-white"
        />
        <button onClick={() => void load(query.trim())} className="rounded bg-gold-500 px-4 py-3 font-semibold text-black">Search</button>
      </div>

      {error && <Card className="border border-crimson-500/30 text-crimson-200">{error}</Card>}
      {centralDown && (
        <Card className="border border-amber-500/20 bg-amber-900/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">Central search is currently unavailable</div>
              <div className="text-sm text-primary-300">We couldn't reach the central search service. You can try searching lawyers or firms directly.</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void searchOnly('lawyers')} className="rounded border border-amber-400/30 px-3 py-2 text-sm">Search lawyers only</button>
              <button onClick={() => void searchOnly('firms')} className="rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-black">Search firms only</button>
            </div>
          </div>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Lawyers</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lawyers.length === 0 && <Card>No lawyers found.</Card>}
          {lawyers.map(lawyer => (
            <Card key={lawyer.id} className="space-y-3">
              <div className="font-semibold">{lawyer.name}</div>
              <div className="text-sm text-primary-300">{lawyer.specialization}</div>
              <div className="text-xs text-primary-400">{lawyer.bijural_flag} · {lawyer.average_rating} rating · {lawyer.active_cases} active cases</div>
              <Link href={`/book?kind=lawyer&id=${encodeURIComponent(lawyer.id)}&name=${encodeURIComponent(lawyer.name)}`} className="inline-flex rounded bg-gold-500 px-3 py-2 text-sm font-semibold text-black">Book consultation</Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Firms</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {firms.length === 0 && <Card>No firms found.</Card>}
          {firms.map(firm => (
            <Card key={firm.id} className="space-y-3">
              <div className="font-semibold">{firm.name}</div>
              <div className="text-xs text-primary-400">{firm.member_count ?? 0} active members</div>
              <Link href={`/book?kind=firm&id=${firm.id}&name=${encodeURIComponent(firm.name)}`} className="inline-flex rounded bg-gold-500 px-3 py-2 text-sm font-semibold text-black">Book with firm</Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
