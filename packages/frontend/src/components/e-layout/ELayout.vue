<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed } from 'vue'

type Direction = 'column' | 'row'

const props = withDefaults(
  defineProps<{
    direction?: Direction
    style?: CSSProperties
  }>(),
  {
    direction: 'row',
    style: () => ({}),
  },
)

const layoutStyle = computed<CSSProperties>(() => ({
  display: 'flex',
  flexDirection: props.direction,
  width: '100%',
  height: '100%',
  boxSizing: 'border-box',
  ...props.style,
}))
</script>

<template>
  <div class="e-layout" :style="layoutStyle">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.e-layout {
  overflow: hidden; // 防止内部意外溢出破坏布局，但滚动完全由外部控制
}
</style>
