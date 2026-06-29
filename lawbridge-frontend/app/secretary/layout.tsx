'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clearSession } from '../../lib/authSession'

const ALLOWED_ROLES = new Set(['secretary', 'firm_admin', 'partner', 'associate'])

const nav = [
  { label: 'Dashboard', href: '/secretary/dashboard' },
  { label: 'Payments', href: '/secretary/payments' },
]

function SecreatarySidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const name = typeof window !== 'undefined' ? (localStorage.getItem('fullName') || 'Secretary') : 'Secretary'
  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-primary-900 border-r border-neutral-700/40">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-700/30">
        <div className="w-8 h-8 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-sm flex-shrink-0">{initials}</div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-100 truncate">{name}</p>
          <p className="text-xs text-neutral-500 truncate">Firm Secretary</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-gold-500/15 text-gold-300 border border-gold-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-primary-800/60'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-neutral-700/30">
        <button
          onClick={() => { clearSession(); router.push('/auth/login') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-crimson-300 hover:bg-crimson-900/20 transition-colors w-full"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

export default function SecretaryLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const access = localStorage.getItem('access')
      const role = localStorage.getItem('userRole') || ''
      if (!access || !ALLOWED_ROLES.has(role)) {
        router.replace('/auth/lawyer-login')
      } else {
        setReady(true)
      }
    } catch {
      router.replace('/auth/login')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return null

  return (
    <>
      <SecreatarySidebar />
      <main
        className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-all duration-300 max-w-[100vw] overflow-x-hidden"
        style={{ marginLeft: '15rem', width: 'calc(100vw - 15rem)' }}
      >
        {children}
      </main>
    </>
  )
}
