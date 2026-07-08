'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import { ArrowRightIcon, BalanceIcon, BriefcaseIcon, CheckIcon, LawIcon, UserIcon } from '../../../components/icons/Icons'
import { applyRoleToSession, loginWithEmail, registerStaff } from '../../../lib/authSession'
import { createFirm, inviteFirmMember } from '../../../lib/firmsApi'

type AssociateSeat = {
  name: string
  email: string
  role: string
  barNumber: string
}

const createAssociateSeat = (): AssociateSeat => ({
  name: '',
  email: '',
  role: 'Associate',
  barNumber: '',
})

export default function LawFirmRegisterPage() {
  const router = useRouter()
  const [firmName, setFirmName] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [taxId, setTaxId] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('Cameroon')
  const [firmEmail, setFirmEmail] = useState('')
  const [firmPhone, setFirmPhone] = useState('')
  const [leadPartnerName, setLeadPartnerName] = useState('')
  const [leadPartnerEmail, setLeadPartnerEmail] = useState('')
  const [leadPartnerPhone, setLeadPartnerPhone] = useState('')
  const [leadPartnerBar, setLeadPartnerBar] = useState('')
  const [secretaryName, setSecretaryName] = useState('')
  const [secretaryEmail, setSecretaryEmail] = useState('')
  const [secretaryPhone, setSecretaryPhone] = useState('')
  const [secretaryTitle, setSecretaryTitle] = useState('Firm Administrator')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [associateSeats, setAssociateSeats] = useState<AssociateSeat[]>([createAssociateSeat(), createAssociateSeat()])
  const [selectedFirmSize, setSelectedFirmSize] = useState('5-10 lawyers')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const updateAssociate = (index: number, field: keyof AssociateSeat, value: string) => {
    setAssociateSeats(prev => prev.map((seat, seatIndex) => (seatIndex === index ? { ...seat, [field]: value } : seat)))
  }

  const addAssociate = () => {
    setAssociateSeats(prev => [...prev, createAssociateSeat()])
  }

  const removeAssociate = (index: number) => {
    setAssociateSeats(prev => (prev.length > 1 ? prev.filter((_, seatIndex) => seatIndex !== index) : prev))
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (!firmName.trim() || !leadPartnerEmail.trim() || !leadPartnerName.trim()) {
      setError('Firm name, lead partner name, and lead partner email are required')
      setLoading(false)
      return
    }

    try {
      await registerStaff({
        email: leadPartnerEmail.trim(),
        full_name: leadPartnerName.trim(),
        password,
        role: 'firm_admin',
      })

      const loginResult = await loginWithEmail(leadPartnerEmail.trim(), password)
      applyRoleToSession(loginResult.me, 'lawyer')

      const firm = await createFirm({ name: firmName.trim() }, loginResult.access)

      const inviteErrors: string[] = []

      if (secretaryEmail.trim()) {
        try {
          await inviteFirmMember(firm.id, { email: secretaryEmail.trim(), role: 'firm_admin' }, loginResult.access)
        } catch (inviteCause) {
          inviteErrors.push(`Secretary invite: ${inviteCause instanceof Error ? inviteCause.message : String(inviteCause)}`)
        }
      }

      for (const seat of associateSeats) {
        if (!seat.email.trim()) continue
        try {
          await inviteFirmMember(firm.id, { email: seat.email.trim(), role: 'associate' }, loginResult.access)
        } catch (inviteCause) {
          inviteErrors.push(`${seat.email.trim()}: ${inviteCause instanceof Error ? inviteCause.message : String(inviteCause)}`)
        }
      }

      if (inviteErrors.length > 0) {
        setMessage(`Firm created. Some invitations could not be sent: ${inviteErrors.join(' | ')}`)
      } else {
        setMessage('Firm created and invitations sent successfully.')
      }

      await new Promise(resolve => setTimeout(resolve, 1200))
      router.push('/lawyer/dashboard')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create firm account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111a] text-neutral-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,146,58,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(57,107,166,0.18),transparent_30%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl items-stretch lg:grid-cols-[1fr_1.08fr]">
        <section className="flex flex-col justify-between px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
          <div className="max-w-xl space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-gold-400/20 bg-white/5 px-4 py-2 text-sm text-neutral-200 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-primary-950 shadow-lg shadow-gold-500/20">
                <LawIcon width={16} height={16} />
              </div>
              Law firm onboarding
            </div>

            <div className="space-y-4">
              <h1 className="font-display text-4xl leading-tight text-neutral-50 sm:text-5xl lg:text-6xl">
                Create a firm account for your practice.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-neutral-300 sm:text-lg">
                Set up one firm, add every associate under it, assign the secretary as firm administrator, and keep the platform admin separate.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <BalanceIcon className="mb-3 h-5 w-5 text-gold-300" />
                <p className="text-sm text-neutral-300">One account for the entire law firm</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <UserIcon className="mb-3 h-5 w-5 text-sky-300" />
                <p className="text-sm text-neutral-300">Associate seats and secretary admin included</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <CheckIcon className="mb-3 h-5 w-5 text-emerald-400" />
                <p className="text-sm text-neutral-300">Secure practice-wide document handling</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <BriefcaseIcon className="mb-3 h-5 w-5 text-neutral-200" />
                <p className="text-sm text-neutral-300">General system admin stays outside the firm</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-sm font-semibold text-neutral-100">Recommended account structure</p>
              <div className="mt-4 space-y-3 text-sm text-neutral-300">
                <p>1. Firm owner or managing partner creates the firm account.</p>
                <p>2. Secretary is assigned as the firm administrator for daily operations.</p>
                <p>3. Each associate gets a seat under the same firm workspace.</p>
                <p>4. General system admins remain platform-wide and do not belong to the firm.</p>
              </div>
            </div>
          </div>

          <p className="mt-10 text-sm text-neutral-400">
            Need a client portal instead?{' '}
            <Link href="/auth/register" className="font-semibold text-gold-300 hover:text-gold-200">
              Create a client account
            </Link>
          </p>
        </section>

        <section className="flex items-center px-6 pb-10 sm:px-10 lg:px-12 lg:py-14">
          <div className="w-full rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8 animate-fade-up" style={{ animationFillMode: 'both' }}>
            <div className="mb-8 space-y-2">
              <p className="text-sm uppercase tracking-[0.28em] text-gold-300">Firm setup</p>
              <h2 className="font-display text-3xl text-neutral-50">Create firm account</h2>
              <p className="text-sm leading-6 text-neutral-300">
                Enter the firm details and seed the first account structure for your team.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-7">
              {error && (
                <div className="rounded-2xl border border-crimson-500/30 bg-crimson-500/10 px-4 py-3 text-sm text-crimson-100">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {message}
                </div>
              )}
              <section className="space-y-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display text-xl text-neutral-50">Firm details</h3>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-300">
                    {selectedFirmSize}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Firm name" value={firmName} onChange={event => setFirmName(event.target.value)} placeholder="Lawbridge Chambers" />
                  <Input label="Firm size" value={selectedFirmSize} onChange={event => setSelectedFirmSize(event.target.value)} placeholder="5-10 lawyers" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Registration number" value={registrationNumber} onChange={event => setRegistrationNumber(event.target.value)} placeholder="RC123456789" />
                  <Input label="Tax ID" value={taxId} onChange={event => setTaxId(event.target.value)} placeholder="NIF-2026-0001" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Firm email" type="email" value={firmEmail} onChange={event => setFirmEmail(event.target.value)} placeholder="admin@lawfirm.com" />
                  <Input label="Firm phone" type="tel" value={firmPhone} onChange={event => setFirmPhone(event.target.value)} placeholder="+237 6 00 000 000" />
                </div>
                <Input label="Office address" value={address} onChange={event => setAddress(event.target.value)} placeholder="123 Boulevard..." />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="City" value={city} onChange={event => setCity(event.target.value)} placeholder="Douala" />
                  <Input label="Country" value={country} onChange={event => setCountry(event.target.value)} placeholder="Cameroon" />
                </div>
              </section>

              <section className="space-y-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <h3 className="font-display text-xl text-neutral-50">Lead lawyer / managing partner</h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Full name" value={leadPartnerName} onChange={event => setLeadPartnerName(event.target.value)} placeholder="Dr. Daniel Mbarga" />
                  <Input label="Bar number" value={leadPartnerBar} onChange={event => setLeadPartnerBar(event.target.value)} placeholder="BAR-00921" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Email address" type="email" value={leadPartnerEmail} onChange={event => setLeadPartnerEmail(event.target.value)} placeholder="daniel@lawfirm.com" />
                  <Input label="Phone number" type="tel" value={leadPartnerPhone} onChange={event => setLeadPartnerPhone(event.target.value)} placeholder="+237 6 11 111 111" />
                </div>
              </section>

              <section className="space-y-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display text-xl text-neutral-50">Associate seats</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addAssociate}>
                    Add associate
                  </Button>
                </div>

                <div className="space-y-4">
                  {associateSeats.map((seat, index) => (
                    <div key={index} className="rounded-2xl border border-white/10 bg-primary-900/40 p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-neutral-100">Associate {index + 1}</p>
                        <Button type="button" variant="ghost" size="xs" onClick={() => removeAssociate(index)}>
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Name" value={seat.name} onChange={event => updateAssociate(index, 'name', event.target.value)} placeholder="Associate lawyer" />
                        <Input label="Email" type="email" value={seat.email} onChange={event => updateAssociate(index, 'email', event.target.value)} placeholder="associate@lawfirm.com" />
                        <Input label="Role" value={seat.role} onChange={event => updateAssociate(index, 'role', event.target.value)} placeholder="Associate / Counsel" />
                        <Input label="Bar number" value={seat.barNumber} onChange={event => updateAssociate(index, 'barNumber', event.target.value)} placeholder="BAR-01012" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <h3 className="font-display text-xl text-neutral-50">Secretary as firm administrator</h3>
                <p className="text-sm leading-6 text-neutral-300">
                  The secretary manages the firm account day to day, including staff invites, matter routing, and document coordination.
                </p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Secretary name" value={secretaryName} onChange={event => setSecretaryName(event.target.value)} placeholder="Martha Njei" />
                  <Input label="Title" value={secretaryTitle} onChange={event => setSecretaryTitle(event.target.value)} placeholder="Firm Administrator" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Secretary email" type="email" value={secretaryEmail} onChange={event => setSecretaryEmail(event.target.value)} placeholder="admin@lawfirm.com" />
                  <Input label="Secretary phone" type="tel" value={secretaryPhone} onChange={event => setSecretaryPhone(event.target.value)} placeholder="+237 6 22 222 222" />
                </div>
              </section>

              <section className="space-y-5 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <h3 className="font-display text-xl text-neutral-50">Security setup</h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="Password" type="password" showPasswordToggle value={password} onChange={event => setPassword(event.target.value)} placeholder="Create a password" />
                  <Input label="Confirm password" type="password" showPasswordToggle value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Repeat your password" />
                </div>
                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-neutral-300">
                  <input type="checkbox" className="mt-1 h-4 w-4 rounded border-neutral-600 bg-transparent text-gold-400 focus:ring-gold-400" />
                  I confirm that this is a law-firm account and understand the secretary acts as the firm administrator while platform system admins remain separate.
                </label>
              </section>

              <Button type="submit" variant="gold" size="xl" className="w-full" disabled={loading}>
                {loading ? 'Creating firm account...' : 'Create firm account'}
                <ArrowRightIcon width={18} height={18} />
              </Button>
            </form>

            <div className="mt-8 border-t border-white/10 pt-5 text-center text-sm text-neutral-300">
              <span>Already have a firm account? </span>
                <Link href="/auth/lawyer-login" className="font-semibold text-gold-300 hover:text-gold-200">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}