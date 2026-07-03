'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendChatMessage, streamLegalResearch, type ResearchResult, type ResearchCitation } from '../../lib/aiApi'

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

// ── Chat Panel ────────────────────────────────────────────────────────────────

type Msg = { role: 'user' | 'assistant'; content: string }

function ChatPanel({ token }: { token: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const accRef = useRef('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  async function send() {
    if (!input.trim() || streaming) return
    const msg = input.trim()
    setInput('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setStreaming(true)
    setStreamingText('')
    accRef.current = ''

    await sendChatMessage(msg, token, {
      onSessionId: (id) => setSessionId(id),
      onToken: (t) => {
        accRef.current += t
        setStreamingText(accRef.current)
      },
      onDone: () => {
        const final = accRef.current
        setStreaming(false)
        setStreamingText('')
        if (final) setMessages(prev => [...prev, { role: 'assistant', content: final }])
      },
      onError: (e) => { setError(e); setStreaming(false) },
    }, sessionId)
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 && !streaming && (
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

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 text-gold-300 text-xs font-bold mt-0.5">AI</div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-gold-500/15 text-neutral-100 rounded-tr-sm'
                : 'bg-primary-800/60 text-neutral-200 rounded-tl-sm border border-white/8'
            }`}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}

        {streaming && (
          <div className="flex gap-3 justify-start">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 text-gold-300 text-xs font-bold">AI</div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-white/8 bg-primary-800/60 px-4 py-2.5 text-sm leading-relaxed text-neutral-200">
              {streamingText
                ? <p className="whitespace-pre-wrap">{streamingText}<span className="ml-0.5 inline-block w-1 h-4 bg-gold-400 animate-pulse align-middle" /></p>
                : <div className="flex gap-1 items-center h-5"><span className="h-1.5 w-1.5 rounded-full bg-gold-400/70 animate-bounce" /><span className="h-1.5 w-1.5 rounded-full bg-gold-400/70 animate-bounce [animation-delay:0.15s]" /><span className="h-1.5 w-1.5 rounded-full bg-gold-400/70 animate-bounce [animation-delay:0.3s]" /></div>
              }
            </div>
          </div>
        )}

        {error && <p className="text-center text-xs text-red-400">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/8 p-4 flex-shrink-0">
        <div className="flex gap-2 items-end rounded-2xl border border-white/10 bg-primary-900/60 p-2 focus-within:border-gold-500/30 transition-all">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
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
          <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">{streamText}<span className="ml-0.5 inline-block w-1 h-4 bg-gold-400 animate-pulse align-middle" /></p>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-primary-800/40 p-4">
            <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">{result.answer}</p>
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
