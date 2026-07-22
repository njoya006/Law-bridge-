'use client'

import React, { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  listThreads, createThread, listMessages, sendMessage,
  markRead, escalateToHuman, toggleReaction, toggleThreadAI, getWebSocketUrl,
  type Thread, type Message, type CreateThreadPayload,
  THREAD_TYPE_LABELS, THREAD_TYPE_COLORS,
} from '../../lib/messagesApi'
import { ChatIcon, SendIcon, PlusIcon, MailIcon, SparklesIcon, CollapseIcon } from '../../components/icons/Icons'

// ── Constants ─────────────────────────────────────────────────────────────────

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const diff = now.getTime() - d.getTime()
  if (diff < 7 * 86400_000) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function getPreferredContact(): string {
  if (typeof window === 'undefined') return 'in_app'
  try {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}')
    return settings.preferred_contact || 'in_app'
  } catch {
    return 'in_app'
  }
}

// ── New Thread Modal ──────────────────────────────────────────────────────────

function NewThreadModal({
  onClose,
  onCreated,
  token,
}: {
  onClose: () => void
  onCreated: (t: Thread) => void
  token: string
}) {
  const [caseId, setCaseId] = useState('')
  const [caseTitle, setCaseTitle] = useState('')
  const [caseRef, setCaseRef] = useState('')
  const [threadType, setThreadType] = useState<Thread['thread_type']>('client_lawyer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    setLoading(true)
    setError('')
    try {
      const payload: CreateThreadPayload = {
        thread_type: threadType,
        case_id: caseId || undefined,
        case_ref: caseRef,
        case_title: caseTitle,
        subject: caseTitle || (caseId ? `${THREAD_TYPE_LABELS[threadType]} — Case ${caseId}` : THREAD_TYPE_LABELS[threadType]),
      }
      const thread = await createThread(payload, token)
      onCreated(thread)
    } catch {
      setError('Could not create thread. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-primary-800 border border-neutral-700/40 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-neutral-100">New Conversation</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-xl leading-none">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Conversation Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['client_lawyer', 'client_firm', 'client_support', 'firm_internal'] as Thread['thread_type'][]).map(type => (
                <button
                  key={type}
                  onClick={() => setThreadType(type)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all border ${
                    threadType === type
                      ? 'bg-gold-500/15 border-gold-400/40 text-gold-300'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/20'
                  }`}
                >
                  {THREAD_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Case ID <span className="text-neutral-600 normal-case font-normal">(optional)</span></label>
            <input
              type="text"
              value={caseId}
              onChange={e => setCaseId(e.target.value)}
              placeholder="e.g. case reference or ID"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-400/40 focus:bg-white/8"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Case Reference</label>
            <input
              type="text"
              value={caseRef}
              onChange={e => setCaseRef(e.target.value)}
              placeholder="e.g. LB-2024-001"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-400/40"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">Case Title</label>
            <input
              type="text"
              value={caseTitle}
              onChange={e => setCaseTitle(e.target.value)}
              placeholder="e.g. Personal Injury Claim"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-400/40"
            />
          </div>

          {error && <p className="text-crimson-400 text-sm">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-primary-900 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating…' : 'Start Conversation'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Thread List Item ──────────────────────────────────────────────────────────

function ThreadItem({
  thread,
  isActive,
  onClick,
  currentUserId,
}: {
  thread: Thread
  isActive: boolean
  onClick: () => void
  currentUserId: string
}) {
  const badge = THREAD_TYPE_LABELS[thread.thread_type]
  const badgeStyle = THREAD_TYPE_COLORS[thread.thread_type]
  const otherParticipants = thread.participants.filter(p => p.user_id !== currentUserId)
  const displayName = otherParticipants.length > 0
    ? otherParticipants.map(p => p.display_name).join(', ')
    : thread.case_title || `Case #${thread.case_id}`

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl transition-all duration-150 group border ${
        isActive
          ? 'bg-gold-500/10 border-gold-400/20'
          : 'bg-white/3 border-transparent hover:bg-white/5 hover:border-white/8'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-sm font-semibold ${
          thread.thread_type === 'client_support'
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-gold-500/15 text-gold-300'
        }`}>
          {displayName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-sm font-semibold text-neutral-100 truncate">{displayName}</span>
            <span className="text-[10px] text-neutral-500 flex-shrink-0">
              {thread.last_message ? formatTime(thread.last_message.created_at) : formatTime(thread.created_at)}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${badgeStyle}`}>
              {badge}
            </span>
            <span className="text-[10px] text-neutral-500 truncate">
              {thread.case_ref || `Case #${thread.case_id}`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500 truncate flex items-center gap-1">
              {thread.last_message?.is_ai && <SparklesIcon width={11} height={11} className="flex-shrink-0 text-emerald-400/70" />}
              <span className="truncate">{thread.last_message ? thread.last_message.content : 'No messages yet'}</span>
            </p>
            {thread.unread_count > 0 && (
              <span className="flex-shrink-0 ml-2 h-5 min-w-5 px-1 rounded-full bg-gold-400 text-primary-900 text-[10px] font-bold flex items-center justify-center">
                {thread.unread_count > 9 ? '9+' : thread.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMine,
  showReactions,
  onReact,
}: {
  msg: Message
  isMine: boolean
  showReactions: boolean
  onReact: (messageId: number, emoji: string) => void
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  if (msg.is_system) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-neutral-500 bg-white/5 px-3 py-1 rounded-full">{msg.content}</span>
      </div>
    )
  }

  const groupedReactions = msg.reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = []
    acc[r.emoji].push(r)
    return acc
  }, {} as Record<string, typeof msg.reactions>)

  return (
    <div className={`flex gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isMine && (
        <div className={`flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
          msg.is_ai ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gold-500/15 text-gold-300'
        }`}>
          {msg.is_ai ? <SparklesIcon width={14} height={14} /> : msg.sender_name.charAt(0).toUpperCase()}
        </div>
      )}

      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Sender name */}
        {!isMine && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 px-1">
            {msg.sender_name}
          </span>
        )}

        <div className="relative">
          {/* Bubble */}
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isMine
              ? 'bg-gold-500/20 text-neutral-100 rounded-br-md'
              : msg.is_ai
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-neutral-200 rounded-bl-md'
                : 'bg-white/8 text-neutral-100 rounded-bl-md'
          }`}>
            {msg.content}
          </div>

          {/* Emoji picker trigger */}
          {showReactions && (
            <button
              onClick={() => setShowEmojiPicker(v => !v)}
              className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-neutral-300 ${
                isMine ? '-left-8' : '-right-8'
              }`}
            >
              😊
            </button>
          )}

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div className={`absolute z-10 top-0 ${isMine ? 'right-0 mr-8' : 'left-0 ml-8'} bg-primary-800 border border-neutral-700/40 rounded-2xl p-2 flex gap-1 shadow-xl`}>
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReact(msg.id, emoji)
                    setShowEmojiPicker(false)
                  }}
                  className="text-xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reactions */}
        {Object.entries(groupedReactions).length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {Object.entries(groupedReactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className="flex items-center gap-1 text-[11px] bg-white/8 border border-white/10 px-2 py-0.5 rounded-full hover:bg-white/12 transition-colors"
              >
                <span>{emoji}</span>
                <span className="text-neutral-400">{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[9px] text-neutral-600 px-1">{formatTime(msg.created_at)}</span>
      </div>
    </div>
  )
}

// ── Typing Indicator ──────────────────────────────────────────────────────────

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-neutral-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-neutral-500">{name} is typing…</span>
    </div>
  )
}

// ── Message View ──────────────────────────────────────────────────────────────

function MessageView({
  thread,
  token,
  currentUserId,
  userRole,
  onBack,
  onUpdate,
}: {
  thread: Thread
  token: string
  currentUserId: string
  userRole: string
  onBack: () => void
  onUpdate: (t: Thread) => void
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
  const [wsStatus, setWsStatus] = useState<'connecting' | 'open' | 'closed'>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)
  const reconnectRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const mountedRef = useRef(true)

  // ── WebSocket setup ─────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true
    reconnectAttemptsRef.current = 0

    function connect() {
      if (!mountedRef.current) return
      const wsUrl = getWebSocketUrl(thread.id, token)
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      setWsStatus('connecting')

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return }
        setWsStatus('open')
        reconnectAttemptsRef.current = 0
        setLoading(false)
      }

      ws.onmessage = (event) => {
        if (!mountedRef.current) return
        const data = JSON.parse(event.data as string)
        if (data.type === 'history') {
          setMessages(data.messages)
          setLoading(false)
        } else if (data.type === 'message') {
          setMessages(prev => [...prev, data])
        } else if (data.type === 'typing') {
          if (data.is_typing) {
            setTypingUsers(prev => ({ ...prev, [data.user_id]: data.display_name }))
          } else {
            setTypingUsers(prev => { const next = { ...prev }; delete next[data.user_id]; return next })
          }
        } else if (data.type === 'reaction') {
          setMessages(prev => prev.map(m => {
            if (m.id !== data.message_id) return m
            const reactions = m.reactions.filter(r => !(r.user_id === data.user_id && r.emoji === data.emoji))
            if (data.added) reactions.push({ emoji: data.emoji, user_id: data.user_id, display_name: data.display_name, created_at: new Date().toISOString() })
            return { ...m, reactions }
          }))
        }
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        setWsStatus('closed')
        // Exponential backoff reconnect: 2s, 4s, 8s … up to 30s
        const delay = Math.min(2000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++
        reconnectRef.current = setTimeout(connect, delay)
      }

      ws.onerror = () => {
        // Fetch via REST so the user sees current messages while reconnecting
        listMessages(thread.id, token)
          .then(msgs => { if (mountedRef.current) { setMessages(msgs); setLoading(false) } })
          .catch(() => { if (mountedRef.current) setLoading(false) })
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [thread.id, token])

  // ── Auto-scroll ─────────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Mark read ───────────────────────────────────────────────────────────────

  useEffect(() => {
    markRead(thread.id, token).catch(() => {})
  }, [thread.id, token])

  // ── Send ────────────────────────────────────────────────────────────────────

  function sendWsMessage(content: string) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content }))
    } else {
      // REST fallback
      sendMessage(thread.id, content, token)
        .then(msg => setMessages(prev => [...prev, msg]))
        .catch(() => {})
    }
  }

  function handleSend() {
    const content = input.trim()
    if (!content) return
    setInput('')
    sendStopTyping()
    sendWsMessage(content)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Typing indicator ────────────────────────────────────────────────────────

  function sendStartTyping() {
    if (!isTypingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }))
      isTypingRef.current = true
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(sendStopTyping, 3000)
  }

  function sendStopTyping() {
    if (isTypingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }))
      isTypingRef.current = false
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }

  // ── Reaction ────────────────────────────────────────────────────────────────

  function handleReact(messageId: number, emoji: string) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'reaction', message_id: messageId, emoji }))
    } else {
      toggleReaction(thread.id, messageId, emoji, token).catch(() => {})
    }
  }

  // ── Escalate ────────────────────────────────────────────────────────────────

  async function handleEscalate() {
    await escalateToHuman(thread.id, token)
    onUpdate({ ...thread, escalated_to_human: true })
  }

  // ── AI toggle (lawyer only) ─────────────────────────────────────────────────

  async function handleToggleAI() {
    try {
      const result = await toggleThreadAI(thread.id, token)
      onUpdate({ ...thread, is_ai_support: result.is_ai_support })
    } catch { /* ignore */ }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const otherParticipants = thread.participants.filter(p => p.user_id !== currentUserId)
  const headerName = otherParticipants.map(p => p.display_name).join(', ') || thread.case_title

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-neutral-700/30 flex-shrink-0">
        <button
          onClick={onBack}
          aria-label="Back to conversations"
          className="lg:hidden text-neutral-400 hover:text-neutral-100 mr-1"
        >
          <CollapseIcon width={18} height={18} />
        </button>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-base font-semibold bg-gold-500/15 text-gold-300 flex-shrink-0">
          {headerName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-neutral-100 truncate">{headerName}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${THREAD_TYPE_COLORS[thread.thread_type]}`}>
              {THREAD_TYPE_LABELS[thread.thread_type]}
            </span>
            <span className="text-[10px] text-neutral-500">
              {thread.case_ref || `Case #${thread.case_id}`}
              {thread.case_title ? ` — ${thread.case_title}` : ''}
            </span>
            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
              wsStatus === 'open' ? 'bg-emerald-400' : wsStatus === 'connecting' ? 'bg-yellow-400' : 'bg-neutral-600'
            }`} />
          </div>
        </div>

        {/* Escalate button — support threads only */}
        {thread.thread_type === 'client_support' && thread.is_ai_support && !thread.escalated_to_human && (
          <button
            onClick={handleEscalate}
            className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all flex-shrink-0"
          >
            Escalate
          </button>
        )}
        {thread.thread_type === 'client_support' && thread.escalated_to_human && (
          <span className="text-[10px] px-2 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 flex-shrink-0">
            Human agent
          </span>
        )}
        {/* AI toggle — lawyer threads, visible to lawyers only */}
        {thread.thread_type === 'client_lawyer' && userRole === 'lawyer' && (
          <button
            onClick={() => void handleToggleAI()}
            title={thread.is_ai_support ? 'AI assistant is ON — click to disable' : 'Enable AI assistant for this conversation'}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all flex-shrink-0 ${
              thread.is_ai_support
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-white/5 border-white/10 text-neutral-500 hover:border-white/20 hover:text-neutral-300'
            }`}
          >
            <SparklesIcon width={12} height={12} />
            {thread.is_ai_support ? 'AI on' : 'AI off'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 rounded-full border-2 border-gold-400/40 border-t-gold-400 animate-spin" />
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMine={msg.sender_id === currentUserId}
            showReactions={true}
            onReact={handleReact}
          />
        ))}

        {/* Typing indicators */}
        {Object.entries(typingUsers).map(([uid, name]) => (
          <TypingIndicator key={uid} name={name} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="flex-shrink-0 p-4 border-t border-neutral-700/30">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={e => { setInput(e.target.value); sendStartTyping() }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-gold-400/40 resize-none max-h-32 overflow-y-auto"
              style={{ lineHeight: '1.5' }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Send message"
            className="h-11 w-11 flex items-center justify-center rounded-2xl bg-gold-500 hover:bg-gold-400 text-primary-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            <SendIcon width={16} height={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Contact Preference Gate ───────────────────────────────────────────────────

function ContactPreferenceGate({ preference }: { preference: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-4">
        {preference === 'email' ? (
          <MailIcon width={32} height={32} className="text-gold-300" />
        ) : (
          <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gold-300">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-semibold text-neutral-100 mb-2">
        {preference === 'email' ? 'You prefer email communication' : 'You prefer phone communication'}
      </h3>
      <p className="text-sm text-neutral-400 max-w-xs">
        {preference === 'email'
          ? 'In-app messaging is turned off based on your communication preferences. Please contact your lawyer via email.'
          : 'In-app messaging is turned off based on your communication preferences. Please contact your lawyer by phone.'}
      </p>
      <p className="text-xs text-neutral-500 mt-4">
        Change this in{' '}
        <a href="/settings" className="text-gold-400 hover:underline">Settings → Communication</a>
      </p>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function MessagesPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [threads, setThreads] = useState<Thread[]>([])
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewThread, setShowNewThread] = useState(false)
  const [preference, setPreference] = useState('in_app')
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')

  useEffect(() => {
    const t = localStorage.getItem('access')
    const uid = localStorage.getItem('authUserId') || ''
    const role = localStorage.getItem('portalRole') || ''
    setToken(t)
    setCurrentUserId(uid)
    setUserRole(role)
    setPreference(getPreferredContact())

    const threadParam = searchParams.get('thread')
    if (threadParam) {
      // Will auto-select after threads load
    }
  }, [searchParams])

  useEffect(() => {
    if (!token) return

    const fetchThreads = (initial: boolean) => {
      return listThreads(token)
        .then(async data => {
          setThreads(data)
          if (initial) {
            const threadParam = searchParams.get('thread')
            const caseIdParam = searchParams.get('case_id')
            const otherIdParam = searchParams.get('other_id')
            const otherNameParam = searchParams.get('other_name')
            const otherRoleParam = searchParams.get('other_role')
            const caseTitleParam = searchParams.get('case_title')

            if (threadParam) {
              const found = data.find(t => t.id === Number(threadParam))
              if (found) { setSelectedThread(found); setMobileView('thread') }
            } else if (caseIdParam && otherIdParam) {
              // Auto-find or create the thread for this case
              const existing = data.find(t =>
                t.case_id === caseIdParam && (
                  t.thread_type === 'client_lawyer' || t.thread_type === 'client_firm'
                )
              )
              if (existing) {
                setSelectedThread(existing)
                setMobileView('thread')
              } else {
                // Create a new thread for this case
                try {
                  const newThread = await createThread(
                    {
                      thread_type: 'client_lawyer',
                      case_id: caseIdParam,
                      case_title: caseTitleParam || `Case ${caseIdParam.slice(0, 8)}`,
                      subject: caseTitleParam || `Consultation — ${otherNameParam || 'Lawyer'}`,
                      participants: otherIdParam ? [{
                        user_id: otherIdParam,
                        display_name: otherNameParam || 'Lawyer',
                        role: otherRoleParam || 'lawyer',
                      }] : [],
                    },
                    token,
                  )
                  setThreads(prev => [newThread, ...prev])
                  setSelectedThread(newThread)
                  setMobileView('thread')
                } catch { /* fall through to normal list view */ }
              }
            }
            setLoading(false)
          }
        })
        .catch(() => { if (initial) setLoading(false) })
    }

    void fetchThreads(true)
    const interval = setInterval(() => void fetchThreads(false), 15000)
    return () => clearInterval(interval)
  }, [token, searchParams])

  function handleSelectThread(t: Thread) {
    setSelectedThread(t)
    setMobileView('thread')
    // Update unread count optimistically
    setThreads(prev => prev.map(th => th.id === t.id ? { ...th, unread_count: 0 } : th))
  }

  function handleThreadCreated(t: Thread) {
    setThreads(prev => [t, ...prev])
    setSelectedThread(t)
    setMobileView('thread')
    setShowNewThread(false)
  }

  function handleThreadUpdate(t: Thread) {
    setSelectedThread(t)
    setThreads(prev => prev.map(th => th.id === t.id ? t : th))
  }

  if (!token) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <p className="text-neutral-500">Please log in to view messages.</p>
      </div>
    )
  }

  if (preference !== 'in_app') {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-display font-bold text-neutral-100">Messages</h1>
        </div>
        <div className="flex-1 bg-primary-800/40 rounded-3xl border border-neutral-700/30">
          <ContactPreferenceGate preference={preference} />
        </div>
      </div>
    )
  }

  const totalUnread = threads.reduce((sum, t) => sum + t.unread_count, 0)

  return (
    <>
      {showNewThread && token && (
        <NewThreadModal
          token={token}
          onClose={() => setShowNewThread(false)}
          onCreated={handleThreadCreated}
        />
      )}

      <div className="flex flex-col h-[calc(100vh-6rem)]">
        {/* Page header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-display font-bold text-neutral-100">Messages</h1>
            {totalUnread > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-full bg-gold-400 text-primary-900 text-[10px] font-bold flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowNewThread(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/10 border border-gold-400/20 text-gold-300 text-sm font-medium hover:bg-gold-500/20 transition-all"
          >
            <PlusIcon width={16} height={16} />
            <span>New</span>
          </button>
        </div>

        {/* Main panel */}
        <div className="flex-1 flex overflow-hidden rounded-3xl border border-neutral-700/30 bg-primary-900/40 min-h-0">

          {/* Thread list — hidden on mobile when viewing a thread */}
          <div className={`${mobileView === 'thread' ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 xl:w-96 flex-shrink-0 border-r border-neutral-700/30`}>
            <div className="p-3 border-b border-neutral-700/30 flex-shrink-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Conversations</p>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 rounded-full border-2 border-gold-400/40 border-t-gold-400 animate-spin" />
                </div>
              )}

              {!loading && threads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="h-12 w-12 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-3">
                    <ChatIcon width={24} height={24} />
                  </div>
                  <p className="text-sm text-neutral-400 mb-1">No conversations yet</p>
                  <p className="text-xs text-neutral-600">Start a new conversation linked to one of your cases</p>
                  <button
                    onClick={() => setShowNewThread(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-gold-500/10 border border-gold-400/20 text-gold-300 text-sm hover:bg-gold-500/20 transition-all"
                  >
                    Start conversation
                  </button>
                </div>
              )}

              {threads.map((t, i) => (
                <div key={t.id} className="stagger-child" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
                  <ThreadItem
                    thread={t}
                    isActive={selectedThread?.id === t.id}
                    onClick={() => handleSelectThread(t)}
                    currentUserId={currentUserId}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Message panel */}
          <div className={`${mobileView === 'list' ? 'hidden lg:flex' : 'flex'} flex-1 flex-col min-w-0`}>
            {selectedThread ? (
              <MessageView
                key={selectedThread.id}
                thread={selectedThread}
                token={token}
                currentUserId={currentUserId}
                userRole={userRole}
                onBack={() => setMobileView('list')}
                onUpdate={handleThreadUpdate}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="h-16 w-16 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-4">
                  <ChatIcon width={32} height={32} />
                </div>
                <h3 className="text-base font-semibold text-neutral-300 mb-1">Select a conversation</h3>
                <p className="text-sm text-neutral-500">Choose from the list on the left or start a new conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex h-[calc(100vh-8rem)] items-center justify-center"><div className="h-8 w-8 rounded-full border-2 border-gold-400/40 border-t-gold-400 animate-spin" /></div>}>
      <MessagesPageInner />
    </Suspense>
  )
}
