'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { DashboardIcon, CaseIcon, BriefcaseIcon, DocumentIcon, CalendarIcon, PaymentIcon, SettingsIcon, CollapseIcon, ExpandIcon, SunIcon, MoonIcon, UserIcon, LawIcon, LogoutIcon } from '../icons/Icons'
import { getFirmMembers, getMyFirmMemberships, type FirmMembership } from '../../lib/firmsApi'
import { clearSession } from '../../lib/authSession'

const nav = [
  { label: 'My Office', href: '/lawyer/office/me', icon: CaseIcon },
  { label: 'Dashboard', href: '/lawyer/dashboard', icon: DashboardIcon },
  { label: 'Discover', href: '/lawyer/discover', icon: LawIcon },
  { label: 'Matters', href: '/lawyer/matters', icon: CaseIcon },
  { label: 'Clients', href: '/lawyer/clients', icon: BriefcaseIcon },
  { label: 'Team', href: '/lawyer/team', icon: UserIcon },
  { label: 'Documents', href: '/lawyer/documents', icon: DocumentIcon },
  { label: 'Calendar', href: '/lawyer/calendar', icon: CalendarIcon },
  { label: 'Billing', href: '/lawyer/billing', icon: PaymentIcon },
  { label: 'Settings', href: '/lawyer/settings', icon: SettingsIcon },
]

export default function LawyerSidebar() {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    clearSession()
    router.push('/auth/lawyer-login')
  }
  const collapsed = isMobile ? !mobileOpen : desktopCollapsed
  const [associates, setAssociates] = useState<FirmMembership[]>([])
  const [isFirmAdmin, setIsFirmAdmin] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)')

    const syncViewport = () => {
      setIsMobile(mediaQuery.matches)
      if (!mediaQuery.matches) {
        setMobileOpen(false)
      }
    }

    syncViewport()
    mediaQuery.addEventListener('change', syncViewport)

    const accessToken = localStorage.getItem('access')
    const currentUserId = localStorage.getItem('authUserId')

    if (!accessToken) {
      setAssociates([])
      setIsFirmAdmin(false)
      return () => mediaQuery.removeEventListener('change', syncViewport)
    }

    let cancelled = false

    const loadAssociates = async () => {
      try {
        const memberships = await getMyFirmMemberships(accessToken)
        if (cancelled) return

        const currentMembership = memberships.find(membership => String(membership.user) === currentUserId) ?? memberships[0] ?? null
        if (!currentMembership) {
          setAssociates([])
          setIsFirmAdmin(false)
          return
        }

        setIsFirmAdmin(['owner', 'firm_admin', 'partner'].includes(currentMembership.role))

        if (['owner', 'firm_admin', 'partner'].includes(currentMembership.role)) {
          const members = await getFirmMembers(currentMembership.firm, accessToken)
          if (cancelled) return
          setAssociates(members.filter(member => String(member.user) !== String(currentUserId)))
        } else {
          setAssociates([])
        }
      } catch {
        if (!cancelled) {
          setAssociates([])
          setIsFirmAdmin(false)
        }
      }
    }

    void loadAssociates()

    return () => {
      cancelled = true
      mediaQuery.removeEventListener('change', syncViewport)
    }
  }, [])

  useEffect(() => {
    const sidebarMode = isMobile
      ? (mobileOpen ? 'mobile-open' : 'mobile-collapsed')
      : (desktopCollapsed ? 'desktop-collapsed' : 'desktop-expanded')

    document.body.dataset.sidebarMode = sidebarMode
  }, [collapsed, isMobile, mobileOpen, desktopCollapsed])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = savedTheme ?? (prefersDark ? 'dark' : 'light')
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const applyTheme = (nextTheme: 'light' | 'dark') => {
    const html = document.documentElement
    if (nextTheme === 'light') {
      html.classList.add('light-mode')
    } else {
      html.classList.remove('light-mode')
    }
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
    applyTheme(nextTheme)
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-out ${collapsed ? 'w-20 lg:w-72' : 'w-72'} bg-gradient-to-b from-primary-800 via-primary-800 to-primary-900 border-r border-neutral-700/30 shadow-2xl shadow-black/20`}
      style={{ width: 'var(--sidebar-width)' }}
    >
      <button
        onClick={() => {
          if (isMobile) {
            setMobileOpen(v => !v)
            return
          }

          setDesktopCollapsed(v => !v)
        }}
        className="absolute -right-3 top-5 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-gold-400/30 bg-primary-900 text-gold-300 shadow-lg shadow-black/30 transition-all duration-200 hover:scale-110 hover:border-gold-300 hover:text-gold-200 active:scale-95"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ExpandIcon width={16} height={16} /> : <CollapseIcon width={16} height={16} />}
      </button>

      <div className="relative flex items-center justify-between gap-3 p-4 border-b border-neutral-700/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,146,58,0.18),transparent_42%)] pointer-events-none" />
        <div className="flex items-center gap-3 relative">
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-primary-900 font-display font-bold text-sm shadow-lg shadow-gold-500/30">
            <span className="absolute inset-0 rounded-xl bg-white/30 animate-pulse-subtle" />
            <span className="relative"><LawIcon width={18} height={18} /></span>
          </div>
          {!collapsed && (
            <div>
              <div className="font-display font-semibold text-neutral-50 text-base tracking-tight">LawBridge</div>
              <div className="text-xs text-neutral-400">Firm Workspace</div>
            </div>
          )}
        </div>
      </div>

      <nav className="p-3 overflow-y-auto flex-1 space-y-1">
        {nav.map(item => {
          const IconComponent = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-body text-sm border active:scale-[0.98]
                ${isActive
                  ? 'bg-gold-500/10 text-gold-300 border-gold-400/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                  : 'border-transparent text-neutral-300 hover:bg-white/5 hover:text-neutral-50 hover:border-white/5'}
                ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0 ${isActive ? 'bg-gold-500/10' : 'bg-white/0 group-hover:bg-gold-500/10'} shadow-sm`}>
                <span className={`absolute inset-0 rounded-lg bg-gold-400/0 blur-sm transition-colors duration-200 group-hover:bg-gold-400/20 ${isActive ? 'bg-gold-400/15' : ''}`} />
                <span className={`relative transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110 ${isActive ? 'text-gold-300' : 'text-neutral-400 group-hover:text-gold-300'}`}>
                  <IconComponent width={18} height={18} />
                </span>
              </span>
              {!collapsed && <span className="relative z-10 font-medium">{item.label}</span>}
              {isActive && !collapsed && <span className="ml-auto h-2 w-2 rounded-full bg-gold-400 shadow-[0_0_12px_rgba(201,146,58,0.7)] animate-pulse-subtle" />}
            </Link>
          )
        })}

        {/* My Office sub-navigation */}
        {pathname.startsWith('/lawyer/office') && !collapsed && (
          <div className="mt-3 space-y-1 px-2">
            <div className="text-xs text-neutral-400 px-3">Office</div>
            <div className="mt-1 space-y-1">
              <Link href="/lawyer/office/me" className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/lawyer/office/me' ? 'text-gold-300' : 'text-neutral-300 hover:text-neutral-50'}`}>
                <span className="ml-1">Overview</span>
              </Link>
              <Link href="/lawyer/office/me/matters" className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/lawyer/office/me/matters' ? 'text-gold-300' : 'text-neutral-300 hover:text-neutral-50'}`}>
                <span className="ml-1">Matters</span>
              </Link>
              <Link href="/lawyer/office/me/clients" className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/lawyer/office/me/clients' ? 'text-gold-300' : 'text-neutral-300 hover:text-neutral-50'}`}>
                <span className="ml-1">Clients</span>
              </Link>
              <Link href="/lawyer/office/me/documents" className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/lawyer/office/me/documents' ? 'text-gold-300' : 'text-neutral-300 hover:text-neutral-50'}`}>
                <span className="ml-1">Documents</span>
              </Link>
              <Link href="/lawyer/office/me/calendar" className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/lawyer/office/me/calendar' ? 'text-gold-300' : 'text-neutral-300 hover:text-neutral-50'}`}>
                <span className="ml-1">Calendar</span>
              </Link>
              <Link href="/lawyer/office/me/settings" className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/lawyer/office/me/settings' ? 'text-gold-300' : 'text-neutral-300 hover:text-neutral-50'}`}>
                <span className="ml-1">Settings</span>
              </Link>
            </div>
          </div>
        )}

        {pathname.startsWith('/lawyer/office') && !collapsed && isFirmAdmin && associates.length > 0 && (
          <div className="mt-3 space-y-1 px-2">
            <div className="text-xs text-neutral-400 px-3">Associates</div>
            <div className="mt-1 space-y-1">
              {associates.map(member => (
                <Link
                  key={member.id}
                  href={`/lawyer/office/${member.user}`}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${pathname === `/lawyer/office/${member.user}` ? 'text-gold-300' : 'text-neutral-300 hover:text-neutral-50'}`}
                >
                  <span className="ml-1">{member.user_full_name ?? member.user_email ?? `User #${member.user}`}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-neutral-700/30">
        <div className={`flex ${collapsed ? 'flex-col items-center gap-3' : 'items-center gap-2'} rounded-2xl border border-white/5 bg-white/5 p-2 shadow-sm`}>
          <button
            onClick={toggleTheme}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-primary-900/40 text-neutral-300 transition-all duration-200 hover:scale-105 hover:border-gold-400/30 hover:text-gold-300 active:scale-95"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
            <span className="absolute inset-0 rounded-xl bg-gold-400/0 transition-colors duration-200 group-hover:bg-gold-400/10" />
          </button>

          <button
            className="group flex h-10 min-w-10 items-center justify-center rounded-xl border border-white/5 bg-primary-900/40 px-3 text-xs font-semibold tracking-widest text-neutral-300 transition-all duration-200 hover:scale-105 hover:border-gold-400/30 hover:text-gold-200 active:scale-95"
            aria-label="Language selector"
            title="Language"
          >
            EN
          </button>

          <Link
            href="/lawyer/profile"
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-gradient-to-br from-gold-500/25 to-gold-600/25 text-gold-300 transition-all duration-200 hover:scale-105 hover:border-gold-300/40 hover:text-gold-200 active:scale-95"
            aria-label="Open profile"
            title="Profile"
          >
            <UserIcon width={18} height={18} />
            <span className="absolute inset-0 rounded-xl bg-gold-400/0 transition-colors duration-200 group-hover:bg-gold-400/10" />
          </Link>

          <button
            onClick={handleLogout}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-primary-900/40 text-neutral-400 transition-all duration-200 hover:scale-105 hover:border-crimson-500/30 hover:text-crimson-400 active:scale-95"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogoutIcon width={18} height={18} />
            <span className="absolute inset-0 rounded-xl bg-crimson-500/0 transition-colors duration-200 group-hover:bg-crimson-500/10" />
          </button>
        </div>
      </div>
    </aside>
  )
}