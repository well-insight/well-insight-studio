<script setup lang="ts">
import { Key, Lock, User } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { useAuthForm } from '@/hooks/useAuthForm'

const { mode, form, loading, canvasRef, refreshCaptcha, onSubmit, setMode } = useAuthForm()

const cubeRef = ref<HTMLElement | null>(null)

function focusCube() {
  if (cubeRef.value) {
    cubeRef.value.classList.add('cube-focused')
    setTimeout(() => {
      cubeRef.value?.classList.remove('cube-focused')
    }, 1800)
  }
}

function togglePassword(btn: HTMLElement) {
  const input = document.getElementById('password-input') as HTMLInputElement
  if (!input) return
  const icon = btn.querySelector('i')
  if (input.type === 'password') {
    input.type = 'text'
    icon?.classList.replace('fa-eye', 'fa-eye-slash')
  } else {
    input.type = 'password'
    icon?.classList.replace('fa-eye-slash', 'fa-eye')
  }
}
</script>

<template>
  <div class="login-cube-container">
    <!-- 左侧签名区：3D 立方体 -->
    <div class="left-panel">
      <div class="cube-wrapper">
        <div ref="cubeRef" class="cube" @click="focusCube">
          <!-- 6 个面 -->
          <div class="cube-face front"></div>
          <div class="cube-face back"></div>
          <div class="cube-face right"></div>
          <div class="cube-face left"></div>
          <div class="cube-face top"></div>
          <div class="cube-face bottom"></div>
          <!-- 内部装饰线 -->
          <div class="cube-inner">
            <div class="line-x"></div>
            <div class="line-y"></div>
          </div>
        </div>
      </div>

      <div class="brand-text">
        <div class="brand-label">WELL CUBE</div>
        <div class="brand-slogan display-font">
          Craft is<br />precision.
        </div>
      </div>
    </div>

    <!-- 右侧登录卡片 -->
    <div class="right-panel">
      <div class="login-card">
        <!-- Header -->
        <div class="card-header">
          <div class="logo">
            <div class="logo-icon">
              <i class="fa-solid fa-cube"></i>
            </div>
            <span class="logo-text">Well Cube</span>
          </div>
          <div class="subtitle">欢迎回来，设计师。</div>
        </div>

        <!-- Tabs -->
        <div class="tabs" role="tablist">
          <button
            type="button"
            class="tab"
            :class="{ active: mode === 'login' }"
            @click="setMode('login')"
          >
            登录
          </button>
          <button
            type="button"
            class="tab"
            :class="{ active: mode === 'register' }"
            @click="setMode('register')"
          >
            注册
          </button>
        </div>

        <!-- Form -->
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
              :placeholder="mode === 'login' ? '请输入邮箱或用户名' : '请输入邮箱'"
              clearable
              @focus="focusCube"
            />
          </el-form-item>

          <el-form-item v-if="mode === 'register'">
            <template #label>
              <span class="form-label">
                <el-icon><User /></el-icon>
                用户名
              </span>
            </template>
            <el-input v-model="form.username" size="large" placeholder="请输入用户名" clearable />
          </el-form-item>

          <el-form-item>
            <template #label>
              <span class="form-label">
                <el-icon><Lock /></el-icon>
                密码
              </span>
            </template>
            <div class="password-wrapper">
              <el-input
                id="password-input"
                v-model="form.password"
                size="large"
                placeholder="请输入密码"
                type="password"
                show-password
                @focus="focusCube"
              />
              <button type="button" class="password-toggle" @click="togglePassword($event.currentTarget as HTMLElement)">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </el-form-item>

          <el-form-item v-if="mode === 'register'">
            <template #label>
              <span class="form-label">
                <el-icon><Lock /></el-icon>
                确认密码
              </span>
            </template>
            <el-input v-model="form.confirmPassword" size="large" placeholder="请再次输入密码" type="password" show-password />
          </el-form-item>

          <el-form-item>
            <template #label>
              <span class="form-label">
                <el-icon><Key /></el-icon>
                验证码
              </span>
            </template>
            <div class="captcha-row">
              <el-input v-model="form.captcha" size="large" placeholder="请输入验证码" maxlength="6" clearable />
              <canvas
                ref="canvasRef"
                width="112"
                height="40"
                class="captcha-canvas"
                title="点击刷新"
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
            {{ mode === 'login' ? '进入设计系统' : '创建账号' }}
          </el-button>
        </el-form>

        <div class="card-footer">
          还没有账号？<a href="#" @click.prevent="setMode('register')">申请加入</a>
        </div>
      </div>

      <div class="copyright">© 2026 Well Cube Studio</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-cube-container {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 420px;
  background: #11110F;
  color: #FAF9F6;
  font-family: 'Inter', system-ui, sans-serif;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

/* 左侧签名区 */
.left-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 30% 40%, rgba(159,122,234,0.08) 0%, transparent 70%);
  }
}

.cube-wrapper {
  perspective: 800px;
  margin-bottom: 60px;
}

.cube {
  width: 180px;
  height: 180px;
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(25deg) rotateY(45deg);
  transition: transform 1.2s cubic-bezier(0.23, 1, 0.32, 1);
  cursor: pointer;
}

.cube-focused {
  animation: unlock 1.8s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes unlock {
  0% { transform: rotateX(25deg) rotateY(45deg); }
  40% { transform: rotateX(25deg) rotateY(225deg); }
  100% { transform: rotateX(25deg) rotateY(405deg); }
}

.cube-face {
  position: absolute;
  width: 180px;
  height: 180px;
  background: #E8E4D9;
  border: 1px solid #11110F;
  box-shadow: inset 0 0 0 1px #11110F;
}

.front  { transform: translateZ(90px); }
.back   { transform: rotateY(180deg) translateZ(90px); background: #D1CDBF; }
.right  { transform: rotateY(90deg) translateZ(90px); background: #C9C5B8; }
.left   { transform: rotateY(-90deg) translateZ(90px); background: #D1CDBF; }
.top    { transform: rotateX(90deg) translateZ(90px); }
.bottom { transform: rotateX(-90deg) translateZ(90px); background: #C9C5B8; }

.cube-inner {
  position: absolute;
  inset: 0;
  transform: translateZ(91px);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.line-x, .line-y {
  position: absolute;
  background: #11110F;
  opacity: 0.25;
}
.line-x { width: 96px; height: 1px; }
.line-y { width: 1px; height: 96px; }

.brand-text {
  text-align: center;
  z-index: 2;
}

.brand-label {
  color: #9F7AEA;
  font-size: 13px;
  letter-spacing: 4px;
  font-weight: 500;
  margin-bottom: 8px;
}

.display-font {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 52px;
  line-height: 1.05;
  font-weight: 600;
  color: #E8E4D9;
  letter-spacing: -0.02em;
}

/* 右侧卡片 */
.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  background: #1C1B19;
  border-left: 1px solid rgba(255,255,255,0.06);
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: #11110F;
  border-radius: 24px;
  padding: 42px 38px;
  border: 1px solid rgba(255,255,255,0.06);
}

.card-header {
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.logo-icon {
  width: 38px;
  height: 38px;
  background: #9F7AEA;
  color: #11110F;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.logo-text {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.subtitle {
  color: #A3A09B;
  font-size: 15px;
}

.tabs {
  display: flex;
  margin-bottom: 28px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.tab {
  flex: 1;
  padding: 12px 0;
  font-size: 15px;
  font-weight: 500;
  color: #A3A09B;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  transition: color 0.2s;

  &.active {
    color: #FAF9F6;
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: #9F7AEA;
    }
  }
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  letter-spacing: 1.5px;
  color: #A3A09B;
  text-transform: uppercase;
}

.password-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 15px;
  z-index: 2;

  &:hover { color: #9F7AEA; }
}

.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;

  .el-input {
    flex: 1;
  }
}

.captcha-canvas {
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.1);
  background: #1C1B19;
}

.submit-btn {
  width: 100%;
  height: 52px;
  margin-top: 12px;
  background: #9F7AEA !important;
  color: #11110F !important;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.5px;
  border-radius: 16px;
  border: none;

  &:hover {
    background: #8B6AD9 !important;
  }
}

.card-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: #666;

  a {
    color: #9F7AEA;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
}

.copyright {
  text-align: center;
  margin-top: 40px;
  font-size: 11px;
  color: #555;
}
</style>
