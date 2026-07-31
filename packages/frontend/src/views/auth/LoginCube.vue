<script setup lang="ts">
import { Key, Lock, User } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthForm } from '@/hooks/useAuthForm'
import { useThemeStore } from '@/stores/themeStore'
import { CUBE_COLORS, CUBE_FONTS, mixHex } from '@/styles/theme/tokens'

const { mode, form, loading, canvasRef, refreshCaptcha, onSubmit, setMode } = useAuthForm({ prefillDemo: true })
const themeStore = useThemeStore()
const { config, isDark, currentAppearance } = storeToRefs(themeStore)

const cubeRef = ref<HTMLElement | null>(null)

function primaryRgb(hex: string): string {
  const raw = hex.trim().replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(raw))
    return '93, 173, 226'
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
  ].join(', ')
}

/** 舞台保持 Cube 图纸气质；表单跟主题主色 / 明暗 */
const cubeThemeStyle = computed(() => {
  const primary = config.value.primary || '#5DADE2'
  const rgb = primaryRgb(primary)
  const radius = Math.max(4, config.value.borderRadius || 4)
  const dark = isDark.value
  const isCube = currentAppearance.value.id === 'cube'

  return {
    '--bg-0': CUBE_COLORS.bg0,
    '--bg-1': CUBE_COLORS.bg1,
    '--text-main': CUBE_COLORS.text,
    '--text-muted': CUBE_COLORS.textMuted,
    '--signal': CUBE_COLORS.signal,
    '--signal-soft': 'rgba(124, 242, 255, 0.16)',
    '--brass': CUBE_COLORS.brass,
    '--cube-shadow': 'rgba(4, 10, 18, 0.42)',
    '--cube-font-display': isCube ? CUBE_FONTS.display : 'inherit',
    '--cube-font-mono': isCube ? CUBE_FONTS.mono : 'inherit',

    '--theme-primary': primary,
    '--theme-primary-rgb': rgb,
    '--theme-primary-soft': `rgba(${rgb}, 0.14)`,
    '--theme-primary-ring': `rgba(${rgb}, 0.28)`,
    '--theme-primary-deep': mixHex(primary, '#000000', 0.22),
    '--form-radius': `${radius + 8}px`,
    '--form-radius-sm': `${radius + 4}px`,
    '--form-control-radius': `${Math.max(radius, 6)}px`,

    ...(dark
      ? {
          '--panel': 'rgba(14, 20, 30, 0.92)',
          '--panel-line': `rgba(${rgb}, 0.16)`,
          '--panel-border': `rgba(${rgb}, 0.28)`,
          '--ink': CUBE_COLORS.text,
          '--ink-soft': CUBE_COLORS.textSoft,
          '--ink-muted': 'rgba(234, 242, 255, 0.62)',
          '--form-field-bg': 'rgba(8, 12, 18, 0.72)',
          '--form-field-border': `rgba(${rgb}, 0.22)`,
          '--form-placeholder': 'rgba(234, 242, 255, 0.38)',
          '--form-tab-track': 'rgba(8, 12, 18, 0.55)',
          '--form-tab-idle': 'rgba(234, 242, 255, 0.55)',
          '--form-tab-active-fg': '#0c1016',
          '--form-submit-fg': '#0c1016',
          '--form-captcha-bg': 'linear-gradient(180deg, rgba(26, 36, 51, 0.95), rgba(14, 20, 30, 0.98))',
          '--form-shadow': `0 24px 64px rgba(4, 8, 14, 0.55), 0 0 0 1px rgba(${rgb}, 0.08)`,
        }
      : {
          '--panel': mixHex('#f7f3e9', primary, 0.06),
          '--panel-line': `rgba(${rgb}, 0.18)`,
          '--panel-border': `rgba(${rgb}, 0.28)`,
          '--ink': CUBE_COLORS.ink,
          '--ink-soft': CUBE_COLORS.inkSoft,
          '--ink-muted': 'rgba(23, 32, 45, 0.68)',
          '--form-field-bg': 'rgba(255, 255, 255, 0.86)',
          '--form-field-border': `rgba(${rgb}, 0.2)`,
          '--form-placeholder': 'rgba(23, 32, 45, 0.4)',
          '--form-tab-track': `rgba(${rgb}, 0.08)`,
          '--form-tab-idle': 'rgba(23, 32, 45, 0.55)',
          '--form-tab-active-fg': '#ffffff',
          '--form-submit-fg': '#ffffff',
          '--form-captcha-bg': `linear-gradient(180deg, #fffefb, ${mixHex('#e8f0f8', primary, 0.2)})`,
          '--form-shadow': `0 24px 70px rgba(15, 40, 70, 0.16), 0 0 0 1px rgba(${rgb}, 0.06)`,
        }),
  }
})

const stageNotes = [
  '页面 · 数据 · 权限',
  '拖拽搭建业务界面',
  '连接真实服务与流程',
] as const

const systemChips = [
  'Workspace',
  'Schema',
  'Runtime',
] as const

const authTitle = computed(() => (mode.value === 'login' ? '进入控制台' : '创建工作账号'))
const authSubtitle = computed(() => (
  mode.value === 'login'
    ? '继续编辑页面、连接数据并发布业务流程。'
    : '创建团队账号后即可开始搭建你的第一套业务应用。'
))

const themeChip = computed(() => {
  const preset = themeStore.currentPreset?.label ?? 'Theme'
  return `${preset} · ${isDark.value ? 'Dark' : 'Light'}`
})

function pulseCube() {
  if (!cubeRef.value)
    return
  cubeRef.value.classList.remove('cube-focused')
  void cubeRef.value.offsetWidth
  cubeRef.value.classList.add('cube-focused')
  window.setTimeout(() => {
    cubeRef.value?.classList.remove('cube-focused')
  }, 1600)
}
</script>

<template>
  <div class="login-cube-container" :style="cubeThemeStyle">
    <section class="login-stage" aria-label="WellCube 登录引导">
      <div class="login-stage__wash" aria-hidden="true" />
      <div class="login-stage__grid" aria-hidden="true" />
      <div class="login-stage__measure login-stage__measure--x" aria-hidden="true" />
      <div class="login-stage__measure login-stage__measure--y" aria-hidden="true" />

      <div class="login-stage__masthead">
        <div class="login-stage__brand">
          <span class="login-stage__brand-mark">WC</span>
          <div>
            <p class="login-stage__eyebrow">
              WellCube workspace
            </p>
            <h1 class="login-stage__brand-name">
              低代码业务工作台
            </h1>
          </div>
        </div>
        <div class="login-stage__chip-row" aria-label="系统能力标签">
          <span v-for="chip in systemChips" :key="chip" class="login-stage__chip">{{ chip }}</span>
        </div>
      </div>

      <div class="login-stage__hero">
        <div class="login-stage__copy">
          <p class="login-stage__signal">
            Blueprint for live systems
          </p>
          <h2 class="login-stage__title">
            把页面、数据与流程
            <br>
            放进同一张运行中的图纸。
          </h2>
          <p class="login-stage__lead">
            面向产品、运营与交付团队的可视化搭建平台。登录后继续编辑页面、配置数据模型并连接真实业务服务。
          </p>

          <ul class="login-stage__notes">
            <li v-for="item in stageNotes" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>

        <div class="login-stage__artifact" aria-hidden="true">
          <div class="cube-wrapper">
            <div ref="cubeRef" class="cube" @click="pulseCube">
              <div class="cube-face front" />
              <div class="cube-face back" />
              <div class="cube-face right" />
              <div class="cube-face left" />
              <div class="cube-face top" />
              <div class="cube-face bottom" />
              <div class="cube-inner">
                <span class="line-x" />
                <span class="line-y" />
                <span class="cube-node cube-node--core" />
              </div>
            </div>
          </div>

          <div class="artifact-orbit artifact-orbit--lg" />
          <div class="artifact-orbit artifact-orbit--sm" />
          <div class="artifact-ping artifact-ping--a" />
          <div class="artifact-ping artifact-ping--b" />
          <div class="artifact-ping artifact-ping--c" />

          <div class="artifact-caption artifact-caption--top">
            Schema bound
          </div>
          <div class="artifact-caption artifact-caption--right">
            Runtime ready
          </div>
          <div class="artifact-caption artifact-caption--bottom">
            Deployable flow
          </div>
        </div>
      </div>
    </section>

    <aside class="login-panel">
      <div class="login-card">
        <div class="login-card__accent" aria-hidden="true" />
        <div class="login-card__topline">
          <span>Project access</span>
          <span class="login-card__theme-chip">{{ themeChip }}</span>
        </div>
        <div class="login-card__header">
          <h3 class="login-card__title">
            {{ authTitle }}
          </h3>
          <p class="login-card__subtitle">
            {{ authSubtitle }}
          </p>
        </div>

        <div class="tabs" role="tablist" aria-label="登录或注册">
          <button
            type="button"
            class="tab"
            :class="{ active: mode === 'login' }"
            :aria-selected="mode === 'login'"
            @click="setMode('login')"
          >
            登录
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: mode === 'register' }"
            :aria-selected="mode === 'register'"
            @click="setMode('register')"
          >
            注册
          </button>
        </div>

        <div class="login-card__body">
          <el-form class="login-form" label-position="top" @submit.prevent="onSubmit">
            <el-form-item>
              <template #label>
                <span class="form-label">
                  <el-icon><User /></el-icon>
                  {{ mode === 'login' ? '账号' : '邮箱' }}
                </span>
              </template>
              <el-input
                v-model="form.email"
                size="large"
                :placeholder="mode === 'login' ? '输入邮箱或用户名' : '输入邮箱地址'"
                clearable
                :autocomplete="mode === 'login' ? 'username' : 'email'"
                @focus="pulseCube"
              />
            </el-form-item>

            <el-form-item v-if="mode === 'register'">
              <template #label>
                <span class="form-label">
                  <el-icon><User /></el-icon>
                  用户名
                </span>
              </template>
              <el-input
                v-model="form.username"
                size="large"
                placeholder="输入团队内显示的用户名"
                clearable
                maxlength="32"
                autocomplete="username"
                @focus="pulseCube"
              />
            </el-form-item>

            <el-form-item v-if="mode === 'register'">
              <template #label>
                <span class="form-label">
                  <el-icon><User /></el-icon>
                  显示名称
                </span>
              </template>
              <el-input
                v-model="form.displayName"
                size="large"
                placeholder="选填，用于页面协作与发布记录"
                clearable
                maxlength="64"
                autocomplete="nickname"
                @focus="pulseCube"
              />
            </el-form-item>

            <el-form-item>
              <template #label>
                <span class="form-label">
                  <el-icon><Lock /></el-icon>
                  密码
                </span>
              </template>
              <el-input
                v-model="form.password"
                size="large"
                placeholder="输入密码"
                type="password"
                show-password
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                @focus="pulseCube"
              />
            </el-form-item>

            <el-form-item v-if="mode === 'register'">
              <template #label>
                <span class="form-label">
                  <el-icon><Lock /></el-icon>
                  确认密码
                </span>
              </template>
              <el-input
                v-model="form.confirmPassword"
                size="large"
                placeholder="再次输入密码"
                type="password"
                show-password
                autocomplete="new-password"
                @focus="pulseCube"
              />
            </el-form-item>

            <el-form-item>
              <template #label>
                <span class="form-label">
                  <el-icon><Key /></el-icon>
                  验证码
                </span>
              </template>
              <div class="captcha-row">
                <el-input
                  v-model="form.captcha"
                  size="large"
                  placeholder="输入右侧验证码"
                  maxlength="6"
                  clearable
                  @focus="pulseCube"
                />
                <canvas
                  ref="canvasRef"
                  width="112"
                  height="40"
                  class="captcha-canvas"
                  title="点击刷新验证码"
                  @click="refreshCaptcha"
                />
              </div>
            </el-form-item>

            <el-button
              type="primary"
              class="submit-btn"
              size="large"
              native-type="submit"
              :loading="loading"
            >
              {{ mode === 'login' ? '进入工作台' : '创建并进入' }}
            </el-button>
          </el-form>
        </div>

        <div class="card-footer">
          <span>{{ mode === 'login' ? '第一次使用 WellCube？' : '已经有账号了？' }}</span>
          <button type="button" class="card-footer__switch" @click="setMode(mode === 'login' ? 'register' : 'login')">
            {{ mode === 'login' ? '创建账号' : '返回登录' }}
          </button>
        </div>
      </div>

      <p class="copyright">
        © 2026 WellCube Studio · Build pages, data and flows together.
      </p>
    </aside>
  </div>
</template>

<style lang="scss" scoped>
.login-cube-container {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) 430px;
  background:
    radial-gradient(circle at 18% 22%, rgba(124, 242, 255, 0.18), transparent 24%),
    radial-gradient(circle at 78% 12%, rgba(201, 167, 106, 0.12), transparent 22%),
    linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 56%, #0f1824 100%);
  color: var(--text-main);
  overflow: hidden;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
}

.login-stage {
  position: relative;
  padding: 38px 52px 44px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;

  @media (max-width: 1100px) {
    min-height: auto;
    padding: 32px 20px 18px;
  }
}

.login-stage__wash,
.login-stage__grid,
.login-stage__measure {
  position: absolute;
  pointer-events: none;
}

.login-stage__wash {
  inset: 0;
  background:
    linear-gradient(
      90deg,
      rgba(124, 242, 255, 0.04) 0,
      rgba(124, 242, 255, 0.04) 1px,
      transparent 1px,
      transparent 100%
    ),
    linear-gradient(
      180deg,
      rgba(124, 242, 255, 0.04) 0,
      rgba(124, 242, 255, 0.04) 1px,
      transparent 1px,
      transparent 100%
    );
  background-size: 96px 96px;
  mask-image: radial-gradient(circle at center, black 44%, transparent 100%);
  opacity: 0.38;
}

.login-stage__grid {
  inset: 24px;
  border: 1px solid rgba(124, 242, 255, 0.12);
  clip-path: polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px);
}

.login-stage__measure {
  opacity: 0.26;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: var(--signal);
  }
}

.login-stage__measure--x {
  left: 78px;
  right: 78px;
  top: 104px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--signal), transparent);

  &::before,
  &::after {
    top: -5px;
    width: 1px;
    height: 11px;
  }

  &::before {
    left: 0;
  }
  &::after {
    right: 0;
  }
}

.login-stage__measure--y {
  top: 148px;
  bottom: 120px;
  left: 40px;
  width: 1px;
  background: linear-gradient(180deg, transparent, var(--signal), transparent);

  &::before,
  &::after {
    left: -5px;
    width: 11px;
    height: 1px;
  }

  &::before {
    top: 0;
  }
  &::after {
    bottom: 0;
  }
}

.login-stage__masthead,
.login-stage__hero {
  position: relative;
  z-index: 1;
}

.login-stage__masthead {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;

  @media (max-width: 720px) {
    flex-direction: column;
  }
}

.login-stage__brand {
  display: flex;
  gap: 14px;
  align-items: center;
}

.login-stage__brand-mark {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(124, 242, 255, 0.38);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--signal);
  font-size: 13px;
  letter-spacing: 0.22em;
  font-family: 'Consolas', 'SFMono-Regular', monospace;
  background: rgba(124, 242, 255, 0.06);
  box-shadow: 0 0 0 1px rgba(124, 242, 255, 0.08) inset;
}

.login-stage__eyebrow,
.login-card__topline,
.form-label,
.login-stage__chip,
.login-stage__signal,
.artifact-caption {
  font-family: var(--cube-font-mono, 'Consolas', 'SFMono-Regular', monospace);
}

.login-stage__eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(124, 242, 255, 0.84);
}

.login-stage__brand-name {
  margin: 0;
  font-size: 19px;
  letter-spacing: -0.02em;
  font-weight: 600;
}

.login-stage__chip-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.login-stage__chip {
  padding: 7px 11px;
  border: 1px solid rgba(124, 242, 255, 0.18);
  background: rgba(12, 16, 22, 0.4);
  color: rgba(234, 242, 255, 0.78);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.login-stage__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 460px);
  gap: 40px;
  align-items: center;
  padding: 24px 0 8px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    gap: 28px;
    padding-top: 28px;
  }
}

.login-stage__copy {
  max-width: 640px;
}

.login-stage__signal {
  margin: 0 0 14px;
  color: rgba(124, 242, 255, 0.88);
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.login-stage__title {
  margin: 0;
  font-size: clamp(36px, 5vw, 68px);
  line-height: 0.96;
  letter-spacing: -0.05em;
  font-weight: 600;
  font-family: 'Georgia', 'Times New Roman', serif;
  text-wrap: balance;
}

.login-stage__lead {
  max-width: 560px;
  margin: 22px 0 0;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1.75;
}

.login-stage__notes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 0;
  margin: 28px 0 0;
  list-style: none;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }

  li {
    padding: 14px 16px;
    border: 1px solid rgba(124, 242, 255, 0.14);
    background: rgba(9, 15, 22, 0.48);
    color: rgba(234, 242, 255, 0.8);
    font-size: 14px;
    line-height: 1.5;
  }
}

.login-stage__artifact {
  position: relative;
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1100px) {
    min-height: 360px;
  }
}

.cube-wrapper {
  perspective: 1100px;
  z-index: 2;
}

.cube {
  width: 190px;
  height: 190px;
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(-24deg) rotateY(38deg);
  transition: transform 1.2s cubic-bezier(0.22, 1, 0.36, 1);
  cursor: pointer;
  animation: cubeFloat 6s ease-in-out infinite;
}

.cube-focused {
  animation: cubePulse 1.6s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes cubeFloat {
  0%,
  100% {
    transform: rotateX(-24deg) rotateY(38deg) translateY(0);
  }
  50% {
    transform: rotateX(-20deg) rotateY(48deg) translateY(-12px);
  }
}

@keyframes cubePulse {
  0% {
    transform: rotateX(-24deg) rotateY(38deg) scale(1);
  }
  35% {
    transform: rotateX(-24deg) rotateY(138deg) scale(1.02);
  }
  100% {
    transform: rotateX(-24deg) rotateY(218deg) scale(1);
  }
}

.cube-face {
  position: absolute;
  width: 190px;
  height: 190px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(214, 222, 238, 0.9)),
    linear-gradient(0deg, rgba(124, 242, 255, 0.18), rgba(124, 242, 255, 0));
  border: 1px solid rgba(124, 242, 255, 0.55);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.34),
    0 18px 34px var(--cube-shadow);
  backdrop-filter: blur(4px);
}

.front {
  transform: translateZ(95px);
}
.back {
  transform: rotateY(180deg) translateZ(95px);
}
.right {
  transform: rotateY(90deg) translateZ(95px);
}
.left {
  transform: rotateY(-90deg) translateZ(95px);
}
.top {
  transform: rotateX(90deg) translateZ(95px);
}
.bottom {
  transform: rotateX(-90deg) translateZ(95px);
}

.cube-inner {
  position: absolute;
  inset: 0;
  transform: translateZ(96px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.line-x,
.line-y {
  position: absolute;
  background: rgba(23, 32, 45, 0.28);
}

.line-x {
  width: 108px;
  height: 1px;
}
.line-y {
  width: 1px;
  height: 108px;
}

.cube-node {
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--signal);
  box-shadow:
    0 0 0 5px rgba(124, 242, 255, 0.18),
    0 0 26px rgba(124, 242, 255, 0.72);
}

.artifact-orbit,
.artifact-ping,
.artifact-caption {
  position: absolute;
}

.artifact-orbit {
  border: 1px solid rgba(124, 242, 255, 0.16);
  border-radius: 50%;
}

.artifact-orbit--lg {
  width: 360px;
  height: 360px;
}

.artifact-orbit--sm {
  width: 270px;
  height: 270px;
  border-style: dashed;
  animation: orbitSpin 18s linear infinite;
}

@keyframes orbitSpin {
  to {
    transform: rotate(360deg);
  }
}

.artifact-ping {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--brass);
  box-shadow: 0 0 0 6px rgba(201, 167, 106, 0.12);
}

.artifact-ping--a {
  top: 72px;
  left: calc(50% - 126px);
}
.artifact-ping--b {
  right: calc(50% - 154px);
  bottom: 106px;
}
.artifact-ping--c {
  top: 50%;
  right: calc(50% - 172px);
}

.artifact-caption {
  font-size: 11px;
  letter-spacing: 0.16em;
  color: rgba(234, 242, 255, 0.72);
  text-transform: uppercase;
}

.artifact-caption--top {
  top: 82px;
  right: 40px;
}

.artifact-caption--right {
  top: 50%;
  right: 2px;
  transform: rotate(90deg) translateX(-50%);
  transform-origin: right top;
}

.artifact-caption--bottom {
  bottom: 70px;
  left: 26px;
}

.login-panel {
  background:
    linear-gradient(180deg, rgba(var(--theme-primary-rgb), 0.06), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0)),
    rgba(8, 12, 18, 0.82);
  border-left: 1px solid rgba(var(--theme-primary-rgb), 0.18);
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  @media (max-width: 1100px) {
    border-left: none;
    border-top: 1px solid rgba(var(--theme-primary-rgb), 0.18);
    padding: 18px 18px 28px;
  }
}

.login-card {
  position: relative;
  width: min(100%, 382px);
  max-width: 382px;
  height: min(84vh, 760px);
  margin: 0 auto;
  padding: 28px 24px 22px;
  color: var(--ink);
  background:
    linear-gradient(165deg, rgba(var(--theme-primary-rgb), 0.1), transparent 38%),
    var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: var(--form-radius);
  box-shadow: var(--form-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(12px);

  &::before {
    content: '';
    position: absolute;
    inset: 12px;
    border: 1px solid var(--panel-line);
    border-radius: calc(var(--form-radius) - 6px);
    pointer-events: none;
  }
}

.login-card__accent {
  position: absolute;
  top: 0;
  left: 24px;
  right: 24px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--theme-primary),
    var(--signal),
    transparent
  );
  opacity: 0.9;
  pointer-events: none;
}

.login-card__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 18px;
  color: var(--ink-soft);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-family: var(--cube-font-mono, 'Consolas', monospace);
}

.login-card__theme-chip {
  max-width: 52%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 4px 8px;
  border: 1px solid rgba(var(--theme-primary-rgb), 0.28);
  background: var(--theme-primary-soft);
  color: var(--theme-primary);
  letter-spacing: 0.08em;
  font-size: 10px;
}

.login-card__header {
  margin-bottom: 22px;
}

.login-card__title {
  margin: 0;
  font-size: 30px;
  line-height: 1.04;
  letter-spacing: -0.05em;
  font-family: var(--cube-font-display, 'Georgia', serif);
  color: var(--ink);
}

.login-card__subtitle {
  margin: 10px 0 0;
  color: var(--ink-muted);
  font-size: 14px;
  line-height: 1.7;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 6px;
  margin-bottom: 18px;
  background: var(--form-tab-track);
  border: 1px solid var(--panel-line);
  border-radius: 999px;
  flex-shrink: 0;
}

.tab {
  height: 42px;
  border: none;
  background: transparent;
  color: var(--form-tab-idle);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  border-radius: 999px;

  &.active {
    background: var(--theme-primary);
    color: var(--form-tab-active-fg);
    box-shadow: 0 10px 22px var(--theme-primary-ring);
  }
}

.form-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-soft);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.login-card__body {
  min-height: 0;
  flex: 1;
  overflow: auto;
  padding-right: 4px;
  margin-right: -4px;
  scrollbar-gutter: stable;
}

.login-card__body::-webkit-scrollbar {
  width: 8px;
}

.login-card__body::-webkit-scrollbar-track {
  background: transparent;
}

.login-card__body::-webkit-scrollbar-thumb {
  background: rgba(var(--theme-primary-rgb), 0.28);
  border-radius: 999px;
}

.login-card__body::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--theme-primary-rgb), 0.42);
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-input__wrapper) {
    min-height: 48px;
    border-radius: var(--form-control-radius);
    background: var(--form-field-bg);
    box-shadow: 0 0 0 1px var(--form-field-border) inset;
    padding-inline: 14px;
    transition: box-shadow 0.18s ease;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow:
      0 0 0 1px var(--theme-primary) inset,
      0 0 0 4px var(--theme-primary-ring);
  }

  :deep(.el-input__inner) {
    color: var(--ink);
    font-size: 14px;
  }

  :deep(.el-input__inner::placeholder) {
    color: var(--form-placeholder);
  }

  :deep(.el-input__suffix),
  :deep(.el-input__prefix) {
    color: var(--ink-soft);
  }
}

.captcha-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 10px;
  align-items: center;
}

.captcha-canvas {
  width: 112px;
  height: 40px;
  cursor: pointer;
  background: var(--form-captcha-bg);
  border: 1px solid var(--form-field-border);
  border-radius: var(--form-radius-sm);
}

.submit-btn {
  width: 100%;
  height: 50px;
  margin-top: 6px;
  border: none !important;
  border-radius: var(--form-control-radius);
  background: linear-gradient(
    100deg,
    var(--theme-primary) 0%,
    var(--theme-primary-deep) 100%
  ) !important;
  color: var(--form-submit-fg) !important;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow: 0 14px 28px var(--theme-primary-ring);

  &:hover,
  &:focus-visible {
    filter: brightness(1.06);
    background: linear-gradient(
      100deg,
      var(--theme-primary) 0%,
      var(--theme-primary-deep) 100%
    ) !important;
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: 18px;
  font-size: 13px;
  color: var(--ink-muted);

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.card-footer__switch {
  padding: 0;
  border: none;
  background: none;
  color: var(--theme-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: rgba(var(--theme-primary-rgb), 0.35);
  text-underline-offset: 3px;
}

.copyright {
  max-width: 382px;
  margin: 18px auto 0;
  color: rgba(234, 242, 255, 0.46);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.06em;
}

@media (prefers-reduced-motion: reduce) {
  .cube,
  .artifact-orbit--sm {
    animation: none !important;
  }
}
</style>
