'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../lib/api'
import { createCalendarEvent } from '../../lib/calendarApi'

type Step = 1 | 2 | 3 | 4

const CASE_TYPES = [
  'Family Law','Criminal Law','Civil Law','Labor Law','Commercial Law',
  'Real Estate Law','Immigration Law','Tax Law','Constitutional Law',
  'Corporate Law','Intellectual Property','Land Disputes','Inheritance',
  'Contract Disputes','Other',
]

const PAYMENT_METHODS = [
  { value: 'mtn_momo', label: 'MTN Mobile Money', detail: 'Number: 677 000 000' },
  { value: 'orange_money', label: 'Orange Money', detail: 'Number: 655 000 000' },
  { value: 'bank_transfer', label: 'Bank Transfer', detail: 'SCB Cameroun' },
]

function StepIndicator({ current, steps }: { current: Step; steps: string[] }) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => {
        const s = (i + 1) as Step
        const done = current > s
        const active = current === s
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${done ? 'bg-gold-500 border-gold-500 text-black' : active ? 'border-gold-400 text-gold-400 bg-gold-500/10' : 'border-neutral-600 text-neutral-500'}`}>
                {done ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg> : s}
              </div>
              <span className={`text-xs mt-1 font-medium hidden sm:block whitespace-nowrap ${active ? 'text-gold-400' : done ? 'text-neutral-400' : 'text-neutral-600'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-5 sm:mb-0 ${done ? 'bg-gold-500' : 'bg-neutral-700'}`} style={{ minWidth: '2rem' }} />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default function BookPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)
  const [caseId, setCaseId] = useState('')
  const [kind, setKind] = useState<'lawyer' | 'firm'>('lawyer')
  const [targetId, setTargetId] = useState('')
  const [targetName, setTargetName] = useState('')
  const [bookingFee, setBookingFee] = useState('')
  const [caseType, setCaseType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState<'standard' | 'urgent'>('standard')
  const [legalTradition, setLegalTradition] = useState<'common_law' | 'civil_law'>('common_law')
  const [circuit] = useState<'anglophone' | 'francophone'>('anglophone')
  const [language, setLanguage] = useState<'en' | 'fr'>('en')
  const [consultationType, setConsultationType] = useState<'in_person' | 'virtual'>('in_person')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [location, setLocation] = useState('')
  const [virtualLink, setVirtualLink] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Lawyers don't book other lawyers from this flow
    if (localStorage.getItem('portalRole') === 'lawyer') {
      router.replace('/lawyer/discover')
      return
    }
    const p = new URLSearchParams(window.location.search)
    setKind((p.get('kind') as 'lawyer' | 'firm') || 'lawyer')
    setTargetId(p.get('id') || '')
    setTargetName(p.get('name') || '')
    setBookingFee(p.get('fee') || '')
  }, [router])

  const hasFee = Boolean(bookingFee && parseFloat(bookingFee) > 0)
  const feeDisplay = hasFee ? `${parseFloat(bookingFee).toLocaleString()} XAF` : null

  const validate1 = () => {
    const e: Record<string, string> = {}
    if (!caseType) e.caseType = 'Select a case type'
    if (!title.trim()) e.title = 'Enter a brief title'
    if (description.trim().length < 20) e.description = 'Describe your matter in at least 20 characters'
    setErrors(e); return Object.keys(e).length === 0
  }
  const validate2 = () => {
    const e: Record<string, string> = {}
    if (!preferredDate) e.date = 'Select a preferred date'
    if (!preferredTime) e.time = 'Select a preferred time'
    if (consultationType === 'in_person' && !location.trim()) e.location = 'Enter a meeting location'
    setErrors(e); return Object.keys(e).length === 0
  }
  const validate3 = () => {
    const e: Record<string, string> = {}
    if (hasFee) {
      if (!paymentMethod) e.paymentMethod = 'Select a payment method'
      if (!paymentRef.trim()) e.paymentRef = 'Enter your transaction reference number'
    }
    if (!agreedToTerms) e.terms = 'You must agree to the terms to continue'
    setErrors(e); return Object.keys(e).length === 0
  }

  const submit = async () => {
    const access = localStorage.getItem('access')
    if (!access) { router.push('/auth/login'); return }
    setSubmitting(true)
    try {
      const clientEmail = (() => { try { return JSON.parse(atob(access.split('.')[1])).email || '' } catch { return '' } })()
      const caseData = await api.post<{ id: string }>('case', '/cases/', {
        title: title || `Consultation with ${targetName}`,
        description,
        case_type: caseType,
        legal_tradition: legalTradition,
        circuit,
        language,
        booking_status: 'pending',
        booking_metadata: {
          target_type: kind, target_id: targetId, target_name: targetName,
          consultation_type: consultationType, booking_fee: bookingFee,
          payment_method: paymentMethod, payment_reference: paymentRef,
          payment_status: paymentRef ? 'pending_verification' : 'none',
          preferred_date: preferredDate, preferred_time: preferredTime,
          location: consultationType === 'in_person' ? location : '',
          virtual_link: consultationType === 'virtual' ? virtualLink : '',
          urgency, client_email: clientEmail,
        },
      }, access)
      try {
        await createCalendarEvent({
          case_id: caseData.id,
          event_type: 'consultation',
          date: preferredDate,
          time: preferredTime,
          location: consultationType === 'in_person' ? location : 'Virtual',
          virtual_link: consultationType === 'virtual' ? virtualLink : null,
          initiator_id: clientEmail,
        }, access)
      } catch { /* non-fatal */ }
      setCaseId(caseData.id)
      setStep(4)
    } catch (e) {
      setErrors({ submit: e instanceof Error ? e.message : 'Booking failed. Please try again.' })
    } finally { setSubmitting(false) }
  }

  const next = () => {
    if (step === 1 && !validate1()) return
    if (step === 2 && !validate2()) return
    if (step === 3) { if (!validate3()) return; void submit(); return }
    setStep(prev => (prev + 1) as Step)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-display-md text-neutral-50">Book a Consultation</h1>
        <p className="text-neutral-400 mt-1">With <span className="text-gold-400 font-medium">{targetName || 'your selected lawyer/firm'}</span></p>
      </div>

      <StepIndicator current={step} steps={['Your Matter', 'Schedule', 'Review & Pay', 'Confirmed']} />

      {step === 1 && (
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6 space-y-5">
          <h2 className="font-heading text-body-lg text-neutral-50">Describe Your Legal Matter</h2>
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Case Type *</label>
            <select value={caseType} onChange={e => setCaseType(e.target.value)} className="w-full rounded-lg px-4 py-3 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50">
              <option value="">Select a case type…</option>
              {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.caseType && <p className="text-crimson-400 text-xs mt-1">{errors.caseType}</p>}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Brief Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Land dispute between neighbours"
              className="w-full rounded-lg px-4 py-3 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50 placeholder:text-neutral-600" />
            {errors.title && <p className="text-crimson-400 text-xs mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Description *</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Briefly explain your legal issue, what you need help with, and any relevant context…"
              className="w-full rounded-lg px-4 py-3 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50 placeholder:text-neutral-600 resize-none" />
            <p className="text-neutral-600 text-xs mt-1">{description.length} characters (minimum 20)</p>
            {errors.description && <p className="text-crimson-400 text-xs mt-1">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Urgency</label>
              <div className="flex gap-2">
                {(['standard', 'urgent'] as const).map(u => (
                  <button key={u} type="button" onClick={() => setUrgency(u)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize ${urgency === u ? 'bg-gold-500/15 border-gold-500/40 text-gold-400' : 'border-neutral-700/40 text-neutral-400 hover:border-neutral-500'}`}>{u}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Legal Tradition</label>
              <select value={legalTradition} onChange={e => setLegalTradition(e.target.value as 'common_law' | 'civil_law')}
                className="w-full rounded-lg px-3 py-2 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 text-sm focus:outline-none focus:border-gold-500/50">
                <option value="common_law">Common Law</option>
                <option value="civil_law">Civil Law</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Language</label>
              <select value={language} onChange={e => setLanguage(e.target.value as 'en' | 'fr')}
                className="w-full rounded-lg px-3 py-2 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 text-sm focus:outline-none focus:border-gold-500/50">
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6 space-y-5">
          <h2 className="font-heading text-body-lg text-neutral-50">Consultation Type & Schedule</h2>
          <div>
            <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Consultation Type</label>
            <div className="grid grid-cols-2 gap-3">
              {([{ value: 'in_person', label: '🏢 In-Person', desc: "Meet at the lawyer's office" }, { value: 'virtual', label: '💻 Virtual', desc: 'Video call or phone' }] as const).map(opt => (
                <button key={opt.value} type="button" onClick={() => setConsultationType(opt.value)}
                  className={`p-4 rounded-xl border text-left ${consultationType === opt.value ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-neutral-700/40 text-neutral-400 hover:border-neutral-500'}`}>
                  <p className="font-semibold text-sm mb-1">{opt.label}</p>
                  <p className="text-xs opacity-70">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Preferred Date *</label>
              <input type="date" value={preferredDate} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} onChange={e => setPreferredDate(e.target.value)}
                className="w-full rounded-lg px-4 py-3 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50" />
              {errors.date && <p className="text-crimson-400 text-xs mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Preferred Time *</label>
              <input type="time" value={preferredTime} onChange={e => setPreferredTime(e.target.value)}
                className="w-full rounded-lg px-4 py-3 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50" />
              {errors.time && <p className="text-crimson-400 text-xs mt-1">{errors.time}</p>}
            </div>
          </div>
          {consultationType === 'in_person' ? (
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Meeting Location *</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Office address, city, or region…"
                className="w-full rounded-lg px-4 py-3 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50 placeholder:text-neutral-600" />
              {errors.location && <p className="text-crimson-400 text-xs mt-1">{errors.location}</p>}
            </div>
          ) : (
            <div>
              <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Your Virtual Link (optional)</label>
              <input type="url" value={virtualLink} onChange={e => setVirtualLink(e.target.value)} placeholder="Zoom, Google Meet… (lawyer may provide)"
                className="w-full rounded-lg px-4 py-3 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50 placeholder:text-neutral-600" />
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-6">
            <h2 className="font-heading text-body-lg text-neutral-50 mb-4">Booking Summary</h2>
            <div className="space-y-3 text-sm">
              {(
                [
                  ['Booking with', targetName],
                  ['Case type', caseType],
                  ['Date & Time', `${preferredDate} at ${preferredTime}`],
                  ['Consultation', consultationType.replace('_', ' ')],
                  ...(location ? [['Location', location]] : []),
                  ...(urgency === 'urgent' ? [['Priority', '⚡ Urgent']] : []),
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-neutral-400">{k}</span>
                  <span className="text-neutral-200 capitalize">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {hasFee ? (
            <div className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-6 space-y-4">
              <h2 className="font-heading text-body-lg text-gold-400">Booking Fee — {feeDisplay}</h2>
              <p className="text-neutral-500 text-xs">Refunded if declined. Full legal fees discussed separately with the lawyer.</p>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Payment Method *</label>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button key={pm.value} type="button" onClick={() => setPaymentMethod(pm.value)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm ${paymentMethod === pm.value ? 'border-gold-500/50 bg-gold-500/10 text-gold-300' : 'border-neutral-700/40 text-neutral-400 hover:border-neutral-500'}`}>
                      <span className="font-medium">{pm.label}</span>
                      <span className="text-xs opacity-70">{pm.detail}</span>
                    </button>
                  ))}
                </div>
                {errors.paymentMethod && <p className="text-crimson-400 text-xs mt-1">{errors.paymentMethod}</p>}
              </div>
              {paymentMethod && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-900/10 p-4 text-sm text-amber-300">
                  {paymentMethod === 'mtn_momo' && <p>Send <strong>{feeDisplay}</strong> to MTN MoMo <strong>677 000 000</strong> (Lawbridge). Enter the transaction ID below.</p>}
                  {paymentMethod === 'orange_money' && <p>Send <strong>{feeDisplay}</strong> to Orange Money <strong>655 000 000</strong> (Lawbridge). Enter the transaction ID below.</p>}
                  {paymentMethod === 'bank_transfer' && <p>Transfer <strong>{feeDisplay}</strong> to SCB Cameroun account <strong>10001-12345678</strong>. Enter the reference below.</p>}
                </div>
              )}
              {paymentMethod && (
                <div>
                  <label className="text-xs uppercase tracking-wide text-neutral-400 font-semibold block mb-2">Transaction Reference *</label>
                  <input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} placeholder="e.g. TXN123456789"
                    className="w-full rounded-lg px-4 py-3 bg-primary-900/60 text-neutral-50 border border-neutral-700/50 focus:outline-none focus:border-gold-500/50 placeholder:text-neutral-600" />
                  {errors.paymentRef && <p className="text-crimson-400 text-xs mt-1">{errors.paymentRef}</p>}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-700/30 bg-primary-800/30 p-5">
              <p className="text-neutral-400 text-sm"><span className="text-neutral-200 font-medium">No booking fee required.</span> Consultation fees are discussed directly with the lawyer/firm.</p>
            </div>
          )}

          <div className="rounded-xl border border-neutral-700/40 bg-primary-800/40 p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-gold-500" />
              <span className="text-neutral-300 text-sm">
                I understand this booking is a request subject to acceptance. I confirm all information is accurate.
                {hasFee && ' I have made the payment as instructed and understand fees are refunded if the booking is declined.'}
              </span>
            </label>
            {errors.terms && <p className="text-crimson-400 text-xs mt-2">{errors.terms}</p>}
          </div>

          {errors.submit && <div className="rounded-lg border border-crimson-500/30 bg-crimson-900/10 p-4 text-crimson-300 text-sm">{errors.submit}</div>}
        </div>
      )}

      {step === 4 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-900/10 p-8 text-center space-y-5">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          </div>
          <div>
            <h2 className="font-display text-display-xs text-neutral-50 mb-2">Booking Request Submitted</h2>
            <p className="text-neutral-400 text-sm">Sent to <span className="text-gold-400">{targetName}</span>. They will respond within 24–48 hours.</p>
          </div>
          <div className="rounded-lg border border-neutral-700/30 bg-primary-800/40 p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Booking ID</span><span className="text-neutral-200 font-mono text-xs">{caseId.slice(0, 8).toUpperCase()}…</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Status</span><span className="text-amber-400 font-medium">Awaiting Acceptance</span></div>
            {hasFee && paymentRef && <div className="flex justify-between"><span className="text-neutral-500">Payment</span><span className="text-neutral-300">Pending verification</span></div>}
          </div>
          <div className="text-left space-y-2">
            <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wide">What happens next</p>
            {[`${targetName} reviews and responds within 48 hours.`, 'You get an email + in-app notification on acceptance or decline.', hasFee ? 'If declined: booking fee refunded in 3–5 business days.' : 'If accepted: the lawyer will contact you to discuss fees and confirm details.'].map((t, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="h-5 w-5 rounded-full bg-gold-500/20 text-gold-400 text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                <span className="text-neutral-400">{t}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => router.push(`/bookings/${caseId}`)} className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-600 text-neutral-300 text-sm hover:border-gold-500/50 hover:text-gold-400 transition-colors">View Booking</button>
            <button onClick={() => router.push('/dashboard')} className="flex-1 px-4 py-2.5 rounded-lg bg-gold-500 text-black font-semibold text-sm hover:bg-gold-400 transition-colors">Go to Dashboard</button>
          </div>
        </div>
      )}

      {step < 4 && (
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button onClick={() => setStep(prev => (prev - 1) as Step)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-600/40 text-neutral-400 text-sm hover:border-neutral-500 hover:text-neutral-200 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg> Back
            </button>
          ) : (
            <button onClick={() => router.back()} className="px-4 py-2.5 rounded-lg border border-neutral-600/40 text-neutral-400 text-sm hover:border-neutral-500 hover:text-neutral-200 transition-colors">Cancel</button>
          )}
          <button onClick={next} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? <><span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" /> Submitting…</> : step === 3 ? 'Submit Booking Request' : <>Next <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg></>}
          </button>
        </div>
      )}
    </div>
  )
}
