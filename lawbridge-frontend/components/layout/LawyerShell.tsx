'use client'

import React, { useEffect, useState } from 'react'
import LawyerSidebar from './LawyerSidebar'
import SecretarySidebar from './SecretarySidebar'

export default function LawyerShell({ children }: { children: React.ReactNode }) {
  const [isSecretary, setIsSecretary] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    setIsSecretary(role === 'secretary')
  }, [])

  return (
    <>
      {isSecretary ? <SecretarySidebar /> : <LawyerSidebar />}
      <main
        className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-all duration-300 max-w-[100vw] overflow-x-hidden"
        style={{ marginLeft: 'var(--sidebar-width)', width: 'calc(100vw - var(--sidebar-width))' }}
      >
        {children}
      </main>
    </>
  )
}
