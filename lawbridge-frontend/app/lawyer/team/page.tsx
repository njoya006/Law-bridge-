'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import {
  getMyFirmMemberships, getFirmMembers, getFirmDetail, getFirmPendingInvites,
  getFirmActivity, inviteFirmMember, updateFirmMemberRole, removeFirmMember,
  cancelFirmInvite, createFirm,
  type FirmMembership, type FirmInvite, type FirmActionLog, type Firm,
} from '../../../lib/firmsApi'
import { uploadFirmLogo, validateImageFile } from '../../../lib/avatarApi'

// ─── constants ────────────────────────────────────────────────────────────────

const ROLES = [
  { value: 'firm_admin', label: 'Firm Admin',  desc: 'Can manage members, cases and firm settings' },
  { value: 'partner',    label: 'Partner',      desc: 'Full access to cases and clients' },
  { value: 'associate',  label: 'Associate',    desc: 'Works on assigned cases only' },
  { value: 'guest',      label: 'Guest',        desc: 'Read-only access to shared resources' },
]

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner', firm_admin: 'Firm Admin', partner: 'Partner',
  associate: 'Associate', guest: 'Guest',
}

const ROLE_COLORS: Record<string, string> = {
  owner:      'bg-gold-500/15 text-gold-300 border-gold-400/20',
  firm_admin: 'bg-blue-500/15 text-blue-300 border-blue-400/20',
  partner:    'bg-emerald-500/15 text-emerald-300 border-emerald-400/20',
  associate:  'bg-neutral-500/15 text-neutral-300 border-neutral-400/20',
  guest:      'bg-neutral-700/30 text-neutral-400 border-neutral-600/20',
}

const ACTION_LABELS: Record<string, string> = {
  invite_sent:      'Invited',
  invite_accepted:  'Accepted invite',
  member_removed:   'Removed member',
  role_changed:     'Changed role',
}

const ACTION_COLORS: Record<string, string> = {
  invite_sent:      'text-blue-300',
  invite_accepted:  'text-emerald-300',
  member_removed:   'text-crimson-300',
  role_changed:     'text-gold-300',
}

function initials(name?: string | null, email?: string | null) {
  if (name && name !== email) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }
  return (email ?? '?')[0].toUpperCase()
}

function fmt(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── modal helpers ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-primary-900 border border-neutral-700/50 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/30">
          <h3 className="font-display font-semibold text-neutral-50 text-lg">{title}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">{children}</label>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`w-full rounded-lg px-4 py-2.5 bg-primary-800/40 text-neutral-50 border border-neutral-700/50
      focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-400 font-body text-sm ${props.className ?? ''}`} />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`w-full rounded-lg px-4 py-2.5 bg-primary-800/40 text-neutral-50 border border-neutral-700/50
      focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-400 font-body text-sm resize-none ${props.className ?? ''}`} />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`w-full rounded-lg px-4 py-2.5 bg-primary-800/40 text-neutral-50 border border-neutral-700/50
      focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-400 font-body text-sm ${props.className ?? ''}`} />
  )
}

// ─── Invite modal ─────────────────────────────────────────────────────────────

function InviteModal({ firmId, firmName, onClose, onDone }: {
  firmId: number; firmName: string; onClose: () => void; onDone: () => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('associate')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const selectedRole = ROLES.find(r => r.value === role)

  const handleSend = async () => {
    setErr(''); setBusy(true)
    try {
      const token = localStorage.getItem('access') ?? ''
      await inviteFirmMember(firmId, { email, role, note }, token)
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to send invite')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Invite a Team Member" onClose={onClose}>
      {/* step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1,2,3].map(s => (
          <React.Fragment key={s}>
            <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold border transition-colors ${
              step === s ? 'bg-gold-500 border-gold-400 text-primary-900' :
              step > s  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' :
                          'bg-neutral-800 border-neutral-600 text-neutral-400'
            }`}>{step > s ? '✓' : s}</div>
            {s < 3 && <div className={`flex-1 h-px ${step > s ? 'bg-emerald-500/40' : 'bg-neutral-700'}`} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <p className="text-neutral-400 text-sm">Enter the email address of the lawyer you want to invite to <strong className="text-neutral-200">{firmName}</strong>. They must already have a lawyer account on LawBridge.</p>
          <div>
            <FieldLabel>Email address</FieldLabel>
            <Input type="email" placeholder="colleague@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button variant="gold" onClick={() => {
              if (!email.includes('@')) { setErr('Enter a valid email address.'); return }
              setErr(''); setStep(2)
            }}>Next</Button>
          </div>
          {err && <p className="text-crimson-300 text-sm">{err}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-neutral-400 text-sm">Select the role for <strong className="text-neutral-200">{email}</strong>. You can change this later.</p>
          <div className="space-y-2">
            {ROLES.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  role === r.value
                    ? 'bg-gold-500/10 border-gold-400/30 text-gold-200'
                    : 'border-neutral-700/40 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800/30'
                }`}>
                <div className="font-semibold text-sm">{r.label}</div>
                <div className="text-xs text-neutral-400 mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>
          <div>
            <FieldLabel>Note (optional)</FieldLabel>
            <Textarea rows={2} placeholder="Why are you inviting this person? E.g. New associate joining the property team." value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button variant="gold" onClick={() => { setErr(''); setStep(3) }}>Review</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="rounded-xl border border-neutral-700/40 bg-primary-800/20 p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Inviting</span>
              <span className="text-neutral-100 font-medium">{email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">As</span>
              <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${ROLE_COLORS[role]}`}>{selectedRole?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Firm</span>
              <span className="text-neutral-100">{firmName}</span>
            </div>
            {note && (
              <div className="text-sm border-t border-neutral-700/30 pt-3">
                <span className="text-neutral-400">Note:</span>{' '}
                <span className="text-neutral-200">{note}</span>
              </div>
            )}
          </div>
          <p className="text-neutral-400 text-sm">An invite link will be created. Share it with the person so they can accept and join the firm.</p>
          {err && <p className="text-crimson-300 text-sm">{err}</p>}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button variant="gold" onClick={handleSend} disabled={busy}>{busy ? 'Sending…' : 'Send Invite'}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─── invite success modal ──────────────────────────────────────────────────────

function InviteSuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Invite Sent" onClose={onClose}>
      <div className="text-center py-4 space-y-4">
        <div className="text-5xl">✉️</div>
        <p className="text-neutral-200">The invite has been created successfully. Share the invite link with your colleague so they can accept and join the firm.</p>
        <p className="text-neutral-400 text-sm">They will appear in the team list once they accept. You can see pending invites in the <strong className="text-neutral-300">Invites</strong> tab.</p>
        <Button variant="gold" onClick={onClose}>Done</Button>
      </div>
    </Modal>
  )
}

// ─── Role change modal ────────────────────────────────────────────────────────

function RoleModal({ member, onClose, onDone }: {
  member: FirmMembership; onClose: () => void; onDone: () => void
}) {
  const [role, setRole] = useState(member.role)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const name = member.user_full_name || member.user_email || `Member #${member.user}`

  const handleSave = async () => {
    if (!reason.trim()) { setErr('Please provide a reason for this role change.'); return }
    setBusy(true); setErr('')
    try {
      const token = localStorage.getItem('access') ?? ''
      await updateFirmMemberRole(member.id, role, reason, token)
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to update role')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Change Member Role" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-800/30 border border-neutral-700/30">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gold-500/30 to-gold-600/20 flex items-center justify-center text-gold-300 font-bold text-sm">
            {initials(member.user_full_name, member.user_email)}
          </div>
          <div>
            <div className="font-medium text-neutral-100 text-sm">{name}</div>
            <div className="text-xs text-neutral-400">{member.user_email}</div>
          </div>
          <div className="ml-auto">
            <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${ROLE_COLORS[member.role] ?? ROLE_COLORS.associate}`}>
              {ROLE_LABELS[member.role] ?? member.role}
            </span>
          </div>
        </div>

        <div>
          <FieldLabel>New Role</FieldLabel>
          <div className="space-y-2">
            {ROLES.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  role === r.value
                    ? 'bg-gold-500/10 border-gold-400/30 text-gold-200'
                    : 'border-neutral-700/40 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800/30'
                }`}>
                <div className="font-semibold text-sm">{r.label}</div>
                <div className="text-xs text-neutral-400 mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>Reason for change <span className="text-crimson-400">*</span></FieldLabel>
          <Textarea rows={3}
            placeholder="Explain why you're changing this member's role. E.g. Promoted to partner after 3 years as associate and successful case closures."
            value={reason} onChange={e => setReason(e.target.value)} />
          <p className="text-xs text-neutral-500 mt-1">This will be recorded in the firm's activity log for accountability.</p>
        </div>

        {err && <p className="text-crimson-300 text-sm">{err}</p>}

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="gold" onClick={handleSave} disabled={busy || role === member.role}>
            {busy ? 'Saving…' : 'Save Change'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Remove modal ──────────────────────────────────────────────────────────────

function RemoveModal({ member, onClose, onDone }: {
  member: FirmMembership; onClose: () => void; onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const name = member.user_full_name || member.user_email || `Member #${member.user}`
  const targetEmail = member.user_email ?? ''
  const confirmMatch = confirm.toLowerCase() === targetEmail.toLowerCase()

  const handleRemove = async () => {
    if (reason.trim().length < 10) { setErr('Please provide at least 10 characters explaining why this member is being removed.'); return }
    if (!confirmMatch) { setErr(`Type the member's email address exactly to confirm.`); return }
    setBusy(true); setErr('')
    try {
      const token = localStorage.getItem('access') ?? ''
      await removeFirmMember(member.id, reason, token)
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to remove member')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Remove Team Member" onClose={onClose}>
      <div className="space-y-5">
        <div className="p-4 rounded-xl border border-crimson-500/30 bg-crimson-500/5">
          <p className="text-crimson-200 text-sm font-medium">⚠ This action is permanent</p>
          <p className="text-neutral-400 text-sm mt-1">
            Removing <strong className="text-neutral-200">{name}</strong> will immediately revoke their access to the firm's cases and documents.
            This action is logged and attributed to your account.
          </p>
        </div>

        <div>
          <FieldLabel>Reason for removal <span className="text-crimson-400">*</span></FieldLabel>
          <Textarea rows={4}
            placeholder="Explain clearly why this person is being removed from the firm. E.g. Employee resigned on 25 June 2026, exit process completed."
            value={reason} onChange={e => setReason(e.target.value)} />
          <p className="text-xs text-neutral-500 mt-1">
            Minimum 10 characters. This is recorded in the firm activity log.
          </p>
        </div>

        <div>
          <FieldLabel>Confirm by typing their email address</FieldLabel>
          <Input
            placeholder={targetEmail || 'member email'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className={confirmMatch && confirm ? 'border-emerald-400/50' : ''}
          />
          <p className="text-xs text-neutral-500 mt-1">Type <strong className="text-neutral-300">{targetEmail}</strong> to enable the remove button.</p>
        </div>

        {err && <p className="text-crimson-300 text-sm">{err}</p>}

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={busy || !confirmMatch || reason.trim().length < 10}
          >
            {busy ? 'Removing…' : 'Remove Member'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Member card ───────────────────────────────────────────────────────────────

function MemberCard({ member, isAdmin, currentUserId, onRoleChange, onRemove }: {
  member: FirmMembership
  isAdmin: boolean
  currentUserId: number
  onRoleChange: (m: FirmMembership) => void
  onRemove: (m: FirmMembership) => void
}) {
  const name = member.user_full_name || member.user_email || `User #${member.user}`
  const isSelf = member.user === currentUserId
  const isOwner = member.role === 'owner'
  const canAct = isAdmin && !isSelf && !isOwner
  const memberInitials = initials(member.user_full_name, member.user_email)
  const avatarSrc = (member as FirmMembership & { avatar_url?: string | null }).avatar_url ?? null

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-neutral-700/30 bg-primary-800/10 hover:border-neutral-600/40 hover:bg-primary-800/20 transition-all group">
      <div className="relative flex-shrink-0">
        <div className="h-11 w-11 rounded-full overflow-hidden bg-gradient-to-br from-gold-500/30 to-gold-600/15 flex items-center justify-center text-gold-300 font-bold text-sm">
          {avatarSrc
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={avatarSrc} alt={name} className="h-full w-full object-cover" />
            : memberInitials}
        </div>
        {isSelf && (
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-primary-900 flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">YOU</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-neutral-100 text-sm truncate">{name}</p>
            <p className="text-xs text-neutral-400 truncate">{member.user_email ?? member.invited_email ?? '—'}</p>
          </div>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs border font-medium ${ROLE_COLORS[member.role] ?? ROLE_COLORS.associate}`}>
            {ROLE_LABELS[member.role] ?? member.role}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500">
          <span>Joined {fmt(member.accepted_at)}</span>
          {!member.accepted_at && <span className="text-amber-400">Pending acceptance</span>}
        </div>

        {canAct && (
          <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onRoleChange(member)}
              className="px-3 py-1 text-xs rounded-lg border border-neutral-600/40 text-neutral-300 hover:border-gold-400/40 hover:text-gold-300 transition-colors"
            >
              Change Role
            </button>
            <button
              onClick={() => onRemove(member)}
              className="px-3 py-1 text-xs rounded-lg border border-neutral-600/40 text-neutral-400 hover:border-crimson-400/40 hover:text-crimson-300 transition-colors"
            >
              Remove
            </button>
          </div>
        )}
        {isOwner && isAdmin && !isSelf && (
          <p className="mt-2 text-xs text-neutral-600 italic">Owner — cannot be removed</p>
        )}
      </div>
    </div>
  )
}

// ─── Firm logo uploader (owner / firm_admin only) ─────────────────────────────

function FirmLogoUploader({ firmId, currentLogoUrl, onUploaded }: {
  firmId: number
  currentLogoUrl: string | null
  onUploaded: (url: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const displayUrl = preview ?? currentLogoUrl ?? null

  const handleFile = async (file: File) => {
    const err = validateImageFile(file)
    if (err) { setError(err); return }
    setError('')
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const token = localStorage.getItem('access') ?? ''
      const { logo_url } = await uploadFirmLogo(firmId, file, token)
      onUploaded(logo_url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer border border-neutral-700/50 hover:border-gold-400/50 transition-colors group bg-primary-800/40"
        onClick={() => inputRef.current?.click()}
        title="Click to upload firm logo"
      >
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="Firm logo" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1">
            <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 19.5h15a.75.75 0 00.75-.75V6a.75.75 0 00-.75-.75h-15A.75.75 0 003.75 6v12.75c0 .414.336.75.75.75z" />
            </svg>
            <span className="text-[10px] text-neutral-500">Add logo</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading
            ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            : <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          }
        </div>
      </div>
      <div className="text-xs text-neutral-400 space-y-0.5">
        <p className="font-medium text-neutral-300">Firm Logo</p>
        <p>JPEG, PNG or WebP · max 5 MB</p>
        <p>Only admins &amp; owners can change this</p>
        {error && <p className="text-crimson-300">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = '' }}
      />
    </div>
  )
}


// ─── Create firm inline ────────────────────────────────────────────────────────

function CreateFirmInline({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) { setErr('Firm name is required.'); return }
    setErr(''); setBusy(true)
    try {
      const token = localStorage.getItem('access') ?? ''
      await createFirm({ name: name.trim() }, token)
      onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create firm')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2 space-y-3 max-w-sm mx-auto">
      <p className="text-neutral-500 text-xs">Or create a new firm below:</p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Firm name…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          className="flex-1 rounded-lg px-3 py-2 bg-primary-800/40 text-neutral-50 border border-neutral-700/50
            focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-400 text-sm"
        />
        <Button variant="gold" size="sm" onClick={handleCreate} disabled={busy}>
          {busy ? 'Creating…' : 'Create'}
        </Button>
      </div>
      {err && <p className="text-crimson-300 text-xs">{err}</p>}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'members' | 'invites' | 'activity'

export default function LawyerTeamPage() {
  const [tab, setTab] = useState<Tab>('members')
  const [myMembership, setMyMembership] = useState<FirmMembership | null>(null)
  const [firm, setFirm] = useState<{ id: number; name: string; logo_url?: string | null } | null>(null)
  const [members, setMembers] = useState<FirmMembership[]>([])
  const [pendingInvites, setPendingInvites] = useState<FirmInvite[]>([])
  const [activityLog, setActivityLog] = useState<FirmActionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  // Modals
  const [showInvite, setShowInvite] = useState(false)
  const [inviteDone, setInviteDone] = useState(false)
  const [roleTarget, setRoleTarget] = useState<FirmMembership | null>(null)
  const [removeTarget, setRemoveTarget] = useState<FirmMembership | null>(null)

  const [currentUserId, setCurrentUserId] = useState<number>(0)

  const isAdmin = myMembership?.role === 'owner' || myMembership?.role === 'firm_admin'

  const load = useCallback(async () => {
    const token = localStorage.getItem('access')
    if (!token) { setErr('Not signed in.'); setLoading(false); return }

    try {
      const memberships = await getMyFirmMemberships(token)
      const primary = memberships[0]
      if (!primary) {
        setLoading(false)
        return
      }

      setMyMembership(primary)
      setCurrentUserId(primary.user)

      const [mems, firmDetail] = await Promise.allSettled([
        getFirmMembers(primary.firm, token),
        getFirmDetail(primary.firm, token),
      ])
      if (mems.status === 'fulfilled') setMembers(mems.value)
      if (firmDetail.status === 'fulfilled') {
        const fd = firmDetail.value
        setFirm({ id: fd.id, name: fd.name, logo_url: fd.logo_url ?? null })
      } else {
        setFirm({ id: primary.firm, name: '' })
      }

      if (primary.role === 'owner' || primary.role === 'firm_admin') {
        const [invites, logs] = await Promise.allSettled([
          getFirmPendingInvites(primary.firm, token),
          getFirmActivity(primary.firm, token),
        ])
        if (invites.status === 'fulfilled') setPendingInvites(invites.value)
        if (logs.status === 'fulfilled') setActivityLog(logs.value)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleInviteDone = () => {
    setShowInvite(false)
    setInviteDone(true)
    void load()
  }
  const handleRoleDone = () => { setRoleTarget(null); void load() }
  const handleRemoveDone = () => { setRemoveTarget(null); void load() }

  if (loading) {
    return (
      <main className="max-w-4xl w-full">
        <div className="flex items-center gap-3 text-neutral-400 py-16">
          <span className="animate-spin h-5 w-5 border-2 border-gold-400 border-t-transparent rounded-full" />
          Loading team…
        </div>
      </main>
    )
  }

  if (!myMembership) {
    return (
      <main className="max-w-4xl w-full space-y-6">
        <div>
          <h1 className="font-display text-display-md text-neutral-50">Team</h1>
          <p className="text-neutral-400">Manage your firm members</p>
        </div>
        {err && (
          <div className="rounded-xl border border-crimson-500/30 bg-crimson-900/10 px-4 py-3 text-sm text-crimson-300">
            {err}
          </div>
        )}
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">🏛</div>
          <h2 className="font-heading text-lg text-neutral-100 mb-2">You're not part of a firm</h2>
          <p className="text-neutral-400 text-sm mb-6">
            You need to belong to a firm to view and manage a team.
            {!err && ' Contact your firm administrator for an invitation, or create a new firm.'}
          </p>
          {!err && (
            <CreateFirmInline onCreated={load} />
          )}
        </Card>
      </main>
    )
  }

  return (
    <main className="max-w-4xl w-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-display-md text-neutral-50">Team</h1>
          <p className="text-neutral-400 text-sm mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''} · Your role:{' '}
            <span className={`font-medium ${ROLE_COLORS[myMembership.role]?.split(' ')[1] ?? 'text-neutral-200'}`}>
              {ROLE_LABELS[myMembership.role] ?? myMembership.role}
            </span>
          </p>
        </div>
        {isAdmin && (
          <Button variant="gold" size="sm" onClick={() => setShowInvite(true)}>
            + Invite Member
          </Button>
        )}
      </div>

      {err && (
        <Card className="p-4 border border-crimson-500/30 text-crimson-200 text-sm">{err}</Card>
      )}

      {/* Firm Logo — admin/owner only */}
      {isAdmin && firm && (
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-3">Firm Identity</p>
          <FirmLogoUploader
            firmId={firm.id}
            currentLogoUrl={firm.logo_url ?? null}
            onUploaded={(url) => setFirm(prev => prev ? { ...prev, logo_url: url } : prev)}
          />
        </Card>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-neutral-700/30">
        {([
          { id: 'members' as Tab, label: `Members (${members.length})` },
          ...(isAdmin ? [
            { id: 'invites' as Tab, label: `Pending Invites${pendingInvites.length ? ` (${pendingInvites.length})` : ''}` },
            { id: 'activity' as Tab, label: 'Activity Log' },
          ] : []),
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-gold-400 text-gold-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MEMBERS TAB ── */}
      {tab === 'members' && (
        <div className="space-y-3">
          {members.length === 0 && (
            <Card className="p-8 text-center text-neutral-400">No team members yet.</Card>
          )}
          {members.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              onRoleChange={setRoleTarget}
              onRemove={setRemoveTarget}
            />
          ))}
          {isAdmin && (
            <p className="text-xs text-neutral-600 pt-2">
              Hover over a member card to see admin actions. Role changes and removals require a written justification and are permanently logged.
            </p>
          )}
        </div>
      )}

      {/* ── PENDING INVITES TAB ── */}
      {tab === 'invites' && isAdmin && (
        <div className="space-y-3">
          {pendingInvites.length === 0 && (
            <Card className="p-8 text-center text-neutral-400">No pending invites.</Card>
          )}
          {pendingInvites.map(inv => (
            <div key={inv.token}
              className="flex items-center justify-between p-4 rounded-xl border border-neutral-700/30 bg-primary-800/10">
              <div>
                <p className="font-medium text-neutral-100 text-sm">{inv.email}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                  <span>Invited {fmt(inv.created_at)}</span>
                  {inv.expires_at && <span>· Expires {fmt(inv.expires_at)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs border font-medium ${ROLE_COLORS[inv.role] ?? ROLE_COLORS.associate}`}>
                  {ROLE_LABELS[inv.role] ?? inv.role}
                </span>
                <button
                  onClick={async () => {
                    if (!firm) return
                    const token = localStorage.getItem('access')
                    if (!token) return
                    try {
                      await cancelFirmInvite(firm.id, inv.token, token)
                      setPendingInvites(prev => prev.filter(i => i.token !== inv.token))
                    } catch (e) {
                      setErr(e instanceof Error ? e.message : 'Failed to cancel invite')
                    }
                  }}
                  className="rounded-lg border border-neutral-700 px-2 py-0.5 text-xs text-neutral-400 hover:border-red-500/50 hover:text-red-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
          <p className="text-xs text-neutral-600 pt-2">Invites appear here until the recipient accepts them. Share the invite link directly with the person.</p>
        </div>
      )}

      {/* ── ACTIVITY LOG TAB ── */}
      {tab === 'activity' && isAdmin && (
        <div className="space-y-3">
          {activityLog.length === 0 && (
            <Card className="p-8 text-center text-neutral-400">No activity recorded yet.</Card>
          )}
          {activityLog.map(log => (
            <div key={log.id}
              className="p-4 rounded-xl border border-neutral-700/30 bg-primary-800/10 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={`text-sm font-medium ${ACTION_COLORS[log.action] ?? 'text-neutral-300'}`}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  {' '}
                  <span className="text-sm text-neutral-300">{log.target_email}</span>
                </div>
                <span className="text-xs text-neutral-500 flex-shrink-0">{fmt(log.created_at)}</span>
              </div>
              {(log.old_role || log.new_role) && (
                <p className="text-xs text-neutral-400">
                  {log.old_role && <><span className="line-through">{ROLE_LABELS[log.old_role] ?? log.old_role}</span>{' → '}</>}
                  {log.new_role && <span className="text-neutral-200">{ROLE_LABELS[log.new_role] ?? log.new_role}</span>}
                </p>
              )}
              {log.reason && (
                <p className="text-xs text-neutral-400 italic border-l-2 border-neutral-700 pl-3">
                  "{log.reason}"
                </p>
              )}
              <p className="text-xs text-neutral-600">By {log.performed_by_email}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── MODALS ── */}
      {showInvite && firm && (
        <InviteModal
          firmId={firm.id}
          firmName={firm.name || 'your firm'}
          onClose={() => setShowInvite(false)}
          onDone={handleInviteDone}
        />
      )}
      {inviteDone && <InviteSuccessModal onClose={() => setInviteDone(false)} />}
      {roleTarget && (
        <RoleModal member={roleTarget} onClose={() => setRoleTarget(null)} onDone={handleRoleDone} />
      )}
      {removeTarget && (
        <RemoveModal member={removeTarget} onClose={() => setRemoveTarget(null)} onDone={handleRemoveDone} />
      )}
    </main>
  )
}
