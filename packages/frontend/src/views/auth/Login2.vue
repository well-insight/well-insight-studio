<script setup lang="ts">
import { Key, Lock, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { nextTick, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginRequest, registerRequest } from '@/api/auth'
import heroImg from '@/assets/login-hero.png'

import { getAuthStore } from '@/stores/auth'

type AuthMode = 'login' | 'register'

const router = useRouter()
const route = useRoute()
const authStore = getAuthStore()

const mode = ref<AuthMode>('login')

const form = reactive({
  email: '',
  username: '',
  displayName: '',
  password: '',
  confirmPassword: '',
  captcha: '',
})

const loading = ref(false)

const captchaAnswer = ref('')
const canvasRef = useTemplateRef<HTMLCanvasElement>('captchaCanvas')

function drawCaptcha() {
  const chars = '0123456789'
  let code = ''
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]!
  captchaAnswer.value = code

  const cvs = canvasRef.value
  if (!cvs)
    return
  const ctx = cvs.getContext('2d')
  if (!ctx)
    return

  const w = cvs.width
  const h = cvs.height
  ctx.fillStyle = '#e4edf7'
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(30, 91, 184, ${0.12 + Math.random() * 0.2})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.stroke()
  }

  ctx.font = 'bold 21px ui-sans-serif, system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < code.length; i++) {
    ctx.fillStyle = `rgb(${20 + Math.floor(Math.random() * 40)}, ${70 + Math.floor(Math.random() * 60)}, ${150 + Math.floor(Math.random() * 50)})`
    ctx.save()
    ctx.translate(14 + i * 24, h / 2)
    ctx.rotate((Math.random() - 0.5) * 0.45)
    ctx.fillText(code[i]!, -6, 0)
    ctx.restore()
  }
}

function refreshCaptcha() {
  form.captcha = ''
  nextTick(() => drawCaptcha())
}

onMounted(() => {
  nextTick(() => drawCaptcha())
})

watch(mode, () => {
  form.captcha = ''
  nextTick(() => drawCaptcha())
})

function validateCaptcha(): boolean {
  if (!form.captcha.trim()) {
    ElMessage.warning('请输入验证码')
    return false
  }
  if (form.captcha.trim() !== captchaAnswer.value) {
    ElMessage.error('验证码错误')
    refreshCaptcha()
    return false
  }
  return true
}

async function afterAuthSuccess(message: string) {
  ElMessage.success(message)
  const redirect
    = typeof route.query.redirect === 'string' && route.query.redirect
      ? route.query.redirect
      : '/'
  await router.replace(redirect)
}

async function onSubmit() {
  const accountOrEmail = form.email.trim()
  const password = form.password

  if (!accountOrEmail) {
    ElMessage.warning(mode.value === 'login' ? '请输入邮箱或用户名' : '请输入邮箱')
    return
  }
  if (!password) {
    ElMessage.warning('请输入密码')
    return
  }

  if (mode.value === 'register') {
    const email = accountOrEmail
    const username = form.username.trim()
    if (!username) {
      ElMessage.warning('请输入用户名')
      return
    }
    if (username.length < 2) {
      ElMessage.warning('用户名至少 2 个字符')
      return
    }
    if (password.length < 6) {
      ElMessage.warning('密码至少 6 位')
      return
    }
    if (password !== form.confirmPassword) {
      ElMessage.warning('两次输入的密码不一致')
      return
    }
  }

  if (!validateCaptcha())
    return

  loading.value = true
  try {
    if (mode.value === 'login') {
      const result = await loginRequest({ account: accountOrEmail, password })
      if (!result.ok) {
        ElMessage.error(result.message)
        refreshCaptcha()
        return
      }
      authStore.loginSuccess(result.token, result.user)
      await afterAuthSuccess(result.message)
      return
    }

    const result = await registerRequest({
      email: accountOrEmail,
      username: form.username.trim(),
      password,
      display_name: form.displayName.trim() || undefined,
    })
    if (!result.ok) {
      ElMessage.error(result.message)
      refreshCaptcha()
      return
    }
    authStore.loginSuccess(result.token, result.user)
    await afterAuthSuccess(result.message)
  }
  finally {
    loading.value = false
  }
}

function setMode(next: AuthMode) {
  mode.value = next
}
</script>

<template>
  <div class="login-page">
    <div class="login-page__bg" aria-hidden="true">
      <img
        class="login-page__bg-img"
        :src="heroImg"
        alt=""
        fetchpriority="high"
        decoding="async"
      >
      <div class="login-page__bg-overlay" />
    </div>

    <div class="login-page__shell">
      <div class="login-page__aside">
        <div class="login-card">
          <h1 class="login-card__title">
            {{ mode === 'login' ? '登录系统' : '注册账号' }}
          </h1>

          <div class="login-card__tabs" role="tablist" aria-label="登录或注册">
            <button
              type="button"
              class="login-card__tab"
              :class="{ 'login-card__tab--active': mode === 'login' }"
              role="tab"
              :aria-selected="mode === 'login'"
              @click="setMode('login')"
            >
              登录
            </button>
            <button
              type="button"
              class="login-card__tab"
              :class="{ 'login-card__tab--active': mode === 'register' }"
              role="tab"
              :aria-selected="mode === 'register'"
              @click="setMode('register')"
            >
              注册
            </button>
          </div>

          <el-form class="login-card__form" label-position="top" @submit.prevent="onSubmit">
            <el-form-item>
              <template #label>
                <span class="login-label">
                  <el-icon class="login-label__icon"><User /></el-icon>
                  {{ mode === 'login' ? '账号' : '邮箱' }}
                </span>
              </template>
              <el-input
                v-model="form.email"
                size="large"
                :placeholder="mode === 'login' ? '请输入邮箱或用户名' : '请输入邮箱'"
                clearable
                :autocomplete="mode === 'login' ? 'username' : 'email'"
              />
            </el-form-item>

            <el-form-item v-if="mode === 'register'">
              <template #label>
                <span class="login-label">
                  <el-icon class="login-label__icon"><User /></el-icon>
                  用户名
                </span>
              </template>
              <el-input
                v-model="form.username"
                size="large"
                placeholder="请输入用户名"
                clearable
                maxlength="32"
                autocomplete="username"
              />
            </el-form-item>

            <el-form-item v-if="mode === 'register'">
              <template #label>
                <span class="login-label">
                  <el-icon class="login-label__icon"><User /></el-icon>
                  显示名称
                </span>
              </template>
              <el-input
                v-model="form.displayName"
                size="large"
                placeholder="选填，默认同用户名"
                clearable
                maxlength="64"
                autocomplete="nickname"
              />
            </el-form-item>

            <el-form-item>
              <template #label>
                <span class="login-label">
                  <el-icon class="login-label__icon"><Lock /></el-icon>
                  密码
                </span>
              </template>
              <el-input
                v-model="form.password"
                size="large"
                placeholder="请输入密码"
                type="password"
                show-password
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
              />
            </el-form-item>

            <el-form-item v-if="mode === 'register'">
              <template #label>
                <span class="login-label">
                  <el-icon class="login-label__icon"><Lock /></el-icon>
                  确认密码
                </span>
              </template>
              <el-input
                v-model="form.confirmPassword"
                size="large"
                placeholder="请再次输入密码"
                type="password"
                show-password
                autocomplete="new-password"
              />
            </el-form-item>

            <el-form-item>
              <template #label>
                <span class="login-label">
                  <el-icon class="login-label__icon"><Key /></el-icon>
                  验证码
                </span>
              </template>
              <div class="login-captcha-row">
                <el-input
                  v-model="form.captcha"
                  size="large"
                  placeholder="请输入验证码"
                  maxlength="6"
                  clearable
                />
                <canvas
                  ref="captchaCanvas"
                  width="112"
                  height="40"
                  class="login-captcha-canvas"
                  title="点击刷新"
                  role="button"
                  tabindex="0"
                  @click="refreshCaptcha"
                  @keyup.enter="refreshCaptcha"
                />
              </div>
            </el-form-item>

            <el-button
              type="primary"
              class="login-submit"
              size="large"
              native-type="submit"
              :loading="loading"
            >
              {{ mode === 'login' ? '登录' : '注册' }}
            </el-button>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  min-height: 100dvh;
}

.login-page__bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: #e6eef9;
}

.login-page__bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  /* 拉伸铺满视口，四边无留白（宽高比与屏幕不一致时会变形） */
  object-fit: fill;
}

.login-page__bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    rgba(255, 255, 255, 0.06) 0%,
    rgba(252, 253, 255, 0.28) 50%,
    rgba(255, 255, 255, 0.5) 100%
  );
  pointer-events: none;
}

.login-page__shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  justify-content: flex-end;
  align-items: stretch;
  box-sizing: border-box;
}

.login-page__aside {
  flex: 0 0 clamp(380px, 36vw, 480px);
  width: clamp(380px, 36vw, 480px);
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 40px 48px 24px;
  box-sizing: border-box;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 36px 36px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow:
    0 4px 24px rgba(30, 91, 184, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
}

.login-card__title {
  margin: 0 0 20px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #153e75;
  text-align: center;
}

.login-card__tabs {
  display: flex;
  margin-bottom: 24px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(30, 91, 184, 0.08);
  gap: 4px;
}

.login-card__tab {
  flex: 1;
  border: none;
  padding: 10px 12px;
  font-size: 15px;
  font-weight: 600;
  color: #5a6d85;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}

.login-card__tab--active {
  background: #fff;
  color: #1e5bb8;
  box-shadow: 0 1px 4px rgba(30, 91, 184, 0.12);
}

.login-card__form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    margin-bottom: 6px;
    padding: 0;
  }
}

.login-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #3d4e66;
  font-weight: 500;
}

.login-label__icon {
  font-size: 16px;
  color: #1e5bb8;
}

.login-captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;

  :deep(.el-input) {
    flex: 1;
  }
}

.login-captcha-canvas {
  flex-shrink: 0;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #d0ddeb;
  background: #fff;
}

.login-submit {
  width: 100%;
  margin-top: 8px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  letter-spacing: 0.12em;
}

@media (max-width: 960px) {
  .login-page__shell {
    justify-content: center;
    align-items: center;
    padding: 24px 16px 32px;
  }

  .login-page__aside {
    flex: 1 1 auto;
    width: 100%;
    padding: 0;
  }
}
</style>
