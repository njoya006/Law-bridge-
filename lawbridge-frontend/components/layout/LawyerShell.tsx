'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import LawyerSidebar from './LawyerSidebar'
import SecretarySidebar from './SecretarySidebar'

export default function LawyerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Read synchronously so the correct sidebar renders on first paint with no flash
  const [isSecretary, setIsSecretary] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('userRole') === 'secretary'
  })

  useEffect(() => {
    const role = localStorage.getItem('userRole')
    setIsSecretary(role === 'secretary')
  }, [])

  useEffect(() => {
    document.body.dataset.portal = isSecretary ? 'secretary' : 'lawyer'
    return () => { delete document.body.dataset.portal }
  }, [isSecretary])

  return (
    <>
      {isSecretary ? <SecretarySidebar /> : <LawyerSidebar />}

      {/* Mobile top bar — only visible below lg (1024px) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-20 h-14 flex items-center gap-3 px-4 bg-primary-800/95 backdrop-blur-sm border-b border-neutral-700/30 shadow-lg shadow-black/20">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('lawbridge:open-sidebar'))}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-700/30 bg-primary-900/40 text-neutral-300 hover:text-neutral-50 hover:bg-white/10 transition-all active:scale-95"
          aria-label="Open navigation"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-primary-900 font-bold text-xs shadow-md shadow-gold-500/20">
            ⚖
          </div>
          <span className="font-display font-semibold text-neutral-50 text-sm tracking-tight">LawBridge</span>
        </div>
      </header>

      <main
        key={pathname}
        className="px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 pt-20 lg:pt-8 transition-[margin] duration-300 max-w-[100vw] overflow-x-hidden animate-in fade-in duration-300"
        style={{ marginLeft: 'var(--sidebar-width)', width: 'calc(100vw - var(--sidebar-width))' }}
      >
        {children}
      </main>
    </>
  )
}
