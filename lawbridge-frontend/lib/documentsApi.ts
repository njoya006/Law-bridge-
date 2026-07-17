import { api } from './api'
import { SERVICE_URLS } from './serviceUrls'

export type DocumentSignature = {
  id: string
  signer_id: string
  signer_name: string
  signature_type: 'draw' | 'typed' | 'stamp'
  stamp_type: string
  signed_at: string
}

export type DocumentItem = {
  id: string
  case_id: string
  uploader_id: string
  filename: string
  document_type: string
  status: string
  file_size: number
  mime_type: string
  minio_path?: string | null
  is_encrypted: boolean
  version: number
  parent_document_id?: string | null
  created_at: string
  updated_at: string
  is_password_protected?: boolean
  signatures?: DocumentSignature[]
}

export function listDocuments(caseId: string, token?: string | null) {
  return api.get<{ count: number; results: DocumentItem[] }>('document', `/${caseId}/`, token)
}

export function uploadDocument(
  caseId: string,
  file: File,
  type: string,
  token: string,
  password?: string,
  parentDocumentId?: string,
) {
  const form = new FormData()
  form.append('file', file)
  form.append('type', type)
  if (password) form.append('password', password)
  if (parentDocumentId) form.append('parent_document_id', parentDocumentId)
  return api.request<DocumentItem>('document', `/upload/${caseId}/`, {
    method: 'POST',
    token,
    headers: {},
    body: form,
  })
}

export function signDocument(
  documentId: string,
  data: {
    signature_type: 'draw' | 'typed' | 'stamp'
    signature_data: string
    stamp_type?: string
    signer_name?: string
  },
  token: string,
) {
  return api.request<DocumentSignature>('document', `/${documentId}/sign/`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
}

async function fetchDocumentResponse(documentId: string, token?: string | null, password?: string | null) {
  if (!token) throw new Error('Missing auth token')

  const url = `${SERVICE_URLS.document.replace(/\/$/, '')}/${documentId}/download/`
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (password) headers['X-DOCUMENT-PASSWORD'] = password
  let resp = await fetch(url, { method: 'GET', headers })

  if (!resp.ok) {
    if ((resp.status === 401 || resp.status === 403) && typeof window !== 'undefined') {
      const refresh = localStorage.getItem('refresh')
      if (refresh) {
        const refreshResponse = await fetch(`${SERVICE_URLS.auth.replace(/\/$/, '')}/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        })

        if (refreshResponse.ok) {
          const refreshed = await refreshResponse.json() as { access?: string }
          if (refreshed.access) {
            localStorage.setItem('access', refreshed.access)
            resp = await fetch(url, { method: 'GET', headers: { Authorization: `Bearer ${refreshed.access}` } })
          }
        }
      }
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => 'Request failed')
      if (/password required/i.test(text)) throw new Error('password_required')
      if (/invalid password/i.test(text)) throw new Error('invalid_password')
      throw new Error(`${resp.status} ${url}: ${text}`)
    }
  }

  return resp
}

export async function fetchDocumentBlob(documentId: string, token?: string | null, password?: string | null) {
  const response = await fetchDocumentResponse(documentId, token, password)
  return response.blob()
}

export async function openDocument(documentId: string, token?: string | null, password?: string | null) {
  const blob = await fetchDocumentBlob(documentId, token, password)
  const blobUrl = URL.createObjectURL(blob)
  const page = window.open(blobUrl, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  return page
}

export async function downloadDocument(documentId: string, token?: string | null, password?: string | null, filename?: string) {
  const blob = await fetchDocumentBlob(documentId, token, password)
  const blobUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = filename || documentId
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}
