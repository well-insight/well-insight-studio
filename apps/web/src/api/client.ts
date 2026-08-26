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

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiOrigin()}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })

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
