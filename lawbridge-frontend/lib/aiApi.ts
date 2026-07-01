import { SERVICE_URLS } from './serviceUrls'

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export type ChatSession = {
  id: string
  title: string
  language: string
  case_id: string | null
  updated_at: string
  messages?: ChatMessage[]
}

export type SessionsResponse = {
  results?: ChatSession[]
}

function aiBase() {
  return SERVICE_URLS.ai.replace(/\/$/, '')
}

export async function listChatSessions(token: string): Promise<ChatSession[]> {
  const res = await fetch(`${aiBase()}/ai/sessions/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load sessions (${res.status})`)
  const data = (await res.json()) as SessionsResponse | ChatSession[]
  return Array.isArray(data) ? data : (data.results ?? [])
}

export async function getChatSession(sessionId: string, token: string): Promise<ChatSession> {
  const res = await fetch(`${aiBase()}/ai/sessions/${sessionId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Session not found (${res.status})`)
  return res.json() as Promise<ChatSession>
}

export async function deleteChatSession(sessionId: string, token: string): Promise<void> {
  const res = await fetch(`${aiBase()}/ai/sessions/${sessionId}/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 404) throw new Error(`Delete failed (${res.status})`)
}

export type StreamCallbacks = {
  onSessionId?: (id: string) => void
  onToken: (token: string) => void
  onDone: () => void
  onError: (msg: string) => void
}

/**
 * POST /api/v1/ai/chat/ and consume the SSE stream.
 * Calls onToken for each streamed token, onDone when complete.
 */
export async function sendChatMessage(
  message: string,
  token: string,
  callbacks: StreamCallbacks,
  sessionId?: string,
  caseId?: string,
): Promise<void> {
  const res = await fetch(`${aiBase()}/ai/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      message,
      ...(sessionId ? { session_id: sessionId } : {}),
      ...(caseId ? { case_id: caseId } : {}),
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    callbacks.onError(`Request failed (${res.status}): ${text.slice(0, 200)}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) {
    callbacks.onError('No response body')
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue

        try {
          const parsed = JSON.parse(raw) as {
            session_id?: string
            token?: string
            done?: boolean
            error?: string
          }

          if (parsed.session_id) callbacks.onSessionId?.(parsed.session_id)
          if (parsed.token) callbacks.onToken(parsed.token)
          if (parsed.error) { callbacks.onError(parsed.error); return }
          if (parsed.done) { callbacks.onDone(); return }
        } catch {
          // malformed SSE line — skip
        }
      }
    }
  } finally {
    reader.cancel().catch(() => undefined)
  }

  callbacks.onDone()
}

// ── Legal Drafts ──────────────────────────────────────────────────────────────

export type LegalDraft = {
  id: string
  draft_type: string
  title: string
  instructions: string
  content: string
  case_id: string | null
  created_at: string
}

export type LegalDraftSummary = Pick<LegalDraft, 'id' | 'draft_type' | 'title' | 'case_id' | 'created_at'>

export const DRAFT_TYPE_LABELS: Record<string, string> = {
  letter_to_client:    'Letter to Client',
  letter_to_court:     'Letter to Court',
  motion:              'Motion / Requête',
  contract_clause:     'Contract Clause',
  memorandum:          'Legal Memorandum',
  demand_letter:       'Demand Letter',
  affidavit:           'Affidavit',
  settlement_proposal: 'Settlement Proposal',
  appeal_brief:        'Appeal Brief',
  other:               'Other',
}

export async function listLegalDrafts(token: string): Promise<LegalDraftSummary[]> {
  const res = await fetch(`${aiBase()}/ai/drafts/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to load drafts (${res.status})`)
  return res.json() as Promise<LegalDraftSummary[]>
}

export async function getLegalDraft(id: string, token: string): Promise<LegalDraft> {
  const res = await fetch(`${aiBase()}/ai/drafts/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Draft not found (${res.status})`)
  return res.json() as Promise<LegalDraft>
}

export async function createLegalDraft(
  payload: { draft_type: string; instructions: string; title?: string; case_id?: string | null },
  token: string,
): Promise<LegalDraft> {
  const res = await fetch(`${aiBase()}/ai/drafts/create/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Draft generation failed (${res.status}): ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<LegalDraft>
}

export async function deleteLegalDraft(id: string, token: string): Promise<void> {
  const res = await fetch(`${aiBase()}/ai/drafts/${id}/`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 404) throw new Error(`Delete failed (${res.status})`)
}

export type ClarifyQuestion = {
  id: string
  label: string
  placeholder: string
  required: boolean
}

export async function clarifyDraft(
  payload: { draft_type: string; instructions: string },
  token: string,
): Promise<ClarifyQuestion[]> {
  const res = await fetch(`${aiBase()}/ai/drafts/clarify/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Clarify failed (${res.status})`)
  const data = await res.json() as { questions: ClarifyQuestion[] }
  return data.questions
}

export type DraftStreamCallbacks = {
  onToken: (t: string) => void
  onDone: (draft: { id: string; title: string; created_at: string }) => void
  onError: (msg: string) => void
}

export type TranslateCallbacks = {
  onToken: (t: string) => void
  onDone: () => void
  onError: (msg: string) => void
}

export async function streamTranslate(
  payload: { content: string; target_lang: 'en' | 'fr' },
  token: string,
  callbacks: TranslateCallbacks,
): Promise<void> {
  const res = await fetch(`${aiBase()}/ai/drafts/translate/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    callbacks.onError(`Translation failed (${res.status})`)
    return
  }
  const reader = res.body?.getReader()
  if (!reader) { callbacks.onError('No response body'); return }
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue
        try {
          const parsed = JSON.parse(raw) as { token?: string; done?: boolean; error?: string }
          if (parsed.error) { callbacks.onError(parsed.error); return }
          if (parsed.token) callbacks.onToken(parsed.token)
          if (parsed.done) { callbacks.onDone(); return }
        } catch { /* skip */ }
      }
    }
  } finally {
    reader.cancel().catch(() => undefined)
  }
  callbacks.onDone()
}

// ── Contract Intelligence ─────────────────────────────────────────────────────

export type ContractClause = {
  title: string
  excerpt: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  issue: string
  recommendation: string
}

export type ContractReviewResult = {
  overall_risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  missing_clauses: string[]
  clauses: ContractClause[]
}

export async function analyzeContract(file: File, token: string): Promise<ContractReviewResult> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${aiBase()}/ai/analyze/contract/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Contract analysis failed (${res.status}): ${text.slice(0, 200)}`)
  }

  return res.json() as Promise<ContractReviewResult>
}

// ── Legal Research ────────────────────────────────────────────────────────────

export type ResearchCitation = {
  title: string
  reference: string
  relevance_note: string
}

export type ResearchResult = {
  answer: string
  citations: ResearchCitation[]
  confidence: 'high' | 'medium' | 'low'
  disclaimer: string
  session_id?: string
}

export type ResearchCallbacks = {
  onToken: (t: string) => void
  onDone: (result: ResearchResult) => void
  onError: (msg: string) => void
}

// ── Meeting Notes → Action Items ─────────────────────────────────────────────

export type ActionItem = {
  item: string
  assignee: 'lawyer' | 'client' | 'third_party'
  suggested_due_date: string | null
}

export type MeetingResult = {
  summary: string
  action_items: ActionItem[]
  draft_client_email: string
  case_note_text: string
}

export type MeetingCallbacks = {
  onToken: (t: string) => void
  onDone: (result: MeetingResult) => void
  onError: (msg: string) => void
}

export async function streamMeetingSummary(
  payload: { raw_notes: string; case_id: string; case_type: string; client_name: string },
  token: string,
  callbacks: MeetingCallbacks,
): Promise<void> {
  const res = await fetch(`${aiBase()}/ai/meetings/summarize/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    callbacks.onError(`Meeting summary failed (${res.status}): ${text.slice(0, 200)}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) { callbacks.onError('No response body'); return }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue
        try {
          const parsed = JSON.parse(raw) as {
            token?: string
            done?: boolean
            error?: string
            summary?: string
            action_items?: ActionItem[]
            draft_client_email?: string
            case_note_text?: string
          }
          if (parsed.error) { callbacks.onError(parsed.error); return }
          if (parsed.token) callbacks.onToken(parsed.token)
          if (parsed.done) {
            callbacks.onDone({
              summary: parsed.summary ?? '',
              action_items: parsed.action_items ?? [],
              draft_client_email: parsed.draft_client_email ?? '',
              case_note_text: parsed.case_note_text ?? '',
            })
            return
          }
        } catch { /* skip */ }
      }
    }
  } finally {
    reader.cancel().catch(() => undefined)
  }
  callbacks.onDone({ summary: '', action_items: [], draft_client_email: '', case_note_text: '' })
}

export async function streamLegalResearch(
  payload: { query: string; session_id?: string },
  token: string,
  callbacks: ResearchCallbacks,
): Promise<void> {
  const res = await fetch(`${aiBase()}/ai/research/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    callbacks.onError(`Research failed (${res.status}): ${text.slice(0, 200)}`)
    return
  }

  const reader = res.body?.getReader()
  if (!reader) { callbacks.onError('No response body'); return }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue
        try {
          const parsed = JSON.parse(raw) as {
            token?: string
            done?: boolean
            error?: string
            answer?: string
            citations?: ResearchCitation[]
            confidence?: string
            disclaimer?: string
            session_id?: string
          }
          if (parsed.error) { callbacks.onError(parsed.error); return }
          if (parsed.token) callbacks.onToken(parsed.token)
          if (parsed.done) {
            callbacks.onDone({
              answer: parsed.answer ?? '',
              citations: parsed.citations ?? [],
              confidence: (parsed.confidence ?? 'medium') as ResearchResult['confidence'],
              disclaimer: parsed.disclaimer ?? '',
              session_id: parsed.session_id,
            })
            return
          }
        } catch { /* skip */ }
      }
    }
  } finally {
    reader.cancel().catch(() => undefined)
  }
  callbacks.onDone({ answer: '', citations: [], confidence: 'low', disclaimer: '' })
}

export async function streamDraft(
  payload: { draft_type: string; instructions: string; answers?: Record<string, string>; title?: string; case_id?: string | null },
  token: string,
  callbacks: DraftStreamCallbacks,
): Promise<void> {
  const res = await fetch(`${aiBase()}/ai/drafts/stream/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    callbacks.onError(`Draft generation failed (${res.status}): ${text.slice(0, 200)}`)
    return
  }
  const reader = res.body?.getReader()
  if (!reader) { callbacks.onError('No response body'); return }

  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw) continue
        try {
          const parsed = JSON.parse(raw) as { token?: string; done?: boolean; draft_id?: string; title?: string; created_at?: string; error?: string }
          if (parsed.error) { callbacks.onError(parsed.error); return }
          if (parsed.token) callbacks.onToken(parsed.token)
          if (parsed.done && parsed.draft_id) {
            callbacks.onDone({ id: parsed.draft_id, title: parsed.title ?? 'Draft', created_at: parsed.created_at ?? new Date().toISOString() })
            return
          }
        } catch { /* skip malformed line */ }
      }
    }
  } finally {
    reader.cancel().catch(() => undefined)
  }
}
