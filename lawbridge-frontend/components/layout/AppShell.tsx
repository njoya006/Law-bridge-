'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import LawyerShell from './LawyerShell'

function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [portalRole, setPortalRole] = useState<string | null>(null)

  useEffect(() => {
    try {
      setPortalRole(localStorage.getItem('portalRole'))
    } catch {
      setPortalRole('client')
    }
  }, [pathname])

  if (portalRole === 'lawyer') {
    return <LawyerShell>{children}</LawyerShell>
  }

  if (portalRole === 'client') {
    return (
      <>
        <Sidebar />
        <main
          className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-all duration-300 max-w-[100vw] overflow-x-hidden"
          style={{ marginLeft: 'var(--sidebar-width)', width: 'calc(100vw - var(--sidebar-width))' }}
        >
          {children}
        </main>
      </>
    )
  }


  // portalRole not yet read from localStorage (pre-hydration) — render without sidebar
  return <>{children}</>
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname?.startsWith('/auth')
  const isLawyerRoute = pathname?.startsWith('/lawyer')
  const isSecretaryRoute = pathname?.startsWith('/secretary')
  const isPublicRoute = pathname === '/' || pathname === '/about' || pathname === '/support'
  const isIntakeRoute = pathname?.startsWith('/intake')

  if (isAuthRoute || isLawyerRoute || isSecretaryRoute || isPublicRoute || isIntakeRoute) {
    return <>{children}</>
  }

  return <PortalShell>{children}</PortalShell>
}
