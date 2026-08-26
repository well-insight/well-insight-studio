<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast, WiButton, WiCard, WiInput, WiInputPassword } from '@well-insight/ui'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const displayName = ref('')
const submitting = ref(false)

watch(isLogin, () => {
  displayName.value = ''
})

async function submit() {
  submitting.value = true
  try {
    if (isLogin.value) {
      await authStore.login(email.value, password.value)
      toast.success({ summary: '登录成功' })
    } else {
      await authStore.register(email.value, password.value, displayName.value || email.value.split('@')[0] || email.value)
      toast.success({ summary: '注册成功' })
    }
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect)
  } catch (err) {
    toast.error({ summary: err instanceof Error ? err.message : '操作失败' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-brand">
      <div class="brand-logo">WI</div>
      <h1>Well-Insight</h1>
    </div>

    <WiCard class="auth-card">
      <h2 class="auth-title">{{ isLogin ? '欢迎回来' : '创建账号' }}</h2>
      <p class="auth-subtitle">{{ isLogin ? '登录后继续你的数据探索' : '注册后即可创建可视化项目' }}</p>

      <form class="auth-form" @submit.prevent="submit">
        <WiInput v-model="email" type="email" label="邮箱" placeholder="you@example.com" fluid />
        <WiInput
          v-if="!isLogin"
          v-model="displayName"
          label="昵称"
          placeholder="你的名字"
          fluid
        />
        <WiInputPassword v-model="password" label="密码" placeholder="至少 6 位" fluid />

        <WiButton type="submit" fluid :loading="submitting">
          {{ isLogin ? '登录' : '注册' }}
        </WiButton>
      </form>

      <div class="auth-switch">
        <span>{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
        <WiButton variant="link" @click="isLogin = !isLogin">
          {{ isLogin ? '立即注册' : '去登录' }}
        </WiButton>
      </div>
    </WiCard>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: var(--wi-color-surface);
  color: var(--wi-color-text);
  padding: 24px;
}
.auth-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 16px;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #22d3ee);
}
.auth-brand h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--wi-color-text);
}
.auth-card {
  width: 100%;
  max-width: 380px;
  padding: 28px;
}
.auth-title {
  margin: 0 0 6px;
  font-size: 20px;
  color: var(--wi-color-text);
}
.auth-subtitle {
  margin: 0 0 20px;
  font-size: 12px;
  color: var(--wi-color-text-muted);
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.auth-switch {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 18px;
  font-size: 12px;
  color: var(--wi-color-text-muted);
}
</style>
