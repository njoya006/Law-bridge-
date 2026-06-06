'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LawyerShell from '../../components/layout/LawyerShell'

export default function LawyerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    const access = localStorage.getItem('access')
    const portalRole = localStorage.getItem('portalRole')
    if (!access || portalRole !== 'lawyer') {
      router.replace('/auth/lawyer-login')
    }
  }, [router])

  return <LawyerShell>{children}</LawyerShell>
}
