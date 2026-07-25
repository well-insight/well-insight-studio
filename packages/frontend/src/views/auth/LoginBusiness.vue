<script setup lang="ts">
import { Key, Lock, User } from '@element-plus/icons-vue'
import { onMounted, onUnmounted, useTemplateRef } from 'vue'
import { useAuthForm } from '@/hooks/useAuthForm'

const { mode, form, loading, canvasRef, refreshCaptcha, onSubmit, setMode } = useAuthForm()

const features = [
  { title: '页面设计', desc: '可视化搭建 H5 / PC 页面', icon: '◇' },
  { title: '应用集', desc: '多页面组装为完整应用', icon: '▣' },
  { title: '数据集', desc: '统一管理业务数据源', icon: '☰' },
  { title: '数据连接', desc: '对接外部接口与服务', icon: '⟳' },
] as const

const fxCanvas = useTemplateRef<HTMLCanvasElement>('fxCanvas')

let rafId = 0
let resizeHandler: (() => void) | null = null

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  r: number
}

function startParticleField() {
  const canvas = fxCanvas.value
  if (!canvas)
    return
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let w = 0
  let h = 0
  let particles: Particle[] = []
  const LINK_DIST = 140
  const COUNT_BASE = reduced ? 28 : 72

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = window.innerWidth
    h = window.innerHeight
    canvas!.width = Math.floor(w * dpr)
    canvas!.height = Math.floor(h * dpr)
    canvas!.style.width = `${w}px`
    canvas!.style.height = `${h}px`
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

    const count = Math.floor(COUNT_BASE * Math.min(w / 1280, 1.35))
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: 1 + Math.random() * 1.8,
    }))
  }

  function frame() {
    ctx!.clearRect(0, 0, w, h)

    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > w)
        p.vx *= -1
      if (p.y < 0 || p.y > h)
        p.vy *= -1
    }

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i]!
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j]!
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.hypot(dx, dy)
        if (dist > LINK_DIST)
          continue
        const alpha = (1 - dist / LINK_DIST) * 0.42
        ctx!.beginPath()
        ctx!.strokeStyle = `rgba(120, 200, 255, ${alpha})`
        ctx!.lineWidth = 1
        ctx!.moveTo(a.x, a.y)
        ctx!.lineTo(b.x, b.y)
        ctx!.stroke()
      }
    }

    for (const p of particles) {
      ctx!.beginPath()
      ctx!.fillStyle = 'rgba(186, 224, 255, 0.9)'
      ctx!.shadowColor = 'rgba(74, 180, 255, 0.85)'
      ctx!.shadowBlur = 8
      ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx!.fill()
    }
    ctx!.shadowBlur = 0

    if (!reduced)
      rafId = requestAnimationFrame(frame)
  }

  resize()
  frame()
  resizeHandler = resize
  window.addEventListener('resize', resize)
}

onMounted(() => {
  startParticleField()
})

onUnmounted(() => {
  if (rafId)
    cancelAnimationFrame(rafId)
  if (resizeHandler)
    window.removeEventListener('resize', resizeHandler)
})
</script>

<template>
  <div class="login-biz">
    <div class="login-biz__bg" aria-hidden="true">
      <div class="login-biz__aurora" />
      <div class="login-biz__beam login-biz__beam--1" />
      <div class="login-biz__beam login-biz__beam--2" />
      <div class="login-biz__mesh" />
      <div class="login-biz__grid" />
      <div class="login-biz__floor" />
      <div class="login-biz__orb login-biz__orb--a" />
      <div class="login-biz__orb login-biz__orb--b" />
      <div class="login-biz__orb login-biz__orb--c" />
      <div class="login-biz__ring login-biz__ring--lg" />
      <div class="login-biz__ring login-biz__ring--sm" />
      <canvas ref="fxCanvas" class="login-biz__fx" />
      <svg class="login-biz__wires" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="wireGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(74,180,255,0)" />
            <stop offset="50%" stop-color="rgba(140,220,255,0.95)" />
            <stop offset="100%" stop-color="rgba(74,180,255,0)" />
          </linearGradient>
          <filter id="glowSoft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          class="login-biz__wire"
          d="M40 420 C180 360, 260 280, 360 240 S520 200, 620 160"
          stroke="url(#wireGlow)"
          filter="url(#glowSoft)"
        />
        <path
          class="login-biz__wire login-biz__wire--soft"
          d="M80 520 C220 460, 300 380, 420 340 S600 300, 740 260"
          stroke="url(#wireGlow)"
        />
        <path
          class="login-biz__wire login-biz__wire--alt"
          d="M120 80 C220 160, 300 220, 400 280 S560 360, 700 420"
          stroke="url(#wireGlow)"
        />
        <circle class="login-biz__node" cx="360" cy="240" r="4" filter="url(#glowSoft)" />
        <circle class="login-biz__node" cx="520" cy="200" r="3.5" filter="url(#glowSoft)" />
        <circle class="login-biz__node login-biz__node--pulse" cx="620" cy="160" r="5" filter="url(#glowSoft)" />
        <circle class="login-biz__node login-biz__node--pulse" cx="400" cy="280" r="4" filter="url(#glowSoft)" />
      </svg>
      <div class="login-biz__cubes">
        <span class="login-biz__cube login-biz__cube--1" />
        <span class="login-biz__cube login-biz__cube--2" />
        <span class="login-biz__cube login-biz__cube--3" />
        <span class="login-biz__cube login-biz__cube--4" />
      </div>
      <div class="login-biz__scan" />
    </div>

    <div class="login-biz__shell">
      <section class="login-biz__brand" aria-label="WellCube 产品介绍">
        <div class="login-biz__brand-mark login-biz__enter">
          <span class="login-biz__logo-wrap">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="7" fill="#5b5bd6" />
              <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="white" fill-opacity="0.95" />
              <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="white" fill-opacity="0.55" />
            </svg>
          </span>
          <span class="login-biz__brand-name">WellCube</span>
          <span class="login-biz__badge">低代码平台</span>
        </div>

        <h1 class="login-biz__headline login-biz__enter login-biz__enter--d1">
          <span class="login-biz__headline-glow">低代码可视化工作台</span>
        </h1>
        <p class="login-biz__lead login-biz__enter login-biz__enter--d2">
          从页面设计到数据连接，一站式构建业务应用
        </p>

        <ul class="login-biz__features">
          <li
            v-for="(item, index) in features"
            :key="item.title"
            class="login-biz__feature login-biz__enter"
            :style="{ animationDelay: `${0.35 + index * 0.08}s` }"
          >
            <span class="login-biz__feature-icon" aria-hidden="true">{{ item.icon }}</span>
            <span class="login-biz__feature-body">
              <span class="login-biz__feature-title">{{ item.title }}</span>
              <span class="login-biz__feature-desc">{{ item.desc }}</span>
            </span>
          </li>
        </ul>
      </section>

      <aside class="login-biz__aside">
        <div class="login-card login-biz__enter login-biz__enter--d3">
          <div class="login-card__glow" aria-hidden="true" />
          <div class="login-card__brand">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="7" fill="#5b5bd6" />
              <path d="M7 14L12 9L17 14L12 19L7 14Z" fill="white" fill-opacity="0.95" />
              <path d="M13 14L18 9L21 12V16L18 19L13 14Z" fill="white" fill-opacity="0.55" />
            </svg>
            <span>WellCube</span>
          </div>

          <h2 class="login-card__title">
            {{ mode === 'login' ? '登录工作台' : '注册账号' }}
          </h2>
          <p class="login-card__subtitle">
            {{ mode === 'login' ? '使用账号进入可视化设计系统' : '创建账号后即可开始搭建应用' }}
          </p>

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
                  ref="canvasRef"
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
              {{ mode === 'login' ? '进入工作台' : '注册并登录' }}
            </el-button>
          </el-form>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-biz {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: hidden;
  color: #e8f4ff;
}

.login-biz__bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background:
    radial-gradient(900px 520px at 18% 20%, rgba(56, 160, 255, 0.28), transparent 58%),
    radial-gradient(700px 480px at 72% 10%, rgba(91, 91, 214, 0.35), transparent 55%),
    radial-gradient(800px 500px at 60% 90%, rgba(20, 90, 160, 0.4), transparent 50%),
    linear-gradient(150deg, #071420 0%, #0d2840 38%, #124066 72%, #1a5a8c 100%);
}

.login-biz__aurora {
  position: absolute;
  inset: -20%;
  background: conic-gradient(
    from 120deg at 40% 35%,
    rgba(40, 140, 255, 0.18),
    transparent 28%,
    rgba(90, 210, 255, 0.12),
    transparent 55%,
    rgba(91, 91, 214, 0.2),
    transparent 78%
  );
  filter: blur(40px);
  animation: login-biz-aurora 18s linear infinite;
  pointer-events: none;
}

.login-biz__beam {
  position: absolute;
  width: 2px;
  height: 140%;
  top: -20%;
  background: linear-gradient(180deg, transparent, rgba(140, 210, 255, 0.55), transparent);
  filter: blur(1px);
  opacity: 0.55;
  animation: login-biz-beam 7s ease-in-out infinite;
  pointer-events: none;
}

.login-biz__beam--1 {
  left: 28%;
  transform: rotate(18deg);
}

.login-biz__beam--2 {
  left: 52%;
  transform: rotate(-12deg);
  animation-delay: -3.2s;
  opacity: 0.35;
}

.login-biz__mesh {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.06) 0%, transparent 40%),
    linear-gradient(180deg, transparent 50%, rgba(3, 12, 22, 0.55) 100%);
  pointer-events: none;
}

.login-biz__grid {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    linear-gradient(rgba(140, 200, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(140, 200, 255, 0.12) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 75% 65% at 38% 40%, #000 15%, transparent 78%);
  animation: login-biz-grid 24s linear infinite;
  pointer-events: none;
}

.login-biz__floor {
  position: absolute;
  left: -10%;
  right: -10%;
  bottom: -18%;
  height: 48%;
  background:
    linear-gradient(90deg, transparent 0%, rgba(100, 190, 255, 0.08) 50%, transparent 100%),
    repeating-linear-gradient(90deg, rgba(120, 200, 255, 0.14) 0 1px, transparent 1px 64px),
    repeating-linear-gradient(0deg, rgba(120, 200, 255, 0.12) 0 1px, transparent 1px 48px);
  transform: perspective(600px) rotateX(62deg);
  transform-origin: center top;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.75), transparent 85%);
  opacity: 0.55;
  pointer-events: none;
  animation: login-biz-floor 16s linear infinite;
}

.login-biz__fx {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.85;
}

.login-biz__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(52px);
  pointer-events: none;
  animation: login-biz-float 10s ease-in-out infinite;
  mix-blend-mode: screen;
}

.login-biz__orb--a {
  top: 4%;
  left: 12%;
  width: 320px;
  height: 320px;
  background: rgba(64, 170, 255, 0.45);
}

.login-biz__orb--b {
  right: 22%;
  bottom: 6%;
  width: 420px;
  height: 420px;
  background: rgba(91, 91, 214, 0.55);
  animation-delay: -4s;
}

.login-biz__orb--c {
  top: 38%;
  left: 42%;
  width: 200px;
  height: 200px;
  background: rgba(160, 230, 255, 0.28);
  animation-delay: -7s;
}

.login-biz__ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(140, 210, 255, 0.28);
  box-shadow:
    0 0 24px rgba(74, 180, 255, 0.2),
    inset 0 0 24px rgba(74, 180, 255, 0.08);
  pointer-events: none;
  animation: login-biz-spin 28s linear infinite;
}

.login-biz__ring--lg {
  top: 12%;
  left: 38%;
  width: 280px;
  height: 280px;
}

.login-biz__ring--sm {
  top: 22%;
  left: 44%;
  width: 160px;
  height: 160px;
  animation-direction: reverse;
  animation-duration: 18s;
  border-style: dashed;
  opacity: 0.7;
}

.login-biz__wires {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.7;
  pointer-events: none;
}

.login-biz__wire {
  fill: none;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-dasharray: 8 14;
  animation: login-biz-dash 14s linear infinite;
}

.login-biz__wire--soft {
  stroke-width: 1;
  opacity: 0.55;
  animation-duration: 22s;
}

.login-biz__wire--alt {
  stroke-width: 1.2;
  opacity: 0.4;
  animation-duration: 18s;
  animation-direction: reverse;
}

.login-biz__node {
  fill: rgba(200, 236, 255, 0.95);
}

.login-biz__node--pulse {
  transform-box: fill-box;
  transform-origin: center;
  animation: login-biz-pulse 2.4s ease-in-out infinite;
}

.login-biz__cubes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  perspective: 800px;
}

.login-biz__cube {
  position: absolute;
  width: 56px;
  height: 56px;
  border: 1px solid rgba(186, 224, 255, 0.45);
  border-radius: 12px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(91, 91, 214, 0.22)),
    radial-gradient(circle at 30% 25%, rgba(180, 230, 255, 0.35), transparent 55%);
  box-shadow:
    0 0 24px rgba(74, 180, 255, 0.25),
    0 16px 32px rgba(4, 16, 30, 0.35);
  animation: login-biz-cube 8s ease-in-out infinite;
  backdrop-filter: blur(2px);
}

.login-biz__cube--1 {
  top: 18%;
  left: 58%;
  transform: rotate(18deg) rotateY(18deg);
}

.login-biz__cube--2 {
  top: 54%;
  left: 18%;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  animation-delay: -2.5s;
}

.login-biz__cube--3 {
  top: 66%;
  left: 46%;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  animation-delay: -5s;
  opacity: 0.75;
}

.login-biz__cube--4 {
  top: 30%;
  left: 72%;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  animation-delay: -1.2s;
  opacity: 0.65;
}

.login-biz__scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(180deg, transparent, rgba(120, 210, 255, 0.08), transparent);
  animation: login-biz-scan 5.5s ease-in-out infinite;
  pointer-events: none;
  mix-blend-mode: screen;
}

.login-biz__shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(380px, 38vw, 460px);
  align-items: stretch;
  box-sizing: border-box;
}

.login-biz__brand {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 64px clamp(40px, 6vw, 88px);
  max-width: 660px;
  /* sticky 固定左侧，注册表单变高时不跳动、右侧也不需要滚动条 */
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  height: 100dvh;
  box-sizing: border-box;
}

.login-biz__brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.login-biz__logo-wrap {
  display: inline-flex;
  border-radius: 10px;
  box-shadow:
    0 0 0 1px rgba(140, 210, 255, 0.35),
    0 0 28px rgba(74, 180, 255, 0.45);
  animation: login-biz-logo-glow 3.2s ease-in-out infinite;
}

.login-biz__brand-name {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #f3f8fc;
  text-shadow: 0 0 24px rgba(100, 190, 255, 0.35);
}

.login-biz__badge {
  margin-left: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #b8e2ff;
  background: rgba(74, 160, 230, 0.18);
  border: 1px solid rgba(140, 210, 255, 0.35);
  box-shadow: 0 0 16px rgba(74, 180, 255, 0.2);
}

.login-biz__headline {
  margin: 0 0 14px;
  font-size: clamp(30px, 3.4vw, 44px);
  font-weight: 760;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: #ffffff;
}

.login-biz__headline-glow {
  background: linear-gradient(105deg, #ffffff 10%, #9ad4ff 45%, #ffffff 70%, #c8ebff 100%);
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: login-biz-shimmer 5s ease-in-out infinite;
  filter: drop-shadow(0 0 18px rgba(100, 190, 255, 0.35));
}

.login-biz__lead {
  margin: 0 0 36px;
  max-width: 28em;
  font-size: 16px;
  line-height: 1.7;
  color: rgba(214, 234, 250, 0.86);
}

.login-biz__features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

.login-biz__feature {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(8, 28, 48, 0.35);
  border: 1px solid rgba(140, 210, 255, 0.22);
  backdrop-filter: blur(12px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.login-biz__feature:hover {
  transform: translateY(-3px);
  border-color: rgba(160, 220, 255, 0.5);
  box-shadow:
    0 10px 28px rgba(4, 20, 40, 0.35),
    0 0 24px rgba(74, 180, 255, 0.18);
}

.login-biz__feature-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 13px;
  color: #9ad4ff;
  background: rgba(74, 160, 230, 0.2);
  border: 1px solid rgba(140, 210, 255, 0.3);
  box-shadow: 0 0 12px rgba(74, 180, 255, 0.2);
}

.login-biz__feature-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.login-biz__feature-title {
  font-size: 14px;
  font-weight: 650;
  color: #d2ecff;
}

.login-biz__feature-desc {
  font-size: 12px;
  line-height: 1.5;
  color: rgba(206, 228, 244, 0.72);
}

.login-biz__aside {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 40px 36px 40px 12px;
  box-sizing: border-box;
  background: transparent;
  border-left: none;
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 400px;
  padding: 34px 30px 30px;
  border-radius: 22px;
  background: rgba(12, 28, 46, 0.42);
  border: 1px solid rgba(160, 210, 255, 0.18);
  box-shadow: 0 20px 48px rgba(4, 12, 24, 0.35);
  backdrop-filter: blur(32px) saturate(140%);
  -webkit-backdrop-filter: blur(32px) saturate(140%);
  overflow: hidden;
  isolation: isolate;
}

.login-card__glow {
  display: none;
}

.login-card__brand {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 18px;
  font-size: 17px;
  font-weight: 700;
  color: #f0f7ff;
}

.login-card__title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #f5faff;
  text-align: center;
  text-shadow: none;
}

.login-card__subtitle {
  margin: 0 0 20px;
  font-size: 13px;
  line-height: 1.5;
  color: rgba(210, 228, 244, 0.72);
  text-align: center;
}

.login-card__tabs {
  display: flex;
  margin-bottom: 18px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(160, 210, 255, 0.14);
  gap: 4px;
}

.login-card__tab {
  flex: 1;
  border: none;
  padding: 10px 12px;
  font-size: 15px;
  font-weight: 600;
  color: rgba(210, 228, 244, 0.65);
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  transition:
    background 0.2s,
    color 0.2s;
}

.login-card__tab--active {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.login-card__form {
  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-form-item__label) {
    margin-bottom: 6px;
    padding: 0;
  }

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.22);
    box-shadow: 0 0 0 1px rgba(160, 210, 255, 0.16) inset;
    transition:
      background 0.2s,
      box-shadow 0.2s;
  }

  :deep(.el-input__wrapper:hover) {
    background: rgba(0, 0, 0, 0.28);
    box-shadow: 0 0 0 1px rgba(160, 210, 255, 0.28) inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    background: rgba(0, 0, 0, 0.32);
    box-shadow: 0 0 0 1px rgba(140, 200, 255, 0.45) inset;
  }

  :deep(.el-input__inner) {
    color: #f0f7ff;
  }

  :deep(.el-input__inner::placeholder) {
    color: rgba(190, 214, 235, 0.42);
  }

  /* 覆盖浏览器 autofill 默认白底 */
  :deep(.el-input__inner:-webkit-autofill),
  :deep(.el-input__inner:-webkit-autofill:hover),
  :deep(.el-input__inner:-webkit-autofill:focus),
  :deep(.el-input__inner:-webkit-autofill:active) {
    -webkit-text-fill-color: #f0f7ff !important;
    caret-color: #f0f7ff;
    box-shadow: 0 0 0 1000px rgba(8, 22, 38, 0.92) inset !important;
    transition: background-color 99999s ease-out;
  }

  :deep(.el-input__wrapper:has(.el-input__inner:-webkit-autofill)) {
    background: rgba(0, 0, 0, 0.22);
    box-shadow: 0 0 0 1px rgba(160, 210, 255, 0.16) inset;
  }

  :deep(.el-input__prefix),
  :deep(.el-input__suffix),
  :deep(.el-input__clear),
  :deep(.el-input__password) {
    color: rgba(190, 214, 235, 0.7);
  }
}

.login-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: rgba(230, 242, 252, 0.86);
  font-weight: 500;
}

.login-label__icon {
  font-size: 16px;
  color: #8ec8f0;
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
  border: 1px solid rgba(160, 210, 255, 0.2);
  background: rgba(255, 255, 255, 0.78);
}

.login-submit {
  width: 100%;
  margin-top: 6px;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  letter-spacing: 0.08em;
  --el-button-bg-color: #5b5bd6;
  --el-button-border-color: #5b5bd6;
  --el-button-hover-bg-color: #6a6ae0;
  --el-button-hover-border-color: #6a6ae0;
  box-shadow: 0 8px 20px rgba(8, 30, 50, 0.35);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 10px 24px rgba(8, 30, 50, 0.42);
  }
}

.login-biz__enter {
  opacity: 0;
  animation: login-biz-enter 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.login-biz__enter--d1 {
  animation-delay: 0.08s;
}

.login-biz__enter--d2 {
  animation-delay: 0.16s;
}

.login-biz__enter--d3 {
  animation-delay: 0.24s;
}

@keyframes login-biz-aurora {
  to {
    transform: rotate(360deg);
  }
}

@keyframes login-biz-beam {
  0%,
  100% {
    opacity: 0.15;
    translate: 0 0;
  }
  50% {
    opacity: 0.65;
    translate: 18px -10px;
  }
}

@keyframes login-biz-grid {
  to {
    background-position: 56px 56px;
  }
}

@keyframes login-biz-floor {
  to {
    background-position:
      64px 0,
      64px 0,
      0 48px;
  }
}

@keyframes login-biz-float {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -18px;
  }
}

@keyframes login-biz-cube {
  0%,
  100% {
    translate: 0 0;
    filter: brightness(1);
  }
  50% {
    translate: 0 -16px;
    filter: brightness(1.25);
  }
}

@keyframes login-biz-dash {
  to {
    stroke-dashoffset: -360;
  }
}

@keyframes login-biz-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.45);
  }
}

@keyframes login-biz-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes login-biz-scan {
  0% {
    top: -10%;
    opacity: 0;
  }
  15% {
    opacity: 0.8;
  }
  85% {
    opacity: 0.5;
  }
  100% {
    top: 110%;
    opacity: 0;
  }
}

@keyframes login-biz-shimmer {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes login-biz-logo-glow {
  0%,
  100% {
    box-shadow:
      0 0 0 1px rgba(140, 210, 255, 0.35),
      0 0 20px rgba(74, 180, 255, 0.35);
  }
  50% {
    box-shadow:
      0 0 0 1px rgba(160, 230, 255, 0.55),
      0 0 36px rgba(74, 180, 255, 0.65);
  }
}

@keyframes login-biz-border {
  to {
    background-position: 300% 0;
  }
}

@keyframes login-biz-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .login-biz__shell {
    grid-template-columns: 1fr;
    justify-items: center;
    padding: 28px 16px 36px;
  }

  .login-biz__brand {
    display: none;
  }

  .login-biz__aside {
    width: 100%;
    padding: 0;
  }

  .login-card__brand {
    display: inline-flex;
  }

  .login-biz__cubes,
  .login-biz__wires,
  .login-biz__ring,
  .login-biz__floor {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-biz__aurora,
  .login-biz__beam,
  .login-biz__grid,
  .login-biz__floor,
  .login-biz__orb,
  .login-biz__cube,
  .login-biz__ring,
  .login-biz__scan,
  .login-biz__wire,
  .login-biz__headline-glow,
  .login-biz__logo-wrap,
  .login-card__glow {
    animation: none !important;
  }

  .login-biz__enter {
    opacity: 1;
    animation: none;
  }
}
</style>
