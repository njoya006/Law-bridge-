"use client"
import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  DashboardIcon, UploadIcon, AnalysisIcon, ChatIcon, DocumentIcon,
  CaseIcon, PaymentIcon, SettingsIcon, CollapseIcon, ExpandIcon,
  SunIcon, MoonIcon, UserIcon, LawIcon, LogoutIcon,
} from '../icons/Icons'
import { clearSession } from '../../lib/authSession'

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV = [
  { label: 'Portal',         href: '/dashboard',     icon: DashboardIcon },
  { label: 'Discover',       href: '/discover',       icon: LawIcon },
  { label: 'Bookings',       href: '/bookings',       icon: CaseIcon },
  { label: 'Notifications',  href: '/notifications',  icon: ChatIcon },
  { label: 'Upload',         href: '/upload',         icon: UploadIcon },
  { label: 'Updates',        href: '/analyses',       icon: AnalysisIcon },
  { label: 'Messages',       href: '/chat',           icon: ChatIcon },
  { label: 'Files',          href: '/documents',      icon: DocumentIcon },
  { label: 'Matters',        href: '/cases',          icon: CaseIcon },
  { label: 'Billing',        href: '/payments',       icon: PaymentIcon },
  { label: 'Settings',       href: '/settings',       icon: SettingsIcon },
]

// Five tabs shown in the mobile bottom bar (most-used)
const BOTTOM_NAV = [
  { label: 'Portal',    href: '/dashboard',    icon: DashboardIcon },
  { label: 'Discover',  href: '/discover',     icon: LawIcon },
  { label: 'Matters',   href: '/cases',        icon: CaseIcon },
  { label: 'Messages',  href: '/chat',         icon: ChatIcon },
  { label: 'Profile',   href: '/profile',      icon: UserIcon },
]

// ── Desktop sidebar ───────────────────────────────────────────────────────────

function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const pathname = usePathname()
  const router = useRouter()

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
          <span className="relative">⚖</span>
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
                  ? 'bg-gold-500/10 text-gold-300 border-gold-400/20'
                  : 'border-transparent text-neutral-300 hover:bg-white/5 hover:text-neutral-50 hover:border-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0 ${active ? 'bg-gold-500/10' : 'group-hover:bg-gold-500/10'}`}>
                <span className={`absolute inset-0 rounded-lg blur-sm transition-colors duration-200 group-hover:bg-gold-400/20 ${active ? 'bg-gold-400/15' : 'bg-gold-400/0'}`} />
                <span className={`relative transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110 ${active ? 'text-gold-300' : 'text-neutral-400 group-hover:text-gold-300'}`}>
                  <Icon width={18} height={18} />
                </span>
              </span>
              {!collapsed && <span className="relative z-10 font-medium text-sm">{item.label}</span>}
              {active && !collapsed && (
                <span className="ml-auto h-2 w-2 rounded-full bg-gold-400 shadow-[0_0_12px_rgba(201,146,58,0.7)] animate-pulse-subtle" />
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

  function handleLogout() {
    clearSession()
    router.push('/auth/login')
  }

  // Set sidebar-width to 0 on mobile so main content fills full width
  useEffect(() => {
    document.body.dataset.sidebarMode = 'mobile-collapsed'
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary-900/95 backdrop-blur-md border-t border-neutral-700/40 shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
      <div className="flex items-stretch">
        {BOTTOM_NAV.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 px-1 transition-colors duration-150 active:bg-white/5 ${
                active ? 'text-gold-400' : 'text-neutral-500'
              }`}
            >
              <span className={`flex items-center justify-center h-6 w-6 transition-transform duration-150 ${active ? 'scale-110' : ''}`}>
                <Icon width={20} height={20} />
              </span>
              <span className={`text-[9px] font-semibold uppercase tracking-wider ${active ? 'text-gold-400' : 'text-neutral-500'}`}>
                {item.label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(201,146,58,0.8)]" />
              )}
            </Link>
          )
        })}

        {/* Logout — far right */}
        <button
          onClick={handleLogout}
          className="flex-none flex flex-col items-center justify-center gap-0.5 py-2.5 px-3 text-neutral-600 active:bg-white/5 transition-colors"
        >
          <span className="flex items-center justify-center h-6 w-6">
            <LogoutIcon width={20} height={20} />
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-wider">Out</span>
        </button>
      </div>

      {/* iOS safe-area spacer */}
      <div className="h-safe-bottom bg-primary-900/95" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
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
