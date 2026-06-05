'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RequireLawyer({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    try {
      const token = localStorage.getItem('access')
      const portalRole = localStorage.getItem('portalRole')
      const lawyerId = localStorage.getItem('lawyerId')

      // Basic rule: must be authenticated and have portalRole 'lawyer' and a lawyerId
      if (!token || portalRole !== 'lawyer' || !lawyerId) {
        router.replace('/auth/lawyer-login')
        return
      }
    } catch (e) {
      router.replace('/auth/lawyer-login')
      return
    } finally {
      setChecking(false)
    }
  }, [router])

  if (checking) {
    return <div className="p-6">Checking access...</div>
  }

  return <>{children}</>
}
