const DEFAULT_API_ORIGIN = 'http://localhost:3000'

function getApiOrigin(): string {
  if (import.meta.env.VITE_API_ORIGIN) return import.meta.env.VITE_API_ORIGIN as string
  return DEFAULT_API_ORIGIN
}

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message)
  }
}

async function request<T>(path: string, init: RequestInit | undefined, allowRefresh: boolean): Promise<T> {
  const response = await fetch(`${getApiOrigin()}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

  if (response.status === 401 && allowRefresh && path !== '/api/auth/refresh') {
    const refreshResponse = await fetch(`${getApiOrigin()}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (refreshResponse.ok) return request<T>(path, init, false)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? `HTTP ${response.status}`,
      response.status,
    )
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, init, true)
}
