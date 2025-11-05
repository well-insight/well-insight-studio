<script setup lang="ts" name="SvgIcon">
// 引入vue函数
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name?: string
    bgColor?: string
    strokeColor?: string
    className?: string
    fontSize?: string | number
  }>(),
  {
    bgColor: '#2c2c2c',
    name: '',
    strokeColor: '',
    fontSize: 24,
  },
)

const symbolId = computed(() => `#icon-${props.name}`)
const svgClass = computed(() => {
  if (props.className) {
    return `svg-icon ${props.className}`
  }
  return 'svg-icon'
})
</script>

<template>
  <svg aria-hidden="true" :class="svgClass" :style="{ fontSize }" :color="bgColor" :stroke="strokeColor">
    <use :xlink:href="symbolId" />
  </svg>
</template>

<style scoped lang="scss">
.svg-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
  display: inline-flex;
}
</style>
