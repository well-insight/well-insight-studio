import { defineStore } from 'pinia'
import type { AuthUser } from '@/api/auth'
import { store } from '@/store'

const TOKEN_KEY = 'well-cube-auth-token'
const USER_KEY = 'well-cube-auth-user'

function readStoredUser(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: (typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)) || '',
    user: readStoredUser() as AuthUser | null,
  }),
  actions: {
    setToken(token: string) {
      this.token = token
      if (typeof localStorage === 'undefined') return
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    },
    setUser(user: AuthUser | null) {
      this.user = user
      if (typeof localStorage === 'undefined') return
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
      else localStorage.removeItem(USER_KEY)
    },
    loginSuccess(token: string, user: AuthUser) {
      this.setToken(token)
      this.setUser(user)
    },
    logout() {
      this.setToken('')
      this.setUser(null)
    },
  },
})

export function getAuthStore() {
  return useAuthStore(store)
}
