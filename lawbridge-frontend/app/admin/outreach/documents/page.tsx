'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type DocCategory = 'pitch_deck' | 'proposal' | 'agreement' | 'template' | 'report' | 'other'

interface OutreachDocument {
  id: string
  name: string
  category: DocCategory
  description?: string
  firmId?: string
  firmName?: string
  fileSize?: string
  addedBy?: string
  addedAt: string
  url?: string
}

const CATEGORY_LABELS: Record<DocCategory, string> = {
  pitch_deck: 'Pitch Deck',
  proposal: 'Proposal',
  agreement: 'Agreement',
  template: 'Template',
  report: 'Report',
  other: 'Other',
}

const CATEGORY_COLORS: Record<DocCategory, string> = {
  pitch_deck: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
  proposal: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  agreement: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  template: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  report: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/20',
  other: 'bg-neutral-600/15 text-neutral-400 border-neutral-600/20',
}

const SEED_DOCS: OutreachDocument[] = [
  { id: 'doc-1', name: 'LawBridge Platform Overview.pdf', category: 'pitch_deck', description: 'General pitch deck for law firm outreach — product capabilities and roadmap.', addedBy: 'CEO', addedAt: '2026-06-01T10:00:00Z', fileSize: '4.2 MB' },
  { id: 'doc-2', name: 'Founding Council Agreement Template.docx', category: 'agreement', description: 'Standard founding council membership agreement — to be signed by each council firm.', addedBy: 'Legal', addedAt: '2026-06-10T09:00:00Z', fileSize: '128 KB' },
  { id: 'doc-3', name: 'Pilot Partner Proposal.pdf', category: 'proposal', description: 'Proposal template for inviting firms into the pilot partner programme.', addedBy: 'Public Image Lead', addedAt: '2026-06-15T14:30:00Z', fileSize: '2.8 MB' },
  { id: 'doc-4', name: 'Interview Questionnaire.docx', category: 'template', description: 'Standard set of interview questions for firm discovery sessions.', addedBy: 'Public Image Lead', addedAt: '2026-06-20T11:00:00Z', fileSize: '56 KB' },
  { id: 'doc-5', name: 'Outreach Progress Report — June 2026.pdf', category: 'report', description: 'Monthly outreach summary: firms contacted, interviews held, council pipeline status.', addedBy: 'CEO', addedAt: '2026-07-01T08:00:00Z', fileSize: '1.1 MB' },
]

const LS_KEY = 'lawbridge_outreach_docs'

function loadDocs(): OutreachDocument[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) {
      localStorage.setItem(LS_KEY, JSON.stringify(SEED_DOCS))
      return SEED_DOCS
    }
    return JSON.parse(raw)
  } catch {
    return SEED_DOCS
  }
}

function saveDocs(docs: OutreachDocument[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(docs))
}

function genId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function FileIcon({ category }: { category: DocCategory }) {
  if (category === 'pitch_deck') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5M3.75 3L12 9.75 20.25 3" />
      </svg>
    )
  }
  if (category === 'agreement') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<OutreachDocument[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<DocCategory | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [delTarget, setDelTarget] = useState<string | null>(null)

  const [form, setForm] = useState<{ name: string; category: DocCategory; description: string; firmName: string; url: string }>({
    name: '', category: 'other', description: '', firmName: '', url: '',
  })
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDocs(loadDocs()) }, [])

  const filtered = docs.filter(d => {
    const q = search.toLowerCase()
    if (catFilter !== 'all' && d.category !== catFilter) return false
    if (q && !d.name.toLowerCase().includes(q) && !(d.firmName ?? '').toLowerCase().includes(q) && !(d.description ?? '').toLowerCase().includes(q)) return false
    return true
  })

  function openModal() {
    setForm({ name: '', category: 'other', description: '', firmName: '', url: '' })
    setShowModal(true)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setForm(prev => ({
      ...prev,
      name: prev.name || file.name,
    }))
  }

  async function addDoc(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const file = fileRef.current?.files?.[0]
    const fileSize = file ? (file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`) : undefined
    const doc: OutreachDocument = {
      id: genId(),
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim() || undefined,
      firmName: form.firmName.trim() || undefined,
      url: form.url.trim() || undefined,
      fileSize,
      addedBy: localStorage.getItem('fullName') || 'Admin',
      addedAt: new Date().toISOString(),
    }
    const next = [doc, ...docs]
    setDocs(next)
    saveDocs(next)
    setShowModal(false)
    setSaving(false)
  }

  function deleteDoc(id: string) {
    const next = docs.filter(d => d.id !== id)
    setDocs(next)
    saveDocs(next)
    setDelTarget(null)
  }

  const categories = Array.from(new Set(docs.map(d => d.category))) as DocCategory[]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="text-xs text-neutral-500 mb-1">
          <Link href="/admin/outreach" className="hover:text-neutral-300 transition-colors">Outreach</Link>
          {' › '}
          <span className="text-neutral-400">Documents</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-neutral-50">Documents & Resources</h1>
            <p className="text-sm text-neutral-500 mt-1">Outreach materials, agreements, pitch decks, and templates</p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-xl bg-gold-500 hover:bg-gold-400 px-4 py-2.5 text-sm font-semibold text-black transition-colors shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Document
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(['all', ...categories] as (DocCategory | 'all')[]).slice(0, 6).map(cat => {
          const count = cat === 'all' ? docs.length : docs.filter(d => d.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`rounded-xl border p-3 text-left transition-colors ${catFilter === cat ? 'border-gold-500/40 bg-gold-500/10' : 'border-white/8 bg-primary-800/20 hover:border-white/15'}`}
            >
              <div className="text-xl font-bold text-neutral-100">{count}</div>
              <div className="text-[11px] text-neutral-500 mt-0.5">{cat === 'all' ? 'Total' : CATEGORY_LABELS[cat]}</div>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-primary-800/30 border border-white/8 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-500/40 transition-colors"
        />
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-primary-800/10 py-20 text-center">
          <svg className="mx-auto mb-3 text-neutral-700 w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <p className="text-neutral-500 text-sm">
            {search || catFilter !== 'all' ? 'No documents match your search.' : 'No documents yet. Click "Add Document" to get started.'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/8 bg-primary-800/20 overflow-hidden">
          <div className="divide-y divide-white/5">
            {filtered.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors group">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${CATEGORY_COLORS[doc.category]}`}>
                  <FileIcon category={doc.category} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm text-neutral-100 hover:text-gold-300 transition-colors truncate">
                        {doc.name}
                      </a>
                    ) : (
                      <span className="font-medium text-sm text-neutral-100 truncate">{doc.name}</span>
                    )}
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_COLORS[doc.category]}`}>
                      {CATEGORY_LABELS[doc.category]}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-600">
                    <span>{fmt(doc.addedAt)}</span>
                    {doc.addedBy && <span>· {doc.addedBy}</span>}
                    {doc.fileSize && <span>· {doc.fileSize}</span>}
                    {doc.firmName && <span>· {doc.firmName}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5 transition-colors"
                    >
                      Open
                    </a>
                  )}
                  <button
                    onClick={() => setDelTarget(doc.id)}
                    className="rounded-lg border border-crimson-800/50 px-3 py-1.5 text-xs text-crimson-400 hover:bg-crimson-900/20 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note about MinIO */}
      <p className="text-[11px] text-neutral-600 text-center">
        Document entries are stored locally. File upload to MinIO cloud storage will be enabled when the storage service is connected.
      </p>

      {/* Add Document Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-neutral-700/50 bg-primary-900 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700/30">
              <h3 className="font-semibold text-neutral-100">Add Document</h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-200 text-xl leading-none">×</button>
            </div>
            <form onSubmit={addDoc} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">
                  File <span className="text-red-400">*</span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  onChange={handleFileChange}
                  className="w-full rounded-lg border border-dashed border-neutral-700 bg-primary-800/30 px-3 py-3 text-sm text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-gold-500/10 file:text-gold-400 file:text-xs file:font-semibold file:px-3 file:py-1.5 hover:border-neutral-600 transition-colors cursor-pointer"
                />
                <p className="mt-1 text-[10px] text-neutral-600">File is stored locally on your device. Cloud upload requires MinIO connection.</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">
                  Document Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. KEUSSA Law — Pilot Proposal.pdf"
                  required
                  className="w-full rounded-lg bg-primary-800/40 border border-neutral-700/60 text-neutral-100 placeholder-neutral-600 px-3 py-2.5 text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value as DocCategory }))}
                    className="w-full rounded-lg bg-primary-800/40 border border-neutral-700/60 text-neutral-100 px-3 py-2.5 text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
                  >
                    {(Object.keys(CATEGORY_LABELS) as DocCategory[]).map(c => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">Related Firm</label>
                  <input
                    value={form.firmName}
                    onChange={e => setForm(p => ({ ...p, firmName: e.target.value }))}
                    placeholder="Firm name (optional)"
                    className="w-full rounded-lg bg-primary-800/40 border border-neutral-700/60 text-neutral-100 placeholder-neutral-600 px-3 py-2.5 text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">External URL</label>
                <input
                  value={form.url}
                  onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                  placeholder="https://drive.google.com/… (optional)"
                  type="url"
                  className="w-full rounded-lg bg-primary-800/40 border border-neutral-700/60 text-neutral-100 placeholder-neutral-600 px-3 py-2.5 text-sm focus:outline-none focus:border-gold-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of this document…"
                  rows={2}
                  className="w-full rounded-lg bg-primary-800/40 border border-neutral-700/60 text-neutral-100 placeholder-neutral-600 px-3 py-2.5 text-sm focus:outline-none focus:border-gold-500/50 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200 transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="px-5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Adding…' : 'Add Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {delTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-700/50 bg-primary-900 shadow-2xl p-6 space-y-4">
            <h3 className="font-semibold text-neutral-100">Remove document?</h3>
            <p className="text-sm text-neutral-400">This will remove the entry from the registry. The actual file is not affected.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDelTarget(null)} className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200">Cancel</button>
              <button onClick={() => deleteDoc(delTarget)} className="px-5 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white text-sm font-semibold transition-colors">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
