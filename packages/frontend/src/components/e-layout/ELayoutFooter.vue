<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed } from 'vue'

const props = defineProps<{
  style?: CSSProperties
}>()

const footerStyle = computed<CSSProperties>(() => ({
  flexShrink: 0,
  boxSizing: 'border-box',
  width: '100%',
  ...props.style,
}))
</script>

<template>
  <footer class="e-layout-footer" :style="footerStyle">
    <slot />
  </footer>
</template>

<style scoped lang="scss">
/* 无额外滚动相关样式 */
</style>
