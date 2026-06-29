'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clearSession } from '../../lib/authSession'
import { DashboardIcon, PaymentIcon, ChartBarIcon, UsersIcon, LogoutIcon } from '../../components/icons/Icons'

const ALLOWED_ROLES = new Set(['secretary', 'firm_admin', 'partner', 'associate', 'owner', 'managing_partner'])

const nav = [
  { label: 'Dashboard', href: '/secretary/dashboard', Icon: DashboardIcon },
  { label: 'Payments', href: '/secretary/payments', Icon: PaymentIcon },
  { label: 'Reports', href: '/secretary/reports', Icon: ChartBarIcon },
  { label: 'Members', href: '/secretary/members', Icon: UsersIcon },
]

function SecretarySidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [name, setName] = useState('Secretary')
  const [role, setRole] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setName(localStorage.getItem('fullName') || 'Secretary')
      setRole(localStorage.getItem('userRole') || '')
    }
  }, [])

  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'S'

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 flex flex-col bg-primary-900 border-r border-neutral-700/40">
      {/* Identity */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-700/30">
        <div className="w-9 h-9 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-100 truncate">{name}</p>
          <p className="text-xs text-neutral-500 truncate capitalize">{role.replace(/_/g, ' ') || 'Firm Secretary'}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-gold-500/15 text-gold-300 border border-gold-500/20'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-primary-800/60'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" width={16} height={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-neutral-700/30 space-y-1">
        <Link href="/lawyer/office/me"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-neutral-500 hover:text-neutral-300 hover:bg-primary-800/40 transition-colors">
          ← Lawyer Office
        </Link>
        <button onClick={() => { clearSession(); router.push('/auth/login') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-red-300 hover:bg-red-900/20 transition-colors w-full">
          <LogoutIcon className="w-4 h-4 flex-shrink-0" width={16} height={16} />
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
      <SecretarySidebar />
      <main
        className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 transition-all duration-300 max-w-[100vw] overflow-x-hidden"
        style={{ marginLeft: '15rem', width: 'calc(100vw - 15rem)' }}
      >
        {children}
      </main>
    </>
  )
}
