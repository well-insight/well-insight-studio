<script setup lang="ts">
import { useMotion, useTheme, WiMessage, WiToast } from '@well-insight/ui'
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

const { setTheme } = useTheme()
const { setMotion } = useMotion()

onMounted(() => {
  setTheme('light')
  setMotion('full')
})
</script>

<template>
  <RouterView />
  <WiMessage placement="top" />
  <WiToast position="bottom-right" />
</template>

<style>
/* 兼容旧变量名，让整套页面跟随 well-insight-ui 主题切换 */
[data-theme="light"] {
  --wi-surface: #f8fafc;
  --wi-surface-elevated: #ffffff;
  --wi-surface-hover: #f1f5f9;
  --wi-text-color: #1e293b;
  --wi-text-secondary: #64748b;
  --wi-border-color: #e2e8f0;
  --wi-primary: #3b82f6;
  --wi-ground-background: #f8fafc;
}
[data-theme="dark"] {
  --wi-surface: #0c111c;
  --wi-surface-elevated: #141c2a;
  --wi-surface-hover: #1e2638;
  --wi-text-color: #e8edf5;
  --wi-text-secondary: #8a9bb5;
  --wi-border-color: #1e2638;
  --wi-primary: #3b82f6;
  --wi-ground-background: #080b13;
}

html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
</style>
