'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import PublicHeader from '../../components/layout/PublicHeader'
import {
  ShieldIcon, BalanceIcon, DocumentIcon, SparklesIcon, UsersIcon, SettingsIcon,
  MailIcon, ChatIcon, PlusIcon,
} from '../../components/icons/Icons'

const faqs = [
  {
    q: 'How do I get started with LawBridge?',
    a: 'Click "Get Started" on the homepage to create a free account. You can choose to register as an individual lawyer or as part of a law firm. Setup takes less than 5 minutes.',
  },
  {
    q: 'Is my client data secure?',
    a: 'Yes. All data is encrypted at rest and in transit using AES-256 and TLS 1.3. Access is controlled by role-based permissions and every action is logged in a tamper-proof audit trail.',
  },
  {
    q: 'Does LawBridge support both Civil Law and Common Law practice?',
    a: 'Absolutely. LawBridge is bijural by design, built specifically for Cameroon\'s dual legal tradition. You can flag matters as Common Law (Anglophone), Civil Law (Francophone), or both.',
  },
  {
    q: 'Can I use LawBridge in French and English?',
    a: 'Yes. The platform supports both French and English. Language can be toggled at any time from the sidebar settings.',
  },
  {
    q: 'What is the AI assistant and how does it work?',
    a: 'The AI assistant helps you research legal questions, draft document summaries, and brainstorm arguments. It runs on a private AI model — your queries are never shared with third parties.',
  },
  {
    q: 'Can my whole law firm use LawBridge?',
    a: 'Yes. Law firm accounts support multiple users with different roles (senior partner, associate, paralegal, etc.). Contact us for team pricing.',
  },
  {
    q: 'How do I invite colleagues to my firm account?',
    a: 'From the Admin panel, go to "Manage Seats" and enter your colleague\'s email address. They will receive an invitation link to join your firm workspace.',
  },
  {
    q: 'I found a bug or something is not working. What do I do?',
    a: 'We apologise for the inconvenience. Please use the contact form below or email us directly. Describe what you were doing, what you expected, and what happened instead. Screenshots are helpful.',
  },
]

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`pub-card rounded-xl border transition-all duration-300 ${open ? 'border-gold-400/40' : 'border-[var(--border-default)]'}`}>
      <button
        className="w-full flex items-center justify-between gap-4 p-6 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className="font-heading font-semibold pub-heading text-base leading-snug">{q}</span>
        <span className={`shrink-0 w-6 h-6 rounded-full border border-[var(--border-default)] flex items-center justify-center transition-transform duration-200 ${open ? 'rotate-45 border-gold-400 text-gold-400' : 'text-[var(--text-tertiary)]'}`}>
          <PlusIcon width={14} height={14} className="w-3.5 h-3.5" />
        </span>
      </button>
      {open && (
        <div className="px-6 pb-6 pt-0">
          <p className="pub-subtext leading-relaxed text-sm">{a}</p>
        </div>
      )}
    </div>
  )
}

const categories = [
  { Icon: ShieldIcon,   title: 'Account & Security', desc: 'Password resets, two-factor auth, access control' },
  { Icon: BalanceIcon,  title: 'Cases & Matters', desc: 'Creating cases, assigning lawyers, tracking status' },
  { Icon: DocumentIcon, title: 'Documents', desc: 'Uploading, sharing, and organising files' },
  { Icon: SparklesIcon, title: 'AI Assistant', desc: 'Using the AI for research, drafting, and analysis' },
  { Icon: UsersIcon,    title: 'Team & Billing', desc: 'Firm accounts, invites, invoicing, payments' },
  { Icon: SettingsIcon, title: 'Technical Issues', desc: 'Bugs, errors, and performance problems' },
]

export default function SupportPage() {
  return (
    <div className="min-h-screen pub-page">
      <PublicHeader />

      {/* ─── Hero ─── */}
      <section className="relative px-6 pt-40 pb-20 md:pt-52 md:pb-28 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-32 right-1/3 w-72 h-72 bg-gold-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-gradient-to-r from-gold-500/60 to-transparent" />
            <span className="text-label-md text-gold-400/90 tracking-widest font-semibold">HELP CENTER</span>
            <div className="h-px w-8 bg-gradient-to-l from-gold-500/60 to-transparent" />
          </div>
          <h1 className="font-display text-5xl md:text-6xl pub-heading font-bold leading-tight mb-6">
            How can we help?
          </h1>
          <p className="text-lg pub-subtext leading-relaxed max-w-xl mx-auto">
            Find answers to common questions or reach out to our team directly.
          </p>
        </div>
      </section>

      {/* ─── Categories ─── */}
      <section className="px-6 py-16 pub-section-alt">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl pub-heading font-bold text-center mb-12">Browse by topic</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {categories.map((cat, i) => (
              <div
                key={cat.title}
                className="stagger-child pub-card rounded-2xl p-6 border border-[var(--border-default)] hover:border-gold-400/40 hover:shadow-md transition-all duration-300 cursor-default group"
                style={{ '--i': i } as React.CSSProperties}
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-200 inline-flex w-10 h-10 rounded-xl bg-gold-500/15 text-gold-400 items-center justify-center"><cat.Icon width={20} height={20} /></div>
                <h3 className="font-heading font-bold pub-heading text-base mb-2">{cat.title}</h3>
                <p className="pub-muted text-xs leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="px-6 py-24 md:py-32">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl pub-heading font-bold mb-5">Frequently Asked Questions</h2>
            <p className="pub-subtext text-lg">Answers to questions we hear most often</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQ key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact ─── */}
      <section className="px-6 py-24 pub-section-alt">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl pub-heading font-bold mb-5">Still need help?</h2>
            <p className="pub-subtext text-lg">Our team typically responds within one business day.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="pub-card rounded-2xl p-8 border border-[var(--border-default)] text-center hover:border-gold-400/30 hover:shadow-md transition-all duration-300">
              <div className="mb-4 mx-auto w-12 h-12 rounded-2xl bg-gold-500/15 text-gold-400 flex items-center justify-center"><MailIcon width={24} height={24} /></div>
              <h3 className="font-heading font-bold pub-heading text-lg mb-2">Email Us</h3>
              <p className="pub-muted text-sm mb-4">Send us a message any time</p>
              <a
                href="mailto:support@lawbridge.cm"
                className="text-gold-400 font-semibold text-sm hover:text-gold-300 transition-colors"
              >
                support@lawbridge.cm
              </a>
            </div>
            <div className="pub-card rounded-2xl p-8 border border-[var(--border-default)] text-center hover:border-gold-400/30 hover:shadow-md transition-all duration-300">
              <div className="mb-4 mx-auto w-12 h-12 rounded-2xl bg-gold-500/15 text-gold-400 flex items-center justify-center"><ChatIcon width={24} height={24} /></div>
              <h3 className="font-heading font-bold pub-heading text-lg mb-2">In-App Chat</h3>
              <p className="pub-muted text-sm mb-4">Already a user? Chat with us inside the platform</p>
              <Link href="/auth/login">
                <button className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 text-primary-900 font-semibold text-sm hover:opacity-90 transition-opacity shadow-md">
                  Open App
                </button>
              </Link>
            </div>
          </div>

          {/* Simple contact form */}
          <div className="pub-card rounded-2xl p-8 md:p-10 border border-[var(--border-default)]">
            <h3 className="font-heading font-bold pub-heading text-xl mb-6">Send a message</h3>
            <form className="space-y-5" onSubmit={e => { e.preventDefault(); alert('Message sent! We will get back to you soon.') }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold pub-subtext mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="pub-input w-full rounded-xl border border-[var(--border-default)] px-4 py-3 text-sm pub-heading placeholder:text-[var(--text-tertiary)] outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/10 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold pub-subtext mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="pub-input w-full rounded-xl border border-[var(--border-default)] px-4 py-3 text-sm pub-heading placeholder:text-[var(--text-tertiary)] outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/10 transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold pub-subtext mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="What is your question about?"
                  className="pub-input w-full rounded-xl border border-[var(--border-default)] px-4 py-3 text-sm pub-heading placeholder:text-[var(--text-tertiary)] outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/10 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold pub-subtext mb-2">Message</label>
                <textarea
                  rows={5}
                  placeholder="Describe your issue or question..."
                  className="pub-input w-full rounded-xl border border-[var(--border-default)] px-4 py-3 text-sm pub-heading placeholder:text-[var(--text-tertiary)] outline-none focus:border-gold-400/60 focus:ring-2 focus:ring-gold-400/10 transition-all resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-primary-900 font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-md shadow-gold-500/20"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="pub-footer border-t border-[var(--border-default)] px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-primary-900 font-bold text-xs">⚖</div>
            <span className="font-display text-base font-bold pub-heading">LawBridge</span>
          </div>
          <p className="text-sm pub-muted">&copy; 2026 LawBridge. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm pub-muted">
            <Link href="/" className="hover:text-gold-400 transition-colors">Home</Link>
            <Link href="/about" className="hover:text-gold-400 transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
