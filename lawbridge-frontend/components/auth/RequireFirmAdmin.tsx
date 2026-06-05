'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const ALLOWED = ['Secretary / Firm Admin', 'Firm Admin', 'Partner', 'Senior Partner', 'Admin']

export default function RequireFirmAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    try {
      const token = localStorage.getItem('access')
      const portalRole = localStorage.getItem('portalRole')
      const userRole = localStorage.getItem('userRole')

      if (!token || portalRole !== 'lawyer' || !userRole || !ALLOWED.includes(userRole)) {
        // not allowed
        router.replace('/lawyer/dashboard')
        return
      }
    } catch (e) {
      router.replace('/lawyer/dashboard')
      return
    } finally {
      setChecking(false)
    }
  }, [router])

  if (checking) return <div className="p-6">Checking admin access...</div>

  return <>{children}</>
}
