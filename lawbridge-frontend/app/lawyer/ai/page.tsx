'use client'

import React, { useEffect, useRef, useState } from 'react'
import {
  sendChatMessage,
  listChatSessions,
  type ChatSession,
  type ChatMessage,
  getChatSession,
  DRAFT_TYPE_LABELS,
  listLegalDrafts,
  createLegalDraft,
  getLegalDraft,
  deleteLegalDraft,
  type LegalDraft,
  type LegalDraftSummary,
} from '../../../lib/aiApi'

type Tab = 'chat' | 'drafts' | 'analysis'

function SparkIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  )
}

function DocIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  )
}

function ChatBubbleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
    </svg>
  )
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

function ChatPanel({ token }: { token: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listChatSessions(token)
      .then(setSessions)
      .catch(() => {})
  }, [token])

  async function loadSession(id: string) {
    setActiveSession(id)
    try {
      const s = await getChatSession(id, token)
      setMessages(s.messages ?? [])
    } catch {
      setMessages([])
    }
  }

  async function send() {
    if (!input.trim() || streaming) return
    const msg = input.trim()
    setInput('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date().toISOString() }])
    setStreaming(true)
    setStreamingText('')

    let sid = activeSession ?? undefined
    await sendChatMessage(msg, token, {
      onSessionId: (id) => {
        sid = id
        setActiveSession(id)
        setSessions(prev => prev.some(s => s.id === id) ? prev : [{ id, title: msg.slice(0, 60), language: 'en', case_id: null, updated_at: new Date().toISOString() }, ...prev])
      },
      onToken: (t) => setStreamingText(prev => prev + t),
      onDone: () => {
        setStreaming(false)
        setStreamingText(prev => {
          if (prev) {
            setMessages(m => [...m, { role: 'assistant', content: prev, timestamp: new Date().toISOString() }])
          }
          return ''
        })
      },
      onError: (e) => {
        setStreaming(false)
        setStreamingText('')
        setError(e)
      },
    }, sid)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  function newChat() {
    setActiveSession(null)
    setMessages([])
    setStreamingText('')
    setError('')
  }

  return (
    <div className="flex gap-4 h-[70vh] min-h-[500px]">
      {/* Session list */}
      <aside className="w-56 flex-shrink-0 flex flex-col gap-2">
        <button
          onClick={newChat}
          className="w-full px-3 py-2 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-medium hover:bg-gold-500/20 transition-colors"
        >
          + New Chat
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => void loadSession(s.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-colors ${
                activeSession === s.id
                  ? 'bg-gold-500/15 text-gold-300 border border-gold-500/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              {s.title || 'Untitled chat'}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col rounded-xl border border-neutral-700/40 bg-primary-800/30 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streaming && (
            <div className="h-full flex items-center justify-center text-center text-neutral-500 text-sm p-8">
              <div>
                <div className="text-3xl mb-3">⚖️</div>
                <p className="font-medium text-neutral-300 mb-1">LexAI — Your Legal Assistant</p>
                <p>Ask about Cameroonian law, OHADA regulations, case strategy, or anything legal.</p>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                m.role === 'user' ? 'bg-gold-500/20 text-gold-400' : 'bg-primary-600/60 text-neutral-300'
              }`}>
                {m.role === 'user' ? 'Y' : 'AI'}
              </div>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-gold-500/10 border border-gold-500/20 text-neutral-100'
                  : 'bg-primary-900/60 border border-neutral-700/30 text-neutral-200'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {streaming && streamingText && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold bg-primary-600/60 text-neutral-300">AI</div>
              <div className="max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap bg-primary-900/60 border border-neutral-700/30 text-neutral-200">
                {streamingText}<span className="animate-pulse">▍</span>
              </div>
            </div>
          )}
          {error && <div className="text-crimson-400 text-xs text-center">{error}</div>}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-neutral-700/30">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
              placeholder="Ask LexAI about Cameroonian law, case analysis, legal strategy… (Enter to send)"
              rows={2}
              className="flex-1 rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50 resize-none"
            />
            <button
              onClick={() => void send()}
              disabled={streaming || !input.trim()}
              className="px-4 rounded-lg bg-gold-500 text-black font-semibold text-sm hover:bg-gold-400 disabled:opacity-50 transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Legal Drafts Panel ────────────────────────────────────────────────────────

function DraftsPanel({ token }: { token: string }) {
  const [drafts, setDrafts] = useState<LegalDraftSummary[]>([])
  const [selected, setSelected] = useState<LegalDraft | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ draft_type: 'letter_to_client', instructions: '', title: '' })
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listLegalDrafts(token).then(setDrafts).catch(() => {})
  }, [token])

  async function generate() {
    if (!form.instructions.trim()) return
    setGenerating(true)
    setError('')
    try {
      const draft = await createLegalDraft(form, token)
      setDrafts(prev => [draft, ...prev])
      setSelected(draft)
      setCreating(false)
      setForm({ draft_type: 'letter_to_client', instructions: '', title: '' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    }
    setGenerating(false)
  }

  async function openDraft(id: string) {
    try {
      const d = await getLegalDraft(id, token)
      setSelected(d)
      setCreating(false)
    } catch { /* ignore */ }
  }

  async function removeDraft(id: string) {
    await deleteLegalDraft(id, token).catch(() => {})
    setDrafts(prev => prev.filter(d => d.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div className="flex gap-4 h-[70vh] min-h-[500px]">
      {/* Draft list */}
      <aside className="w-56 flex-shrink-0 flex flex-col gap-2">
        <button
          onClick={() => { setCreating(true); setSelected(null) }}
          className="w-full px-3 py-2 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-medium hover:bg-gold-500/20 transition-colors"
        >
          + New Draft
        </button>
        <div className="flex-1 overflow-y-auto space-y-1">
          {drafts.map(d => (
            <button
              key={d.id}
              onClick={() => void openDraft(d.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                selected?.id === d.id
                  ? 'bg-gold-500/15 text-gold-300 border border-gold-500/20'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <div className="truncate font-medium">{d.title}</div>
              <div className="text-neutral-600 text-[10px]">{DRAFT_TYPE_LABELS[d.draft_type] ?? d.draft_type}</div>
            </button>
          ))}
          {drafts.length === 0 && !creating && (
            <p className="text-neutral-600 text-xs px-2 pt-4">No drafts yet. Click "+ New Draft" to generate one with AI.</p>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col rounded-xl border border-neutral-700/40 bg-primary-800/30 overflow-hidden">
        {creating ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <h3 className="font-heading text-body-lg text-neutral-50">Generate Legal Draft</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Document Type</label>
                <select
                  value={form.draft_type}
                  onChange={e => setForm(f => ({ ...f, draft_type: e.target.value }))}
                  className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 focus:outline-none focus:border-gold-500/50"
                >
                  {Object.entries(DRAFT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-neutral-400 text-xs mb-1">Title (optional)</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Letter re: custody hearing"
                  className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-neutral-400 text-xs mb-1">Instructions <span className="text-crimson-400">*</span></label>
              <textarea
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="Describe what the document should contain — parties involved, key facts, the legal point to make, tone required…"
                rows={6}
                className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50 resize-none"
              />
            </div>
            {error && <p className="text-crimson-400 text-xs">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => void generate()}
                disabled={generating || !form.instructions.trim()}
                className="px-5 py-2 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Generating…
                  </>
                ) : 'Generate Draft'}
              </button>
              <button
                onClick={() => setCreating(false)}
                className="px-4 py-2 rounded-lg border border-neutral-700/40 text-neutral-400 text-sm hover:text-neutral-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : selected ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-4 gap-4">
              <div>
                <h3 className="font-heading text-body-lg text-neutral-50">{selected.title}</h3>
                <p className="text-neutral-500 text-xs">{DRAFT_TYPE_LABELS[selected.draft_type] ?? selected.draft_type} · {new Date(selected.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selected.content).catch(() => {})
                  }}
                  className="px-3 py-1.5 rounded-lg border border-neutral-700/40 text-neutral-400 text-xs hover:text-gold-400 transition-colors"
                >
                  Copy
                </button>
                <button
                  onClick={() => void removeDraft(selected.id)}
                  className="px-3 py-1.5 rounded-lg border border-crimson-500/20 text-crimson-400/60 text-xs hover:text-crimson-400 hover:border-crimson-500/40 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-neutral-200 text-sm font-body leading-relaxed bg-primary-900/40 border border-neutral-700/20 rounded-lg p-4">
              {selected.content}
            </pre>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-neutral-500 text-sm p-8">
            <div>
              <div className="text-3xl mb-3">📄</div>
              <p className="font-medium text-neutral-300 mb-1">Legal Document Drafts</p>
              <p>Generate professionally formatted legal documents — letters, motions, affidavits, and more — using AI trained on Cameroonian law.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Document Analysis Panel ───────────────────────────────────────────────────

function AnalysisPanel({ token }: { token: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [context, setContext] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ summary: string; key_points: string[]; risks: string[]; recommendations: string[] } | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function analyze() {
    if (!file && !context.trim()) return
    setUploading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      if (file) formData.append('file', file)
      if (context) formData.append('context', context)

      const res = await fetch('/api/v1/ai/analyze/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Analysis failed (${res.status}): ${text.slice(0, 200)}`)
      }
      const data = await res.json() as typeof result
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    }
    setUploading(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-6 space-y-4">
        <h3 className="font-heading text-body-lg text-neutral-50">Document Analysis</h3>
        <p className="text-neutral-500 text-sm">Upload a legal document and get an AI-powered analysis: key points, risks, and recommendations under Cameroonian and OHADA law.</p>

        {/* File drop zone */}
        <div
          className="border-2 border-dashed border-neutral-700/40 rounded-xl p-8 text-center cursor-pointer hover:border-gold-500/30 hover:bg-primary-800/20 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="space-y-1">
              <p className="text-gold-400 text-sm font-medium">{file.name}</p>
              <p className="text-neutral-500 text-xs">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-neutral-400 text-sm">Click to upload a document</p>
              <p className="text-neutral-600 text-xs">PDF, DOCX, TXT accepted</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-neutral-400 text-xs mb-1">Additional context (optional)</label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Describe the document's context, parties involved, or specific areas you want analyzed…"
            rows={3}
            className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50 resize-none"
          />
        </div>

        {error && <p className="text-crimson-400 text-xs">{error}</p>}

        <button
          onClick={() => void analyze()}
          disabled={uploading || (!file && !context.trim())}
          className="px-5 py-2 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {uploading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Analyzing…
            </>
          ) : 'Analyze Document'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-5">
            <h4 className="font-heading text-body-md text-neutral-50 mb-2">Summary</h4>
            <p className="text-neutral-300 text-sm">{result.summary}</p>
          </div>

          {result.key_points?.length > 0 && (
            <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-5">
              <h4 className="font-heading text-body-md text-neutral-50 mb-2">Key Points</h4>
              <ul className="space-y-1">
                {result.key_points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-neutral-300">
                    <span className="text-gold-500 mt-0.5">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.risks?.length > 0 && (
            <div className="rounded-xl border border-crimson-500/20 bg-crimson-900/10 p-5">
              <h4 className="font-heading text-body-md text-neutral-50 mb-2">Risks & Red Flags</h4>
              <ul className="space-y-1">
                {result.risks.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-neutral-300">
                    <span className="text-crimson-400 mt-0.5">⚠</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations?.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-5">
              <h4 className="font-heading text-body-md text-neutral-50 mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-neutral-300">
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LawyerAIPage() {
  const [tab, setTab] = useState<Tab>('chat')
  const [token, setToken] = useState('')

  useEffect(() => {
    setToken(localStorage.getItem('access') ?? '')
  }, [])

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'chat',     label: 'LexAI Chat',        icon: <ChatBubbleIcon /> },
    { key: 'drafts',   label: 'Legal Drafts',       icon: <DocIcon /> },
    { key: 'analysis', label: 'Document Analysis',  icon: <SparkIcon /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md text-neutral-50">AI Legal Assistant</h1>
          <p className="mt-1 text-neutral-400 text-sm">
            LexAI is trained on Cameroonian Civil Law, Common Law, OHADA, and CEMAC regulations — your 24/7 legal research partner.
          </p>
        </div>
        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/20 border border-gold-500/30 flex items-center justify-center">
          <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-700/40">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {!token && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-4 text-amber-400 text-sm">
          Session expired. Please log in again to use the AI assistant.
        </div>
      )}

      {token && (
        <>
          {tab === 'chat'     && <ChatPanel token={token} />}
          {tab === 'drafts'   && <DraftsPanel token={token} />}
          {tab === 'analysis' && <AnalysisPanel token={token} />}
        </>
      )}
    </div>
  )
}
