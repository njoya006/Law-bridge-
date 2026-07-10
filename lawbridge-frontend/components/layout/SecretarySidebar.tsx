'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { DashboardIcon, DocumentIcon, PaymentIcon, CollapseIcon, ExpandIcon, SunIcon, MoonIcon, LogoutIcon, UserIcon, SparklesIcon, ClipboardIcon, BookmarkIcon, BalanceIcon, ChatIcon, BellIcon } from '../icons/Icons'
import { getMyFirmMemberships } from '../../lib/firmsApi'
import { getReportRequests } from '../../lib/monitoringApi'
import { clearSession } from '../../lib/authSession'

const secretaryNav = [
  { label: 'Dashboard',     href: '/secretary/dashboard',    icon: DashboardIcon },
  { label: 'Messages',      href: '/messages',               icon: ChatIcon },
  { label: 'Notifications', href: '/notifications',          icon: BellIcon },
  { label: 'Intelligence',  href: '/secretary/intelligence', icon: SparklesIcon },
  { label: 'Client Intake', href: '/secretary/intake',       icon: ClipboardIcon },
  { label: 'Payments',      href: '/secretary/payments',     icon: PaymentIcon },
  { label: 'Reports',       href: '/secretary/reports',      icon: DocumentIcon },
  { label: 'Members',       href: '/secretary/members',      icon: UserIcon },
  { label: 'Bookings',      href: '/secretary/bookings',     icon: BookmarkIcon },
]

export default function SecretarySidebar() {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isMobile, setIsMobile] = useState(false)
  const [avatarInitials, setAvatarInitials] = useState('S')
  const [pendingShipped, setPendingShipped] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  const collapsed = isMobile ? !mobileOpen : desktopCollapsed

  const handleLogout = () => {
    clearSession()
    router.push('/auth/lawyer-login')
  }

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => { setIsMobile(mq.matches); if (!mq.matches) setMobileOpen(false) }
    sync()
    mq.addEventListener('change', sync)

    // Open sidebar from mobile top bar hamburger
    const handleOpenSidebar = () => setMobileOpen(true)
    window.addEventListener('lawbridge:open-sidebar', handleOpenSidebar)

    const applyTheme = (t: 'light' | 'dark') => {
      if (t === 'light') document.documentElement.classList.add('light-mode')
      else document.documentElement.classList.remove('light-mode')
    }
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const initial = saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setTheme(initial)
    applyTheme(initial)

    const access = localStorage.getItem('access')
    const name = localStorage.getItem('fullName') || localStorage.getItem('userEmail') || 'S'
    setAvatarInitials(name.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'S')

    if (access) {
      getMyFirmMemberships(access).then(memberships => {
        const m = memberships[0]
        if (!m) return
        getReportRequests(m.firm, access).then(raw => {
          const items = Array.isArray(raw) ? raw : ((raw as { results?: unknown[] }).results ?? [])
          const unread = (items as { status: string }[]).filter(r => r.status === 'delivered' || r.status === 'pending').length
          setPendingShipped(unread)
        }).catch(() => {})
      }).catch(() => {})
    }

    return () => {
      mq.removeEventListener('change', sync)
      window.removeEventListener('lawbridge:open-sidebar', handleOpenSidebar)
    }
  }, [])

  useEffect(() => {
    const mode = isMobile ? (mobileOpen ? 'mobile-open' : 'mobile-collapsed') : (desktopCollapsed ? 'desktop-collapsed' : 'desktop-expanded')
    document.body.dataset.sidebarMode = mode
  }, [collapsed, isMobile, mobileOpen, desktopCollapsed])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    if (next === 'light') document.documentElement.classList.add('light-mode')
    else document.documentElement.classList.remove('light-mode')
  }

  const closeMobile = () => { if (isMobile) setMobileOpen(false) }

  return (
    <>
      {/* Mobile backdrop — tap outside to close */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px]"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-out
          ${isMobile ? 'w-72' : (desktopCollapsed ? 'w-20' : 'w-72')}
          ${isMobile ? (mobileOpen ? 'translate-x-0 shadow-2xl shadow-black/40' : '-translate-x-full') : 'translate-x-0'}
          bg-gradient-to-b from-primary-800 via-primary-800 to-primary-900 border-r border-neutral-700/30 shadow-2xl shadow-black/20`}
      >
        {/* Desktop collapse toggle — hidden on mobile */}
        {!isMobile && (
          <button
            onClick={() => setDesktopCollapsed(v => !v)}
            className="absolute -right-3 top-5 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/30 bg-primary-900 text-gold-300 shadow-lg shadow-black/30 transition-all duration-200 hover:scale-110 hover:border-gold-300 hover:text-gold-200 active:scale-95"
            aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {desktopCollapsed ? <ExpandIcon width={16} height={16} /> : <CollapseIcon width={16} height={16} />}
          </button>
        )}

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 p-4 border-b border-neutral-700/30 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,146,58,0.18),transparent_42%)] pointer-events-none" />
          <div className="flex items-center gap-3 relative">
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-primary-900 font-display font-bold text-sm shadow-lg shadow-gold-500/30 flex-shrink-0">
              <span className="absolute inset-0 rounded-xl bg-white/30 animate-pulse-subtle" />
              <span className="relative"><BalanceIcon width={18} height={18} /></span>
            </div>
            {!collapsed && (
              <div>
                <div className="font-display font-semibold text-neutral-50 text-base tracking-tight">LawBridge</div>
                <div className="text-xs text-neutral-400">Secretary Portal</div>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/10 transition-all active:scale-95 flex-shrink-0"
              aria-label="Close menu"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

      {/* Nav */}
      <nav className="p-3 overflow-y-auto flex-1 space-y-1">
        {secretaryNav.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const isReports = item.href === '/secretary/reports'
          const badge = isReports && pendingShipped > 0 ? pendingShipped : 0
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-body text-sm border active:scale-[0.98]
                ${isActive ? 'bg-portal-soft text-portal border-portal shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]' : 'border-transparent text-neutral-300 hover:bg-white/5 hover:text-neutral-50 hover:border-white/5'}
                ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0 ${isActive ? 'bg-portal-soft' : 'bg-white/0 group-hover:bg-portal-soft'} shadow-sm`}>
                <span className={`absolute inset-0 rounded-lg blur-sm transition-colors duration-200 ${isActive ? 'bg-portal-soft' : 'bg-transparent group-hover:bg-portal-soft'}`} />
                <span className={`relative transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110 ${isActive ? 'text-portal' : 'text-neutral-400 group-hover:text-portal'}`}>
                  <Icon width={18} height={18} />
                </span>
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center shadow-lg">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              {!collapsed && <span className="relative z-10 font-medium">{item.label}</span>}
              {!collapsed && badge > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
              {isActive && !collapsed && badge === 0 && <span className="ml-auto h-2 w-2 rounded-full dot-portal animate-pulse-subtle" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-neutral-700/30">
        <div className={`flex ${collapsed ? 'flex-col items-center gap-3' : 'items-center gap-2'} rounded-2xl border border-white/5 bg-white/5 p-2 shadow-sm`}>
          <button
            onClick={toggleTheme}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-primary-900/40 text-neutral-300 transition-all duration-200 hover:scale-105 hover:border-gold-400/30 hover:text-gold-300 active:scale-95"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-primary-900/40 text-gold-300 text-xs font-bold">
            {avatarInitials}
          </div>
          <button
            onClick={handleLogout}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-primary-900/40 text-neutral-400 transition-all duration-200 hover:scale-105 hover:border-crimson-500/30 hover:text-crimson-400 active:scale-95"
            aria-label="Sign out"
          >
            <LogoutIcon width={18} height={18} />
          </button>
        </div>
      </div>
      </aside>
    </>
  )
}
