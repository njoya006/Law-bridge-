'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getContacts, saveContact, deleteContact, getFirms, generateId, syncContactsFromApi, syncFirmsFromApi, Contact, OutreachFirm } from '../../../../lib/outreachStore'
import { Badge } from '../../../../components/ui/Badge'
import { PlusIcon } from '../../../../components/icons/Icons'

function AddContactModal({ firms, onClose, onSave }: { firms: OutreachFirm[]; onClose: () => void; onSave: (c: Contact) => void }) {
  const [form, setForm] = useState<Partial<Contact>>({ isPrimary: false })
  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firmId || !form.name?.trim()) return
    const firm = firms.find(f => f.id === form.firmId)
    onSave({
      id: generateId(),
      firmId: form.firmId!,
      firmName: firm?.firmName ?? '',
      name: form.name!.trim(),
      position: form.position ?? '',
      email: form.email,
      phone: form.phone,
      whatsapp: form.whatsapp,
      linkedin: form.linkedin,
      isPrimary: form.isPrimary ?? false,
    })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-primary-800 border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-neutral-50">Add Contact</h2>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-200"><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label-xs">Law Firm *</label>
            <select required className="field mt-1 w-full" value={form.firmId ?? ''} onChange={e => setForm(p => ({ ...p, firmId: e.target.value }))}>
              <option value="">Select firm…</option>
              {firms.map(f => <option key={f.id} value={f.id}>{f.firmName}</option>)}
            </select>
          </div>
          <div><label className="label-xs">Name *</label><input required className="field mt-1 w-full" value={form.name ?? ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Maître Jean Keussa" /></div>
          <div><label className="label-xs">Position</label><input className="field mt-1 w-full" value={form.position ?? ''} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="Senior Partner" /></div>
          <div><label className="label-xs">Phone</label><input className="field mt-1 w-full" value={form.phone ?? ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
          <div><label className="label-xs">Email</label><input type="email" className="field mt-1 w-full" value={form.email ?? ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
          <div><label className="label-xs">WhatsApp</label><input className="field mt-1 w-full" value={form.whatsapp ?? ''} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} /></div>
          <div><label className="label-xs">LinkedIn URL</label><input className="field mt-1 w-full" value={form.linkedin ?? ''} onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))} /></div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="primary" checked={form.isPrimary ?? false} onChange={e => setForm(p => ({ ...p, isPrimary: e.target.checked }))} className="rounded" />
            <label htmlFor="primary" className="text-sm text-neutral-300">Set as primary contact for this firm</label>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5">Cancel</button>
          <button type="submit" className="rounded-xl bg-portal-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">Add Contact</button>
        </div>
      </form>
    </div>
  )
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [firms, setFirms] = useState<OutreachFirm[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setContacts(getContacts()); setFirms(getFirms())
    Promise.all([syncContactsFromApi(), syncFirmsFromApi()]).then(([c, f]) => {
      if (c) setContacts(c); if (f) setFirms(f)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contacts.filter(c => !q || c.name.toLowerCase().includes(q) || c.firmName.toLowerCase().includes(q) || (c.position ?? '').toLowerCase().includes(q))
  }, [contacts, search])

  function handleSave(c: Contact) {
    saveContact(c)
    setContacts(getContacts())
    setShowModal(false)
  }

  function handleDelete(id: string) {
    deleteContact(id)
    setContacts(getContacts())
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-neutral-500 mb-1"><Link href="/admin/outreach" className="hover:text-neutral-300">Outreach</Link> › Contacts</div>
          <h1 className="font-display text-2xl font-bold text-neutral-50">Contacts</h1>
          <p className="text-sm text-neutral-500 mt-1">{contacts.length} contacts across {new Set(contacts.map(c => c.firmId)).size} firms</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-portal-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
          <PlusIcon width={14} height={14} />
          Add Contact
        </button>
      </div>

      <div className="relative max-w-sm">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, firm, or position…" className="w-full rounded-xl border border-white/10 bg-primary-900/60 py-2 pl-9 pr-3 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-gold-500/40" />
      </div>

      <div className="rounded-2xl border border-white/8 overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-white/8 bg-primary-900/40">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Contact</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Firm</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden sm:table-cell">Phone</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hidden md:table-cell">Email</th>
              <th className="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-neutral-500 text-sm">No contacts found</td></tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} className="hover:bg-white/3 transition-colors stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-700 to-primary-800 text-[11px] font-bold text-neutral-300 ring-1 ring-white/10">
                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-neutral-200">{c.name}</span>
                        {c.isPrimary && <Badge variant="gold">Primary</Badge>}
                      </div>
                      <p className="text-xs text-neutral-500">{c.position}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/outreach/firms/${c.firmId}`} className="text-sm text-neutral-400 hover:text-portal transition-colors">{c.firmName}</Link>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-400 hidden sm:table-cell">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-neutral-400 hidden md:table-cell">{c.email ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {c.whatsapp && (
                      <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-neutral-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="WhatsApp">
                        <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </a>
                    )}
                    <button onClick={() => handleDelete(c.id)} className="rounded-lg p-1.5 text-neutral-500 hover:text-crimson-400 hover:bg-crimson-500/10 transition-colors">
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-600">{filtered.length} of {contacts.length} contacts shown</p>

      {showModal && <AddContactModal firms={firms} onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}
