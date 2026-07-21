'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { clearSession } from '../../lib/authSession'
import { DashboardIcon, PaymentIcon, ChartBarIcon, UsersIcon, LogoutIcon, DocumentIcon } from '../../components/icons/Icons'

const ALLOWED_ROLES = new Set(['secretary', 'firm_admin'])

const NAV = [
  { label: 'Dashboard',     href: '/secretary/dashboard',   Icon: DashboardIcon },
  { label: 'Bookings',      href: '/secretary/bookings',    Icon: DocumentIcon },
  { label: 'Intelligence',  href: '/secretary/intelligence', Icon: ChartBarIcon },
  { label: 'Client Intake', href: '/secretary/intake',      Icon: DocumentIcon },
  { label: 'Payments',      href: '/secretary/payments',    Icon: PaymentIcon },
  { label: 'Reports',       href: '/secretary/reports',     Icon: ChartBarIcon },
  { label: 'Members',       href: '/secretary/members',     Icon: UsersIcon },
]

const SIDEBAR_W = 240 // px — matches w-60

function SecretarySidebarContent({ onNav }: { onNav?: () => void }) {
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
    <div className="flex h-full flex-col bg-primary-900 border-r border-neutral-700/40">
      {/* Identity */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-700/30 flex-shrink-0">
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
        {NAV.map(({ label, href, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} onClick={onNav}
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
      <div className="px-3 py-4 border-t border-neutral-700/30 space-y-1 flex-shrink-0">
        <div className="px-3 py-2 rounded-lg bg-gold-500/5 border border-gold-500/10 mb-2">
          <p className="text-[10px] font-semibold text-gold-500/70 uppercase tracking-widest">Secretary Portal</p>
          <p className="text-[11px] text-neutral-600 mt-0.5">Firm administration only</p>
        </div>
        <button
          onClick={() => { clearSession(); router.push('/auth/lawyer-login') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-red-300 hover:bg-red-900/20 transition-colors w-full"
        >
          <LogoutIcon className="w-4 h-4 flex-shrink-0" width={16} height={16} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function SecretaryLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady]       = useState(false)
  const [drawerOpen, setDrawer] = useState(false)

  const closeDrawer = useCallback(() => setDrawer(false), [])

  useEffect(() => {
    try {
      const access = localStorage.getItem('access')
      const role   = localStorage.getItem('userRole') || ''
      if (!access || !ALLOWED_ROLES.has(role)) {
        router.replace('/auth/lawyer-login')
      } else {
        setReady(true)
      }
    } catch {
      router.replace('/auth/lawyer-login')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close mobile drawer on route change
  const pathname = usePathname()
  useEffect(() => { setDrawer(false) }, [pathname])

  if (!ready) return null

  return (
    <>
      {/* ── Desktop sidebar — fixed, always visible above lg ──────────────── */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col"
        style={{ width: SIDEBAR_W }}
      >
        <SecretarySidebarContent />
      </aside>

      {/* ── Mobile top bar — shown below lg ──────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center gap-3 px-4 bg-primary-800/95 backdrop-blur-sm border-b border-neutral-700/30 shadow-lg shadow-black/20">
        <button
          onClick={() => setDrawer(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-700/30 bg-primary-900/40 text-neutral-300 hover:text-neutral-50 hover:bg-white/10 transition-all active:scale-95"
          aria-label="Open navigation"
        >
          <svg width={18} height={18} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-primary-900 font-bold text-xs shadow-md shadow-gold-500/20">
            ⚖
          </div>
          <span className="font-display font-semibold text-neutral-50 text-sm tracking-tight">LawBridge</span>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] uppercase tracking-widest text-gold-500/60 font-semibold">Secretary</span>
        </div>
      </header>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div
            className="relative flex-shrink-0 flex flex-col"
            style={{ width: SIDEBAR_W }}
          >
            <div className="absolute top-3 right-[-48px]">
              <button
                onClick={closeDrawer}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-800/80 border border-white/10 text-neutral-400 hover:text-neutral-100 transition-colors"
                aria-label="Close navigation"
              >
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="h-full overflow-y-auto">
              <SecretarySidebarContent onNav={closeDrawer} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────────── */}
      {/* mobile: full width + top-bar offset; lg: pushed right by sidebar */}
      <div key={pathname} className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-20 lg:pt-8 overflow-x-hidden lg:ml-60 lg:w-[calc(100vw-15rem)] animate-in fade-in duration-300">
        {children}
      </div>
    </>
  )
}
