'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthRoute = pathname?.startsWith('/auth')
  const isLawyerRoute = pathname?.startsWith('/lawyer')

  if (isAuthRoute || isLawyerRoute) {
    return <>{children}</>
  }

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