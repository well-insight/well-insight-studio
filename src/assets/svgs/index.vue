<script setup lang="ts" name="SvgIcon">
// 引入vue函数
import { computed, onMounted, ref } from 'vue'

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
    fontSize: '1em',
  },
)

const svgRef = ref<HTMLOrSVGElement>()

const symbolId = computed(() => `#icon-${props.name}`)
const svgClass = computed(() => {
  if (props.className) {
    return `svg-icon ${props.className}`
  }
  return 'svg-icon'
})

onMounted(() => {
  console.log(svgRef.value)
})

const iconColor = computed(() => {
  return svgRef.value
})
</script>

<template>
  <svg ref="svgRef" aria-hidden="true" :class="svgClass" :style="{ fontSize }" :color="bgColor" :stroke="strokeColor">
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
