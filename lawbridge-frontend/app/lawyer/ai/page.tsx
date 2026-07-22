'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer'
import {
  sendChatMessage,
  listChatSessions,
  type ChatSession,
  type ChatMessage,
  getChatSession,
  DRAFT_TYPE_LABELS,
  listLegalDrafts,
  getLegalDraft,
  deleteLegalDraft,
  clarifyDraft,
  streamDraft,
  streamTranslate,
  streamLegalResearch,
  analyzeContract,
  type LegalDraft,
  type LegalDraftSummary,
  type ClarifyQuestion,
  type ContractReviewResult,
  type ContractClause,
  type ResearchCitation,
  type ResearchResult,
} from '../../../lib/aiApi'
import { Badge } from '../../../components/ui/Badge'
import {
  DocumentIcon, AlertTriangleIcon, CheckIcon, XCircleIcon, BookOpenIcon, ClipboardIcon, SearchIcon,
} from '../../../components/icons/Icons'

type Tab = 'chat' | 'drafts' | 'analysis' | 'contract' | 'research' | 'clauses'

function SparkIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/>
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

const EXAMPLE_PROMPTS = [
  { label: 'Case strategy',    text: 'What are the strongest grounds for a civil law appeal in Cameroon under the OHADA Uniform Act?' },
  { label: 'Evidence rules',   text: 'What types of evidence are admissible in a Cameroonian common law commercial dispute?' },
  { label: 'Draft motion',     text: 'Help me draft a motion to dismiss for lack of jurisdiction in a Douala commercial court.' },
  { label: 'Legal research',   text: 'Explain the key differences between OHADA arbitration and UNCITRAL arbitration procedures.' },
]

// ── Structured AI response parsing ───────────────────────────────────────────

type CaseAnalysisData = {
  strength_score?: number
  risk_flags?: string[]
  recommended_next_steps?: string[]
  summary?: string
  [key: string]: unknown
}

type ParsedAI =
  | { type: 'case_analysis'; data: CaseAnalysisData }
  | { type: 'text'; content: string }

function parseAIContent(raw: string): ParsedAI {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const d = parsed as Record<string, unknown>
        if ('strength_score' in d || 'risk_flags' in d || 'recommended_next_steps' in d || 'summary' in d) {
          return { type: 'case_analysis', data: d as CaseAnalysisData }
        }
      }
      return { type: 'text', content: '```json\n' + JSON.stringify(parsed, null, 2) + '\n```' }
    } catch { /* not valid JSON — fall through */ }
  }
  return { type: 'text', content: raw }
}

function CaseAnalysisCard({ data }: { data: CaseAnalysisData }) {
  const score     = typeof data.strength_score === 'number' ? data.strength_score : null
  const riskFlags = Array.isArray(data.risk_flags) ? (data.risk_flags as string[]) : []
  const nextSteps = Array.isArray(data.recommended_next_steps) ? (data.recommended_next_steps as string[]) : []
  const summary   = typeof data.summary === 'string' ? data.summary : ''

  const scoreColor = score === null ? 'text-neutral-400'
    : score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-crimson-400'
  const scoreFill  = score === null ? 'bg-neutral-600'
    : score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-crimson-500'

  return (
    <div className="space-y-4">
      {summary && (
        <p className="text-sm text-neutral-200 leading-relaxed">{summary}</p>
      )}

      {score !== null && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Case Strength</span>
            <span className={`text-xl font-bold tabular-nums ${scoreColor}`}>
              {score}<span className="text-xs font-normal text-neutral-600 ml-0.5">/100</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
            <div className={`h-full rounded-full ${scoreFill} transition-all duration-700`} style={{ width: `${Math.max(score, 2)}%` }} />
          </div>
        </div>
      )}

      {riskFlags.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Risk Flags</p>
          <div className="flex flex-wrap gap-1.5">
            {riskFlags.map((flag, i) => (
              <Badge key={i} variant="danger" size="md">
                <span className="h-1.5 w-1.5 rounded-full bg-crimson-400 flex-shrink-0" />
                {flag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {nextSteps.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Recommended Next Steps</p>
          <ol className="space-y-2">
            {nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-300 leading-relaxed">
                <span className="flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500/15 border border-gold-500/25 text-[10px] font-bold text-gold-400">
                  {i + 1}
                </span>
                <span className="capitalize">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function AIMessageContent({ content }: { content: string }) {
  const parsed = parseAIContent(content)
  return parsed.type === 'case_analysis'
    ? <CaseAnalysisCard data={parsed.data} />
    : <MarkdownRenderer content={parsed.content} />
}

// ──────────────────────────────────────────────────────────────────────────────

function LexAIAvatar({ size = 8 }: { size?: number }) {
  const px = size * 4
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-md shadow-gold-500/20"
      style={{ width: px, height: px, minWidth: px }}
    >
      <svg width={px * 0.55} height={px * 0.55} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L3 9v3c0 5.25 3.8 10.15 9 11.32C17.2 22.15 21 17.25 21 12V9l-9-6z"/>
        <path d="M8 12h8M10 9l2 3 2-3"/>
      </svg>
    </div>
  )
}

function groupSessionsByDate(sessions: ChatSession[]) {
  const now = new Date()
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 86400000
  const weekStart = todayStart - 6 * 86400000
  const groups: Record<string, ChatSession[]> = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] }
  for (const s of sessions) {
    const t = new Date(s.updated_at).getTime()
    if (t >= todayStart)      groups['Today'].push(s)
    else if (t >= yesterdayStart) groups['Yesterday'].push(s)
    else if (t >= weekStart)  groups['This Week'].push(s)
    else                       groups['Earlier'].push(s)
  }
  return groups
}

function ChatPanel({ token }: { token: string }) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState('')
  const [userInitials, setUserInitials] = useState('ME')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    listChatSessions(token).then(setSessions).catch(() => {})
    const name = localStorage.getItem('fullName') ?? ''
    const parts = name.trim().split(' ')
    const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'ME'
    setUserInitials(initials)
  }, [token])

  async function loadSession(id: string) {
    setActiveSession(id)
    try {
      const s = await getChatSession(id, token)
      setMessages(s.messages ?? [])
    } catch { setMessages([]) }
  }

  function newChat() {
    setActiveSession(null)
    setMessages([])
    setStreamingText('')
    setError('')
  }

  async function send() {
    if (!input.trim() || streaming) return
    const msg = input.trim()
    setInput('')
    setError('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date().toISOString() }])
    setStreaming(true)
    setStreamingText('')

    let sid = activeSession ?? undefined
    await sendChatMessage(msg, token, {
      onSessionId: (id) => {
        sid = id
        setActiveSession(id)
        setSessions(prev => prev.some(s => s.id === id) ? prev : [{
          id, title: msg.slice(0, 60), language: 'en', case_id: null, updated_at: new Date().toISOString()
        }, ...prev])
      },
      onToken: (t) => setStreamingText(prev => prev + t),
      onDone: () => {
        setStreaming(false)
        setStreamingText(prev => {
          if (prev) setMessages(m => [...m, { role: 'assistant', content: prev, timestamp: new Date().toISOString() }])
          return ''
        })
      },
      onError: (e) => { setStreaming(false); setStreamingText(''); setError(e) },
    }, sid)
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const grouped = groupSessionsByDate(sessions)

  return (
    <div className="flex flex-col lg:flex-row rounded-2xl border border-white/8 overflow-hidden bg-primary-900/20" style={{ height: 'min(76vh, 760px)' }}>

      {/* ── Session sidebar ──────────────────────────────────────────────────── */}
      <aside className="flex-shrink-0 flex flex-row lg:flex-col lg:w-56 border-b lg:border-b-0 lg:border-r border-white/8 bg-primary-900/30">
        {/* New chat */}
        <div className="p-2.5 border-r lg:border-r-0 lg:border-b border-white/8 flex-shrink-0">
          <button
            onClick={newChat}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/25 text-gold-400 text-xs font-semibold hover:bg-gold-500/18 transition-colors whitespace-nowrap"
          >
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>
            New conversation
          </button>
        </div>
        {/* Session list */}
        <div className="flex-1 overflow-x-auto lg:overflow-x-hidden overflow-y-auto p-2 flex flex-row lg:flex-col gap-1 lg:gap-0 min-w-0">
          {sessions.length === 0 ? (
            <p className="hidden lg:block text-[10px] text-neutral-700 px-2 py-3 text-center">No sessions yet</p>
          ) : (
            Object.entries(grouped).map(([label, group]) => group.length === 0 ? null : (
              <div key={label} className="hidden lg:block mb-2">
                <p className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-neutral-700">{label}</p>
                {group.map(s => (
                  <button
                    key={s.id}
                    onClick={() => void loadSession(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-[11px] transition-all mb-0.5 ${
                      activeSession === s.id
                        ? 'bg-gold-500/12 border-l-[3px] border-gold-500 text-gold-300 pl-2.5 font-medium'
                        : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/4 border-l-[3px] border-transparent pl-2.5'
                    }`}
                  >
                    <span className="block truncate">{s.title || 'Untitled'}</span>
                  </button>
                ))}
              </div>
            ))
          )}
          {/* Mobile: flat list */}
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => void loadSession(s.id)}
              className={`lg:hidden flex-shrink-0 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${
                activeSession === s.id
                  ? 'bg-gold-500/15 text-gold-300 border border-gold-500/25 font-medium'
                  : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              {(s.title || 'Untitled').slice(0, 30)}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Chat area ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 lg:px-6 space-y-5">

          {/* Empty / welcome state */}
          {messages.length === 0 && !streaming && (
            <div className="h-full flex flex-col items-center justify-center gap-7 py-6 min-h-[300px]">
              <div className="flex flex-col items-center gap-3">
                <LexAIAvatar size={16} />
                <div className="text-center">
                  <h3 className="font-display font-semibold text-xl text-neutral-50 tracking-tight">LexAI</h3>
                  <p className="text-xs text-neutral-500 mt-1">Cameroonian Civil Law · Common Law · OHADA · CEMAC</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
                {EXAMPLE_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(p.text); setTimeout(() => textareaRef.current?.focus(), 50) }}
                    className="text-left p-3.5 rounded-2xl border border-white/8 bg-white/[0.025] hover:bg-white/[0.055] hover:border-gold-500/20 transition-all group"
                  >
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-700 mb-1">{p.label}</p>
                    <p className="text-xs text-neutral-400 group-hover:text-neutral-200 transition-colors leading-snug line-clamp-2">{p.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {m.role === 'assistant'
                ? <LexAIAvatar size={8} />
                : (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-neutral-700/80 flex items-center justify-center text-[11px] font-bold text-neutral-200">
                    {userInitials}
                  </div>
                )
              }
              <div className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[82%] min-w-0`}>
                {m.role === 'assistant' ? (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-4 min-w-0 w-full">
                    <AIMessageContent content={m.content} />
                  </div>
                ) : (
                  <div className="bg-gold-500/12 border border-gold-500/20 rounded-2xl px-4 py-3 text-neutral-100 text-sm leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </div>
                )}
                {m.timestamp && (
                  <p className="text-[9px] text-neutral-700 px-1">
                    {new Date(m.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Streaming response */}
          {streaming && streamingText && (
            <div className="flex gap-3">
              <LexAIAvatar size={8} />
              <div className="max-w-[82%] min-w-0 w-full">
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-4">
                  <AIMessageContent content={streamingText} />
                  <span className="inline-block w-0.5 h-[1.1em] bg-gold-500 animate-pulse align-middle ml-0.5 -mb-0.5" />
                </div>
              </div>
            </div>
          )}

          {/* Typing indicator — shown while waiting for first token */}
          {streaming && !streamingText && (
            <div className="flex gap-3">
              <LexAIAvatar size={8} />
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-5 py-4">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-neutral-600 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <span className="text-xs text-crimson-400 bg-crimson-500/8 border border-crimson-500/20 rounded-full px-4 py-1.5">{error}</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ──────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 pb-4 pt-3 lg:px-5 border-t border-white/8 bg-primary-900/20">
          <div className={`flex items-end gap-2 rounded-2xl border px-3 py-2.5 transition-colors ${streaming ? 'border-white/6 opacity-60' : 'border-white/10 focus-within:border-gold-500/35'} bg-primary-900/50`}>
            <button
              className="flex-shrink-0 mb-0.5 p-1.5 rounded-lg text-neutral-700 hover:text-neutral-400 hover:bg-white/5 transition-colors"
              title="Attach document (coming soon)"
              tabIndex={-1}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
              </svg>
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() } }}
              placeholder="Ask about Cameroonian law, OHADA, case strategy…"
              rows={1}
              disabled={streaming}
              className="flex-1 bg-transparent text-sm text-neutral-50 placeholder:text-neutral-600 focus:outline-none py-1 resize-none overflow-y-auto disabled:cursor-not-allowed"
              style={{ minHeight: 28, maxHeight: 120 }}
            />
            <button
              onClick={() => void send()}
              disabled={streaming || !input.trim()}
              className="flex-shrink-0 mb-0.5 p-2.5 rounded-xl transition-all bg-gold-500 hover:bg-gold-400 active:scale-95 text-black shadow-sm shadow-gold-500/20 disabled:opacity-25 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p className="text-center text-[9px] text-neutral-700 mt-1.5 tracking-wide">
            Enter ↵ to send · Shift + Enter for new line
          </p>
        </div>

      </div>
    </div>
  )
}

// ── Document Renderer ─────────────────────────────────────────────────────────

type DocSection = { tag: string; content: string }

function parseDoc(raw: string): DocSection[] {
  const sections: DocSection[] = []
  const re = /\[([A-Z_]+)\]([\s\S]*?)\[\/\1\]/g
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    const before = raw.slice(last, m.index).trim()
    if (before) sections.push({ tag: 'TEXT', content: before })
    sections.push({ tag: m[1], content: m[2].trim() })
    last = re.lastIndex
  }
  const tail = raw.slice(last).trim()
  if (tail) sections.push({ tag: 'TEXT', content: tail })
  return sections
}

function renderLine(line: string, i: number) {
  const t = line.trim()
  if (!t) return <div key={i} className="h-2" />
  if (/^\d+[\.\)]\s/.test(t)) return <p key={i} className="pl-5 text-[14px] leading-relaxed mb-1 text-neutral-800">{t}</p>
  if (/^[a-z]\)/.test(t)) return <p key={i} className="pl-8 text-[14px] leading-relaxed mb-0.5 text-neutral-700">{t}</p>
  if (/^(•|-)\s/.test(t)) return <p key={i} className="pl-5 text-[14px] leading-relaxed mb-0.5 text-neutral-700">{t}</p>
  return <p key={i} className="text-[14px] leading-relaxed mb-1 text-neutral-800">{t}</p>
}

function Block({ lines, className }: { lines: string; className?: string }) {
  return (
    <div className={className}>
      {lines.split('\n').map((l, i) => renderLine(l, i))}
    </div>
  )
}

function DocumentRenderer({ content, draftType }: { content: string; draftType?: string }) {
  const sections = parseDoc(content)
  const hasTags = sections.some(s => s.tag !== 'TEXT')

  // ── Tag-based structured renderer ──
  if (hasTags) {
    const get = (tag: string) => sections.find(s => s.tag === tag)?.content ?? ''
    const all = (tag: string) => sections.filter(s => s.tag === tag).map(s => s.content)

    // Detect document family from tags present
    const tags = new Set(sections.map(s => s.tag))
    const isLetter = tags.has('LETTERHEAD') || tags.has('SALUTATION')
    const isMotion = tags.has('MOTION_TITLE') || tags.has('PRAYER')
    const isAffidavit = tags.has('AFFIDAVIT_TITLE') || tags.has('JURAT') || tags.has('DEPONENT')
    const isMemo = tags.has('MEMO_HEADER') || tags.has('MEMO_META') || tags.has('ISSUES')
    const isAppeal = tags.has('APPEAL_TITLE') || tags.has('GROUNDS')
    const isClause = tags.has('CLAUSE_HEADER')

    return (
      <div className="bg-white rounded-xl shadow-md border border-neutral-200 mx-auto max-w-2xl text-neutral-900 overflow-hidden" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

        {/* ── LETTER / DEMAND / COURT LETTER layout ── */}
        {isLetter && (
          <>
            {/* Letterhead */}
            {get('LETTERHEAD') && (
              <div className="bg-neutral-900 text-white px-8 py-5">
                <div className="text-base font-bold tracking-wide mb-1">{get('LETTERHEAD').split('\n')[0]}</div>
                {get('LETTERHEAD').split('\n').slice(1).map((l, i) => (
                  <div key={i} className="text-neutral-300 text-xs">{l.trim()}</div>
                ))}
              </div>
            )}
            <div className="px-8 py-7 space-y-4">
              {get('DATE') && (
                <p className="text-right text-sm text-neutral-500 italic">{get('DATE')}</p>
              )}
              {get('TO') && (
                <div className="text-sm text-neutral-700 leading-relaxed border-l-2 border-neutral-300 pl-3">
                  {get('TO').split('\n').map((l, i) => <div key={i}>{l.trim()}</div>)}
                </div>
              )}
              {get('REF') && (
                <p className="text-xs text-neutral-500 font-medium tracking-wide">{get('REF')}</p>
              )}
              {get('SUBJECT') && (
                <div className="border-t border-b border-neutral-200 py-2 my-2">
                  <p className="font-bold text-neutral-900 text-sm tracking-wide">{get('SUBJECT')}</p>
                </div>
              )}
              {get('SALUTATION') && (
                <p className="font-semibold text-neutral-800 mt-2">{get('SALUTATION')}</p>
              )}
              {get('BODY') && (
                <Block lines={get('BODY')} className="space-y-3 text-neutral-800 mt-2" />
              )}
              {get('CLOSING') && (
                <p className="mt-6 text-neutral-700">{get('CLOSING')}</p>
              )}
              {get('SIGNATURE') && (
                <div className="mt-8 pt-4 border-t border-neutral-100">
                  {get('SIGNATURE').split('\n').map((l, i) => (
                    <div key={i} className={`text-sm ${i === 0 ? 'font-bold text-neutral-900' : 'text-neutral-600'}`}>{l.trim()}</div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── MOTION / REQUÊTE layout ── */}
        {isMotion && (
          <div className="px-8 py-7 space-y-5">
            {get('COURT') && (
              <div className="text-center border-b-2 border-neutral-900 pb-4 mb-2">
                {get('COURT').split('\n').map((l, i) => (
                  <div key={i} className={i === 0 ? 'font-bold text-lg text-neutral-900 tracking-widest uppercase' : 'text-sm text-neutral-600 mt-0.5'}>{l.trim()}</div>
                ))}
              </div>
            )}
            {get('CASE_REF') && (
              <div className="border border-neutral-300 rounded p-3 bg-neutral-50 text-sm text-center font-mono">
                {get('CASE_REF').split('\n').map((l, i) => <div key={i}>{l.trim()}</div>)}
              </div>
            )}
            {get('PARTIES') && (
              <div className="text-sm text-neutral-700 space-y-1 border-l-4 border-neutral-900 pl-4">
                {get('PARTIES').split('\n').map((l, i) => <div key={i}>{l.trim()}</div>)}
              </div>
            )}
            {get('MOTION_TITLE') && (
              <h2 className="text-center font-bold text-base uppercase tracking-wide text-neutral-900 py-2 border-b border-neutral-200">
                {get('MOTION_TITLE')}
              </h2>
            )}
            {get('PREAMBLE') && (
              <p className="italic text-neutral-700 text-sm">{get('PREAMBLE')}</p>
            )}
            {get('BODY') && (
              <Block lines={get('BODY')} className="space-y-2" />
            )}
            {get('PRAYER') && (
              <div className="mt-4 bg-neutral-50 border border-neutral-200 rounded p-4">
                <p className="font-bold text-sm text-neutral-900 mb-2 uppercase tracking-wide">Prayer / Conclusions</p>
                <Block lines={get('PRAYER')} className="space-y-1" />
              </div>
            )}
            {get('DATE') && <p className="text-sm text-neutral-500 italic mt-4">{get('DATE')}</p>}
            {get('SIGNATURE') && (
              <div className="mt-6 pt-4 border-t border-neutral-200">
                {get('SIGNATURE').split('\n').map((l, i) => (
                  <div key={i} className={`text-sm ${i === 0 ? 'font-bold' : 'text-neutral-600'}`}>{l.trim()}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── AFFIDAVIT layout ── */}
        {isAffidavit && (
          <div className="px-8 py-7 space-y-5">
            {get('COURT') && (
              <div className="text-center border-b-2 border-neutral-900 pb-3">
                {get('COURT').split('\n').map((l, i) => (
                  <div key={i} className={i === 0 ? 'font-bold text-lg uppercase tracking-widest' : 'text-sm text-neutral-600'}>{l.trim()}</div>
                ))}
              </div>
            )}
            {get('CASE_REF') && (
              <div className="border border-neutral-300 rounded p-3 bg-neutral-50 text-sm font-mono text-center">
                {get('CASE_REF').split('\n').map((l, i) => <div key={i}>{l.trim()}</div>)}
              </div>
            )}
            {get('AFFIDAVIT_TITLE') && (
              <h2 className="text-center font-bold uppercase text-base tracking-wide border-b border-neutral-300 pb-2">
                {get('AFFIDAVIT_TITLE')}
              </h2>
            )}
            {get('DEPONENT') && (
              <p className="italic text-neutral-800 text-sm leading-relaxed">{get('DEPONENT')}</p>
            )}
            {get('BODY') && (
              <Block lines={get('BODY')} className="space-y-2" />
            )}
            {get('JURAT') && (
              <div className="mt-6 bg-neutral-50 border border-neutral-300 rounded p-4 text-sm space-y-3">
                <p className="font-bold uppercase text-xs tracking-widest text-neutral-600">Jurat</p>
                <p className="text-neutral-700">{get('JURAT')}</p>
              </div>
            )}
            {get('SIGNATURE') && (
              <div className="mt-4 pt-4 border-t border-neutral-200 text-sm">
                {get('SIGNATURE').split('\n').map((l, i) => <div key={i} className="text-neutral-700">{l.trim()}</div>)}
              </div>
            )}
          </div>
        )}

        {/* ── MEMORANDUM layout ── */}
        {isMemo && (
          <div className="px-8 py-7 space-y-5">
            {get('MEMO_HEADER') && (
              <div className="bg-neutral-900 text-white px-6 py-4 -mx-8 -mt-7 mb-2 text-center">
                {get('MEMO_HEADER').split('\n').map((l, i) => (
                  <div key={i} className={i === 0 ? 'font-bold text-sm tracking-widest uppercase' : 'text-neutral-300 text-xs mt-0.5'}>{l.trim()}</div>
                ))}
              </div>
            )}
            {get('MEMO_META') && (
              <div className="bg-neutral-50 border border-neutral-200 rounded p-4 text-sm space-y-1">
                {get('MEMO_META').split('\n').map((l, i) => {
                  const [label, ...rest] = l.split(':')
                  return rest.length ? (
                    <div key={i} className="flex gap-2"><span className="font-bold text-neutral-600 w-20 shrink-0">{label}:</span><span>{rest.join(':').trim()}</span></div>
                  ) : <div key={i}>{l.trim()}</div>
                })}
              </div>
            )}
            {get('SUMMARY') && (
              <div className="bg-amber-50 border-l-4 border-amber-500 px-4 py-3">
                <p className="font-bold text-xs uppercase tracking-widest text-amber-700 mb-1">Executive Summary</p>
                <p className="text-sm text-neutral-800 leading-relaxed">{get('SUMMARY')}</p>
              </div>
            )}
            {get('ISSUES') && (
              <div>
                <p className="font-bold text-xs uppercase tracking-widest text-neutral-600 mb-2">Issues Presented</p>
                <Block lines={get('ISSUES')} className="space-y-1" />
              </div>
            )}
            {get('BRIEF_ANSWERS') && (
              <div>
                <p className="font-bold text-xs uppercase tracking-widest text-neutral-600 mb-2">Brief Answers</p>
                <Block lines={get('BRIEF_ANSWERS')} className="space-y-1" />
              </div>
            )}
            {get('BODY') && (
              <Block lines={get('BODY')} className="space-y-3 pt-2 border-t border-neutral-100" />
            )}
            {get('CONCLUSION') && (
              <div className="bg-neutral-50 border border-neutral-200 rounded p-4">
                <p className="font-bold text-xs uppercase tracking-widest text-neutral-600 mb-2">Conclusion & Recommendations</p>
                <Block lines={get('CONCLUSION')} className="space-y-1" />
              </div>
            )}
            {get('SIGNATURE') && (
              <div className="pt-4 border-t border-neutral-200 text-sm">
                {get('SIGNATURE').split('\n').map((l, i) => <div key={i} className={i === 0 ? 'font-bold' : 'text-neutral-600'}>{l.trim()}</div>)}
              </div>
            )}
          </div>
        )}

        {/* ── APPEAL BRIEF layout ── */}
        {isAppeal && (
          <div className="px-8 py-7 space-y-5">
            {get('COURT') && (
              <div className="text-center border-b-2 border-neutral-900 pb-3">
                {get('COURT').split('\n').map((l, i) => (
                  <div key={i} className={i === 0 ? 'font-bold text-lg uppercase tracking-widest' : 'text-sm text-neutral-600'}>{l.trim()}</div>
                ))}
              </div>
            )}
            {get('CASE_REF') && (
              <div className="border border-neutral-300 rounded p-3 bg-neutral-50 text-sm text-center font-mono">
                {get('CASE_REF').split('\n').map((l, i) => <div key={i}>{l.trim()}</div>)}
              </div>
            )}
            {get('PARTIES') && (
              <div className="text-sm text-center space-y-1 text-neutral-700">
                {get('PARTIES').split('\n').map((l, i) => (
                  <div key={i} className={l.includes('APPELLANT') || l.includes('APPELANT') ? 'font-bold' : ''}>{l.trim()}</div>
                ))}
              </div>
            )}
            {get('APPEAL_TITLE') && (
              <h2 className="text-center font-bold uppercase text-sm tracking-wide text-neutral-900 border-y border-neutral-300 py-2">
                {get('APPEAL_TITLE')}
              </h2>
            )}
            {get('BACKGROUND') && (
              <div>
                <p className="font-bold text-xs uppercase tracking-widest text-neutral-600 mb-2">Statement of the Case</p>
                <Block lines={get('BACKGROUND')} className="space-y-2" />
              </div>
            )}
            {get('GROUNDS') && (
              <div className="bg-neutral-50 border border-neutral-200 rounded p-4">
                <p className="font-bold text-xs uppercase tracking-widest text-neutral-600 mb-2">Grounds of Appeal</p>
                <Block lines={get('GROUNDS')} className="space-y-1" />
              </div>
            )}
            {get('ARGUMENTS') && (
              <div>
                <p className="font-bold text-xs uppercase tracking-widest text-neutral-600 mb-2">Submissions</p>
                <Block lines={get('ARGUMENTS')} className="space-y-2" />
              </div>
            )}
            {get('PRAYER') && (
              <div className="bg-neutral-50 border border-neutral-200 rounded p-4">
                <p className="font-bold text-xs uppercase tracking-widest text-neutral-600 mb-2">Prayer</p>
                <Block lines={get('PRAYER')} className="space-y-1" />
              </div>
            )}
            {get('DATE') && <p className="text-sm italic text-neutral-500">{get('DATE')}</p>}
            {get('SIGNATURE') && (
              <div className="pt-4 border-t border-neutral-200 text-sm">
                {get('SIGNATURE').split('\n').map((l, i) => <div key={i} className={i === 0 ? 'font-bold' : 'text-neutral-600'}>{l.trim()}</div>)}
              </div>
            )}
          </div>
        )}

        {/* ── CONTRACT CLAUSE layout ── */}
        {isClause && (
          <div className="px-8 py-7 space-y-4">
            {get('CLAUSE_HEADER') && (
              <div className="border-b-2 border-neutral-900 pb-3">
                {get('CLAUSE_HEADER').split('\n').map((l, i) => (
                  <div key={i} className={i === 0 ? 'font-bold text-base uppercase tracking-wide' : 'text-xs text-neutral-500 mt-0.5'}>{l.trim()}</div>
                ))}
              </div>
            )}
            {get('BODY') && <Block lines={get('BODY')} className="space-y-2" />}
            {get('DEFINITIONS') && (
              <div className="bg-neutral-50 border border-neutral-200 rounded p-4">
                <p className="font-bold text-xs uppercase tracking-widest text-neutral-600 mb-2">Definitions</p>
                <Block lines={get('DEFINITIONS')} className="space-y-1" />
              </div>
            )}
            {get('NOTES') && (
              <div className="bg-amber-50 border-l-4 border-amber-400 px-4 py-3">
                <p className="font-bold text-xs uppercase tracking-widest text-amber-700 mb-1">Drafting Notes</p>
                <Block lines={get('NOTES')} className="space-y-1 text-sm text-neutral-700" />
              </div>
            )}
          </div>
        )}

        {/* Fallback for OTHER or unknown tag combos */}
        {!isLetter && !isMotion && !isAffidavit && !isMemo && !isAppeal && !isClause && (
          <div className="px-8 py-7 space-y-3">
            {sections.map((s, i) => {
              if (s.tag === 'TITLE') return <h2 key={i} className="font-bold text-base text-center uppercase tracking-wide border-b pb-2">{s.content}</h2>
              if (s.tag === 'DATE') return <p key={i} className="text-right text-sm text-neutral-500 italic">{s.content}</p>
              if (s.tag === 'PARTIES') return <div key={i} className="border-l-4 border-neutral-300 pl-3 text-sm space-y-0.5">{s.content.split('\n').map((l, j) => <div key={j}>{l}</div>)}</div>
              if (s.tag === 'BODY') return <Block key={i} lines={s.content} className="space-y-2" />
              if (s.tag === 'SIGNATURE') return <div key={i} className="pt-4 border-t text-sm space-y-0.5">{s.content.split('\n').map((l, j) => <div key={j} className={j === 0 ? 'font-bold' : 'text-neutral-600'}>{l.trim()}</div>)}</div>
              if (s.tag === 'TEXT') return <Block key={i} lines={s.content} className="space-y-2" />
              return (
                <div key={i} className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{s.tag.replace(/_/g, ' ')}</p>
                  <Block lines={s.content} className="space-y-1" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Fallback: smart line-by-line renderer for unstructured text ──
  let dateFound = false
  const lines = content.split('\n')
  return (
    <div className="bg-white rounded-xl shadow-md border border-neutral-200 px-8 py-7 mx-auto max-w-2xl space-y-1" style={{ fontFamily: "'Georgia', serif" }}>
      {lines.map((line, i) => {
        const t = line.trim()
        if (!t) return <div key={i} className="h-3" />
        if (/^(RE|SUBJECT|OBJET)\s*:/i.test(t)) return <p key={i} className="font-bold border-l-2 border-amber-500 pl-3 py-1 text-neutral-900">{t}</p>
        const isDate = /^\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},\s+\d{4}/.test(t)
        if (isDate && !dateFound) { dateFound = true; return <p key={i} className="text-right text-sm text-neutral-500 italic">{t}</p> }
        if (t.length > 4 && t === t.toUpperCase() && /[A-Z]{3}/.test(t)) return <h3 key={i} className="font-bold text-center uppercase tracking-wide text-sm pt-4 pb-1 text-neutral-900">{t}</h3>
        if (/^(Dear|Cher|Chère|Madam|Monsieur)\b/i.test(t)) return <p key={i} className="font-semibold mt-4 text-neutral-900">{t}</p>
        if (/^(Yours|Respectfully|Sincerely|Cordialement|Veuillez agréer)\b/i.test(t)) return <p key={i} className="mt-6 text-neutral-700">{t}</p>
        if (/^\d+[\.\)]\s/.test(t)) return <p key={i} className="pl-5 leading-relaxed text-[14px] text-neutral-800">{t}</p>
        return <p key={i} className="leading-relaxed text-[14px] text-neutral-800">{t}</p>
      })}
    </div>
  )
}

// ── Legal Drafts Panel ────────────────────────────────────────────────────────

type DraftStep = 'form' | 'clarifying' | 'questions' | 'generating' | 'done'

function DraftsPanel({ token }: { token: string }) {
  const [drafts, setDrafts] = useState<LegalDraftSummary[]>([])
  const [selected, setSelected] = useState<LegalDraft | null>(null)

  // Wizard state
  const [step, setStep] = useState<DraftStep>('form')
  const [form, setForm] = useState({ draft_type: 'letter_to_client', instructions: '', title: '' })
  const [questions, setQuestions] = useState<ClarifyQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [streamContent, setStreamContent] = useState('')
  const [error, setError] = useState('')

  // Translation state
  const [translating, setTranslating] = useState(false)
  const [translatedContent, setTranslatedContent] = useState('')
  const [translatedLang, setTranslatedLang] = useState<'en' | 'fr' | null>(null)
  const [showTranslated, setShowTranslated] = useState(false)

  useEffect(() => {
    listLegalDrafts(token).then(setDrafts).catch(() => {})
  }, [token])

  function resetWizard() {
    setStep('form')
    setForm({ draft_type: 'letter_to_client', instructions: '', title: '' })
    setQuestions([])
    setAnswers({})
    setStreamContent('')
    setError('')
    setTranslatedContent('')
    setTranslatedLang(null)
    setShowTranslated(false)
  }

  async function translate(targetLang: 'en' | 'fr') {
    const source = selected?.content || streamContent
    if (!source || translating) return
    setTranslating(true)
    setTranslatedContent('')
    setTranslatedLang(targetLang)
    setShowTranslated(true)
    await streamTranslate(
      { content: source, target_lang: targetLang },
      token,
      {
        onToken: t => setTranslatedContent(prev => prev + t),
        onDone: () => setTranslating(false),
        onError: () => setTranslating(false),
      },
    )
  }

  async function askClarifyQuestions() {
    if (!form.instructions.trim()) return
    setStep('clarifying')
    setError('')
    try {
      const qs = await clarifyDraft({ draft_type: form.draft_type, instructions: form.instructions }, token)
      setQuestions(qs)
      setAnswers(Object.fromEntries(qs.map(q => [q.id, ''])))
      setStep('questions')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load questions')
      setStep('form')
    }
  }

  async function generate() {
    setStep('generating')
    setStreamContent('')
    setError('')
    await streamDraft(
      { draft_type: form.draft_type, instructions: form.instructions, answers, title: form.title || undefined },
      token,
      {
        onToken: t => setStreamContent(prev => prev + t),
        onDone: draft => {
          setDrafts(prev => [{ id: draft.id, draft_type: form.draft_type, title: draft.title, case_id: null, created_at: draft.created_at }, ...prev])
          setStep('done')
        },
        onError: msg => { setError(msg); setStep('questions') },
      },
    )
  }

  async function openDraft(id: string) {
    try {
      const d = await getLegalDraft(id, token)
      setSelected(d)
      resetWizard()
    } catch { /* ignore */ }
  }

  async function removeDraft(id: string) {
    await deleteLegalDraft(id, token).catch(() => {})
    setDrafts(prev => prev.filter(d => d.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const activeContent = step === 'done' || step === 'generating' ? streamContent : selected?.content ?? ''
  const showDocument = (step === 'done' || step === 'generating') || (selected && step === 'form')

  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 h-[82vh] lg:h-[var(--chat-height)]">
      {/* Draft list — horizontal scroll on mobile, sidebar on desktop */}
      <aside className="flex-shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto lg:w-56 pb-1 lg:pb-0">
        <button
          onClick={() => { setSelected(null); resetWizard(); setStep('form') }}
          className="flex-shrink-0 px-3 py-2 rounded-lg bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-medium hover:bg-gold-500/20 transition-colors whitespace-nowrap"
        >
          + New Draft
        </button>
        {drafts.map(d => (
          <button
            key={d.id}
            onClick={() => void openDraft(d.id)}
            className={`flex-shrink-0 text-left px-3 py-2 rounded-lg text-xs transition-colors whitespace-nowrap lg:whitespace-normal lg:w-full ${
              selected?.id === d.id
                ? 'bg-gold-500/15 text-gold-300 border border-gold-500/20'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
            }`}
          >
            <div className="lg:truncate font-medium">{d.title}</div>
            <div className="text-neutral-600 text-[10px] hidden lg:block">{DRAFT_TYPE_LABELS[d.draft_type] ?? d.draft_type}</div>
          </button>
        ))}
        {drafts.length === 0 && step === 'form' && (
          <p className="text-neutral-600 text-xs px-2 pt-1 lg:pt-4 whitespace-nowrap lg:whitespace-normal">No drafts yet.</p>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col rounded-xl border border-neutral-700/40 bg-primary-800/30 overflow-hidden min-h-0">

        {/* ── Step: form ── */}
        {step === 'form' && !selected && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <h3 className="font-heading text-body-lg text-neutral-50">Generate Legal Draft</h3>
              <p className="text-neutral-500 text-xs mt-1">Describe what you need — AI will ask clarifying questions before drafting.</p>
            </div>
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
              <label className="block text-neutral-400 text-xs mb-1">Brief description <span className="text-crimson-400">*</span></label>
              <textarea
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="What is this document for? Who are the parties? What is the key issue or relief sought? Don't worry about details — AI will ask follow-up questions."
                rows={5}
                className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50 resize-none"
              />
            </div>
            {error && <p className="text-crimson-400 text-xs">{error}</p>}
            <button
              onClick={() => void askClarifyQuestions()}
              disabled={!form.instructions.trim()}
              className="px-5 py-2.5 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              Continue — let AI ask me questions →
            </button>
          </div>
        )}

        {/* ── Step: clarifying (loading questions) ── */}
        {step === 'clarifying' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <svg className="w-8 h-8 animate-spin text-gold-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-neutral-400 text-sm">AI is reviewing your description and preparing questions…</p>
          </div>
        )}

        {/* ── Step: questions ── */}
        {step === 'questions' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <h3 className="font-heading text-body-lg text-neutral-50">A few quick questions</h3>
              <p className="text-neutral-500 text-xs mt-1">
                Answer as many as you can — AI will use these to produce a complete document with no missing placeholders.
              </p>
            </div>

            <div className="space-y-4">
              {questions.map(q => (
                <div key={q.id}>
                  <label className="block text-neutral-300 text-sm mb-1">
                    {q.label}
                    {q.required && <span className="text-crimson-400 ml-1">*</span>}
                  </label>
                  <input
                    value={answers[q.id] ?? ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder={q.placeholder}
                    className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50"
                  />
                </div>
              ))}
            </div>

            {error && <p className="text-crimson-400 text-xs">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => void generate()}
                className="px-5 py-2.5 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 transition-colors flex items-center gap-2"
              >
                Generate Draft
              </button>
              <button
                onClick={() => setStep('form')}
                className="px-4 py-2 rounded-lg border border-neutral-700/40 text-neutral-400 text-sm hover:text-neutral-200 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        )}

        {/* ── Step: generating / done (streaming document view) ── */}
        {(step === 'generating' || step === 'done') && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-700/40 flex-shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                {step === 'generating' && (
                  <svg className="w-4 h-4 animate-spin text-gold-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                )}
                <span className="text-neutral-300 text-sm font-medium">
                  {step === 'generating' ? 'Drafting document…' : (form.title || DRAFT_TYPE_LABELS[form.draft_type] || 'Draft')}
                </span>
              </div>
              {step === 'done' && (
                <div className="flex gap-2 flex-wrap">
                  {/* Translation buttons */}
                  <div className="flex items-center gap-1 border border-neutral-700/40 rounded-lg overflow-hidden">
                    <button
                      onClick={() => { setShowTranslated(false) }}
                      className={`px-2.5 py-1.5 text-xs transition-colors ${!showTranslated ? 'bg-gold-500/20 text-gold-300' : 'text-neutral-500 hover:text-neutral-200'}`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => void translate('fr')}
                      disabled={translating}
                      className={`px-2.5 py-1.5 text-xs transition-colors ${showTranslated && translatedLang === 'fr' ? 'bg-gold-500/20 text-gold-300' : 'text-neutral-500 hover:text-neutral-200'}`}
                    >
                      {translating && translatedLang === 'fr' ? '…' : '🇫🇷 FR'}
                    </button>
                    <button
                      onClick={() => void translate('en')}
                      disabled={translating}
                      className={`px-2.5 py-1.5 text-xs transition-colors ${showTranslated && translatedLang === 'en' ? 'bg-gold-500/20 text-gold-300' : 'text-neutral-500 hover:text-neutral-200'}`}
                    >
                      {translating && translatedLang === 'en' ? '…' : '🇬🇧 EN'}
                    </button>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(showTranslated ? translatedContent : streamContent).catch(() => {})}
                    className="px-3 py-1.5 rounded-lg border border-neutral-700/40 text-neutral-400 text-xs hover:text-gold-400 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => { resetWizard(); setSelected(null) }}
                    className="px-3 py-1.5 rounded-lg border border-neutral-700/40 text-neutral-400 text-xs hover:text-neutral-200 transition-colors"
                  >
                    New Draft
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-neutral-100/5">
              {showTranslated && translatedContent ? (
                <DocumentRenderer content={translatedContent} draftType={form.draft_type} />
              ) : showTranslated && translating ? (
                <div className="h-32 flex items-center justify-center text-neutral-400 text-sm gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Translating…
                </div>
              ) : streamContent ? (
                <DocumentRenderer content={streamContent} draftType={form.draft_type} />
              ) : (
                <div className="h-32 flex items-center justify-center text-neutral-500 text-sm">Starting…</div>
              )}
            </div>
          </div>
        )}

        {/* ── Viewing saved draft ── */}
        {selected && step === 'form' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-700/40 flex-shrink-0 flex-wrap gap-2">
              <div>
                <span className="text-neutral-200 text-sm font-medium">{selected.title}</span>
                <span className="ml-3 text-neutral-500 text-xs">
                  {DRAFT_TYPE_LABELS[selected.draft_type] ?? selected.draft_type} · {new Date(selected.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* Translation buttons */}
                <div className="flex items-center gap-1 border border-neutral-700/40 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowTranslated(false)}
                    className={`px-2.5 py-1.5 text-xs transition-colors ${!showTranslated ? 'bg-gold-500/20 text-gold-300' : 'text-neutral-500 hover:text-neutral-200'}`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => void translate('fr')}
                    disabled={translating}
                    className={`px-2.5 py-1.5 text-xs transition-colors ${showTranslated && translatedLang === 'fr' ? 'bg-gold-500/20 text-gold-300' : 'text-neutral-500 hover:text-neutral-200'}`}
                  >
                    {translating && translatedLang === 'fr' ? '…' : '🇫🇷 FR'}
                  </button>
                  <button
                    onClick={() => void translate('en')}
                    disabled={translating}
                    className={`px-2.5 py-1.5 text-xs transition-colors ${showTranslated && translatedLang === 'en' ? 'bg-gold-500/20 text-gold-300' : 'text-neutral-500 hover:text-neutral-200'}`}
                  >
                    {translating && translatedLang === 'en' ? '…' : '🇬🇧 EN'}
                  </button>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(showTranslated ? translatedContent : selected.content).catch(() => {})}
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
            <div className="flex-1 overflow-y-auto p-6 bg-neutral-100/5">
              {showTranslated && translatedContent ? (
                <DocumentRenderer content={translatedContent} draftType={selected.draft_type} />
              ) : showTranslated && translating ? (
                <div className="h-32 flex items-center justify-center text-neutral-400 text-sm gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Translating…
                </div>
              ) : (
                <DocumentRenderer content={selected.content} draftType={selected.draft_type} />
              )}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {step === 'form' && !selected && false && (
          <div className="flex-1 flex items-center justify-center text-center text-neutral-500 text-sm p-8">
            <div>
              <div className="mb-3 flex justify-center text-neutral-500"><DocumentIcon width={30} height={30} /></div>
              <p className="font-medium text-neutral-300 mb-1">Legal Document Drafts</p>
              <p>Generate professionally formatted legal documents using AI trained on Cameroonian law.</p>
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
    if (!file && !context.trim()) { setError('Please upload a file or describe what you want analysed.'); return }
    setUploading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      if (file) formData.append('file', file)
      if (context) formData.append('context', context)

      const res = await fetch('/api/v1/ai/analyze/direct/', {
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
                    <AlertTriangleIcon width={14} height={14} className="text-crimson-400 mt-0.5 flex-shrink-0" />
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
                    <CheckIcon width={14} height={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
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

// ── Recent Analyses store ─────────────────────────────────────────────────────

const RECENT_ANALYSES_KEY = 'lawbridge_recent_analyses'

type RecentAnalysis = { id: string; fileName: string; date: string; score: number; level: string; summary: string; clauseCount: number }

function getRecentAnalyses(): RecentAnalysis[] {
  try { return JSON.parse(localStorage.getItem(RECENT_ANALYSES_KEY) || '[]') }
  catch { return [] }
}

function persistRecentAnalysis(a: RecentAnalysis) {
  const list = [a, ...getRecentAnalyses().filter(x => x.id !== a.id)].slice(0, 10)
  localStorage.setItem(RECENT_ANALYSES_KEY, JSON.stringify(list))
}

// ── Contract Review Panel ─────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  low: 'border-emerald-500/40 bg-emerald-900/10',
  medium: 'border-gold-500/40 bg-gold-900/10',
  high: 'border-amber-500/40 bg-amber-700/10',
  critical: 'border-crimson-500/40 bg-crimson-700/10',
}

const RISK_VARIANT: Record<string, 'success' | 'gold' | 'warning' | 'danger'> = {
  low: 'success',
  medium: 'gold',
  high: 'warning',
  critical: 'danger',
}

const RISK_SCORE_COLOR = (score: number) =>
  score >= 75 ? '#EF4444' : score >= 45 ? '#F59E0B' : '#10B981'

function RiskScoreRing({ score }: { score: number }) {
  const color = RISK_SCORE_COLOR(score)
  const deg = score * 3.6
  return (
    <div className="relative w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: `conic-gradient(${color} ${deg}deg, #1f2937 ${deg}deg)` }}>
      <div className="w-20 h-20 rounded-full bg-primary-900 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-neutral-50" style={{ color }}>{score}</span>
        <span className="text-[10px] text-neutral-400">/ 100</span>
      </div>
    </div>
  )
}

function ClauseCard({ clause }: { clause: ContractClause }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-lg border-l-4 ${RISK_COLORS[clause.risk_level]} p-4 space-y-2`}
      style={{ borderLeftColor: clause.risk_level === 'critical' ? '#ef4444' : clause.risk_level === 'high' ? '#f97316' : clause.risk_level === 'medium' ? '#f59e0b' : '#10b981' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={RISK_VARIANT[clause.risk_level]}>{clause.risk_level}</Badge>
          <span className="text-sm font-medium text-neutral-100">{clause.title}</span>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-neutral-500 hover:text-neutral-300 text-xs flex-shrink-0"
        >
          {open ? 'hide ▲' : 'details ▼'}
        </button>
      </div>
      <p className="text-xs text-neutral-400 font-mono truncate">{clause.excerpt}</p>
      {open && (
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Issue</p>
            <p className="text-xs text-neutral-300 mt-0.5">{clause.issue}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">Recommendation</p>
            <p className="text-xs text-neutral-200 mt-0.5">{clause.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ContractReviewPanel({ token }: { token: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<ContractReviewResult | null>(null)
  const [error, setError] = useState('')
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setRecentAnalyses(getRecentAnalyses()) }, [])

  async function runAnalysis() {
    if (!file) { setError('Please upload a contract file.'); return }
    setAnalyzing(true)
    setError('')
    setResult(null)
    try {
      const data = await analyzeContract(file, token)
      setResult(data)
      const rec: RecentAnalysis = {
        id: Date.now().toString(),
        fileName: file.name,
        date: new Date().toISOString(),
        score: data.overall_risk_score,
        level: data.risk_level,
        summary: data.summary.slice(0, 140),
        clauseCount: data.clauses.length,
      }
      persistRecentAnalysis(rec)
      setRecentAnalyses(getRecentAnalyses())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    }
    setAnalyzing(false)
  }

  function exportReport() {
    if (!result) return
    const lines = [
      `CONTRACT RISK REPORT`,
      `Overall Risk Score: ${result.overall_risk_score}/100 (${result.risk_level.toUpperCase()})`,
      ``,
      `SUMMARY`,
      result.summary,
      ``,
    ]
    if (result.missing_clauses.length > 0) {
      lines.push('MISSING CLAUSES')
      result.missing_clauses.forEach(c => lines.push(`• ${c}`))
      lines.push('')
    }
    lines.push('CLAUSE ANALYSIS')
    result.clauses.forEach(c => {
      lines.push(`[${c.risk_level.toUpperCase()}] ${c.title}`)
      lines.push(`Issue: ${c.issue}`)
      lines.push(`Recommendation: ${c.recommendation}`)
      lines.push('')
    })
    navigator.clipboard.writeText(lines.join('\n')).catch(() => {})
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-6 space-y-4">
        <div>
          <h3 className="font-heading text-body-lg text-neutral-50">AI Contract Intelligence</h3>
          <p className="text-neutral-500 text-sm mt-1">
            Upload a contract for clause-by-clause risk analysis under Cameroonian law and OHADA Uniform Acts.
          </p>
        </div>

        <div
          className="border-2 border-dashed border-neutral-700/40 rounded-xl p-8 text-center cursor-pointer hover:border-gold-500/30 hover:bg-primary-800/20 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt"
            onChange={e => { setFile(e.target.files?.[0] ?? null); setResult(null) }}
          />
          {file ? (
            <div className="space-y-1">
              <p className="text-gold-400 text-sm font-medium">{file.name}</p>
              <p className="text-neutral-500 text-xs">{(file.size / 1024).toFixed(0)} KB · Click to change</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center">
                <DocumentIcon width={40} height={40} className="w-10 h-10 text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-sm">Click to upload a contract</p>
              <p className="text-neutral-600 text-xs">PDF, DOCX, TXT — up to 10 MB</p>
            </div>
          )}
        </div>

        {error && <p className="text-crimson-400 text-xs">{error}</p>}

        <button
          onClick={() => void runAnalysis()}
          disabled={analyzing || !file}
          className="px-5 py-2.5 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {analyzing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Analyzing contract…
            </>
          ) : 'Analyze Contract'}
        </button>
      </div>

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && !result && !analyzing && (
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/20 p-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Recent Analyses</p>
          <div className="space-y-2">
            {recentAnalyses.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg border border-neutral-700/30 bg-primary-900/30 px-3 py-2.5">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${
                  r.level === 'critical' ? 'border-crimson-500/40 text-crimson-400 bg-crimson-900/20'
                  : r.level === 'high' ? 'border-amber-500/40 text-amber-400 bg-amber-900/20'
                  : r.level === 'medium' ? 'border-gold-500/40 text-gold-400 bg-gold-900/20'
                  : 'border-emerald-500/40 text-emerald-400 bg-emerald-900/20'
                }`}>
                  {r.score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-200 truncate">{r.fileName}</p>
                  <p className="text-[10px] text-neutral-500">{r.clauseCount} clauses · {new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Risk Overview */}
          <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-5">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
              <RiskScoreRing score={result.overall_risk_score} />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-heading text-body-md text-neutral-50">Overall Risk Assessment</h4>
                  <Badge variant={RISK_VARIANT[result.risk_level]} size="md">{result.risk_level}</Badge>
                </div>
                <p className="text-neutral-300 text-sm">{result.summary}</p>
                <button
                  onClick={exportReport}
                  className="text-xs text-neutral-500 hover:text-gold-400 flex items-center gap-1 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Copy Report
                </button>
              </div>
            </div>
          </div>

          {/* Missing Clauses */}
          {result.missing_clauses.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-5">
              <h4 className="font-heading text-body-md text-neutral-50 mb-3 flex items-center gap-2">
                <AlertTriangleIcon width={16} height={16} className="text-amber-400" />
                Missing Standard Clauses
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.missing_clauses.map((c, i) => (
                  <Badge key={i} variant="warning">{c}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Clause Cards */}
          {result.clauses.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-heading text-body-md text-neutral-50">
                Clause Analysis <span className="text-neutral-500 font-normal text-sm">({result.clauses.length} clauses)</span>
              </h4>
              {result.clauses.map((clause, i) => (
                <ClauseCard key={i} clause={clause} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Legal Research Panel ──────────────────────────────────────────────────────

function ResearchPanel({ token }: { token: string }) {
  const [query, setQuery] = useState('')
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function search(q?: string) {
    const searchQuery = (q ?? query).trim()
    if (!searchQuery || streaming) return
    setStreaming(true)
    setStreamText('')
    setResult(null)
    setError('')

    await streamLegalResearch(
      { query: searchQuery, session_id: sessionId },
      token,
      {
        onToken: t => setStreamText(prev => prev + t),
        onDone: (res) => {
          setResult(res)
          if (res.session_id) setSessionId(res.session_id)
          setHistory(prev => [searchQuery, ...prev.filter(h => h !== searchQuery)].slice(0, 5))
          setStreaming(false)
          setStreamText('')
        },
        onError: msg => { setError(msg); setStreaming(false) },
      },
    )
  }

  function copyCitation(citation: ResearchCitation) {
    const text = `${citation.title} — ${citation.reference}\n(${citation.relevance_note})`
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
      {/* Recent searches — horizontal scroll on mobile, sidebar on desktop */}
      {history.length > 0 && (
        <aside className="flex-shrink-0 lg:w-48">
          <p className="text-neutral-500 text-xs uppercase tracking-widest mb-2 px-1">Recent</p>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 lg:block lg:space-y-1 lg:overflow-x-hidden">
            {history.map((h, i) => (
              <button
                key={i}
                onClick={() => { setQuery(h); void search(h) }}
                className="flex-shrink-0 text-left px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-white/5 whitespace-nowrap lg:whitespace-normal lg:truncate lg:w-full transition-colors"
              >
                {h}
              </button>
            ))}
          </div>
        </aside>
      )}

      <div className="flex-1 space-y-5">
        {/* Search box */}
        <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-5 space-y-3">
          <div>
            <h3 className="font-heading text-body-lg text-neutral-50">Legal Research Mode</h3>
            <p className="text-neutral-500 text-sm mt-0.5">
              Search Cameroonian Civil Code, Common Law, OHADA Uniform Acts, and CEMAC regulations with cited statutes.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void search() }}
              placeholder="Search Cameroonian law, OHADA, force majeure…"
              className="flex-1 rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2.5 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50"
            />
            <button
              onClick={() => void search()}
              disabled={streaming || !query.trim()}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-gold-500 text-black font-semibold text-sm hover:bg-gold-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
            >
              {streaming ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <SearchIcon width={16} height={16} className="w-4 h-4" />
              )}
              Search
            </button>
          </div>
        </div>

        {/* Streaming answer */}
        {streaming && streamText && (
          <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-5">
            <MarkdownRenderer content={streamText} />
            <span className="inline-block w-0.5 h-4 bg-gold-400 animate-pulse align-middle ml-0.5 mt-1" />
          </div>
        )}

        {error && <p className="text-crimson-400 text-xs">{error}</p>}

        {/* Result */}
        {result && !streaming && (
          <div className="space-y-4">
            {/* Answer + confidence */}
            <div className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <h4 className="font-heading text-body-md text-neutral-50">Research Answer</h4>
                <Badge variant={result.confidence === 'high' ? 'success' : result.confidence === 'medium' ? 'gold' : 'danger'} size="md">
                  {result.confidence === 'high' ? 'High Confidence' : result.confidence === 'medium' ? 'Medium Confidence' : 'Low — verify independently'}
                </Badge>
              </div>
              <MarkdownRenderer content={result.answer} />
              {result.disclaimer && (
                <p className="text-xs text-neutral-500 border-t border-neutral-700/30 pt-2">{result.disclaimer}</p>
              )}
            </div>

            {/* Citations */}
            {result.citations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-heading text-body-md text-neutral-50">Legal Citations</h4>
                {result.citations.map((c, i) => (
                  <div key={i} className="rounded-xl border border-neutral-700/30 bg-primary-800/20 p-4 flex items-start gap-3">
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-100">{c.title}</p>
                      <p className="text-xs font-mono text-gold-400">{c.reference}</p>
                      <p className="text-xs text-neutral-500">{c.relevance_note}</p>
                    </div>
                    <button
                      onClick={() => copyCitation(c)}
                      className="flex-shrink-0 px-2.5 py-1 rounded-lg border border-neutral-700/40 text-neutral-400 text-xs hover:text-gold-400 hover:border-gold-500/30 transition-colors"
                    >
                      {copied ? <CheckIcon width={14} height={14} /> : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!streaming && !result && !error && (
          <div className="rounded-xl border border-dashed border-neutral-700/30 p-10 text-center">
            <div className="mb-3 flex justify-center text-neutral-500"><BookOpenIcon width={32} height={32} /></div>
            <p className="font-medium text-neutral-300 mb-1">Search Cameroonian Law</p>
            <p className="text-neutral-500 text-sm">Ask a legal question and receive a cited answer backed by specific statutes, articles, and OHADA regulations.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Clause Library ────────────────────────────────────────────────────────────

const CLAUSE_LIB_KEY = 'lawbridge_clause_library'
const CLAUSE_CATEGORIES = ['General', 'Indemnity', 'Liability', 'Payment', 'Termination', 'Confidentiality', 'Governing Law', 'Dispute Resolution', 'Force Majeure', 'IP', 'Other']

type SavedClause = { id: string; title: string; content: string; category: string; savedAt: string }

function getClauseLibrary(): SavedClause[] {
  try { return JSON.parse(localStorage.getItem(CLAUSE_LIB_KEY) || '[]') }
  catch { return [] }
}

function persistClause(c: SavedClause) {
  const lib = [c, ...getClauseLibrary().filter(x => x.id !== c.id)]
  localStorage.setItem(CLAUSE_LIB_KEY, JSON.stringify(lib))
}

function deleteClauseById(id: string) {
  localStorage.setItem(CLAUSE_LIB_KEY, JSON.stringify(getClauseLibrary().filter(x => x.id !== id)))
}

function ClauseLibraryPanel() {
  const [clauses, setClauses] = useState<SavedClause[]>([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: 'General' })
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => { setClauses(getClauseLibrary()) }, [])

  function addClause() {
    if (!form.title.trim() || !form.content.trim()) return
    const c: SavedClause = {
      id: Date.now().toString(),
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      savedAt: new Date().toISOString(),
    }
    persistClause(c)
    setClauses(getClauseLibrary())
    setForm({ title: '', content: '', category: 'General' })
    setShowAdd(false)
  }

  function remove(id: string) {
    deleteClauseById(id)
    setClauses(getClauseLibrary())
  }

  function copy(content: string, id: string) {
    navigator.clipboard.writeText(content).catch(() => {})
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const usedCats = [...new Set(clauses.map(c => c.category))]
  const filtered = clauses.filter(c => {
    const q = search.toLowerCase()
    return (!q || c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q))
      && (!catFilter || c.category === catFilter)
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="font-heading text-body-lg text-neutral-50">Clause Library</h3>
          <p className="text-neutral-500 text-sm mt-0.5">Save and reuse contract clauses across matters.</p>
        </div>
        <button
          onClick={() => setShowAdd(o => !o)}
          className="flex-shrink-0 px-4 py-2 rounded-lg bg-gold-500/15 border border-gold-500/30 text-gold-400 text-sm font-medium hover:bg-gold-500/25 transition-colors flex items-center gap-1.5"
        >
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="6" y1="1" x2="6" y2="11"/><line x1="1" y1="6" x2="11" y2="6"/></svg>
          Add Clause
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-gold-500/20 bg-primary-800/40 p-5 space-y-3">
          <h4 className="text-sm font-medium text-neutral-200">New Clause</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Clause title (e.g. Force Majeure)"
              className="rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50"
            />
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 focus:outline-none focus:border-gold-500/50"
            >
              {CLAUSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="Paste the clause text here…"
            rows={5}
            className="w-full rounded-lg bg-primary-900/50 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={addClause}
              disabled={!form.title.trim() || !form.content.trim()}
              className="px-4 py-2 rounded-lg bg-gold-500 text-black text-sm font-semibold hover:bg-gold-400 disabled:opacity-50 transition-colors"
            >
              Save Clause
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-lg border border-neutral-700/40 text-neutral-400 text-sm hover:text-neutral-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {clauses.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clauses…"
            className="flex-1 min-w-[180px] rounded-lg bg-primary-800/40 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-50 placeholder:text-neutral-500 focus:outline-none focus:border-gold-500/50"
          />
          {usedCats.length > 1 && (
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="rounded-lg bg-primary-800/40 border border-neutral-700/40 px-3 py-2 text-sm text-neutral-400 focus:outline-none focus:border-gold-500/50"
            >
              <option value="">All categories</option>
              {usedCats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.id} className="rounded-xl border border-neutral-700/40 bg-primary-800/30 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-neutral-100">{c.title}</span>
                    <Badge variant="neutral">{c.category}</Badge>
                  </div>
                  <p className="text-[10px] text-neutral-600 mt-0.5">{new Date(c.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => copy(c.content, c.id)}
                    className={`px-2.5 py-1 rounded-lg border text-xs transition-colors ${
                      copied === c.id ? 'border-emerald-500/30 text-emerald-400' : 'border-neutral-700/40 text-neutral-400 hover:text-gold-400 hover:border-gold-500/30'
                    }`}
                  >
                    {copied === c.id ? <span className="flex items-center gap-1"><CheckIcon width={12} height={12} /> Copied</span> : 'Copy'}
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="px-2 py-1 rounded-lg border border-neutral-700/40 text-neutral-600 text-xs hover:text-crimson-400 hover:border-crimson-500/30 transition-colors"
                  >
                    <XCircleIcon width={12} height={12} />
                  </button>
                </div>
              </div>
              <pre className="text-xs text-neutral-400 leading-relaxed line-clamp-3 font-mono bg-primary-900/40 rounded-lg px-3 py-2 whitespace-pre-wrap break-words">{c.content}</pre>
            </div>
          ))}
        </div>
      ) : clauses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-700/30 p-10 text-center">
          <div className="mb-3 flex justify-center text-neutral-500"><ClipboardIcon width={32} height={32} /></div>
          <p className="font-medium text-neutral-300 mb-1">No saved clauses yet</p>
          <p className="text-neutral-500 text-sm">Save contract clauses from your drafts or add them manually to reuse across matters.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-gold-500/15 border border-gold-500/30 text-gold-400 text-sm hover:bg-gold-500/25 transition-colors"
          >
            Add your first clause
          </button>
        </div>
      ) : (
        <p className="text-neutral-500 text-sm text-center py-6">No clauses match your search.</p>
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

  const tabs: { key: Tab; label: string; short: string; icon: React.ReactNode }[] = [
    { key: 'chat',     label: 'LexAI Chat',        short: 'Chat',     icon: <ChatBubbleIcon /> },
    { key: 'drafts',   label: 'Legal Drafts',       short: 'Drafts',   icon: <DocumentIcon className="w-5 h-5" /> },
    { key: 'analysis', label: 'Doc Analysis',       short: 'Analysis', icon: <SparkIcon /> },
    { key: 'contract', label: 'Contract Review',    short: 'Contract', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )},
    { key: 'research', label: 'Legal Research',     short: 'Research', icon: <SearchIcon className="w-5 h-5" /> },
    { key: 'clauses', label: 'Clause Library', short: 'Clauses', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414A1 1 0 0120 8.414V17a2 2 0 01-2 2H8M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
      </svg>
    )},
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-display-md text-neutral-50">AI Legal Assistant</h1>
          <p className="mt-1 text-neutral-400 text-sm hidden sm:block">
            LexAI is trained on Cameroonian Civil Law, Common Law, OHADA, and CEMAC regulations — your 24/7 legal research partner.
          </p>
          <p className="mt-1 text-neutral-400 text-xs sm:hidden">
            Your AI-powered legal research partner.
          </p>
        </div>
        <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/20 border border-gold-500/30 flex items-center justify-center">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="flex gap-0.5 border-b border-neutral-700/40 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex-shrink-0 ${
              tab === t.key
                ? 'border-gold-500 text-gold-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {t.icon}
            <span className="sm:hidden">{t.short}</span>
            <span className="hidden sm:inline">{t.label}</span>
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
          {tab === 'contract' && <ContractReviewPanel token={token} />}
          {tab === 'research' && <ResearchPanel token={token} />}
          {tab === 'clauses'  && <ClauseLibraryPanel />}
        </>
      )}
    </div>
  )
}
