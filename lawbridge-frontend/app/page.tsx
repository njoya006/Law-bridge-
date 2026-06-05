'use client'
import React from 'react'
import Link from 'next/link'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { CaseIcon, AnalysisIcon, ChatIcon, DocumentIcon, PaymentIcon, LawIcon, ArrowRightIcon } from '../components/icons/Icons'

export default function Home(){
  return (
    <main className="min-h-screen w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-40 lg:py-52">
        {/* Minimal background */}
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute top-20 right-10 w-72 h-72 bg-gold-500/5 rounded-full blur-2xl" />
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-primary-600/5 rounded-full blur-2xl" />
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Tagline */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
            <div className="h-px w-8 bg-gradient-to-r from-gold-500/60 to-transparent" />
            <span className="text-label-md text-gold-400/80 tracking-widest">LEGAL EXCELLENCE</span>
            <div className="h-px w-8 bg-gradient-to-l from-gold-500/60 to-transparent" />
          </div>

          {/* Main headline - Extra Bold */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-center leading-tight font-bold mb-10 text-neutral-50 animate-fade-up">
            Reimagined Legal Practice
          </h1>

          {/* Subheader - Generous whitespace */}
          <p className="text-center text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto mb-16 leading-relaxed animate-fade-up animation-delay-100">
            Enterprise-grade legal management for Africa's elite professionals
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-24 animate-fade-up animation-delay-200">
            <Link href="/auth/login">
              <Button size="lg" variant="gold" className="text-lg px-8 py-3">
                Get Started
                <ArrowRightIcon width={20} height={20} />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Stats - Cleaner layout with more spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 text-center">
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold text-gold-400">2K+</div>
              <p className="text-neutral-500 text-lg">Active Professionals</p>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold text-gold-400">5K+</div>
              <p className="text-neutral-500 text-lg">Cases Managed</p>
            </div>
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold text-gold-400">98%</div>
              <p className="text-neutral-500 text-lg">Satisfaction</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Cleaner with more whitespace */}
      <section id="features" className="relative px-6 py-32 md:py-48 bg-gradient-to-b from-primary-800/0 to-primary-800/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="font-display text-5xl md:text-6xl text-neutral-50 mb-6 font-bold">
              Powerful Features
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Everything you need to manage legal practice efficiently
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <Card className="group p-8 space-y-4 hover:border-gold-400/60 cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-br from-gold-500 to-gold-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform text-neutral-900">
                <CaseIcon width={28} height={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-neutral-50">Case Management</h3>
              <p className="text-neutral-400 leading-relaxed">
                Organize and track every case with precision. Powerful tools designed for legal practice.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="group p-8 space-y-4 hover:border-emerald-400/60 cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform text-neutral-900">
                <AnalysisIcon width={28} height={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-neutral-50">AI Research</h3>
              <p className="text-neutral-400 leading-relaxed">
                Intelligent legal research powered by AI. Find precedents in seconds.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="group p-8 space-y-4 hover:border-primary-400/60 cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform text-neutral-900">
                <ChatIcon width={28} height={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-neutral-50">Collaboration</h3>
              <p className="text-neutral-400 leading-relaxed">
                Real-time collaboration with your team. Share and update instantly.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="group p-8 space-y-4 hover:border-amber-400/60 cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform text-neutral-900">
                <DocumentIcon width={28} height={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-neutral-50">Documents</h3>
              <p className="text-neutral-400 leading-relaxed">
                Secure storage with full audit trails and compliance built-in.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="group p-8 space-y-4 hover:border-crimson-400/60 cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-br from-crimson-500 to-crimson-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform text-neutral-900">
                <PaymentIcon width={28} height={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-neutral-50">Billing</h3>
              <p className="text-neutral-400 leading-relaxed">
                Track time and manage billing with comprehensive analytics.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="group p-8 space-y-4 hover:border-gold-400/60 cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-br from-gold-600 to-amber-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform text-neutral-900">
                <LawIcon width={28} height={28} />
              </div>
              <h3 className="font-heading text-xl font-bold text-neutral-50">Security</h3>
              <p className="text-neutral-400 leading-relaxed">
                Enterprise security with encryption and compliance standards.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Minimalist design */}
      <section className="relative px-6 py-32 md:py-48 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-5xl md:text-6xl text-neutral-50 mb-8 font-bold">
            Ready to transform?
          </h2>
          <p className="text-xl text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join leading legal professionals across Africa
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/auth/login">
              <Button size="lg" variant="gold" className="text-lg px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="#contact">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-700 px-6 py-12 bg-primary-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-heading text-body-sm text-gold-400 mb-4">Product</h4>
              <ul className="space-y-2 text-body-sm text-neutral-400">
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/cases">Cases</Link></li>
                <li><Link href="/chat">AI Assistant</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-body-sm text-gold-400 mb-4">Company</h4>
              <ul className="space-y-2 text-body-sm text-neutral-400">
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-body-sm text-gold-400 mb-4">Legal</h4>
              <ul className="space-y-2 text-body-sm text-neutral-400">
                <li><a href="#">Privacy</a></li>
                <li><a href="#">Terms</a></li>
                <li><a href="#">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-body-sm text-gold-400 mb-4">Connect</h4>
              <ul className="space-y-2 text-body-sm text-neutral-400">
                <li><a href="#">Twitter</a></li>
                <li><a href="#">LinkedIn</a></li>
                <li><a href="#">Email</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-700 pt-8 text-center text-body-sm text-neutral-500">
            <p>&copy; 2026 LawBridge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
