"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  DashboardIcon, UploadIcon, ChatIcon, DocumentIcon,
  PaymentIcon, SettingsIcon, CollapseIcon, ExpandIcon,
  SunIcon, MoonIcon, UserIcon, LogoutIcon, BellIcon, GridIcon, SparklesIcon,
  BookOpenIcon, BalanceIcon, CompassIcon, ClipboardIcon, BookmarkIcon,
} from '../icons/Icons'
import { clearSession } from '../../lib/authSession'

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV = [
  { label: 'Portal',         href: '/dashboard',     icon: DashboardIcon },
  { label: 'Discover',       href: '/discover',       icon: CompassIcon },
  { label: 'Bookings',       href: '/bookings',       icon: BookmarkIcon },
  { label: 'Notifications',  href: '/notifications',  icon: BellIcon },
  { label: 'AI Assistant',   href: '/ai',             icon: SparklesIcon },
  { label: 'Messages',       href: '/messages',       icon: ChatIcon },
  { label: 'Library',        href: '/library',        icon: BookOpenIcon },
  { label: 'Files',          href: '/documents',      icon: DocumentIcon },
  { label: 'Upload',         href: '/upload',         icon: UploadIcon },
  { label: 'Matters',        href: '/cases',          icon: ClipboardIcon },
  { label: 'Billing',        href: '/payments',       icon: PaymentIcon },
  { label: 'Settings',       href: '/settings',       icon: SettingsIcon },
]

// Four core tabs + ··· More
const BOTTOM_NAV = [
  { label: 'Portal',    href: '/dashboard',    icon: DashboardIcon },
  { label: 'Discover',  href: '/discover',     icon: CompassIcon },
  { label: 'Matters',   href: '/cases',        icon: ClipboardIcon },
  { label: 'Messages',  href: '/messages',     icon: ChatIcon },
]

// Items shown in the ··· More drawer
const MORE_ITEMS = [
  { label: 'Upload',         href: '/upload',         icon: UploadIcon },
  { label: 'Library',        href: '/library',        icon: BookOpenIcon },
  { label: 'Files',          href: '/documents',      icon: DocumentIcon },
  { label: 'Bookings',       href: '/bookings',       icon: BookmarkIcon },
  { label: 'Alerts',         href: '/notifications',  icon: BellIcon },
  { label: 'AI Assistant',   href: '/ai',             icon: SparklesIcon },
  { label: 'Billing',        href: '/payments',       icon: PaymentIcon },
  { label: 'Settings',       href: '/settings',       icon: SettingsIcon },
  { label: 'Profile',        href: '/profile',        icon: UserIcon },
]

// ── Desktop sidebar ───────────────────────────────────────────────────────────

function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    async function fetchUnread() {
      const token = localStorage.getItem('access')
      if (!token) return
      try {
        const res = await fetch('/api/v1/messages/threads/', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const threads = (await res.json()) as Array<{ unread_count?: number }>
        setUnreadCount(threads.reduce((s, t) => s + (t.unread_count || 0), 0))
      } catch { /* silent */ }
    }
    fetchUnread()
    const iv = setInterval(fetchUnread, 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    document.body.dataset.sidebarMode = collapsed ? 'desktop-collapsed' : 'desktop-expanded'
  }, [collapsed])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = savedTheme ?? (prefersDark ? 'dark' : 'light')
    setTheme(initial)
    applyTheme(initial)
  }, [])

  function applyTheme(t: 'light' | 'dark') {
    if (t === 'light') document.documentElement.classList.add('light-mode')
    else document.documentElement.classList.remove('light-mode')
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    applyTheme(next)
  }

  function handleLogout() {
    clearSession()
    router.push('/auth/login')
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-out bg-gradient-to-b from-primary-800 via-primary-800 to-primary-900 border-r border-neutral-700/30 shadow-2xl shadow-black/20 ${collapsed ? 'w-20' : 'w-72'}`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="absolute -right-3 top-5 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/30 bg-primary-900 text-gold-300 shadow-lg shadow-black/30 transition-all duration-200 hover:scale-110 hover:border-gold-300 hover:text-gold-200 active:scale-95"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ExpandIcon width={16} height={16} /> : <CollapseIcon width={16} height={16} />}
      </button>

      {/* Logo */}
      <div className="relative flex items-center gap-3 p-4 border-b border-neutral-700/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,146,58,0.18),transparent_42%)] pointer-events-none" />
        <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-primary-900 font-display font-bold text-sm shadow-lg shadow-gold-500/30 flex-shrink-0">
          <span className="absolute inset-0 rounded-xl bg-white/30 animate-pulse-subtle" />
          <span className="relative"><BalanceIcon width={18} height={18} /></span>
        </div>
        {!collapsed && (
          <div>
            <div className="font-display font-semibold text-neutral-50 text-base tracking-tight">LawBridge</div>
            <div className="text-xs text-neutral-400">Client Portal</div>
          </div>
        )}
      </div>

      {/* Nav links */}
      <nav className="p-3 overflow-y-auto flex-1 space-y-0.5">
        {NAV.map(item => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border active:scale-[0.98] ${
                active
                  ? 'bg-portal-soft text-portal border-portal'
                  : 'border-transparent text-neutral-300 hover:bg-white/5 hover:text-neutral-50 hover:border-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0 ${active ? 'bg-portal-soft' : 'group-hover:bg-portal-soft'}`}>
                <span className={`absolute inset-0 rounded-lg blur-sm transition-colors duration-200 ${active ? 'bg-portal-soft' : 'bg-transparent group-hover:bg-portal-soft'}`} />
                <span className={`relative transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110 ${active ? 'text-portal' : 'text-neutral-400 group-hover:text-portal'}`}>
                  <Icon width={18} height={18} />
                </span>
              </span>
              {!collapsed && <span className="relative z-10 font-medium text-sm">{item.label}</span>}
              {!collapsed && item.label === 'Messages' && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              {active && !collapsed && item.label !== 'Messages' && (
                <span className="ml-auto h-2 w-2 rounded-full dot-portal animate-pulse-subtle" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer controls */}
      <div className="p-3 border-t border-neutral-700/30">
        <div className={`flex ${collapsed ? 'flex-col items-center gap-2' : 'items-center gap-2'} rounded-2xl border border-white/5 bg-white/5 p-2`}>
          <button
            onClick={toggleTheme}
            className="group relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-primary-900/40 text-neutral-300 transition-all duration-200 hover:scale-105 hover:border-gold-400/30 hover:text-gold-300 active:scale-95"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
          </button>
          <button className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/5 bg-primary-900/40 px-2 text-[11px] font-semibold tracking-widest text-neutral-300 transition-all duration-200 hover:border-gold-400/30 hover:text-gold-200">
            EN
          </button>
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-gradient-to-br from-gold-500/25 to-gold-600/25 text-gold-300 transition-all duration-200 hover:scale-105 hover:border-gold-300/40"
            title="Profile"
          >
            <UserIcon width={16} height={16} />
          </Link>
          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-primary-900/40 text-neutral-400 transition-all duration-200 hover:scale-105 hover:border-red-500/30 hover:text-red-400 active:scale-95"
            title="Sign out"
          >
            <LogoutIcon width={16} height={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── Mobile bottom nav ─────────────────────────────────────────────────────────

function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      const token = localStorage.getItem('access')
      if (!token) return
      try {
        const res = await fetch('/api/v1/messages/threads/', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const threads = (await res.json()) as Array<{ unread_count?: number }>
        setUnreadCount(threads.reduce((s, t) => s + (t.unread_count || 0), 0))
      } catch { /* silent */ }
    }
    fetchUnread()
    const iv = setInterval(fetchUnread, 30000)
    return () => clearInterval(iv)
  }, [])

  function handleLogout() {
    clearSession()
    router.push('/auth/login')
  }

  useEffect(() => {
    document.body.dataset.sidebarMode = 'mobile-collapsed'
  }, [])

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  const moreActive = MORE_ITEMS.some(item => pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)))

  return (
    <>
      {/* ── More drawer backdrop ──────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── More drawer ──────────────────────────────────────────────────────── */}
      <div
        className={`fixed left-0 right-0 z-50 bg-primary-900/98 backdrop-blur-xl border-t border-neutral-700/40 shadow-[0_-8px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-neutral-600" />
        </div>

        <div className="px-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-3">More</p>

          {/* 4-column icon grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {MORE_ITEMS.map(item => {
              const Icon = item.icon
              const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-150 active:scale-95 ${
                    active
                      ? 'bg-portal-soft text-portal'
                      : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200'
                  }`}
                >
                  <Icon width={22} height={22} />
                  <span className="text-[9px] font-semibold uppercase tracking-wider leading-none">{item.label}</span>
                  {active && <span className="h-1 w-1 rounded-full dot-portal" />}
                </Link>
              )
            })}
          </div>

          {/* Logout row */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 active:scale-[0.98]"
          >
            <LogoutIcon width={18} height={18} />
            <span className="text-sm font-medium">Sign out</span>
          </button>
        </div>

        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </div>

      {/* ── Bottom tab bar ────────────────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary-900/95 backdrop-blur-md border-t border-neutral-700/40 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-stretch h-16">
          {BOTTOM_NAV.map(item => {
            const Icon = item.icon
            const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150 active:bg-white/5 ${
                  active ? 'text-portal-accent' : 'text-neutral-500'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-portal-accent shadow-portal-accent" />
                )}
                <span className={`relative flex items-center justify-center transition-transform duration-150 ${active ? 'scale-110' : ''}`}>
                  <Icon width={20} height={20} />
                  {item.label === 'Messages' && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider">{item.label}</span>
              </Link>
            )
          })}

          {/* ··· More button */}
          <button
            onClick={() => setDrawerOpen(v => !v)}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150 active:bg-white/5 ${
              drawerOpen || moreActive ? 'text-portal-accent' : 'text-neutral-500'
            }`}
          >
            {(drawerOpen || moreActive) && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-portal-accent shadow-portal-accent" />
            )}
            <span className={`flex items-center justify-center transition-transform duration-200 ${drawerOpen ? 'rotate-90 scale-110' : ''}`}>
              <GridIcon width={20} height={20} />
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider">More</span>
          </button>
        </div>

        {/* iOS safe-area spacer */}
        <div className="bg-primary-900/95" style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>
    </>
  )
}

// ── Exported component ────────────────────────────────────────────────────────

export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  if (isMobile) return <MobileBottomNav />
  return <DesktopSidebar />
}
