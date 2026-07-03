'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  sendChatMessage, streamLegalResearch,
  listChatSessions, getChatSession, deleteChatSession,
  type ChatSession, type ResearchResult, type ResearchCitation,
} from '../../lib/aiApi'
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer'

type Tab = 'chat' | 'research' | 'ask'

function SparkIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function SearchIcon2() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" strokeWidth={1.8} />
      <path strokeLinecap="round" strokeWidth={1.8} d="m21 21-4.35-4.35" />
    </svg>
  )
}

function MsgIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

type Msg = { role: 'user' | 'assistant'; content: string }

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── Sessions Sidebar ──────────────────────────────────────────────────────────

function SessionsSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  sessions: ChatSession[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (e: React.MouseEvent, id: string) => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 flex-shrink-0">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-gold-500/25 bg-gold-500/8 px-3 py-2 text-xs font-semibold text-gold-400 transition-all hover:bg-gold-500/15 hover:border-gold-500/40"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {sessions.length === 0 && (
          <p className="text-center text-xs text-neutral-600 py-6 px-3">No past conversations yet.</p>
        )}
        {sessions.map(s => (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`group relative flex flex-col rounded-lg px-3 py-2 cursor-pointer transition-all ${
              s.id === activeId
                ? 'bg-gold-500/10 border border-gold-500/20'
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <p className={`text-xs font-medium truncate pr-6 leading-snug ${s.id === activeId ? 'text-neutral-100' : 'text-neutral-300'}`}>
              {s.title || 'Untitled chat'}
            </p>
            <p className="text-[10px] text-neutral-600 mt-0.5">{relTime(s.updated_at)}</p>
            <button
              onClick={(e) => onDelete(e, s.id)}
              className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 rounded-md p-0.5 text-neutral-600 hover:text-red-400 transition-all"
              title="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

function ChatPanel({ token }: { token: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState('')
  const [loadingSession, setLoadingSession] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const accRef = useRef('')

  useEffect(() => {
    listChatSessions(token).then(setSessions).catch(() => {})
  }, [token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  async function openSession(id: string) {
    if (id === activeId || loadingSession) return
    setLoadingSession(true)
    setActiveId(id)
    setMessages([])
    setInput('')
    setError('')
    setSidebarOpen(false)
    try {
      const s = await getChatSession(id, token)
      setMessages((s.messages ?? []).map((m: { role: 'user' | 'assistant'; content: string }) => ({
        role: m.role,
        content: m.content,
      })))
    } catch {
      setError('Could not load this conversation.')
    } finally {
      setLoadingSession(false)
    }
  }

  function newChat() {
    setActiveId(null)
    setMessages([])
    setInput('')
    setError('')
    setSidebarOpen(false)
  }

  async function deleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    await deleteChatSession(id, token).catch(() => {})
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeId === id) newChat()
  }

  async function send() {
    if (!input.trim() || streaming) return
    const msg = input.trim()
    setInput('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setStreaming(true)
    setStreamingText('')
    accRef.current = ''

    let sid = activeId ?? undefined

    await sendChatMessage(msg, token, {
      onSessionId: (id) => {
        sid = id
        setActiveId(id)
        setSessions(prev =>
          prev.some(s => s.id === id)
            ? prev.map(s => s.id === id ? { ...s, updated_at: new Date().toISOString() } : s)
            : [{ id, title: msg.slice(0, 55), language: 'en', case_id: null, updated_at: new Date().toISOString() }, ...prev]
        )
      },
      onToken: (t) => {
        accRef.current += t
        setStreamingText(accRef.current)
      },
      onDone: () => {
        const final = accRef.current
        setStreaming(false)
        setStreamingText('')
        if (final) setMessages(prev => [...prev, { role: 'assistant', content: final }])
        if (sid) setSessions(prev => prev.map(s => s.id === sid ? { ...s, updated_at: new Date().toISOString() } : s))
      },
      onError: (e) => { setError(e); setStreaming(false) },
    }, sid)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Sessions sidebar (desktop always visible, mobile overlay) ── */}
      <>
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar panel */}
        <aside className={`
          flex-shrink-0 border-r border-white/8 bg-primary-900/40 overflow-hidden transition-all duration-200
          md:w-52 md:translate-x-0 md:relative md:z-auto
          ${sidebarOpen
            ? 'fixed inset-y-0 left-0 z-30 w-64 translate-x-0'
            : 'fixed inset-y-0 left-0 z-30 w-64 -translate-x-full md:w-52 md:translate-x-0 md:relative'
          }
        `}>
          <div className="flex items-center justify-between px-3 pt-3 pb-1 md:hidden">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Conversations</p>
            <button onClick={() => setSidebarOpen(false)} className="text-neutral-500 hover:text-neutral-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 pt-3 pb-1">
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">Conversations</p>
          </div>
          <SessionsSidebar
            sessions={sessions}
            activeId={activeId}
            onSelect={openSession}
            onNew={newChat}
            onDelete={deleteSession}
          />
        </aside>
      </>

      {/* ── Main chat area ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Mobile sidebar toggle */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-white/8 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-neutral-400 border border-white/8 hover:text-neutral-200 hover:bg-white/5 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            {activeId ? sessions.find(s => s.id === activeId)?.title?.slice(0, 24) || 'Current chat' : 'New chat'}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {loadingSession && (
            <div className="flex items-center justify-center h-full">
              <div className="h-6 w-6 rounded-full border-2 border-gold-400/30 border-t-gold-400 animate-spin" />
            </div>
          )}

          {!loadingSession && messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/20 text-gold-300">
                <SparkIcon />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-200 text-lg">LexAI — Your Legal Assistant</h3>
                <p className="text-sm text-neutral-500 mt-1 max-w-md">Ask any legal question. I specialise in Cameroonian law, OHADA, and Common Law.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-left max-w-lg w-full">
                {[
                  'What are my rights if my landlord evicts me without notice?',
                  'How do I file a small claims case in Cameroon?',
                  'What does OHADA law say about business contracts?',
                  'Can my employer fire me without compensation?',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus() }}
                    className="rounded-xl border border-white/8 bg-primary-800/40 px-3 py-2.5 text-left text-xs text-neutral-400 transition-all hover:border-gold-500/25 hover:bg-gold-500/5 hover:text-neutral-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loadingSession && messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 text-gold-300 text-xs font-bold mt-0.5">AI</div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                m.role === 'user'
                  ? 'bg-gold-500/15 text-neutral-100 rounded-tr-sm'
                  : 'bg-primary-800/60 rounded-tl-sm border border-white/8'
              }`}>
                {m.role === 'user'
                  ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                  : <MarkdownRenderer content={m.content} />
                }
              </div>
            </div>
          ))}

          {streaming && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 text-gold-300 text-xs font-bold mt-0.5">AI</div>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-white/8 bg-primary-800/60 px-4 py-3">
                {streamingText
                  ? (
                    <div>
                      <MarkdownRenderer content={streamingText} />
                      <span className="inline-block w-0.5 h-4 bg-gold-400 animate-pulse align-middle ml-0.5" />
                    </div>
                  )
                  : <div className="flex gap-1 items-center h-5"><span className="h-1.5 w-1.5 rounded-full bg-gold-400/70 animate-bounce" /><span className="h-1.5 w-1.5 rounded-full bg-gold-400/70 animate-bounce [animation-delay:0.15s]" /><span className="h-1.5 w-1.5 rounded-full bg-gold-400/70 animate-bounce [animation-delay:0.3s]" /></div>
                }
              </div>
            </div>
          )}

          {error && <p className="text-center text-xs text-red-400">{error}</p>}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/8 p-4 flex-shrink-0">
          <div className="flex gap-2 items-end rounded-2xl border border-white/10 bg-primary-900/60 p-2 focus-within:border-gold-500/30 transition-all">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
              placeholder="Ask a legal question…"
              className="flex-1 resize-none bg-transparent px-2 py-1 text-sm text-neutral-200 placeholder-neutral-500 outline-none max-h-32"
            />
            <button
              onClick={() => void send()}
              disabled={!input.trim() || streaming}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-500/20 text-gold-300 transition-all hover:bg-gold-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-neutral-600">LexAI may make mistakes. Verify important legal information with a licensed lawyer.</p>
        </div>
      </div>
    </div>
  )
}

// ── Research Panel ─────────────────────────────────────────────────────────────

function ResearchPanel({ token }: { token: string }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [streamText, setStreamText] = useState('')
  const [error, setError] = useState('')
  const accRef = useRef('')

  async function search(q?: string) {
    const searchQuery = q ?? query
    if (!searchQuery.trim() || loading) return
    if (q) setQuery(q)
    setLoading(true)
    setError('')
    setResult(null)
    setStreamText('')
    accRef.current = ''

    await streamLegalResearch({ query: searchQuery }, token, {
      onToken: (t) => {
        accRef.current += t
        setStreamText(accRef.current)
      },
      onDone: (r) => {
        setResult(r)
        setStreamText('')
        setLoading(false)
      },
      onError: (e) => { setError(e); setLoading(false) },
    })
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-neutral-200 mb-1">Legal Research</h3>
        <p className="text-xs text-neutral-500">Search Cameroonian statutes, OHADA acts, and case precedents.</p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && void search()}
          placeholder="e.g. employee dismissal rights under labour code"
          className="flex-1 rounded-xl border border-white/10 bg-primary-900/60 px-4 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 outline-none focus:border-gold-500/40 transition-all"
        />
        <button
          onClick={() => void search()}
          disabled={loading || !query.trim()}
          className="rounded-xl border border-gold-500/25 bg-gold-500/10 px-4 py-2.5 text-sm font-semibold text-gold-400 transition-all hover:bg-gold-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && <p className="text-sm text-red-400 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">{error}</p>}

      {loading && streamText && (
        <div className="rounded-xl border border-white/8 bg-primary-800/40 p-4">
          <MarkdownRenderer content={streamText} />
          <span className="ml-0.5 inline-block w-0.5 h-4 bg-gold-400 animate-pulse align-middle mt-1" />
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-primary-800/40 p-4">
            <MarkdownRenderer content={result.answer} />
          </div>
          {result.citations?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">Legal References</p>
              <div className="space-y-2">
                {result.citations.map((c: ResearchCitation, i: number) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-white/6 bg-primary-900/40 px-4 py-2.5">
                    <span className="text-gold-400 font-mono text-xs mt-0.5 flex-shrink-0">§</span>
                    <div>
                      <p className="text-sm font-medium text-neutral-200">{c.title}</p>
                      {c.relevance_note && <p className="text-xs text-neutral-500 mt-0.5">{c.relevance_note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !streamText && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'Tenant rights under civil code',
            'OHADA commercial contract obligations',
            'Employee dismissal compensation',
            'Land title dispute procedures',
          ].map(q => (
            <button
              key={q}
              onClick={() => void search(q)}
              className="rounded-xl border border-white/6 bg-primary-800/30 px-3 py-2.5 text-left text-xs text-neutral-400 transition-all hover:border-gold-500/20 hover:text-neutral-200"
            >
              {q} →
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Ask a Lawyer Panel ─────────────────────────────────────────────────────────

function AskLawyerPanel() {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16 gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-700/60 to-primary-800/60 border border-white/8 text-neutral-300">
        <MsgIcon />
      </div>
      <div>
        <h3 className="font-semibold text-neutral-100 text-xl">Talk to a Real Lawyer</h3>
        <p className="text-sm text-neutral-400 mt-2 max-w-sm">
          Start a secure, private conversation with a licensed lawyer directly from your LawBridge account.
        </p>
      </div>
      <ul className="text-left text-sm text-neutral-400 space-y-2 max-w-xs">
        {[
          'Encrypted end-to-end messages',
          'Linked to your case for context',
          'Replies within 24 hours',
        ].map(f => (
          <li key={f} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-400 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={() => router.push('/messages?new=client_lawyer')}
        className="rounded-2xl bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/30 px-6 py-3 text-sm font-semibold text-gold-300 transition-all hover:from-gold-500/30 hover:to-gold-600/30 hover:border-gold-400/50 hover:text-gold-200"
      >
        Message a Lawyer →
      </button>
      <p className="text-xs text-neutral-600">You can also start a message from the Messages page at any time.</p>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'chat',     label: 'LexAI Chat',    icon: <SparkIcon /> },
  { key: 'research', label: 'Legal Research', icon: <SearchIcon2 /> },
  { key: 'ask',      label: 'Ask a Lawyer',  icon: <MsgIcon /> },
]

export default function ClientAIPage() {
  const [tab, setTab] = useState<Tab>('chat')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem('access'))
  }, [])

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
        Sign in to access LexAI.
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 5rem)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-0 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/20 text-gold-300">
            <SparkIcon />
          </div>
          <div>
            <h2 className="font-display text-lg text-neutral-100">AI Legal Assistant</h2>
            <p className="text-xs text-neutral-500">Powered by LexAI — Cameroonian law specialist</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/8">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
                tab === t.key
                  ? 'border-gold-400 text-gold-300'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span className={tab === t.key ? 'text-gold-300' : 'text-neutral-600'}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {tab === 'chat'     && <ChatPanel token={token} />}
        {tab === 'research' && <div className="h-full overflow-y-auto"><ResearchPanel token={token} /></div>}
        {tab === 'ask'      && <AskLawyerPanel />}
      </div>
    </div>
  )
}
