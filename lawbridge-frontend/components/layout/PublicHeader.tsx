'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SunIcon, MoonIcon } from '../icons/Icons'

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'About', href: '/about' },
  { label: 'Support', href: '/support' },
]

export default function PublicHeader() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const isDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    const t = isDark ? 'dark' : 'light'
    setTheme(t)
    applyTheme(t)

    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const applyTheme = (t: 'light' | 'dark') => {
    if (t === 'light') document.documentElement.classList.add('light-mode')
    else document.documentElement.classList.remove('light-mode')
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    applyTheme(next)
  }

  if (!mounted) return null

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[var(--bg-base)]/90 backdrop-blur-xl border-b border-[var(--border-default)] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-primary-900 font-bold text-base shadow-lg shadow-gold-500/30">
            ⚖
          </div>
          <span className="font-display text-xl font-bold text-[var(--text-primary)]">LawBridge</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(link => {
            const isActive = link.href === '/about' || link.href === '/support'
              ? pathname === link.href
              : false
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors duration-200 ${
                  isActive
                    ? 'text-gold-400'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg text-[var(--text-secondary)] hover:text-gold-400 hover:bg-gold-500/10 transition-all duration-200"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark'
              ? <SunIcon className="w-5 h-5" />
              : <MoonIcon className="w-5 h-5" />}
          </button>

          <Link href="/auth/login">
            <button className="hidden sm:block px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-elevated)] transition-all duration-200">
              Log in
            </button>
          </Link>

          <Link href="/auth/register">
            <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-primary-900 font-semibold text-sm hover:opacity-90 active:scale-95 transition-all duration-200 shadow-md shadow-gold-500/20 whitespace-nowrap">
              Get Started
            </button>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            onClick={() => setMenuOpen(v => !v)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border-default)] bg-[var(--bg-base)]/95 backdrop-blur-xl px-6 py-4 space-y-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/auth/login" className="block" onClick={() => setMenuOpen(false)}>
            <span className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all">
              Log in
            </span>
          </Link>
        </div>
      )}
    </header>
  )
}
