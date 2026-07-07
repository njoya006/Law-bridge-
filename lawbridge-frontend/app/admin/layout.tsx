'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { DashboardIcon, UsersIcon, InboxIcon, LogoutIcon, ShieldIcon, BookOpenIcon, LawIcon, SparklesIcon, ChartBarIcon } from '../../components/icons/Icons'
import { clearSession } from '../../lib/authSession'

const ADMIN_NAV = [
  { label: 'Dashboard',    href: '/admin',               icon: DashboardIcon },
  { label: 'Intelligence', href: '/admin/intelligence',  icon: SparklesIcon },
  { label: 'Risk Monitor', href: '/admin/risks',         icon: ShieldIcon },
  { label: 'Analytics',   href: '/admin/analytics',     icon: ChartBarIcon },
  { label: 'Users',        href: '/admin/users',         icon: UsersIcon },
  { label: 'Support Inbox',href: '/admin/support',       icon: InboxIcon },
  { label: 'Content',      href: '/admin/content',       icon: BookOpenIcon },
  { label: 'Verification', href: '/admin/verification',  icon: LawIcon },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('userInfo') || localStorage.getItem('me')
    let role = ''
    if (raw) {
      try { role = JSON.parse(raw)?.role ?? '' } catch { /* ignore */ }
    }
    if (!role) {
      const access = localStorage.getItem('access')
      if (access) {
        try {
          const payload = JSON.parse(atob(access.split('.')[1]))
          role = payload.role ?? ''
        } catch { /* ignore */ }
      }
    }
    if (!['support', 'admin'].includes(role.toLowerCase())) {
      router.replace('/dashboard')
      return
    }
    setChecked(true)
  }, [router])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111a]">
        <div className="h-8 w-8 rounded-full border-2 border-gold-400/30 border-t-gold-400 animate-spin" />
      </div>
    )
  }

  function handleLogout() {
    clearSession()
    router.push('/auth/login')
  }

  return (
    <div className="flex min-h-screen bg-[#07111a] text-neutral-50">
      {/* Admin sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-gradient-to-b from-primary-800 via-primary-800 to-primary-900 border-r border-neutral-700/30 shadow-2xl z-40">
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-neutral-700/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 text-primary-900 font-bold text-sm shadow-lg shadow-gold-500/30 flex-shrink-0">
            <ShieldIcon width={18} height={18} />
          </div>
          <div>
            <div className="font-display font-semibold text-neutral-50 text-base">LawBridge</div>
            <div className="text-xs text-gold-400/80">Admin Console</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 flex-1 space-y-0.5">
          {ADMIN_NAV.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border ${
                  active
                    ? 'bg-gold-500/10 text-gold-300 border-gold-400/20'
                    : 'border-transparent text-neutral-300 hover:bg-white/5 hover:text-neutral-50 hover:border-white/5'
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-gold-500/10 text-gold-300' : 'text-neutral-400'}`}>
                  <Icon width={16} height={16} />
                </span>
                <span className="font-medium text-sm">{item.label}</span>
                {active && <span className="ml-auto h-2 w-2 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(201,146,58,0.7)]" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-700/30">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogoutIcon width={16} height={16} />
            <span className="text-sm font-medium">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen p-6">
        {children}
      </main>
    </div>
  )
}
