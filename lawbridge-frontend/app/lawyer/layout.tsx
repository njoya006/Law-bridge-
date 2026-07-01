'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LawyerShell from '../../components/layout/LawyerShell'

export default function LawyerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let access: string | null = null
    let portalRole: string | null = null
    let userRole: string | null = null
    try {
      access = localStorage.getItem('access')
      portalRole = localStorage.getItem('portalRole')
      userRole = localStorage.getItem('userRole')
    } catch {
      // localStorage unavailable (private browsing restriction)
    }

    if (!access || portalRole !== 'lawyer') {
      router.replace('/auth/lawyer-login')
    } else if (userRole === 'secretary' || userRole === 'firm_admin') {
      // Secretaries log in as 'lawyer' portal role but belong in the secretary portal
      router.replace('/secretary/dashboard')
    } else {
      setReady(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return null

  return <LawyerShell>{children}</LawyerShell>
}
