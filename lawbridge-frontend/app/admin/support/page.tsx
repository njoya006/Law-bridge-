'use client'

import React, { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type Participant = { user_id: string; display_name: string; role: string }
type LastMessage = { content: string; sender_name: string; created_at: string }
type Thread = {
  id: number
  case_title?: string
  subject?: string
  escalated_to_human: boolean
  is_ai_support: boolean
  updated_at: string
  participants: Participant[]
  last_message?: LastMessage
  unread_count?: number
}
type Message = {
  id: number
  content: string
  sender_id: string
  sender_name: string
  sender_role: string
  is_ai: boolean
  is_system: boolean
  created_at: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ── Thread list ────────────────────────────────────────────────────────────────

function ThreadList({ threads, activeId, onSelect }: {
  threads: Thread[]
  activeId: number | null
  onSelect: (id: number) => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/8 flex-shrink-0">
        <h2 className="font-semibold text-neutral-100 text-sm">Support Inbox</h2>
        <p className="text-xs text-neutral-500 mt-0.5">{threads.length} thread{threads.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {threads.map(t => {
          const client = t.participants?.find(p => p.role === 'client')
          const active = t.id === activeId
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`w-full text-left px-4 py-3 transition-all hover:bg-white/4 ${active ? 'bg-gold-500/8 border-l-2 border-gold-400' : 'border-l-2 border-transparent'}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-500/20 to-gold-600/20 text-gold-300 text-xs font-bold">
                  {(client?.display_name?.[0] ?? '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-200 truncate">{client?.display_name ?? 'Unknown'}</p>
                    <span className="text-[10px] text-neutral-600 flex-shrink-0">{formatTime(t.updated_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {t.escalated_to_human ? (
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/25 px-1.5 py-px text-[9px] font-bold text-amber-400 uppercase">Human</span>
                    ) : (
                      <span className="rounded-full bg-blue-500/15 border border-blue-500/25 px-1.5 py-px text-[9px] font-bold text-blue-400 uppercase">AI</span>
                    )}
                    {t.last_message && (
                      <p className="text-xs text-neutral-500 truncate">{t.last_message.content}</p>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
        {threads.length === 0 && (
          <div className="px-4 py-12 text-center text-neutral-500 text-sm">No support threads</div>
        )}
      </div>
    </div>
  )
}

// ── Message view ───────────────────────────────────────────────────────────────

function MessageView({ threadId, token }: { threadId: number; token: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [aiDrafting, setAiDrafting] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const latestMsgIdRef = useRef<number>(0)

  function startPolling() {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/messages/threads/${threadId}/messages/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json() as Message[] | { results?: Message[] }
        const msgs = Array.isArray(data) ? data : (data.results ?? [])
        if (msgs.length > 0) {
          const newest = msgs[msgs.length - 1]
          if (newest.id > latestMsgIdRef.current) {
            latestMsgIdRef.current = newest.id
            setMessages(msgs)
          }
        }
      } catch { /* silently skip */ }
    }, 3000)
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  async function handleAiDraft() {
    if (aiDrafting || messages.length === 0) return
    setAiDrafting(true)
    setInput('')

    const context = messages.slice(-5).map(m => {
      const role = m.sender_role === 'support' || m.is_ai ? 'Support' : 'Client'
      return `${role}: ${m.content}`
    }).join('\n')

    const prompt = `You are LawBridge Support. Draft a helpful, empathetic reply to this support conversation. Reply in the same language as the client. Reply with the message text only, no preamble.\n\n${context}\n\nSupport:`

    try {
      const res = await fetch('/api/v1/ai/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: prompt, portal: 'support', language: 'en' }),
      })

      if (!res.body) { setAiDrafting(false); return }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let draft = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6)) as { token?: string; text?: string; content?: string }
              const tok = json.token ?? json.text ?? json.content ?? ''
              draft += tok
              setInput(draft)
            } catch { /* non-JSON line, skip */ }
          }
        }
      }
    } catch {
      // silently fail — textarea remains empty or with partial draft
    } finally {
      setAiDrafting(false)
    }
  }

  useEffect(() => {
    setMessages([])
    setInput('')
    setError('')
    stopPolling()
    latestMsgIdRef.current = 0

    // Always load history via REST first
    fetch(`/api/v1/messages/threads/${threadId}/messages/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: Message[] | { results?: Message[] }) => {
        const msgs = Array.isArray(data) ? data : (data.results ?? [])
        setMessages(msgs)
        if (msgs.length > 0) latestMsgIdRef.current = msgs[msgs.length - 1].id
      })
      .catch(() => {})

    // Try WebSocket for real-time updates
    let wsConnected = false
    try {
      const base = process.env.NEXT_PUBLIC_API_GATEWAY_URL
        ?? (typeof window !== 'undefined' && window.location.protocol === 'https:'
          ? 'https://32.197.83.70'
          : 'http://32.197.83.70')
      const wsBase = base.replace(/^https/, 'wss').replace(/^http(?!s)/, 'ws')
      const ws = new WebSocket(`${wsBase}/ws/messages/thread/${threadId}/?token=${token}`)
      wsRef.current = ws

      ws.onopen = () => { wsConnected = true; stopPolling() }

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data ?? '{}') as {
          type?: string; messages?: Message[]
          id?: number; content?: string; sender_id?: string
          sender_name?: string; sender_role?: string; is_ai?: boolean; created_at?: string
        }
        if (data.type === 'history') {
          const msgs = data.messages ?? []
          setMessages(msgs)
          if (msgs.length > 0) latestMsgIdRef.current = msgs[msgs.length - 1].id
        } else if (data.type === 'message') {
          const newMsg = {
            id: data.id ?? 0,
            content: data.content ?? '',
            sender_id: data.sender_id ?? '',
            sender_name: data.sender_name ?? '',
            sender_role: data.sender_role ?? '',
            is_ai: data.is_ai ?? false,
            is_system: false,
            created_at: data.created_at ?? new Date().toISOString(),
          }
          if (newMsg.id > latestMsgIdRef.current) latestMsgIdRef.current = newMsg.id
          setMessages(prev => {
            // Avoid duplicates (optimistic message already added)
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      }

      ws.onerror = () => { if (!wsConnected) startPolling() }
      ws.onclose = () => { startPolling() }

      // Start polling immediately as fallback; stop if WS connects within 3s
      setTimeout(() => { if (!wsConnected) startPolling() }, 3000)
    } catch {
      startPolling()
    }

    return () => {
      wsRef.current?.close()
      stopPolling()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)
    setError('')

    // Optimistic message — appears immediately regardless of WS/REST path
    const tempId = -Date.now()
    const optimistic: Message = {
      id: tempId,
      content,
      sender_id: '',
      sender_name: 'You',
      sender_role: 'support',
      is_ai: false,
      is_system: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', content }))
      setSending(false)
    } else {
      // REST fallback
      fetch(`/api/v1/messages/threads/${threadId}/messages/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then((msg: Message) => {
          // Replace optimistic message with real one from server
          if (msg.id > latestMsgIdRef.current) latestMsgIdRef.current = msg.id
          setMessages(prev => prev.map(m => m.id === tempId ? msg : m))
        })
        .catch(e => {
          // Remove optimistic message on failure
          setMessages(prev => prev.filter(m => m.id !== tempId))
          setError(`Send failed (${String(e)})`)
        })
        .finally(() => setSending(false))
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.map((m, i) => {
          if (m.is_system) {
            return (
              <p key={i} className="text-center text-xs text-neutral-600 py-1">{m.content}</p>
            )
          }
          const isAdmin = m.sender_role === 'support'
          const isAI = m.is_ai
          return (
            <div key={i} className={`flex gap-2 ${isAdmin && !isAI ? 'justify-end' : 'justify-start'}`}>
              {!isAdmin && (
                <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5 ${
                  isAI ? 'bg-gradient-to-br from-gold-500/20 to-gold-600/20 text-gold-300' : 'bg-primary-700 text-neutral-300'
                }`}>
                  {isAI ? 'AI' : m.sender_name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                isAdmin && !isAI
                  ? 'bg-gold-500/15 text-neutral-100 rounded-tr-sm'
                  : isAI
                  ? 'bg-blue-500/10 border border-blue-500/15 text-neutral-200 rounded-tl-sm'
                  : 'bg-primary-800/60 border border-white/8 text-neutral-200 rounded-tl-sm'
              }`}>
                {!isAdmin && <p className="text-[10px] font-semibold text-neutral-500 mb-0.5">{isAI ? '🤖 LawBridge AI' : m.sender_name}</p>}
                <p className="whitespace-pre-wrap">{m.content}</p>
                <p className="text-[9px] text-neutral-600 mt-1 text-right">{formatTime(m.created_at)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/8 p-4 flex-shrink-0">
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <div className="flex gap-2 items-end rounded-2xl border border-white/10 bg-primary-900/60 p-2 focus-within:border-gold-500/30 transition-all">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
            placeholder="Reply as LawBridge Support…"
            className="flex-1 resize-none bg-transparent px-2 py-1 text-sm text-neutral-200 placeholder-neutral-500 outline-none max-h-28"
          />
          <button
            onClick={() => void handleAiDraft()}
            disabled={aiDrafting || messages.length === 0}
            title="AI Draft Reply"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-700/60 text-neutral-400 transition-all hover:bg-gold-500/10 hover:text-gold-300 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {aiDrafting ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M1 4v6h6M23 20v-6h-6M3.5 15a9 9 0 1 0 .5-4" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
                <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => void send()}
            disabled={!input.trim() || sending}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-500/20 text-gold-300 transition-all hover:bg-gold-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-neutral-600 mt-1.5 text-center">Your reply will appear as LawBridge Support in the client&apos;s messages.</p>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

function SupportPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  const initialThread = searchParams.get('thread')
  const [activeId, setActiveId] = useState<number | null>(initialThread ? parseInt(initialThread) : null)

  useEffect(() => {
    const t = localStorage.getItem('access')
    setToken(t)
    if (!t) { setLoading(false); return }

    const fetchThreads = (initial: boolean) => {
      fetch('/api/v1/messages/admin/threads/', { headers: { Authorization: `Bearer ${t}` } })
        .then(r => {
          if (!r.ok) {
            if (initial) setLoading(false)
            return null
          }
          return r.json() as Promise<Thread[]>
        })
        .then((data: Thread[] | null) => {
          if (!data) return
          setThreads(data)
          if (initial) {
            if (!activeId && data.length > 0) setActiveId(data[0].id)
            setLoading(false)
          }
        })
        .catch(() => { if (initial) setLoading(false) })
    }

    fetchThreads(true)
    const interval = setInterval(() => fetchThreads(false), 10000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectThread(id: number) {
    setActiveId(id)
    router.push(`/admin/support?thread=${id}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-gold-400/30 border-t-gold-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] rounded-2xl border border-white/8 overflow-hidden bg-primary-900/20">
      {/* Left: thread list */}
      <div className="w-72 flex-shrink-0 border-r border-white/8">
        <ThreadList threads={threads} activeId={activeId} onSelect={selectThread} />
      </div>

      {/* Right: message view */}
      <div className="flex-1 min-w-0">
        {activeId && token ? (
          <MessageView threadId={activeId} token={token} />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-500 text-sm">
            Select a thread to view messages
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminSupportPage() {
  return (
    <Suspense fallback={<div className="flex h-[70vh] items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-gold-400/30 border-t-gold-400 animate-spin" /></div>}>
      <SupportPageContent />
    </Suspense>
  )
}
