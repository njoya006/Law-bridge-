'use client'
import React from 'react'
import Link from 'next/link'
import PublicHeader from '../../components/layout/PublicHeader'

const team = [
  {
    name: 'Njoya Medin Praise',
    role: 'Co-Founder & Lead Engineer',
    initials: 'NMP',
    bio: 'Architect of the LawBridge platform. Passionate about using technology to make quality legal services accessible across Africa. Leads product engineering, backend infrastructure, and AI integration.',
    accent: 'from-gold-400 to-gold-500',
  },
  {
    name: 'Ngeminang Precious',
    role: 'Co-Founder & Product Designer',
    initials: 'NP',
    bio: 'Leads user experience and product design at LawBridge. Focused on creating intuitive workflows that fit how Cameroonian lawyers actually practice — bijurally and bilingually.',
    accent: 'from-primary-400 to-primary-500',
  },
]

const values = [
  {
    title: 'Access to Justice',
    desc: 'We believe technology can help bridge the gap between legal professionals and the communities they serve across Cameroon and the CEMAC region.',
  },
  {
    title: 'Bijural by Design',
    desc: "LawBridge is built for Cameroon's unique dual legal tradition — supporting both Common Law and Civil Law practice seamlessly in one platform.",
  },
  {
    title: 'Privacy First',
    desc: 'Legal data is sensitive. Our platform is built with bank-grade encryption and strict access controls to protect every client and every case.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen pub-page">
      <PublicHeader />

      {/* ─── Hero ─── */}
      <section className="relative px-6 pt-40 pb-24 md:pt-52 md:pb-32 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-24 left-1/3 w-80 h-80 bg-gold-500/6 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary-600/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-gradient-to-r from-gold-500/60 to-transparent" />
            <span className="text-label-md text-gold-400/90 tracking-widest font-semibold">OUR STORY</span>
            <div className="h-px w-8 bg-gradient-to-l from-gold-500/60 to-transparent" />
          </div>
          <h1 className="font-display text-5xl md:text-6xl pub-heading font-bold leading-tight mb-8">
            Built for Africa's<br />Legal Professionals
          </h1>
          <p className="text-lg md:text-xl pub-subtext leading-relaxed max-w-2xl mx-auto">
            LawBridge was born from a simple observation: Cameroon's legal professionals deserve world-class tools that understand their unique context — bijural, bilingual, and client-focused.
          </p>
        </div>
      </section>

      {/* ─── Mission ─── */}
      <section className="px-6 py-20 pub-section-alt">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl pub-card-prominent p-10 md:p-14 text-center border border-gold-400/20">
            <div className="text-4xl mb-6">⚖</div>
            <h2 className="font-display text-3xl md:text-4xl pub-heading font-bold mb-6">Our Mission</h2>
            <p className="text-lg pub-subtext leading-relaxed max-w-2xl mx-auto">
              To empower every lawyer in Cameroon and the wider CEMAC region with intelligent, secure, and elegant tools — so they can focus on what matters most: delivering justice for their clients.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Team ─── */}
      <section className="px-6 py-24 md:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl pub-heading font-bold mb-5">Meet the Team</h2>
            <p className="text-lg pub-subtext max-w-xl mx-auto">
              Two builders passionate about legal technology and African innovation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {team.map(member => (
              <div
                key={member.name}
                className="pub-card rounded-2xl p-8 border border-[var(--border-default)] hover:border-gold-400/30 transition-all duration-300 hover:shadow-lg group"
              >
                <div className="flex items-start gap-5 mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.accent} flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                    {member.initials}
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold pub-heading">{member.name}</h3>
                    <p className="text-sm text-gold-400 font-semibold mt-1">{member.role}</p>
                  </div>
                </div>
                <p className="pub-subtext leading-relaxed text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Values ─── */}
      <section className="px-6 py-24 md:py-32 pub-section-alt">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl pub-heading font-bold mb-5">What we stand for</h2>
            <p className="pub-subtext text-lg max-w-lg mx-auto">
              The principles that guide every decision we make
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map(v => (
              <div key={v.title} className="pub-card rounded-2xl p-8 border border-[var(--border-default)] hover:border-gold-400/30 transition-all duration-300 hover:shadow-md">
                <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center mb-5">
                  <div className="w-3 h-3 rounded-full bg-gold-400" />
                </div>
                <h3 className="font-heading text-lg font-bold pub-heading mb-3">{v.title}</h3>
                <p className="pub-subtext text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-4xl pub-heading font-bold mb-6">Ready to get started?</h2>
          <p className="pub-subtext text-lg mb-10">Join the growing community of legal professionals on LawBridge.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-primary-900 font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-gold-500/20">
                Create Free Account
              </button>
            </Link>
            <Link href="/support">
              <button className="px-8 py-4 rounded-xl border border-[var(--border-default)] pub-subtext font-semibold hover:border-gold-400/50 hover:text-gold-400 transition-all duration-200">
                Contact Us
              </button>
            </Link>
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
            <Link href="/support" className="hover:text-gold-400 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
