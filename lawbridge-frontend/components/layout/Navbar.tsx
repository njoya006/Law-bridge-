'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { SearchIcon, SunIcon, MoonIcon } from '../icons/Icons'
import { getLang, setLang } from '../../lib/i18n'

export default function Navbar(){
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeNavItem, setActiveNavItem] = useState<string>('dashboard')
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarInitials, setAvatarInitials] = useState('U')
  const [currentLang, setCurrentLang] = useState<'en' | 'fr'>('en')

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Cases', href: '/cases' },
    { label: 'Documents', href: '/documents' },
    { label: 'Analytics', href: '/analyses' },
    { label: 'Team', href: '/chat' },
  ]

  useEffect(() => {
    setMounted(true)

    // Load language
    setCurrentLang(getLang())
    const onLangChanged = (e: Event) => {
      setCurrentLang((e as CustomEvent<{ lang: 'en' | 'fr' }>).detail.lang)
    }
    window.addEventListener('lawbridge:lang-changed', onLangChanged)

    // Load avatar
    const cached = localStorage.getItem('avatarUrl')
    if (cached) setAvatarUrl(cached)
    const access = localStorage.getItem('access')
    if (access) {
      fetch('/api/v1/auth/me/', { headers: { Authorization: `Bearer ${access}` } })
        .then(r => r.ok ? r.json() : null)
        .then((me: { full_name?: string; email?: string; avatar_url?: string | null } | null) => {
          if (!me) return
          if (me.avatar_url) {
            setAvatarUrl(me.avatar_url)
            localStorage.setItem('avatarUrl', me.avatar_url)
          }
          const name = me.full_name || me.email || 'U'
          setAvatarInitials(name.split(/\s+/).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() || 'U')
        })
        .catch(() => {})
    }

    // Get saved theme or use system preference
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const isDark = saved 
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(isDark ? 'dark' : 'light')
    applyTheme(isDark ? 'dark' : 'light')

    // Listen for avatar updates from the profile page
    const onAvatarUpdated = (e: Event) => {
      const url = (e as CustomEvent<{ url: string }>).detail?.url
      if (url) { setAvatarUrl(url); localStorage.setItem('avatarUrl', url) }
    }
    window.addEventListener('lawbridge:avatar-updated', onAvatarUpdated)

    // Handle scroll event
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('lawbridge:lang-changed', onLangChanged)
      window.removeEventListener('lawbridge:avatar-updated', onAvatarUpdated)
      window.removeEventListener('scroll', handleScroll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyTheme = (t: 'light' | 'dark') => {
    const html = document.documentElement
    if (t === 'light') {
      html.classList.add('light-mode')
    } else {
      html.classList.remove('light-mode')
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) return null

  return (
    <header className={`fixed left-72 right-0 top-0 h-20 z-30 flex items-center justify-between px-8 transition-all duration-300 ${
      isScrolled
        ? 'bg-primary-800/50 backdrop-blur-lg border-b border-neutral-700/40 shadow-lg'
        : 'bg-transparent border-b border-transparent'
    }`}>
      {/* Left Section - Premium Navigation with Animated Indicators */}
      <div className="hidden lg:flex items-center gap-2">
        {navItems.map((item) => (
          <div
            key={item.href}
            className="relative group cursor-pointer"
            onMouseEnter={() => setHoveredNavItem(item.label)}
            onMouseLeave={() => setHoveredNavItem(null)}
          >
            <Link href={item.href}>
              <span className="px-4 py-2 text-sm font-semibold text-neutral-400 group-hover:text-gold-400 transition-colors duration-200 block relative">
                {item.label}
              </span>
            </Link>
            {/* Animated underline with gradient */}
            <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-gold-500 via-gold-400 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></div>
          </div>
        ))}
      </div>

      {/* Right Section - Search, Theme, Language, Profile */}
      <div className="flex-1 flex items-center justify-end gap-4 ml-auto">
        {/* Enhanced Search Bar with Focus State */}
        <div className="hidden md:flex items-center max-w-xs bg-neutral-700/10 hover:bg-neutral-700/20 focus-within:bg-neutral-700/30 rounded-lg px-3 py-2 group transition-all duration-300 border border-neutral-700/20 hover:border-neutral-700/40 focus-within:border-gold-500/50">
          <SearchIcon className="w-4 h-4 text-neutral-500 group-hover:text-neutral-400 group-focus-within:text-gold-400 transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg px-3 py-1.5 bg-transparent text-neutral-50 placeholder:text-neutral-600 border-none outline-none text-sm"
          />
        </div>

        {/* Theme Toggle with Pulse Effect */}
        <button
          onClick={toggleTheme}
          className="relative flex items-center justify-center p-2.5 rounded-lg bg-neutral-700/10 hover:bg-neutral-700/20 text-neutral-400 hover:text-gold-400 border border-neutral-700/20 hover:border-gold-500/50 transition-all duration-300 group"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <SunIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          ) : (
            <MoonIcon className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          )}
          {/* Subtle pulse on hover */}
          <span className="absolute inset-0 rounded-lg bg-gold-500/0 group-hover:bg-gold-500/5 transition-colors duration-300"></span>
        </button>

        {/* Language Selector */}
        <button
          onClick={() => {
            const next = currentLang === 'en' ? 'fr' : 'en'
            setLang(next)
          }}
          className="px-3.5 py-2.5 rounded-lg bg-neutral-700/10 hover:bg-neutral-700/20 text-neutral-400 hover:text-neutral-50 border border-neutral-700/20 hover:border-neutral-700/50 transition-all duration-300 font-body text-sm font-semibold"
          title={currentLang === 'en' ? 'Switch to French' : 'Passer en anglais'}
        >
          {currentLang === 'en' ? 'EN' : 'FR'}
        </button>

        {/* User Profile Button with Glow Effect */}
        <Link href="/profile">
          <button className="relative h-10 w-10 rounded-lg overflow-hidden bg-gradient-to-br from-gold-500/40 to-gold-600/40 hover:from-gold-500/50 hover:to-gold-600/50 border border-gold-500/40 hover:border-gold-400/60 transition-all duration-300 group shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 flex items-center justify-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-gold-300 text-xs font-bold">{avatarInitials}</span>
            )}
            <span className="absolute inset-0 rounded-lg bg-gold-400/0 group-hover:bg-gold-400/10 transition-colors duration-300"></span>
          </button>
        </Link>
      </div>
    </header>
  )
}
