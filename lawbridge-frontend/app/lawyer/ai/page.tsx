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
  getLegalDraft,
  deleteLegalDraft,
  clarifyDraft,
  streamDraft,
  streamTranslate,
  type LegalDraft,
  type LegalDraftSummary,
  type ClarifyQuestion,
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
    <div className="flex gap-4 h-[78vh] min-h-[560px]">
      {/* Sidebar — draft list */}
      <aside className="w-56 flex-shrink-0 flex flex-col gap-2">
        <button
          onClick={() => { setSelected(null); resetWizard(); setStep('form') }}
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
          {drafts.length === 0 && step === 'form' && (
            <p className="text-neutral-600 text-xs px-2 pt-4">No drafts yet. Click &quot;+ New Draft&quot; to generate one with AI.</p>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col rounded-xl border border-neutral-700/40 bg-primary-800/30 overflow-hidden">

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
              <div className="text-3xl mb-3">📄</div>
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
