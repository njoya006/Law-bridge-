'use client'

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { inviteFirmMember } from '../../../../lib/firmsApi'

export default function InvitePage() {
  const params = useParams()
  const firmId = Number(params?.firmId)
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'associate' | 'partner' | 'firm_admin' | 'guest'>('associate')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    const access = localStorage.getItem('access')
    if (!access) {
      setMessage('Please sign in before inviting members.')
      return
    }

    // basic client-side email validation
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setMessage('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      setSentEmail(email)
      await inviteFirmMember(firmId, { email, role }, access)
      setShowSuccess(true)
      setEmail('')
    } catch (err: any) {
      setMessage(err?.response?.data?.detail ?? err?.message ?? 'Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  function SuccessModal({ onClose, email }: { onClose: () => void; email: string }) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold">Invite sent</h2>
          <p className="mt-2 text-sm text-gray-600">An invite has been sent to <strong className="text-gray-800">{email}</strong>. They must register as a lawyer to accept.</p>
          <div className="mt-4 flex justify-end">
            <button onClick={onClose} className="rounded border px-3 py-1">Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold">Invite a lawyer to your firm</h1>
      <p className="mt-2 text-sm text-gray-500">Only users registered as lawyers can accept invites. If the person isn't registered yet, ask them to sign up as a lawyer first.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <div className="text-sm font-medium">Email</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full rounded border px-3 py-2" />
        </label>

        <label className="block">
          <div className="text-sm font-medium">Role</div>
          <select value={role} onChange={(e) => setRole(e.target.value as any)} className="mt-1 w-full rounded border px-3 py-2">
            <option value="associate">Associate</option>
            <option value="partner">Partner</option>
            <option value="firm_admin">Firm admin</option>
            <option value="guest">Guest</option>
          </select>
        </label>

        <div className="flex items-center gap-3">
          <button disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-white">{loading ? 'Sending...' : 'Send invite'}</button>
          <button type="button" onClick={() => router.back()} className="rounded border px-3 py-2">Cancel</button>
        </div>

        {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
      </form>

      {showSuccess && <SuccessModal email={sentEmail} onClose={() => setShowSuccess(false)} />}
    </div>
  )
}
