import type { User } from '../../api/auth'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { login as apiLogin, logout as apiLogout, refresh as apiRefresh, register as apiRegister, me } from '../../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  let initPromise: Promise<void> | null = null

  const isLoggedIn = computed(() => !!user.value)

  async function init() {
    if (initialized.value) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      loading.value = true
      try {
        const res = await me()
        if (res.user) {
          user.value = res.user
        } else {
          try {
            user.value = (await apiRefresh()).user
          } catch {
            user.value = null
          }
        }
      } catch {
        user.value = null
      } finally {
        initialized.value = true
        loading.value = false
        initPromise = null
      }
    })()

    return initPromise
  }

  async function login(identifier: string, password: string) {
    const res = await apiLogin(identifier, password)
    user.value = res.user
  }

  async function register(username: string, email: string, password: string, displayName?: string) {
    const res = await apiRegister(username, email, password, displayName)
    user.value = res.user
  }

  async function logout() {
    try {
      await apiLogout()
    } finally {
      user.value = null
      initialized.value = true
    }
  }

  return { user, loading, initialized, isLoggedIn, init, login, register, logout }
})
