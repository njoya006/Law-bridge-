import { api } from './api'

export interface ThreadParticipant {
  user_id: string
  display_name: string
  role: 'client' | 'lawyer' | 'firm_admin' | 'support'
  firm_id?: number | null
  last_read_at?: string | null
  joined_at: string
  is_active: boolean
}

export interface LastMessage {
  id: number
  content: string
  sender_name: string
  created_at: string
  is_ai: boolean
}

export interface Thread {
  id: number
  thread_type: 'client_lawyer' | 'client_firm' | 'client_support' | 'firm_internal'
  case_id: string
  case_ref: string
  case_title: string
  subject: string
  is_ai_support: boolean
  escalated_to_human: boolean
  is_closed: boolean
  created_at: string
  updated_at: string
  participants: ThreadParticipant[]
  last_message: LastMessage | null
  unread_count: number
}

export interface Reaction {
  emoji: string
  user_id: string
  display_name: string
  created_at: string
}

export interface Message {
  id: number
  sender_id: string
  sender_name: string
  sender_role: string
  content: string
  is_ai: boolean
  is_system: boolean
  is_deleted: boolean
  created_at: string
  edited_at?: string | null
  reactions: Reaction[]
}

export interface CreateThreadPayload {
  thread_type: Thread['thread_type']
  case_id?: string
  case_ref?: string
  case_title?: string
  subject?: string
  participants?: Array<{
    user_id: string
    display_name: string
    role: string
    firm_id?: number
  }>
}

// ── REST API ────────────────────────────────────────────────────────────────

export async function listThreads(token: string): Promise<Thread[]> {
  return api.get<Thread[]>('messaging', '/messages/threads', token)
}

export async function createThread(payload: CreateThreadPayload, token: string): Promise<Thread> {
  return api.post<Thread>('messaging', '/messages/threads', payload, token)
}

export async function getThread(id: number, token: string): Promise<Thread> {
  return api.get<Thread>('messaging', `/messages/threads/${id}`, token)
}

export async function listMessages(threadId: number, token: string, beforeId?: number): Promise<Message[]> {
  const qs = beforeId ? `?before=${beforeId}` : ''
  return api.get<Message[]>('messaging', `/messages/threads/${threadId}/messages${qs}`, token)
}

export async function sendMessage(threadId: number, content: string, token: string): Promise<Message> {
  return api.post<Message>('messaging', `/messages/threads/${threadId}/messages`, { content }, token)
}

export async function markRead(threadId: number, token: string): Promise<void> {
  await api.post('messaging', `/messages/threads/${threadId}/read`, {}, token)
}

export async function escalateToHuman(threadId: number, token: string): Promise<void> {
  await api.post('messaging', `/messages/threads/${threadId}/escalate`, {}, token)
}

export async function toggleReaction(threadId: number, messageId: number, emoji: string, token: string): Promise<{ added: boolean }> {
  return api.post('messaging', `/messages/threads/${threadId}/messages/${messageId}/react`, { emoji }, token)
}

export async function toggleThreadAI(threadId: number, token: string): Promise<{ is_ai_support: boolean }> {
  return api.patch<{ is_ai_support: boolean }>('messaging', `/messages/threads/${threadId}`, {}, token)
}

/**
 * Opens the direct conversation between client and lawyer for a specific case.
 * Reuses an existing thread if one already exists; creates a new one otherwise.
 */
export async function getOrCreateCaseThread(opts: {
  caseId: string
  caseTitle: string
  caseRef?: string
  otherUserId: string
  otherDisplayName: string
  otherRole: 'lawyer' | 'client' | 'firm_admin'
  token: string
}): Promise<Thread> {
  const threads = await listThreads(opts.token)
  const existing = threads.find(
    t => t.thread_type === 'client_lawyer' && t.case_id === opts.caseId,
  )
  if (existing) return existing

  return createThread(
    {
      thread_type: 'client_lawyer',
      case_id: opts.caseId,
      case_ref: opts.caseRef || '',
      case_title: opts.caseTitle,
      subject: opts.caseTitle || 'Case conversation',
      participants: [{ user_id: opts.otherUserId, display_name: opts.otherDisplayName, role: opts.otherRole }],
    },
    opts.token,
  )
}

// ── WebSocket URL ───────────────────────────────────────────────────────────

export function getWebSocketUrl(threadId: number, token: string): string {
  const gatewayHttp =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
    (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : 'http://localhost')

  // Convert http(s):// → ws(s)://
  const wsBase = gatewayHttp.replace(/^http/, 'ws').replace(/\/$/, '')
  return `${wsBase}/ws/messages/thread/${threadId}/?token=${encodeURIComponent(token)}`
}

// ── Thread type labels ──────────────────────────────────────────────────────

export const THREAD_TYPE_LABELS: Record<Thread['thread_type'], string> = {
  client_lawyer: 'Lawyer',
  client_firm: 'Firm',
  client_support: 'Support',
  firm_internal: 'Team',
}

export const THREAD_TYPE_COLORS: Record<Thread['thread_type'], string> = {
  client_lawyer: 'text-blue-400 bg-blue-400/10',
  client_firm: 'text-purple-400 bg-purple-400/10',
  client_support: 'text-emerald-400 bg-emerald-400/10',
  firm_internal: 'text-orange-400 bg-orange-400/10',
}
