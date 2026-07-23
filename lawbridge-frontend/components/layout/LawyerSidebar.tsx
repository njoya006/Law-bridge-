'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  DashboardIcon, DocumentIcon, CalendarIcon, PaymentIcon, SettingsIcon,
  CollapseIcon, ExpandIcon, SunIcon, MoonIcon, LawIcon, LogoutIcon,
  BookOpenIcon, SparklesIcon, UsersIcon, BuildingIcon, CompassIcon,
  ClipboardIcon, BookmarkIcon, BadgeCheckIcon, SlidersIcon, PencilIcon,
  BarChart2Icon, TeamIcon, ChatIcon, BellIcon,
  NetworkIcon, ActivityIcon, HandshakeIcon, ReferralIcon, TrophyIcon,
  GavelIcon, TrendingUpIcon, UserPlusIcon, BriefcaseStarIcon,
} from '../icons/Icons'
import { getFirmMembers, getMyFirmMemberships, type FirmMembership } from '../../lib/firmsApi'
import { getReportRequests } from '../../lib/monitoringApi'
import { clearSession } from '../../lib/authSession'

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ width?: number; height?: number; className?: string }>
}
type NavSection = { heading?: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Home',
    items: [
      { label: 'My Office',     href: '/lawyer/office/me', icon: BuildingIcon },
      { label: 'Dashboard',     href: '/lawyer/dashboard', icon: DashboardIcon },
      { label: 'Bookings',      href: '/lawyer/bookings',  icon: BookmarkIcon },
      { label: 'Messages',      href: '/messages',          icon: ChatIcon },
      { label: 'Notifications', href: '/notifications',     icon: BellIcon },
      { label: 'Calendar',      href: '/lawyer/calendar',  icon: CalendarIcon },
    ],
  },
  {
    heading: 'Practice',
    items: [
      { label: 'Matters',      href: '/lawyer/matters',   icon: ClipboardIcon },
      { label: 'Clients',      href: '/lawyer/clients',   icon: UsersIcon },
      { label: 'Documents',    href: '/lawyer/documents', icon: DocumentIcon },
      { label: 'AI Assistant', href: '/lawyer/ai',        icon: SparklesIcon },
      { label: 'Case Triage',  href: '/lawyer/triage',    icon: SlidersIcon },
    ],
  },
  {
    heading: 'Network ★',
    items: [
      { label: 'Feed',          href: '/lawyer/network/feed',         icon: ActivityIcon },
      { label: 'Mentorship',    href: '/lawyer/network/mentorship',   icon: TeamIcon },
      { label: 'Partnerships',  href: '/lawyer/network/partnerships', icon: HandshakeIcon },
      { label: 'Referrals',     href: '/lawyer/network/referrals',    icon: ReferralIcon },
      { label: 'Following',     href: '/lawyer/network/following',    icon: UserPlusIcon },
    ],
  },
  {
    heading: 'Knowledge',
    items: [
      { label: 'Library',         href: '/library',                        icon: BookOpenIcon },
      { label: 'My Publications', href: '/lawyer/library',                 icon: PencilIcon },
      { label: 'Judgments',       href: '/lawyer/knowledge/judgments',     icon: GavelIcon },
      { label: 'Bookmarks',       href: '/lawyer/knowledge/bookmarks',     icon: BookmarkIcon },
    ],
  },
  {
    heading: 'Growth',
    items: [
      { label: 'Discover',      href: '/lawyer/discover',           icon: CompassIcon },
      { label: 'Analytics',     href: '/lawyer/growth/analytics',   icon: TrendingUpIcon },
      { label: 'Court Intel',   href: '/lawyer/growth/court-intel', icon: GavelIcon },
      { label: 'Opportunities', href: '/lawyer/growth/opportunities', icon: BriefcaseStarIcon },
      { label: 'Awards',        href: '/lawyer/growth/awards',      icon: TrophyIcon },
      { label: 'Get Verified',  href: '/lawyer/verify',             icon: BadgeCheckIcon },
    ],
  },
  {
    heading: 'Firm',
    items: [
      { label: 'Team',     href: '/lawyer/team',     icon: TeamIcon },
      { label: 'Reports',  href: '/lawyer/reports',  icon: BarChart2Icon },
      { label: 'Billing',  href: '/lawyer/billing',  icon: PaymentIcon },
      { label: 'Settings', href: '/lawyer/settings', icon: SettingsIcon },
    ],
  },
]

// Flat list of all items for badge lookups
const ALL_ITEMS = NAV_SECTIONS.flatMap(s => s.items)

export default function LawyerSidebar() {
  const [desktopCollapsed, setDesktopCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen]             = useState(false)
  const [theme, setTheme]                       = useState<'light' | 'dark'>('dark')
  const [isMobile, setIsMobile]                 = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  const [avatarUrl, setAvatarUrl]         = useState<string | null>(null)
  const [avatarInitials, setAvatarInitials] = useState('L')
  const [displayName, setDisplayName]     = useState('')
  const [associates, setAssociates]       = useState<FirmMembership[]>([])
  const [isFirmAdmin, setIsFirmAdmin]     = useState(false)
  const [pendingReports, setPendingReports] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)

  const collapsed = isMobile ? !mobileOpen : desktopCollapsed

  function handleLogout() {
    clearSession()
    router.push('/auth/lawyer-login')
  }

  function closeMobile() { if (isMobile) setMobileOpen(false) }

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

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const syncVP = () => { setIsMobile(mq.matches); if (!mq.matches) setMobileOpen(false) }
    syncVP()
    mq.addEventListener('change', syncVP)

    const openSidebar = () => setMobileOpen(true)
    window.addEventListener('lawbridge:open-sidebar', openSidebar)

    const token = localStorage.getItem('access')
    const uid   = localStorage.getItem('authUserId')
    const cached = localStorage.getItem('avatarUrl')
    if (cached) setAvatarUrl(cached)

    // Theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initTheme = savedTheme ?? (prefersDark ? 'dark' : 'light')
    setTheme(initTheme)
    applyTheme(initTheme)

    if (!token) {
      return () => { mq.removeEventListener('change', syncVP); window.removeEventListener('lawbridge:open-sidebar', openSidebar) }
    }

    // Avatar update listener
    const onAvatarUpdated = (e: Event) => {
      const url = (e as CustomEvent<{ url: string }>).detail?.url
      if (url) { setAvatarUrl(url); localStorage.setItem('avatarUrl', url) }
    }
    window.addEventListener('lawbridge:avatar-updated', onAvatarUpdated)

    // Fetch user profile
    fetch('/api/v1/auth/me/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((me: { full_name?: string; email?: string; avatar_url?: string | null } | null) => {
        if (!me) return
        const name = me.full_name || me.email || ''
        setDisplayName(name.split('@')[0])
        setAvatarInitials(name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'L')
        if (me.avatar_url) { setAvatarUrl(me.avatar_url); localStorage.setItem('avatarUrl', me.avatar_url) }
      })
      .catch(() => {})

    let cancelled = false

    // Load firm members + badges
    const loadFirm = async () => {
      try {
        const memberships = await getMyFirmMemberships(token)
        if (cancelled) return
        const me = memberships.find(m => String(m.user) === uid) ?? memberships[0] ?? null
        if (!me) return
        setIsFirmAdmin(['owner', 'firm_admin', 'partner'].includes(me.role))
        if (['owner', 'firm_admin', 'partner'].includes(me.role)) {
          const members = await getFirmMembers(me.firm, token)
          if (!cancelled) setAssociates(members.filter(m => String(m.user) !== String(uid)))
        }
        try {
          const raw = await getReportRequests(me.firm, token)
          const items = Array.isArray(raw) ? raw : (raw as { results?: unknown[] }).results ?? []
          const unread = (items as { status: string }[]).filter(r => r.status === 'delivered' || r.status === 'pending').length
          if (!cancelled) setPendingReports(unread)
        } catch { /* non-fatal */ }
      } catch { /* non-fatal */ }
    }
    void loadFirm()

    // Unread messages — poll every 30s
    const fetchUnread = () => {
      fetch('/api/v1/messages/threads/', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : [])
        .then((threads: Array<{ unread_count?: number }>) => {
          if (!cancelled) setUnreadMessages(threads.reduce((s, t) => s + (t.unread_count ?? 0), 0))
        })
        .catch(() => {})
    }
    fetchUnread()
    const msgInterval = setInterval(fetchUnread, 30_000)

    return () => {
      cancelled = true
      clearInterval(msgInterval)
      mq.removeEventListener('change', syncVP)
      window.removeEventListener('lawbridge:open-sidebar', openSidebar)
      window.removeEventListener('lawbridge:avatar-updated', onAvatarUpdated)
    }
  }, [])

  useEffect(() => {
    document.body.dataset.sidebarMode = isMobile
      ? (mobileOpen ? 'mobile-open' : 'mobile-collapsed')
      : (desktopCollapsed ? 'desktop-collapsed' : 'desktop-expanded')
  }, [collapsed, isMobile, mobileOpen, desktopCollapsed])

  function getBadge(href: string) {
    if (href === '/lawyer/reports' && pendingReports > 0) return pendingReports
    if (href === '/messages' && unreadMessages > 0) return unreadMessages
    return 0
  }

  function NavLink({ item }: { item: NavItem }) {
    const Icon    = item.icon
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
    const badge   = getBadge(item.href)
    return (
      <Link
        href={item.href}
        onClick={closeMobile}
        title={collapsed ? item.label : undefined}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 active:scale-[0.98]
          ${collapsed ? 'justify-center' : ''}
          ${isActive
            ? 'bg-gold-500/10 text-gold-300'
            : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-100'
          }`}
      >
        {/* Gold left accent bar on active */}
        {isActive && !collapsed && (
          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gold-400 shadow-[0_0_8px_rgba(212,168,67,0.6)]" />
        )}

        {/* Icon container */}
        <span className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-150
          ${isActive ? 'bg-gold-500/15 text-gold-300' : 'text-neutral-500 group-hover:text-gold-400 group-hover:bg-white/5'}`}>
          <Icon width={16} height={16} />
          {badge > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-crimson-500 text-[9px] font-bold text-white shadow-lg ring-2 ring-primary-900">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </span>

        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {badge > 0 && (
              <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-crimson-500 px-1 text-[10px] font-bold text-white">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
            {isActive && badge === 0 && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-400 shadow-[0_0_6px_rgba(212,168,67,0.8)]" />
            )}
          </>
        )}
      </Link>
    )
  }

  const SidebarInner = (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-out
        ${isMobile ? 'w-72' : desktopCollapsed ? 'w-20' : 'w-72'}
        ${isMobile ? (mobileOpen ? 'translate-x-0 shadow-[4px_0_40px_rgba(0,0,0,0.5)]' : '-translate-x-full') : 'translate-x-0'}
        bg-primary-900 border-r border-white/[0.06]`}
      style={{
        background: 'linear-gradient(180deg, #0d1829 0%, #0B1426 40%, #091020 100%)',
      }}
    >
      {/* Desktop collapse toggle */}
      {!isMobile && (
        <button
          onClick={() => setDesktopCollapsed(v => !v)}
          className="absolute -right-3.5 top-6 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-primary-800 text-neutral-400 shadow-lg transition-all duration-200 hover:border-gold-500/40 hover:text-gold-300 active:scale-95"
          aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {desktopCollapsed ? <ExpandIcon width={13} height={13} /> : <CollapseIcon width={13} height={13} />}
        </button>
      )}

      {/* Header */}
      <div className="relative flex items-center justify-between gap-2 px-4 py-5 overflow-hidden flex-shrink-0">
        {/* Subtle gold gradient bloom */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_0%_0%,rgba(212,168,67,0.12),transparent_70%)]" />

        <div className="relative flex items-center gap-3 min-w-0">
          <div className="relative h-9 w-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-[0_0_20px_rgba(212,168,67,0.35)] text-primary-900">
            <LawIcon width={17} height={17} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-display font-semibold text-neutral-50 text-[15px] tracking-tight leading-none">LawBridge</p>
              <p className="text-[10px] text-neutral-600 tracking-[0.12em] uppercase mt-0.5">Firm Workspace</p>
            </div>
          )}
        </div>

        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-200 hover:bg-white/8 transition-all"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-3' : ''}>
            {section.heading && !collapsed && (
              <p className="px-3 pb-1.5 pt-2 text-[9.5px] font-bold uppercase tracking-[0.18em] text-neutral-700">
                {section.heading}
              </p>
            )}
            {collapsed && si > 0 && (
              <div className="mx-3 my-2 border-t border-white/[0.06]" />
            )}
            {section.items.map(item => <NavLink key={item.href} item={item} />)}
          </div>
        ))}

        {/* My Office sub-nav */}
        {pathname.startsWith('/lawyer/office') && !collapsed && (
          <div className="mt-2 ml-4 pl-3 border-l border-white/[0.06] space-y-0.5">
            {[
              { href: '/lawyer/office/me',           label: 'Overview' },
              { href: '/lawyer/office/me/matters',    label: 'Matters' },
              { href: '/lawyer/office/me/clients',    label: 'Clients' },
              { href: '/lawyer/office/me/documents',  label: 'Documents' },
              { href: '/lawyer/office/me/calendar',   label: 'Calendar' },
              { href: '/lawyer/office/me/settings',   label: 'Settings' },
            ].map(sub => (
              <Link key={sub.href} href={sub.href} onClick={closeMobile}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                  pathname === sub.href ? 'text-gold-300' : 'text-neutral-500 hover:text-neutral-200'
                }`}>
                <span className={`h-1 w-1 rounded-full flex-shrink-0 ${pathname === sub.href ? 'bg-gold-400' : 'bg-neutral-700'}`} />
                {sub.label}
              </Link>
            ))}
          </div>
        )}

        {/* Associates (firm admins only) */}
        {pathname.startsWith('/lawyer/office') && !collapsed && isFirmAdmin && associates.length > 0 && (
          <div className="mt-3 ml-4 pl-3 border-l border-white/[0.06]">
            <p className="px-2.5 pb-1 text-[9.5px] font-bold uppercase tracking-[0.16em] text-neutral-700">Associates</p>
            {associates.map(member => (
              <Link key={member.id} href={`/lawyer/office/${member.user}`} onClick={closeMobile}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                  pathname === `/lawyer/office/${member.user}` ? 'text-gold-300' : 'text-neutral-500 hover:text-neutral-200'
                }`}>
                <span className="h-5 w-5 flex-shrink-0 rounded-full bg-primary-700 border border-white/10 flex items-center justify-center text-[8px] text-neutral-400 font-bold">
                  {(member.user_full_name ?? member.user_email ?? '?').slice(0, 1).toUpperCase()}
                </span>
                <span className="truncate">{member.user_full_name ?? member.user_email ?? `User #${member.user}`}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-2 py-3">
        {!collapsed && displayName && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <p className="text-[11px] font-semibold text-neutral-200 truncate">{displayName}</p>
            <p className="text-[10px] text-neutral-600 tracking-wide">Lawyer Account</p>
          </div>
        )}
        <div className={`flex ${collapsed ? 'flex-col items-center gap-2' : 'items-center gap-1.5'}`}>
          {/* Theme toggle */}
          <button onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-neutral-500 transition-all hover:border-gold-500/25 hover:text-gold-300 hover:bg-gold-500/8 active:scale-95">
            {theme === 'dark' ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
          </button>

          {/* Profile */}
          <Link href="/lawyer/profile" onClick={closeMobile} title="Profile"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden text-neutral-500 transition-all hover:border-gold-500/25 active:scale-95">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gold-500/20 to-gold-700/20 text-gold-300 text-[11px] font-bold">
                {avatarInitials}
              </span>
            )}
          </Link>

          {/* Language */}
          <button title="Language"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-[10px] font-bold tracking-widest text-neutral-500 transition-all hover:border-gold-500/25 hover:text-gold-300 active:scale-95">
            EN
          </button>

          {/* Logout */}
          <button onClick={handleLogout} title="Sign out"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-neutral-600 transition-all hover:border-crimson-500/30 hover:bg-crimson-500/8 hover:text-crimson-400 active:scale-95">
            <LogoutIcon width={16} height={16} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-[3px]" onClick={() => setMobileOpen(false)} aria-hidden />
      )}
      {SidebarInner}
    </>
  )
}
