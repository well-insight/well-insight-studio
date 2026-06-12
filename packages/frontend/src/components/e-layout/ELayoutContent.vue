<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed } from 'vue'

const props = defineProps<{
  style?: CSSProperties
}>()

const contentStyle = computed<CSSProperties>(() => ({
  flex: 1,
  boxSizing: 'border-box',
  ...props.style,
}))
</script>

<template>
  <main class="e-layout-content" :style="contentStyle">
    <slot />
  </main>
</template>

<style scoped lang="scss">
.e-layout-content {
  position: relative;
  background: inherit;
  // 移除 overflow 相关，滚动完全由外部控制
}
</style>
