import { apiRequest } from './client'

export interface User {
  id: string
  username: string
  email: string
  displayName: string
}

export interface AuthResponse {
  user: User
}

export async function me(): Promise<{ user: User | null }> {
  return apiRequest<{ user: User | null }>('/api/auth/me')
}

export async function login(identifier: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  })
}

export async function register(username: string, email: string, password: string, displayName?: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, displayName: displayName?.trim() || undefined }),
  })
}

export async function logout(): Promise<void> {
  await apiRequest<void>('/api/auth/logout', { method: 'POST' })
}

export async function refresh(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/refresh', { method: 'POST' })
}
