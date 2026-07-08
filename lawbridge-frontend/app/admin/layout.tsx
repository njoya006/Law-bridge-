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

function MenuIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function SidebarContent({ pathname, onClose, handleLogout }: { pathname: string; onClose?: () => void; handleLogout: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3 p-4 border-b border-neutral-700/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 text-primary-900 font-bold text-sm shadow-lg shadow-gold-500/30 flex-shrink-0">
          <ShieldIcon width={18} height={18} />
        </div>
        <div className="flex-1">
          <div className="font-display font-semibold text-neutral-50 text-base">LawBridge</div>
          <div className="text-xs text-portal">Admin Console</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-neutral-400 hover:text-neutral-50">
            <XIcon />
          </button>
        )}
      </div>

      <nav className="p-3 flex-1 space-y-0.5 overflow-y-auto">
        {ADMIN_NAV.map(item => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border ${
                active
                  ? 'bg-portal-soft text-portal border-portal'
                  : 'border-transparent text-neutral-300 hover:bg-white/5 hover:text-neutral-50 hover:border-white/5'
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-portal-soft text-portal' : 'text-neutral-400'}`}>
                <Icon width={16} height={16} />
              </span>
              <span className="font-medium text-sm">{item.label}</span>
              {active && <span className="ml-auto h-2 w-2 rounded-full dot-portal" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-neutral-700/30">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-400 transition-all hover:bg-red-500/10 hover:text-red-400"
        >
          <LogoutIcon width={16} height={16} />
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col bg-gradient-to-b from-primary-800 via-primary-800 to-primary-900 border-r border-neutral-700/30 shadow-2xl z-40">
        <SidebarContent pathname={pathname} handleLogout={handleLogout} />
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside className={`fixed left-0 top-0 h-screen w-64 flex flex-col bg-gradient-to-b from-primary-800 via-primary-800 to-primary-900 border-r border-neutral-700/30 shadow-2xl z-50 transition-transform duration-300 ease-out lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} handleLogout={handleLogout} />
      </aside>

      {/* Main content */}
      <main data-portal="admin" className="flex-1 lg:ml-64 min-h-screen">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#07111a]/95 backdrop-blur border-b border-neutral-700/30 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-700/50 text-neutral-300 hover:text-neutral-50 hover:border-neutral-600"
          >
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-500 text-primary-900">
              <ShieldIcon width={14} height={14} />
            </div>
            <span className="font-display font-semibold text-sm text-neutral-50">Admin Console</span>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
