'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { DashboardIcon, UsersIcon, InboxIcon, LogoutIcon, ShieldIcon, BookOpenIcon, BadgeCheckIcon, SparklesIcon, BarChart2Icon } from '../../components/icons/Icons'
import { clearSession } from '../../lib/authSession'

function BuildingIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 22V12h6v10M9 7h1M14 7h1M9 11h1M14 11h1" /></svg>
}
function CalendarCheckIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></svg>
}
function ContactIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
}
function TaskIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 10h10M7 14h6" /></svg>
}
function StarIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
}
function CrownIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 19h18M5 19l2-10 5 5 5-8 2 13" /></svg>
}
function NetworkIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" /><path d="M12 7v4M8.5 17l3.5-6 3.5 6" /></svg>
}
function HandshakeIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20.5 12.5c.83-.83.83-2.17 0-3L15 4H9L4 9v2l1.5 1.5L9 9l3 3-3 3 3 3 3-3" /><path d="M9 21l3-3" /></svg>
}
function FolderIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
}
function ChartBarIcon2() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="12" width="4" height="9" /><rect x="10" y="6" width="4" height="15" /><rect x="17" y="3" width="4" height="18" /></svg>
}
function GearIcon() {
  return <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
}

type NavItem = {
  label: string
  href: string
  icon: () => React.ReactElement
  exact?: boolean
}

type NavGroup = {
  section: string
  items: NavItem[]
}

const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    section: 'OVERVIEW',
    items: [
      { label: 'Dashboard',    href: '/admin',              icon: () => <DashboardIcon width={16} height={16} />, exact: true },
      { label: 'Intelligence', href: '/admin/intelligence', icon: () => <SparklesIcon width={16} height={16} /> },
      { label: 'Risk Monitor', href: '/admin/risks',        icon: () => <ShieldIcon width={16} height={16} /> },
      { label: 'Analytics',   href: '/admin/analytics',    icon: () => <BarChart2Icon width={16} height={16} /> },
    ],
  },
  {
    section: 'OUTREACH & PARTNERSHIPS',
    items: [
      { label: 'Firms',              href: '/admin/outreach/firms',            icon: BuildingIcon },
      { label: 'Interviews',         href: '/admin/outreach/interviews',        icon: CalendarCheckIcon },
      { label: 'Contacts',           href: '/admin/outreach/contacts',          icon: ContactIcon },
      { label: 'Tasks & Follow-ups', href: '/admin/outreach/tasks',             icon: TaskIcon },
      { label: 'Feature Requests',   href: '/admin/outreach/feature-requests',  icon: StarIcon },
    ],
  },
  {
    section: 'FOUNDING NETWORK',
    items: [
      { label: 'Founding Council',  href: '/admin/outreach/founding-council',  icon: CrownIcon },
      { label: 'Founding Network',  href: '/admin/outreach/founding-network',  icon: NetworkIcon },
      { label: 'Pilot Partners',    href: '/admin/outreach/pilot-partners',    icon: HandshakeIcon },
    ],
  },
  {
    section: 'DOCUMENTS & RESOURCES',
    items: [
      { label: 'Documents',     href: '/admin/outreach/documents',    icon: FolderIcon },
      { label: 'Analytics',     href: '/admin/outreach/analytics',    icon: ChartBarIcon2 },
    ],
  },
  {
    section: 'PLATFORM',
    items: [
      { label: 'Users',        href: '/admin/users',        icon: () => <UsersIcon width={16} height={16} /> },
      { label: 'Support Inbox',href: '/admin/support',      icon: () => <InboxIcon width={16} height={16} /> },
      { label: 'Content',      href: '/admin/content',      icon: () => <BookOpenIcon width={16} height={16} /> },
      { label: 'Verification', href: '/admin/verification', icon: () => <BadgeCheckIcon width={16} height={16} /> },
    ],
  },
  {
    section: 'SETTINGS',
    items: [
      { label: 'System Settings', href: '/admin/settings', icon: GearIcon },
    ],
  },
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

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
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

      <nav className="p-3 flex-1 overflow-y-auto space-y-4">
        {ADMIN_NAV_GROUPS.map(group => (
          <div key={group.section}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest text-neutral-600 uppercase">{group.section}</p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon
                const active = isActive(pathname, item.href, item.exact)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 border ${
                      active
                        ? 'bg-portal-soft text-portal border-portal'
                        : 'border-transparent text-neutral-400 hover:bg-white/5 hover:text-neutral-200 hover:border-white/5'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${active ? 'text-portal' : 'text-neutral-500'}`}>
                      <Icon />
                    </span>
                    <span className="font-medium text-sm truncate">{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full dot-portal flex-shrink-0" />}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
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
    document.body.dataset.portal = 'admin'
    return () => { delete document.body.dataset.portal }
  }, [])

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
    <div data-portal="admin" className="flex min-h-screen bg-[#07111a] text-neutral-50">
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
