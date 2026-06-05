'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { SearchIcon, SunIcon, MoonIcon, UserIcon } from '../icons/Icons'

export default function Navbar(){
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeNavItem, setActiveNavItem] = useState<string>('dashboard')
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null)

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Cases', href: '/cases' },
    { label: 'Documents', href: '/documents' },
    { label: 'Analytics', href: '/analyses' },
    { label: 'Team', href: '/chat' },
  ]

  useEffect(() => {
    setMounted(true)
    // Get saved theme or use system preference
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const isDark = saved 
      ? saved === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(isDark ? 'dark' : 'light')
    applyTheme(isDark ? 'dark' : 'light')

    // Handle scroll event
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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

        {/* Language Selector with Interactive Border */}
        <button className="px-3.5 py-2.5 rounded-lg bg-neutral-700/10 hover:bg-neutral-700/20 text-neutral-400 hover:text-neutral-50 border border-neutral-700/20 hover:border-neutral-700/50 transition-all duration-300 font-body text-sm font-semibold group">
          EN
        </button>

        {/* User Profile Button with Glow Effect */}
        <Link href="/profile">
          <button className="relative p-2.5 rounded-lg bg-gradient-to-br from-gold-500/40 to-gold-600/40 hover:from-gold-500/50 hover:to-gold-600/50 text-gold-300 hover:text-gold-200 border border-gold-500/40 hover:border-gold-400/60 transition-all duration-300 group shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40">
            <UserIcon className="w-5 h-5" />
            {/* Glow effect on hover */}
            <span className="absolute inset-0 rounded-lg bg-gold-400/0 group-hover:bg-gold-400/10 transition-colors duration-300 blur-sm"></span>
          </button>
        </Link>
      </div>
    </header>
  )
}
