<template>
  <div class="login-container">
    <!-- 左侧：品牌视觉区 -->
    <div class="left-panel">
      <div class="left-top">
        <div class="brand-mark">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="white" fill-opacity="0.15" />
            <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="white" fill-opacity="0.9" />
            <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="white" fill-opacity="0.5" />
          </svg>
        </div>
        <span class="brand-name">WELL CUBE</span>
      </div>

      <div class="characters-area">
        <AnimatedCharacters
          :is-typing="isTyping"
          :show-password="showPassword"
          :password-length="passwordValue.length"
        />
      </div>

      <div class="left-footer">
        <!-- <a href="#">帮助中心</a>
        <a href="#">隐私政策</a> -->
      </div>

      <div class="decor-blur-1" />
      <div class="decor-blur-2" />
      <div class="decor-grid" />
    </div>

    <!-- 右侧：登录表单 -->
    <div class="right-panel">
      <div class="form-wrapper">
        <div class="mobile-logo">
          <div class="mobile-logo-icon">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="#1E40AF" fill-opacity="0.9" />
              <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="#3B82F6" fill-opacity="0.7" />
            </svg>
          </div>
          <span>WELL CUBE</span>
        </div>

        <!-- <div class="form-header">
           <h1 class="form-title">登录到工作台</h1>
           <p class="form-subtitle">统一接入前端平台旗下所有系统</p>
        </div> -->

        <div class="login-form">
          <div class="login-page__shell">
            <div class="login-page__aside">
              <div class="login-card">
                <h1 class="login-card__title">
                  {{ mode === "login" ? "登录系统" : "注册账号" }}
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
                        {{ mode === "login" ? "账号" : "邮箱" }}
                      </span>
                    </template>
                    <el-input
                      v-model="form.email"
                      size="large"
                      :placeholder="mode === 'login' ? '请输入邮箱或用户名' : '请输入邮箱'"
                      clearable
                      :autocomplete="mode === 'login' ? 'username' : 'email'"
                      @input="handleInput"
                      @focus="handleFocus"
                      @blur="handleBlur"
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
                      @input="handleInput"
                      @focus="handleFocus"
                      @blur="handleBlur"
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
                      @input="handleInput"
                      @focus="handleFocus"
                      @blur="handleBlur"
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
                      ref="passwordInput"
                      v-model="form.password"
                      size="large"
                      placeholder="请输入密码"
                      type="password"
                      show-password
                      :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                      @input="handleInput"
                      @focus="handleFocus"
                      @blur="handleBlur"
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
                      @input="handleInput"
                      @focus="handleFocus"
                      @blur="handleBlur"
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
                    {{ mode === "login" ? "登录" : "注册" }}
                  </el-button>
                </el-form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loginRequest, registerRequest } from "@/api/auth";
import AnimatedCharacters from "@/components/animated-characters/index.vue";
import { getAuthStore } from "@/stores/auth";
import { Key, Lock, User } from "@element-plus/icons-vue";
import { ElMessage, type InputInstance } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

type AuthMode = "login" | "register";

const router = useRouter();
const route = useRoute();
const authStore = getAuthStore();

const mode = ref<AuthMode>("login");

const form = reactive({
  email: "admin",
  username: "admin",
  displayName: "",
  password: "Aa@123456",
  confirmPassword: "",
  captcha: "",
});

const passwordInput = useTemplateRef<InputInstance | null>("passwordInput");

const loading = ref(false);
// 状态
const showPassword = computed(() => passwordInput.value?.passwordVisible);
// isTyping: 用户是否正在输入，用于控制动画角色行为
const isTyping = ref(false);
let typingTimer: ReturnType<typeof setTimeout> | null = null;
const TYPING_IDLE_TIMEOUT = 2000; // 2秒无输入视为停止输入

function handleInput() {
  isTyping.value = true;
  if (typingTimer) clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    isTyping.value = false;
  }, TYPING_IDLE_TIMEOUT);
}

function handleFocus() {
  isTyping.value = true;
}

function handleBlur() {
  isTyping.value = false;
  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }
}
const passwordValue = computed(() => form.password);

const captchaAnswer = ref("");
const canvasRef = useTemplateRef<HTMLCanvasElement>("captchaCanvas");

function drawCaptcha() {
  const chars = "0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]!;
  captchaAnswer.value = code;

  const cvs = canvasRef.value;
  if (!cvs) return;
  const ctx = cvs.getContext("2d");
  if (!ctx) return;

  const w = cvs.width;
  const h = cvs.height;
  ctx.fillStyle = "#e4edf7";
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(30, 91, 184, ${0.12 + Math.random() * 0.2})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }

  ctx.font = "bold 21px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "middle";
  for (let i = 0; i < code.length; i++) {
    ctx.fillStyle = `rgb(${20 + Math.floor(Math.random() * 40)}, ${70 + Math.floor(Math.random() * 60)}, ${150 + Math.floor(Math.random() * 50)})`;
    ctx.save();
    ctx.translate(14 + i * 24, h / 2);
    ctx.rotate((Math.random() - 0.5) * 0.45);
    ctx.fillText(code[i]!, -6, 0);
    ctx.restore();
  }
}

function refreshCaptcha() {
  form.captcha = "";
  nextTick(() => drawCaptcha());
}

onMounted(() => {
  nextTick(() => drawCaptcha());
});

watch(mode, () => {
  form.captcha = "";
  nextTick(() => drawCaptcha());
});

function validateCaptcha(): boolean {
  if (!form.captcha.trim()) {
    ElMessage.warning("请输入验证码");
    return false;
  }
  if (form.captcha.trim() !== captchaAnswer.value) {
    ElMessage.error("验证码错误");
    refreshCaptcha();
    return false;
  }
  return true;
}

async function afterAuthSuccess(message: string) {
  ElMessage.success(message);
  const redirect =
    typeof route.query.redirect === "string" && route.query.redirect ? route.query.redirect : "/";
  await router.replace(redirect);
}

async function onSubmit() {
  const accountOrEmail = form.email.trim();
  const password = form.password;

  if (!accountOrEmail) {
    ElMessage.warning(mode.value === "login" ? "请输入邮箱或用户名" : "请输入邮箱");
    return;
  }
  if (!password) {
    ElMessage.warning("请输入密码");
    return;
  }

  if (mode.value === "register") {
    const email = accountOrEmail;
    const username = form.username.trim();
    if (!username) {
      ElMessage.warning("请输入用户名");
      return;
    }
    if (username.length < 2) {
      ElMessage.warning("用户名至少 2 个字符");
      return;
    }
    if (password.length < 6) {
      ElMessage.warning("密码至少 6 位");
      return;
    }
    if (password !== form.confirmPassword) {
      ElMessage.warning("两次输入的密码不一致");
      return;
    }
  }

  if (!validateCaptcha()) return;

  loading.value = true;
  try {
    if (mode.value === "login") {
      const result = await loginRequest({ account: accountOrEmail, password });
      if (!result.ok) {
        ElMessage.error(result.message);
        refreshCaptcha();
        return;
      }
      authStore.loginSuccess(result.token, result.user);
      await afterAuthSuccess(result.message);
      return;
    }

    const result = await registerRequest({
      email: accountOrEmail,
      username: form.username.trim(),
      password,
      display_name: form.displayName.trim() || undefined,
    });
    if (!result.ok) {
      ElMessage.error(result.message);
      refreshCaptcha();
      return;
    }
    authStore.loginSuccess(result.token, result.user);
    await afterAuthSuccess(result.message);
  } finally {
    loading.value = false;
  }
}

function setMode(next: AuthMode) {
  mode.value = next;
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

/* ─── 左侧面板 ───────────────────────────────────────────────────────────────── */
.left-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  background: linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%);
  overflow: hidden;

  @media (max-width: 1024px) {
    display: none;
  }
}

.left-top {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.brand-name {
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
}

.characters-area {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 500px;
}

.left-footer {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 24px;

  a {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.45);
    text-decoration: none;
    transition: color 0.2s;
    cursor: pointer;

    &:hover {
      color: rgba(255, 255, 255, 0.85);
    }
  }
}

.decor-blur-1 {
  position: absolute;
  top: 15%;
  right: 10%;
  width: 300px;
  height: 300px;
  background: rgba(59, 130, 246, 0.25);
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}

.decor-blur-2 {
  position: absolute;
  bottom: 10%;
  left: 5%;
  width: 400px;
  height: 400px;
  background: rgba(30, 64, 175, 0.3);
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  z-index: 0;
}

.decor-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 1;
}

/* ─── 右侧面板 ───────────────────────────────────────────────────────────────── */
.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: #ffffff;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

.mobile-logo {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 48px;

  @media (max-width: 1024px) {
    display: flex;
  }
}

.mobile-logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* .form-header {
  text-align: center;
  margin-bottom: 40px;
} */

.form-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin: 0 0 10px 0;
  line-height: 1.3;
}

.form-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-input__wrapper) {
    height: 48px;
    background: #fafafa;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &:hover {
      border-color: #3b82f6;
    }

    &.is-focus {
      border-color: #1e40af;
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.08);
      background: #ffffff;
    }
  }

  :deep(.el-input__inner) {
    background: transparent;
    font-size: 14px;
    color: #111827;

    &::placeholder {
      color: #c0c4cc;
    }
  }

  :deep(.el-form-item__error) {
    font-size: 13px;
    margin-top: 4px;
  }
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
  letter-spacing: 0.2px;
}

.eye-toggle {
  color: #6b7280;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: #374151;
  }
}

.error-box {
  padding: 10px 14px;
  font-size: 13px;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin-bottom: 16px;
}

.submit-btn {
  height: 48px !important;
  width: 100%;
  font-size: 15px !important;
  font-weight: 600 !important;
  border-radius: 10px !important;
  background: #1e40af !important;
  border-color: #1e40af !important;
  letter-spacing: 1px;
  transition:
    background 0.2s,
    opacity 0.2s !important;
  cursor: pointer;

  &:hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
    opacity: 1 !important;
  }

  &:active {
    opacity: 0.85 !important;
  }
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 0;
  color: #d1d5db;
  font-size: 13px;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #e5e7eb;
  }

  span {
    color: #9ca3af;
    white-space: nowrap;
  }
}

.feishu-btn {
  height: 48px !important;
  width: 100%;
  font-size: 14px !important;
  border-radius: 10px !important;
  margin-top: 12px !important;
  background: #ffffff !important;
  border: 1px solid #e5e7eb !important;
  color: #374151 !important;
  transition:
    background 0.2s,
    border-color 0.2s !important;
  cursor: pointer;

  &:hover {
    background: #eff6ff !important;
    border-color: rgba(30, 64, 175, 0.25) !important;
    color: #1e40af !important;
  }
}

.signup-row {
  text-align: center;
  font-size: 13px;
  color: #6b7280;
  margin-top: 28px;
}

.signup-link {
  color: #1e40af;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
    color: #1d4ed8;
  }
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
