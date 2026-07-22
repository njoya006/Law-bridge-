"use client"

import React, { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { EmptyState } from '../../../components/ui/EmptyState'
import { SkeletonTable } from '../../../components/ui/Skeleton'
import { PaymentIcon } from '../../../components/icons/Icons'
import { SERVICE_URLS } from '../../../lib/serviceUrls'

type Invoice = {
  id: string
  amount: number
  due_date?: string
  status?: string
  description?: string
}

function statusVariant(status?: string): 'success' | 'danger' | 'gold' {
  switch ((status || '').toLowerCase()) {
    case 'paid': return 'success'
    case 'overdue': return 'danger'
    default: return 'gold'
  }
}

export default function LawyerBillingPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    let mounted = true
    const fetchInvoices = async () => {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('access')
      try {
        const res = await fetch(`${SERVICE_URLS.payment}/invoices/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        if (mounted) setInvoices(Array.isArray(data) ? data : (data.results ?? []))
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load invoices')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchInvoices()
    return () => { mounted = false }
  }, [])

  const totalDue = invoices
    .filter(inv => (inv.status || '').toLowerCase() !== 'paid')
    .reduce((sum, inv) => sum + (inv.amount ?? 0), 0)

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-display-md text-neutral-50">Billing</h2>
        <p className="mt-1 text-neutral-400">Invoices and payment history for your firm</p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">Total invoices</p>
          <p className="font-display text-3xl text-neutral-50">{invoices.length}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">Amount due</p>
          <p className="font-display text-3xl text-gold-400">
            {totalDue.toLocaleString('en-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs text-neutral-400 uppercase tracking-widest mb-1">Paid</p>
          <p className="font-display text-3xl text-emerald-400">
            {invoices.filter(inv => (inv.status || '').toLowerCase() === 'paid').length}
          </p>
        </Card>
      </div>

      {/* Invoices table */}
      <Card className="p-6">
        <h3 className="font-heading text-body-lg text-neutral-50 mb-4">Invoices</h3>

        {loading && <SkeletonTable rows={4} />}

        {!loading && error && (
          <div className="rounded-xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-4 text-sm text-crimson-200">
            <p className="font-medium">Unable to load billing data</p>
            <p className="mt-1 text-crimson-300/70">{error}</p>
            <p className="mt-2 text-neutral-400 text-xs">The payments service may be offline; this panel will update when available.</p>
          </div>
        )}

        {!loading && !error && invoices.length === 0 && (
          <EmptyState
            icon={<PaymentIcon width={24} height={24} />}
            title="No invoices yet"
            body="Invoices are generated automatically when clients pay their booking fees. Accept a booking and receive payment to see records here."
          />
        )}

        {!loading && !error && invoices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700/50 text-left">
                  <th className="pb-3 text-xs text-neutral-400 font-medium uppercase tracking-wide">Invoice</th>
                  <th className="pb-3 text-xs text-neutral-400 font-medium uppercase tracking-wide">Description</th>
                  <th className="pb-3 text-xs text-neutral-400 font-medium uppercase tracking-wide">Due date</th>
                  <th className="pb-3 text-xs text-neutral-400 font-medium uppercase tracking-wide text-right">Amount</th>
                  <th className="pb-3 text-xs text-neutral-400 font-medium uppercase tracking-wide text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/30">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/2">
                    <td className="py-3 text-neutral-200 font-mono text-xs">{inv.id}</td>
                    <td className="py-3 text-neutral-300">{inv.description || '—'}</td>
                    <td className="py-3 text-neutral-400">{inv.due_date || '—'}</td>
                    <td className="py-3 text-neutral-50 font-semibold text-right">
                      {inv.amount?.toLocaleString('en-CM', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 text-right">
                      <Badge variant={statusVariant(inv.status)}>{inv.status || 'pending'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
