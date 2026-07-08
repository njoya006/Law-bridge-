'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import LawyerSidebar from './LawyerSidebar'
import SecretarySidebar from './SecretarySidebar'

export default function LawyerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSecretary, setIsSecretary] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    setIsSecretary(role === 'secretary')
  }, [])

  // Set portal accent on body so fixed-position sidebars also pick up CSS variables
  useEffect(() => {
    document.body.dataset.portal = isSecretary ? 'secretary' : 'lawyer'
    return () => {
      delete document.body.dataset.portal
    }
  }, [isSecretary])

  return (
    <>
      {isSecretary ? <SecretarySidebar /> : <LawyerSidebar />}
      <main
        key={pathname}
        className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-[margin] duration-300 max-w-[100vw] overflow-x-hidden animate-in fade-in duration-300"
        style={{ marginLeft: 'var(--sidebar-width)', width: 'calc(100vw - var(--sidebar-width))' }}
      >
        {children}
      </main>
    </>
  )
}
