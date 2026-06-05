'use client'

import React from 'react'
import LawyerSidebar from './LawyerSidebar'

export default function LawyerShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LawyerSidebar />
      <main
        className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-all duration-300 max-w-[100vw] overflow-x-hidden"
        style={{ marginLeft: 'var(--sidebar-width)', width: 'calc(100vw - var(--sidebar-width))' }}
      >
        {children}
      </main>
    </>
  )
}