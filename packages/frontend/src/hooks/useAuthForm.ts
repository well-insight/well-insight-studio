import { ElMessage } from 'element-plus'
import { nextTick, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginRequest, registerRequest } from '@/api/auth'
import { getAuthStore } from '@/stores/auth'

export type AuthMode = 'login' | 'register'

export interface UseAuthFormOptions {
  /** 是否预填演示账号（仅开发联调用） */
  prefillDemo?: boolean
}

/**
 * 登录/注册表单共用逻辑：校验、验证码、提交与跳转。
 */
export function useAuthForm(options: UseAuthFormOptions = {}) {
  const { prefillDemo = false } = options

  const router = useRouter()
  const route = useRoute()
  const authStore = getAuthStore()

  const mode = ref<AuthMode>('login')
  const loading = ref(false)

  const form = reactive({
    email: prefillDemo ? 'admin' : '',
    username: prefillDemo ? 'admin' : '',
    displayName: '',
    password: prefillDemo ? 'Aa@123456' : '',
    confirmPassword: '',
    captcha: '',
  })

  const captchaAnswer = ref('')
  const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

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
      ctx.strokeStyle = `rgba(91, 91, 214, ${0.12 + Math.random() * 0.2})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(Math.random() * w, Math.random() * h)
      ctx.lineTo(Math.random() * w, Math.random() * h)
      ctx.stroke()
    }

    ctx.font = `bold 21px ${getComputedStyle(document.body).fontFamily || 'sans-serif'}`
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

  return {
    mode,
    form,
    loading,
    canvasRef,
    refreshCaptcha,
    onSubmit,
    setMode,
  }
}
