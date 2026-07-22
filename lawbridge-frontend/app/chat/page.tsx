'use client'
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import {
  listChatSessions,
  getChatSession,
  deleteChatSession,
  sendChatMessage,
  type ChatMessage,
  type ChatSession,
} from '../../lib/aiApi'
import { SendIcon as SendIconBase, PlusIcon as PlusIconBase, DocumentIcon } from '../../components/icons/Icons'

// ─── Icons ────────────────────────────────────────────────────────────────────

function SendIcon() { return <SendIconBase width={16} height={16} className="h-4 w-4" /> }

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  )
}

function PlusIcon() { return <PlusIconBase width={16} height={16} className="h-4 w-4" /> }

function BotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path strokeLinecap="round" d="M12 2v4M9 11V8a3 3 0 016 0v3" />
      <circle cx="9" cy="16" r="1" fill="currentColor" />
      <circle cx="15" cy="16" r="1" fill="currentColor" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function relativeDate(iso: string) {
  try {
    const d = new Date(iso)
    const diff = (Date.now() - d.getTime()) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-gold-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isStreaming }: { msg: ChatMessage; isStreaming?: boolean }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
          ${isUser
            ? 'bg-gradient-to-br from-gold-400 to-gold-500 text-primary-900'
            : 'bg-gradient-to-br from-primary-600 to-primary-700 text-gold-300'}`}
      >
        {isUser ? 'You' : <BotIcon />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-gradient-to-br from-gold-400/20 to-gold-500/10 border border-gold-400/30 text-neutral-100 rounded-tr-sm'
            : 'bg-primary-800/60 border border-neutral-700/40 text-neutral-200 rounded-tl-sm'}`}
      >
        <p className="whitespace-pre-wrap break-words">
          {msg.content}
          {isStreaming && msg.content === '' && <TypingDots />}
        </p>
        {msg.timestamp && (
          <p className="mt-1 text-[10px] text-neutral-500 text-right">{formatTime(msg.timestamp)}</p>
        )}
      </div>
    </div>
  )
}

// ─── Case context banner ──────────────────────────────────────────────────────

function CaseBanner({ caseTitle, caseId }: { caseTitle: string; caseId: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gold-500/30 bg-gold-500/10 text-xs text-gold-300 max-w-full">
      <DocumentIcon width={14} height={14} className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="font-medium truncate">Case context: {caseTitle || caseId}</span>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onPrompt, caseTitle }: { onPrompt: (text: string) => void; caseTitle?: string }) {
  const genericSuggestions = [
    'Summarise Cameroon civil procedure rules',
    'What are the deadlines for filing an appeal?',
    'Explain OHADA arbitration procedures',
    'Draft a motion to dismiss for lack of jurisdiction',
  ]
  const caseSuggestions = caseTitle ? [
    `What are the next steps for the ${caseTitle} case?`,
    `What evidence do I need for this case?`,
    `What legal options does my client have?`,
    `What are the likely risks and outcomes?`,
  ] : genericSuggestions

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-12 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-primary-900">
        <BotIcon />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-display text-xl text-neutral-50 font-semibold">LexAI Assistant</h3>
        <p className="text-sm text-neutral-400 max-w-sm">
          {caseTitle
            ? `Discussing: "${caseTitle}". I know the case details and will ask focused questions.`
            : 'Your AI legal research partner. Ask about cases, procedure, statutes, or drafting.'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {caseSuggestions.map((s, i) => (
          <button
            key={s}
            onClick={() => onPrompt(s)}
            className="stagger-child text-left px-4 py-3 rounded-xl border border-neutral-700/50 bg-primary-800/30
                       text-sm text-neutral-300 hover:border-gold-400/40 hover:bg-primary-700/40
                       transition-all duration-150"
            style={{ '--i': i } as React.CSSProperties}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ChatPageInner() {
  const searchParams = useSearchParams()
  const urlCaseId = searchParams.get('case_id') ?? undefined
  const urlCaseTitle = searchParams.get('case_title') ?? undefined

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeCaseId, setActiveCaseId] = useState<string | undefined>(urlCaseId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access') : null)

  // When case_id comes from URL, update state
  useEffect(() => {
    if (urlCaseId) setActiveCaseId(urlCaseId)
  }, [urlCaseId])

  // Load sessions
  const loadSessions = useCallback(async () => {
    const t = getToken()
    if (!t) return
    try {
      const data = await listChatSessions(t)
      setSessions(data.sort((a, b) => b.updated_at.localeCompare(a.updated_at)))
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => { void loadSessions() }, [loadSessions])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Open a session
  const openSession = useCallback(async (id: string) => {
    const t = getToken()
    if (!t) return
    try {
      const session = await getChatSession(id, t)
      setActiveSessionId(id)
      setActiveCaseId(session.case_id ?? undefined)
      setMessages(session.messages ?? [])
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load session')
    }
  }, [])

  // Delete a session
  const deleteSession = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const t = getToken()
    if (!t) return
    await deleteChatSession(id, t).catch(() => undefined)
    setSessions(prev => prev.filter(s => s.id !== id))
    if (activeSessionId === id) { setActiveSessionId(null); setMessages([]) }
  }, [activeSessionId])

  // New chat
  const newChat = useCallback(() => {
    setActiveSessionId(null)
    setActiveCaseId(urlCaseId)  // keep case context for new chats if coming from a case
    setMessages([])
    setInput('')
    setError('')
    textareaRef.current?.focus()
  }, [urlCaseId])

  // Send message
  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || isStreaming) return
    const t = getToken()
    if (!t) { setError('Sign in to use the AI assistant.'); return }

    setInput('')
    setError('')

    const now = new Date().toISOString()
    setMessages(prev => [
      ...prev,
      { role: 'user', content: text, timestamp: now },
      { role: 'assistant', content: '', timestamp: now },
    ])
    setIsStreaming(true)

    let resolvedSession = activeSessionId

    await sendChatMessage(text, t, {
      onSessionId: (id) => { resolvedSession = id; setActiveSessionId(id) },
      onToken: (tok) => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, content: last.content + tok }
          return updated
        })
      },
      onDone: () => { setIsStreaming(false); void loadSessions() },
      onError: (msg) => {
        setIsStreaming(false)
        setError(msg)
        setMessages(prev => {
          const updated = [...prev]
          if (updated[updated.length - 1]?.content === '') updated.pop()
          return updated
        })
      },
    }, resolvedSession ?? undefined, activeCaseId)
  }, [input, isStreaming, activeSessionId, activeCaseId, loadSessions])

  // Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
  }

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">

      {/* Sidebar */}
      <aside
        className={`flex-shrink-0 border-r border-neutral-700/40 bg-primary-900/60 flex flex-col
                    transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}
      >
        <div className="p-3 border-b border-neutral-700/30 flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-300">Conversations</span>
          <Button size="xs" variant="ghost" onClick={newChat} leftIcon={<PlusIcon />}>New</Button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {sessions.length === 0 && (
            <p className="text-xs text-neutral-500 text-center py-8 px-4">No conversations yet.</p>
          )}
          {sessions.map((s, i) => (
            <button
              key={s.id}
              onClick={() => void openSession(s.id)}
              className={`stagger-child w-full text-left px-3 py-2.5 group flex items-start gap-2 transition-colors
                          hover:bg-primary-700/30
                          ${activeSessionId === s.id ? 'bg-primary-700/50 border-r-2 border-gold-400' : ''}`}
              style={{ '--i': Math.min(i, 8) } as React.CSSProperties}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-200 truncate">{s.title || 'Untitled'}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">{relativeDate(s.updated_at)}</p>
              </div>
              <button
                onClick={(e) => void deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-neutral-500 hover:text-crimson-400"
              >
                <TrashIcon />
              </button>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-700/30 bg-primary-900/40">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="text-neutral-400 hover:text-neutral-200 transition-colors p-1 rounded"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center text-primary-900">
              <BotIcon />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-100">LexAI</p>
              <p className="text-[10px] text-neutral-500">Case-aware legal AI</p>
            </div>
          </div>
          {activeCaseId && (
            <div className="ml-2 hidden sm:block">
              <CaseBanner caseId={activeCaseId} caseTitle={urlCaseTitle ?? activeCaseId} />
            </div>
          )}
          {activeSessionId && (
            <Button size="xs" variant="ghost" onClick={newChat} className="ml-auto" leftIcon={<PlusIcon />}>
              New chat
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {messages.length === 0 && !isStreaming ? (
            <EmptyState onPrompt={(t) => { setInput(t); textareaRef.current?.focus() }} caseTitle={urlCaseTitle} />
          ) : (
            messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))
          )}
          {error && (
            <Card className="border border-crimson-500/30 text-crimson-300 text-sm">{error}</Card>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-neutral-700/30">
          <div className="flex items-end gap-2 rounded-2xl border border-neutral-700/50 bg-primary-800/50
                          focus-within:border-gold-400/40 transition-colors px-3 py-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Ask LexAI a legal question… (Enter to send, Shift+Enter for newline)"
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-sm text-neutral-100 placeholder-neutral-500
                         outline-none min-h-[36px] max-h-[160px] py-1.5 leading-relaxed"
            />
            <Button
              size="icon"
              variant="gold"
              onClick={() => void send()}
              disabled={!input.trim() || isStreaming}
              loading={isStreaming}
              className="flex-shrink-0 mb-0.5"
            >
              {!isStreaming && <SendIcon />}
            </Button>
          </div>
          <p className="text-[10px] text-neutral-600 mt-1.5 text-center">
            LexAI can make mistakes. Verify important legal information.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <div className="h-5 w-5 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
          <span className="text-sm">Loading LexAI…</span>
        </div>
      </div>
    }>
      <ChatPageInner />
    </Suspense>
  )
}
