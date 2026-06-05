"use client"

import React, { useEffect, useState } from 'react'
import { Card } from '../../../components/ui/Card'
import { SERVICE_URLS } from '../../../lib/serviceUrls'

type Invoice = {
  id: string
  amount: number
  due_date?: string
  status?: string
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
      try {
        const res = await fetch(`${SERVICE_URLS.payment}/invoices/`)
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const data = await res.json()
        if (mounted) setInvoices(Array.isArray(data) ? data : [])
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load invoices')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchInvoices()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <h2 className="font-display text-display-md">Billing</h2>

      <div className="mt-4">
        <Card>
          {loading && <div>Loading invoices…</div>}
          {error && (
            <div>
              <strong>Unable to load billing data:</strong> {error}
              <div className="mt-2 text-sm text-muted">The payments service may be offline; this panel will update when available.</div>
            </div>
          )}

          {!loading && !error && invoices.length === 0 && (
            <div>No invoices found.</div>
          )}

          {!loading && !error && invoices.length > 0 && (
            <ul className="space-y-2">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex justify-between">
                  <span>Invoice {inv.id}</span>
                  <span>{inv.amount.toFixed(2)} — {inv.status || 'unknown'}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card>Retainer balances</Card>
          <Card>Payment history</Card>
        </div>
      </div>
    </div>
  )
}