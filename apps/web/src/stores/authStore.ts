import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '../api/auth'
import { login as apiLogin, logout as apiLogout, me, register as apiRegister } from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  async function init() {
    if (initialized.value) return
    loading.value = true
    try {
      const res = await me()
      user.value = res.user
    } catch {
      user.value = null
    } finally {
      initialized.value = true
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password)
    user.value = res.user
  }

  async function register(email: string, password: string, displayName: string) {
    const res = await apiRegister(email, password, displayName)
    user.value = res.user
  }

  async function logout() {
    await apiLogout()
    user.value = null
  }

  return { user, loading, initialized, isLoggedIn, init, login, register, logout }
})
