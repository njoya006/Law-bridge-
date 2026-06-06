'use client'

import React, { useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import { SERVICE_URLS } from '../../lib/serviceUrls'

type Invoice = {
  id: string
  amount: number
  due_date?: string
  paid_at?: string
  status?: string
  description?: string
  case_id?: string
}

type Retainer = {
  id: string
  amount: number
  balance: number
  status?: string
  created_at?: string
}

function statusColor(status?: string) {
  switch ((status || '').toLowerCase()) {
    case 'paid': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    case 'overdue': return 'text-crimson-400 bg-crimson-500/10 border-crimson-500/30'
    default: return 'text-gold-400 bg-gold-500/10 border-gold-500/30'
  }
}

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [retainers, setRetainers] = useState<Retainer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const token = localStorage.getItem('access')
      if (!token) {
        setError('Please sign in to view billing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      const headers = { Authorization: `Bearer ${token}` }
      const base = SERVICE_URLS.payment.replace(/\/$/, '')

      try {
        const [invRes, retRes] = await Promise.allSettled([
          fetch(`${base}/invoices/`, { headers }),
          fetch(`${base}/retainers/`, { headers }),
        ])

        if (invRes.status === 'fulfilled' && invRes.value.ok) {
          const d = await invRes.value.json()
          if (mounted) setInvoices(Array.isArray(d) ? d : (d.results ?? []))
        }
        if (retRes.status === 'fulfilled' && retRes.value.ok) {
          const d = await retRes.value.json()
          if (mounted) setRetainers(Array.isArray(d) ? d : (d.results ?? []))
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load billing data')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void run()
    return () => { mounted = false }
  }, [])

  const totalDue = invoices
    .filter(inv => (inv.status || '').toLowerCase() !== 'paid')
    .reduce((sum, inv) => sum + (inv.amount ?? 0), 0)

  const totalPaid = invoices
    .filter(inv => (inv.status || '').toLowerCase() === 'paid')
    .reduce((sum, inv) => sum + (inv.amount ?? 0), 0)

  return (
    <main className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-display text-display-md text-neutral-50">Billing</h1>
        <p className="text-neutral-400 mt-1">Invoices, retainers, and payment history</p>
      </div>

      {error && (
        <Card className="border border-crimson-500/30 p-4">
          <p className="text-crimson-300 text-sm">{error}</p>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-2">Outstanding</p>
          <p className="font-display text-2xl text-gold-400">
            {totalDue.toLocaleString('en-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-2">Total paid</p>
          <p className="font-display text-2xl text-emerald-400">
            {totalPaid.toLocaleString('en-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-2">Retainer balance</p>
          <p className="font-display text-2xl text-neutral-50">
            {retainers.reduce((s, r) => s + (r.balance ?? 0), 0)
              .toLocaleString('en-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
          </p>
        </Card>
      </div>

      {/* Invoices */}
      <Card className="p-6">
        <h2 className="font-heading text-body-lg text-neutral-50 mb-4">Invoices</h2>

        {loading && (
          <div className="flex items-center gap-2 text-neutral-400 py-10 justify-center">
            <span className="animate-spin h-4 w-4 border-2 border-gold-400 border-t-transparent rounded-full" />
            Loading billing data…
          </div>
        )}

        {!loading && invoices.length === 0 && (
          <p className="text-neutral-400 text-sm py-10 text-center">No invoices found.</p>
        )}

        {!loading && invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700/50 text-left">
                  <th className="pb-3 pr-4 text-xs text-neutral-400 font-medium uppercase tracking-wide">Invoice</th>
                  <th className="pb-3 pr-4 text-xs text-neutral-400 font-medium uppercase tracking-wide">Description</th>
                  <th className="pb-3 pr-4 text-xs text-neutral-400 font-medium uppercase tracking-wide">Due date</th>
                  <th className="pb-3 pr-4 text-xs text-neutral-400 font-medium uppercase tracking-wide text-right">Amount</th>
                  <th className="pb-3 text-xs text-neutral-400 font-medium uppercase tracking-wide text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/30">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 pr-4 text-neutral-200 font-mono text-xs">{inv.id}</td>
                    <td className="py-3 pr-4 text-neutral-300">{inv.description || '—'}</td>
                    <td className="py-3 pr-4 text-neutral-400">{inv.due_date || '—'}</td>
                    <td className="py-3 pr-4 text-neutral-50 font-semibold text-right">
                      {(inv.amount ?? 0).toLocaleString('en-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(inv.status)}`}>
                        {inv.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Retainers */}
      {!loading && retainers.length > 0 && (
        <Card className="p-6">
          <h2 className="font-heading text-body-lg text-neutral-50 mb-4">Retainers</h2>
          <div className="space-y-3">
            {retainers.map(ret => (
              <div key={ret.id} className="flex items-center justify-between p-4 rounded-xl border border-neutral-700/30 bg-primary-800/20">
                <div>
                  <p className="text-neutral-200 font-medium text-sm">Retainer {ret.id}</p>
                  {ret.created_at && <p className="text-neutral-400 text-xs mt-0.5">Created {new Date(ret.created_at).toLocaleDateString()}</p>}
                </div>
                <div className="text-right">
                  <p className="text-neutral-50 font-semibold">
                    {(ret.balance ?? 0).toLocaleString('en-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })} remaining
                  </p>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    of {(ret.amount ?? 0).toLocaleString('en-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </main>
  )
}
