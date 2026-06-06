'use client'
import React from 'react'
import Link from 'next/link'
import PublicHeader from '../components/layout/PublicHeader'
import { CaseIcon, AnalysisIcon, ChatIcon, DocumentIcon, PaymentIcon, LawIcon, ArrowRightIcon } from '../components/icons/Icons'

const features = [
  {
    icon: CaseIcon,
    title: 'Case Management',
    desc: 'Organise and track every case with precision. Powerful tools built for the demands of African legal practice.',
    accent: 'from-gold-500 to-gold-600',
    border: 'hover:border-gold-400/50',
  },
  {
    icon: AnalysisIcon,
    title: 'AI Legal Research',
    desc: 'Intelligent research powered by AI. Surface relevant precedents, statutes, and arguments in seconds.',
    accent: 'from-emerald-500 to-emerald-600',
    border: 'hover:border-emerald-400/50',
  },
  {
    icon: ChatIcon,
    title: 'Team Collaboration',
    desc: 'Real-time collaboration with your firm. Share updates, assign tasks, and stay aligned on every matter.',
    accent: 'from-primary-500 to-primary-600',
    border: 'hover:border-primary-400/50',
  },
  {
    icon: DocumentIcon,
    title: 'Document Vault',
    desc: 'Secure, encrypted storage with full audit trails. Access any document instantly, from anywhere.',
    accent: 'from-amber-500 to-amber-600',
    border: 'hover:border-amber-400/50',
  },
  {
    icon: PaymentIcon,
    title: 'Billing & Invoicing',
    desc: 'Track time, generate invoices, and manage client payments — all in one place.',
    accent: 'from-crimson-500 to-crimson-600',
    border: 'hover:border-crimson-400/50',
  },
  {
    icon: LawIcon,
    title: 'Enterprise Security',
    desc: 'Bank-grade encryption, role-based access control, and compliance standards built for legal data.',
    accent: 'from-gold-600 to-amber-500',
    border: 'hover:border-gold-400/50',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen pub-page">
      <PublicHeader />

      {/* ─── Hero ─── */}
      <section className="relative px-6 pt-40 pb-32 md:pt-52 md:pb-44 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-24 right-1/4 w-96 h-96 bg-gold-500/6 rounded-full blur-3xl" />
          <div className="absolute bottom-16 left-1/4 w-80 h-80 bg-primary-600/6 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 mb-8 animate-fade-in">
            <div className="h-px w-8 bg-gradient-to-r from-gold-500/60 to-transparent" />
            <span className="text-label-md text-gold-400/90 tracking-widest font-semibold">LEGAL EXCELLENCE FOR AFRICA</span>
            <div className="h-px w-8 bg-gradient-to-l from-gold-500/60 to-transparent" />
          </div>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl pub-heading font-bold leading-tight mb-8 animate-fade-up">
            Reimagined<br />Legal Practice
          </h1>

          <p className="text-xl md:text-2xl pub-subtext max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-up animation-delay-100">
            Enterprise-grade legal management for Cameroon's elite legal professionals — bijural, bilingual, and built for growth.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 animate-fade-up animation-delay-200">
            <Link href="/auth/register">
              <button className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-primary-900 font-bold text-lg hover:opacity-90 active:scale-95 transition-all duration-200 shadow-xl shadow-gold-500/25">
                Get Started Free
                <ArrowRightIcon width={20} height={20} />
              </button>
            </Link>
            <Link href="#features">
              <button className="px-8 py-4 rounded-xl border border-[var(--border-default)] pub-subtext font-semibold text-lg hover:border-gold-400/50 hover:text-gold-400 transition-all duration-200">
                See Features
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: '2K+', label: 'Professionals' },
              { value: '5K+', label: 'Cases Managed' },
              { value: '98%', label: 'Satisfaction' },
            ].map(stat => (
              <div key={stat.label} className="space-y-1">
                <div className="text-4xl md:text-5xl font-bold text-gold-400">{stat.value}</div>
                <p className="pub-muted text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="px-6 py-32 md:py-44 pub-section-alt">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl md:text-5xl pub-heading font-bold mb-5">
              Everything your firm needs
            </h2>
            <p className="text-lg pub-subtext max-w-xl mx-auto">
              A complete platform built around how Cameroonian lawyers actually work
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div
                key={f.title}
                className={`group pub-card rounded-2xl p-8 space-y-4 border border-[var(--border-default)] transition-all duration-300 cursor-default ${f.border} hover:shadow-lg hover:-translate-y-0.5`}
              >
                <div className={`w-13 h-13 bg-gradient-to-br ${f.accent} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 text-white shadow-md`}
                  style={{ width: 52, height: 52 }}>
                  <f.icon width={26} height={26} />
                </div>
                <h3 className="font-heading text-lg font-bold pub-heading">{f.title}</h3>
                <p className="pub-subtext leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 py-32 md:py-44 text-center relative overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-gold-500/3 to-transparent" />
        </div>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl pub-heading font-bold mb-6">
            Ready to transform your practice?
          </h2>
          <p className="text-lg pub-subtext mb-10 max-w-xl mx-auto leading-relaxed">
            Join leading legal professionals across Cameroon and the CEMAC region
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-primary-900 font-bold text-lg hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-gold-500/25">
                Start Free Trial
              </button>
            </Link>
            <Link href="/support">
              <button className="px-8 py-4 rounded-xl border border-[var(--border-default)] pub-subtext font-semibold text-lg hover:border-gold-400/50 hover:text-gold-400 transition-all duration-200">
                Talk to Us
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="pub-footer border-t border-[var(--border-default)] px-6 py-14">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-primary-900 font-bold text-sm">⚖</div>
                <span className="font-display text-lg font-bold pub-heading">LawBridge</span>
              </div>
              <p className="text-sm pub-muted leading-relaxed">
                Legal technology built for Africa's legal professionals.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gold-400 mb-4 tracking-wide uppercase">Product</h4>
              <ul className="space-y-2.5 text-sm pub-muted">
                <li><Link href="/#features" className="hover:text-gold-400 transition-colors">Features</Link></li>
                <li><Link href="/auth/login" className="hover:text-gold-400 transition-colors">Dashboard</Link></li>
                <li><Link href="/auth/register" className="hover:text-gold-400 transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gold-400 mb-4 tracking-wide uppercase">Company</h4>
              <ul className="space-y-2.5 text-sm pub-muted">
                <li><Link href="/about" className="hover:text-gold-400 transition-colors">About Us</Link></li>
                <li><Link href="/support" className="hover:text-gold-400 transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gold-400 mb-4 tracking-wide uppercase">Legal</h4>
              <ul className="space-y-2.5 text-sm pub-muted">
                <li><span className="cursor-default">Privacy Policy</span></li>
                <li><span className="cursor-default">Terms of Service</span></li>
                <li><span className="cursor-default">Security</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[var(--border-default)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm pub-muted">&copy; 2026 LawBridge. All rights reserved.</p>
            <p className="text-sm pub-muted">Built with care for Cameroonian legal professionals.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
