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
