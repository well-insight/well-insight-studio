<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed } from 'vue'

const props = defineProps<{
  style?: CSSProperties
}>()

const headerStyle = computed<CSSProperties>(() => ({
  flexShrink: 0,
  boxSizing: 'border-box',
  width: '100%',
  ...props.style
}))
</script>

<template>
  <header class="e-layout-header" :style="headerStyle">
    <slot />
  </header>
</template>

<style scoped lang="scss">
/* 无额外滚动相关样式 */
</style>
