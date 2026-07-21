'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createArticle, listCategories, ARTICLE_TYPE_LABELS, type ArticleType, type BookTier, type BookCategory } from '../../../../../lib/libraryApi'

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
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value.replace(/\r?\n(?!\n)/g, '\n\n').replace(/\n{3,}/g, '\n\n').trim()
  }
  throw new Error(`Unsupported file type: .${ext}`)
}

const ARTICLE_TYPES: ArticleType[] = ['case_summary', 'legal_alert', 'analysis', 'commentary', 'explainer', 'news']

export default function NewArticlePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [importing, setImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [articleType, setArticleType] = useState<ArticleType>('analysis')
  const [tier, setTier] = useState<BookTier>('general')
  const [status, setStatus] = useState<'draft' | 'published'>('published')
  const [jurisdiction, setJurisdiction] = useState('Cameroon')
  const [language, setLanguage] = useState('en')
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  const toggleArea = (area: string) => {
    setSelectedAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])
  }

  const handleFileImport = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!['txt', 'md', 'docx'].includes(ext)) {
      setError(`Unsupported file type: .${ext}`)
      return
    }
    setImporting(true); setError(''); setImportSuccess('')
    try {
      const text = await extractText(file)
      if (!text.trim()) throw new Error('File is empty or could not be read.')
      setContent(text)
      if (!title.trim()) {
        const base = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
        setTitle(base.charAt(0).toUpperCase() + base.slice(1))
      }
      const wc = text.split(/\s+/).filter(Boolean).length
      setImportSuccess(`Imported ${wc.toLocaleString()} words from "${file.name}"`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to read file')
    } finally {
      setImporting(false)
    }
  }, [title])

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!content.trim()) { setError('Content is required'); return }
    setSaving(true); setError('')
    try {
      const token = localStorage.getItem('access') || ''
      const author_name = localStorage.getItem('userName') || localStorage.getItem('userEmail') || ''
      const firmId = localStorage.getItem('firmId')
      await createArticle({
        title: title.trim(), summary: summary.trim(), content: content.trim(),
        article_type: articleType, tier, status, author_name,
        firm_id: tier === 'firm' ? (firmId || undefined) : undefined,
        jurisdiction: jurisdiction.trim(), language, legal_areas: selectedAreas,
      }, token)
      router.push('/lawyer/library')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-950">
      <div className="sticky top-0 z-10 bg-primary-950/95 backdrop-blur-sm border-b border-white/6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/lawyer/library" className="text-white/30 hover:text-white/60 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <span className="text-sm font-medium text-white/60">New Article</span>
          </div>
          <button
            onClick={() => setPreview(p => !p)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              preview ? 'bg-gold-500/15 text-gold-400 border border-gold-500/25' : 'bg-white/5 text-white/40 border border-white/8 hover:text-white/60'
            }`}
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-crimson-500/10 border border-crimson-500/20 px-4 py-3 text-sm text-crimson-400">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
          <div className="space-y-5">
            <input
              type="text"
              placeholder="Article title…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-white placeholder:text-white/20 focus:outline-none border-b border-white/8 pb-3 focus:border-gold-500/40 transition-colors"
            />
            <textarea
              placeholder="Brief summary (shown in article cards)…"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-white/3 border border-white/8 px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-gold-500/30 resize-none transition-all"
            />

            {/* File import */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileImport(f) }}
              className={`rounded-xl border-2 border-dashed p-4 transition-all cursor-pointer ${dragOver ? 'border-gold-500/60 bg-gold-500/8' : 'border-white/10 bg-white/[0.015] hover:border-white/20'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" accept=".docx,.txt,.md" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) { handleFileImport(f); e.target.value = '' } }} />
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${importing ? 'bg-gold-500/10' : 'bg-white/5'}`}>
                  {importing ? <div className="w-4 h-4 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" /> : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/30">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.5"/>
                      <line x1="12" y1="18" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <polyline points="9 15 12 12 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white/50">{importing ? 'Extracting…' : 'Import from file'}</p>
                  <p className="text-[11px] text-white/25">.docx · .txt · .md</p>
                </div>
              </div>
              {importSuccess && (
                <div className="mt-2 pt-2 border-t border-white/6 flex items-center gap-2">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" className="text-emerald-400 flex-shrink-0">
                    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-[11px] text-emerald-400/80">{importSuccess}</p>
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-white/30 uppercase tracking-wider">Content</label>
                <span className="text-xs text-white/20">{content.split(/\s+/).filter(Boolean).length.toLocaleString()} words</span>
              </div>
              {preview ? (
                <div className="min-h-48 rounded-xl bg-white/3 border border-white/8 p-5 prose prose-invert prose-sm max-w-none prose-p:text-white/60" style={{ whiteSpace: 'pre-wrap' }}>
                  {content || <em className="opacity-30">No content yet…</em>}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={18}
                  placeholder="Write your article here. Markdown supported."
                  className="w-full rounded-xl bg-white/3 border border-white/8 px-4 py-4 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-gold-500/30 resize-none font-mono leading-relaxed transition-all"
                />
              )}
            </div>
          </div>

          <aside className="space-y-4">
            {/* Article type */}
            <div className="rounded-xl bg-white/3 border border-white/8 p-4">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Article Type</p>
              <div className="space-y-1">
                {ARTICLE_TYPES.map(t => (
                  <button key={t} onClick={() => setArticleType(t)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium border transition-all ${
                      articleType === t ? 'bg-gold-500/10 border-gold-500/30 text-white' : 'bg-white/2 border-white/5 text-white/40 hover:bg-white/5'
                    }`}>
                    {ARTICLE_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div className="rounded-xl bg-white/3 border border-white/8 p-4">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Visibility</p>
              {(['general', 'firm'] as BookTier[]).map(t => (
                <button key={t} onClick={() => setTier(t)}
                  className={`w-full text-left rounded-lg p-2.5 border mb-1.5 text-xs font-medium transition-all ${
                    tier === t ? 'bg-gold-500/10 border-gold-500/30 text-white' : 'bg-white/2 border-white/5 text-white/35 hover:bg-white/5'
                  }`}>
                  {t === 'general' ? 'Public — all users' : 'Firm — members only'}
                </button>
              ))}
              <div className="mt-3 pt-3 border-t border-white/6">
                <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Status</p>
                {(['published', 'draft'] as const).map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={`w-full text-left rounded-lg px-3 py-2 text-xs font-medium border mb-1 transition-all ${
                      status === s ? 'bg-gold-500/10 border-gold-500/30 text-white' : 'bg-white/2 border-white/5 text-white/35 hover:bg-white/5'
                    }`}>
                    {s === 'published' ? 'Publish immediately' : 'Save as draft'}
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="rounded-xl bg-white/3 border border-white/8 p-4 space-y-3">
              <p className="text-xs font-semibold text-white/30 uppercase tracking-wider">Details</p>
              <div>
                <label className="text-xs text-white/30 mb-1 block">Jurisdiction</label>
                <input type="text" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/8 px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500/30" />
              </div>
              <div>
                <label className="text-xs text-white/30 mb-1 block">Language</label>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  className="w-full rounded-lg bg-white/5 border border-white/8 px-3 py-2 text-sm text-white focus:outline-none">
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
                  <button key={c.slug} onClick={() => toggleArea(c.name)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium border transition-all ${
                      selectedAreas.includes(c.name) ? 'bg-gold-500/15 border-gold-500/30 text-gold-400' : 'bg-white/3 border-white/6 text-white/35 hover:bg-white/6'
                    }`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-gold-500 py-3 text-sm font-semibold text-primary-900 hover:bg-gold-400 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : status === 'published' ? 'Publish Article' : 'Save Draft'}
            </button>
          </aside>
        </div>
      </div>
    </div>
  )
}
