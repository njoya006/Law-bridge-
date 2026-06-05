import { SERVICE_URLS, type ServiceName } from './serviceUrls'

type RequestOptions = RequestInit & {
  service?: ServiceName
  token?: string | null
}

function buildUrl(service: ServiceName, path: string) {
  const base = SERVICE_URLS[service].replace(/\/$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${base}${suffix}`
}

function clearStoredSession() {
  if (typeof window === 'undefined') return

  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
  localStorage.removeItem('portalRole')
  localStorage.removeItem('userRole')
  localStorage.removeItem('lawyerId')
  localStorage.removeItem('authUserId')
}

function redirectToLogin() {
  if (typeof window === 'undefined') return

  if (!window.location.pathname.startsWith('/auth/login')) {
    window.location.assign('/auth/login?reason=session-expired')
  }
}

async function request<T>(service: ServiceName, path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, body, ...rest } = options
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const requestBody: BodyInit | null | undefined =
    body == null ? undefined : isFormData ? body : typeof body === 'string' ? body : JSON.stringify(body)
  const url = buildUrl(service, path)
  const response = await fetch(url, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: requestBody,
  })

  if (!response.ok) {
    const message = await response.text().catch(() => 'Request failed')
    const short = (message || `Request failed with status ${response.status}`).slice(0, 1000)
    const tokenExpired = /token_not_valid|token has expired|given token not valid|not valid for any token type|invalid token|token is invalid/i.test(short)

    if (typeof window !== 'undefined' && tokenExpired && (response.status === 401 || response.status === 403)) {
      const refresh = localStorage.getItem('refresh')
      if (refresh) {
        try {
          const refreshResponse = await fetch(`${SERVICE_URLS.auth.replace(/\/$/, '')}/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
          })

          if (refreshResponse.ok) {
            const refreshed = await refreshResponse.json() as { access?: string }
            if (refreshed.access) {
              localStorage.setItem('access', refreshed.access)
              const retry = await fetch(url, {
                ...rest,
                headers: {
                  ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
                  Authorization: `Bearer ${refreshed.access}`,
                  ...(headers || {}),
                },
                body: requestBody,
              })

              if (retry.ok) {
                if (retry.status === 204) return undefined as T
                return retry.json() as Promise<T>
              }

              const retryMessage = await retry.text().catch(() => 'Request failed')
              const retryShort = (retryMessage || `Request failed with status ${retry.status}`).slice(0, 1000)
              throw new Error(`${retry.status} ${url}: ${retryShort}`)
            }
          } else {
            clearStoredSession()
            redirectToLogin()
            throw new Error('Session expired. Please sign in again.')
          }
        } catch {
          clearStoredSession()
          redirectToLogin()
          throw new Error('Session expired. Please sign in again.')
        }
      }

      clearStoredSession()
      redirectToLogin()
      throw new Error('Session expired. Please sign in again.')
    }

    throw new Error(`${response.status} ${url}: ${short}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  request,
  get: <T>(service: ServiceName, path: string, token?: string | null) => request<T>(service, path, { method: 'GET', token }),
  post: <T>(service: ServiceName, path: string, body?: unknown, token?: string | null) => request<T>(service, path, { method: 'POST', body: body as BodyInit | null | undefined, token }),
  patch: <T>(service: ServiceName, path: string, body?: unknown, token?: string | null) => request<T>(service, path, { method: 'PATCH', body: body as BodyInit | null | undefined, token }),
  put: <T>(service: ServiceName, path: string, body?: unknown, token?: string | null) => request<T>(service, path, { method: 'PUT', body: body as BodyInit | null | undefined, token }),
  del: <T>(service: ServiceName, path: string, token?: string | null) => request<T>(service, path, { method: 'DELETE', token }),
}
