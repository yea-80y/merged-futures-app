import { get } from 'svelte/store'
import { auth } from '../auth/auth-store'
import { getSessionDelegation } from '../auth/session-delegation'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  authenticated?: boolean
}

export async function apiRequest<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, authenticated = false } = opts

  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (authenticated) {
    const state = get(auth)
    if (!state.sessionAddress || !state.delegation) {
      throw new Error('Not authenticated')
    }

    const delegation = state.delegation ?? await getSessionDelegation()
    if (delegation) {
      const delegationB64 = btoa(JSON.stringify(delegation))
      fetchHeaders['X-Session-Delegation'] = delegationB64
    }
    fetchHeaders['X-Session-Address'] = state.sessionAddress
  }

  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API ${method} ${path} failed: ${res.status} ${text}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return res.json()
  }
  return res.text() as unknown as T
}

export const api = {
  get: <T = unknown>(path: string, authenticated = false) =>
    apiRequest<T>(path, { authenticated }),

  post: <T = unknown>(path: string, body: unknown, authenticated = true) =>
    apiRequest<T>(path, { method: 'POST', body, authenticated }),

  patch: <T = unknown>(path: string, body: unknown, authenticated = true) =>
    apiRequest<T>(path, { method: 'PATCH', body, authenticated }),
}
