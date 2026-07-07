'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBook, submitBook, listCategories, type BookTier, type BookCategory } from '../../../../lib/libraryApi'

// ── File import helpers ────────────────────────────────────────────────────────

async function extractText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'txt' || ext === 'md') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve((e.target?.result as string) ?? '')
      reader.onerror = reject
      reader.readAsText(file, 'UTF-8')
    })
  }

  if (ext === 'docx') {
    const mammoth = (await import('mammoth')).default
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawValue({ arrayBuffer })
    // Convert line breaks to double-newlines for markdown paragraph blocks
    return result.value.replace(/\r?\n(?!\n)/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim()
  }

  throw new Error(`Unsupported file type: .${ext}`)
}

export default function NewBookPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [importing, setImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [abstract, setAbstract] = useState('')
  const [content, setContent] = useState('')
  const [tier, setTier] = useState<BookTier>('general')
  const [year, setYear] = useState('')
  const [jurisdiction, setJurisdiction] = useState('Cameroon')
  const [language, setLanguage] = useState('en')
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])

  const toggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  const buildPayload = () => ({
    title: title.trim(),
    subtitle: subtitle.trim(),
    abstract: abstract.trim(),
    content: content.trim(),
    tier,
    year: year ? parseInt(year) : null,
    jurisdiction: jurisdiction.trim(),
    language,
    legal_areas: selectedAreas,
    author_name: localStorage.getItem('userName') || localStorage.getItem('userEmail') || 'Unknown',
    firm_id: tier === 'firm' ? (localStorage.getItem('firmId') || undefined) : undefined,
  })

  const handleSaveDraft = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true); setError('')
    try {
      const token = localStorage.getItem('access') || ''
      const firmId = localStorage.getItem('firmId')
      await createBook(buildPayload(), token, firmId)
      router.push('/lawyer/library')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const handleFileImport = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['txt', 'md', 'docx'].includes(ext)) {
      setError(`File type ".${ext}" is not supported. Please use .docx, .txt, or .md files.`)
      return
    }
    setImporting(true); setError(''); setImportSuccess('')
    try {
      const text = await extractText(file)
      if (!text.trim()) throw new Error('The file appears to be empty or could not be read.')
      setContent(text)
      // Auto-fill title from filename if title is empty
      if (!title.trim()) {
        const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1))
      }
      const wc = text.split(/\s+/).filter(Boolean).length
      setImportSuccess(`Imported ${wc.toLocaleString()} words from "${file.name}". Review and edit before submitting.`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to read file')
    } finally {
      setImporting(false)
    }
  }, [title])

  const handleSubmitForReview = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required before submitting for review')
      return
    }
    setSubmitting(true); setError('')
    try {
      const token = localStorage.getItem('access') || ''
      const firmId = localStorage.getItem('firmId')
      const book = await createBook(buildPayload(), token, firmId)
      await submitBook(book.id, token)
      router.push('/lawyer/library')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-950">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-primary-950/95 backdrop-blur-sm border-b border-white/6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/lawyer/library" className="text-white/30 hover:text-white/60 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <span className="text-sm font-medium text-white/60">New Publication</span>
          </div>
          <button
            onClick={() => setPreview(p => !p)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              preview ? 'bg-gold-500/15 text-gold-400 border border-gold-500/25' : 'bg-white/5 text-white/40 border border-white/8 hover:text-white/60'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
          {/* Main editor */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <input
                type="text"
                placeholder="Publication title…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-white placeholder:text-white/20 focus:outline-none border-b border-white/8 pb-3 focus:border-gold-500/40 transition-colors"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Subtitle (optional)…"
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                className="w-full bg-transparent text-lg text-white/50 placeholder:text-white/20 focus:outline-none border-b border-white/6 pb-2 focus:border-white/15 transition-colors"
              />
            </div>

            {/* Abstract */}
            <div>
              <label className="block text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Abstract</label>
              <textarea
                placeholder="A brief summary of this publication…"
                value={abstract}
                onChange={e => setAbstract(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-white/3 border border-white/8 px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-gold-500/30 focus:bg-white/5 resize-none transition-all"
              />
            </div>

            {/* File Import Panel */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false)
                const file = e.dataTransfer.files[0]
                if (file) handleFileImport(file)
              }}
              className={`rounded-xl border-2 border-dashed p-5 transition-all cursor-pointer ${
                dragOver
                  ? 'border-gold-500/60 bg-gold-500/8'
                  : 'border-white/10 bg-white/[0.015] hover:border-white/20 hover:bg-white/[0.025]'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.txt,.md"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) { handleFileImport(file); e.target.value = '' }
                }}
              />
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  importing ? 'bg-gold-500/10' : 'bg-white/5'
                }`}>
                  {importing ? (
                    <div className="w-5 h-5 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white/30">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <polyline points="9 15 12 12 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white/50">
                    {importing ? 'Extracting text…' : 'Import existing document'}
                  </p>
                  <p className="text-[11px] text-white/25 mt-0.5">
                    Drag & drop or click — supports <span className="text-white/40">.docx</span>, <span className="text-white/40">.txt</span>, <span className="text-white/40">.md</span>
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {['.docx', '.txt', '.md'].map(ext => (
                    <span key={ext} className="rounded-md bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-white/30 font-mono">
                      {ext}
                    </span>
                  ))}
                </div>
              </div>
              {importSuccess && (
                <div className="mt-3 pt-3 border-t border-white/6 flex items-start gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-emerald-400 flex-shrink-0 mt-0.5">
                    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-[11px] text-emerald-400/80 leading-relaxed">{importSuccess}</p>
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-white/30 uppercase tracking-wider">Content</label>
                <span className="text-xs text-white/20">Markdown supported</span>
              </div>
              {preview ? (
                <div className="min-h-64 rounded-xl bg-white/3 border border-white/8 p-5">
                  {content ? (
                    <article className="prose prose-invert prose-sm max-w-none prose-p:text-white/60 prose-headings:text-white prose-strong:text-white/80">
                      <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
                    </article>
                  ) : (
                    <p className="text-white/20 text-sm italic">No content yet…</p>
                  )}
                </div>
              ) : (
                <textarea
                  placeholder="Write your legal publication here. Use markdown for headings (#, ##), bold (**text**), lists (- item), etc."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={20}
                  className="w-full rounded-xl bg-white/3 border border-white/8 px-4 py-4 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-gold-500/30 focus:bg-white/5 resize-none font-mono leading-relaxed transition-all"
                />
              )}
              <p className="text-xs text-white/20 mt-1.5 text-right">{content.length.toLocaleString()} chars</p>
            </div>
          </div>

          {/* Sidebar metadata */}
          <aside className="space-y-5">
            {/* Library tier */}
            <div className="rounded-xl bg-white/3 border border-white/8 p-4">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Library Tier</p>
              <div className="space-y-2">
                {([
                  { value: 'general', label: 'General Library', desc: 'Visible to all verified lawyers and clients' },
                  { value: 'firm', label: 'Firm Library', desc: 'Private to your firm members only' },
                ] as { value: BookTier; label: string; desc: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTier(opt.value)}
                    className={`w-full text-left rounded-lg p-3 border transition-all ${
                      tier === opt.value
                        ? 'bg-gold-500/10 border-gold-500/30 text-white'
                        : 'bg-white/3 border-white/6 text-white/40 hover:bg-white/5'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-0.5">{opt.label}</p>
                    <p className="text-[11px] opacity-60">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="rounded-xl bg-white/3 border border-white/8 p-4 space-y-3">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">Details</p>
              <div>
                <label className="text-xs text-white/30 mb-1 block">Year</label>
                <input
                  type="number"
                  placeholder={new Date().getFullYear().toString()}
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  min="1900" max={new Date().getFullYear()}
                  className="w-full rounded-lg bg-white/5 border border-white/8 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1 block">Jurisdiction</label>
                <input
                  type="text"
                  value={jurisdiction}
                  onChange={e => setJurisdiction(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/8 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-gold-500/30 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1 block">Language</label>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/8 px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500/30 transition-colors cursor-pointer"
                >
                  <option value="en" className="bg-primary-900">English</option>
                  <option value="fr" className="bg-primary-900">French</option>
                </select>
              </div>
            </div>

            {/* Legal areas */}
            <div className="rounded-xl bg-white/3 border border-white/8 p-4">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Legal Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => (
                  <button
                    key={c.slug}
                    onClick={() => toggleArea(c.name)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium border transition-all ${
                      selectedAreas.includes(c.name)
                        ? 'bg-gold-500/15 border-gold-500/30 text-gold-400'
                        : 'bg-white/3 border-white/6 text-white/35 hover:bg-white/6 hover:text-white/55'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={handleSubmitForReview}
                disabled={submitting || saving}
                className="w-full rounded-xl bg-gold-500 py-3 text-sm font-semibold text-primary-950 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit for Review'}
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                className="w-full rounded-xl bg-white/6 border border-white/10 py-3 text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving…' : 'Save as Draft'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
