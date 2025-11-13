<script lang="ts" setup>
import type { PropType } from 'vue'
import type { Compnents } from '@/type'
import { useElementSize } from '@vueuse/core'
import { nextTick, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { getComponentType } from '@/utils/component'

const props = defineProps({
  componentData: {
    type: Object as PropType<Compnents>,
    default: () => ({}),
  },
})
const componentRef = ref()
const containerRef = useTemplateRef('containerRef')
const chartStyle = reactive({
  'height': '100%',
  'width': '100%',
  'transform': 'scale(1)',
  'z-index': '100',
})

const { width, height } = useElementSize(containerRef)

watch(width, () => {
  debugger
})

// 组件类性
const componentType = ref('element')

onMounted(() => {
  nextTick(() => {
    debugger
    console.log(containerRef.value)

    if (width.value) {
      initComponent()
    }
  })
})

function initComponent() {
  const componentStyle = props.componentData.style
  componentType.value = getComponentType(props.componentData)[0]
  const scale = width.value / Number.parseInt(componentStyle?.width)
  chartStyle.width = `${width.value / scale}px` // 158
  chartStyle.height = `${height.value / scale}px` // 93
  chartStyle.transform = `scale(${scale})`
  debugger
}
</script>

<template>
  <div ref="containerRef" :class="`component-${componentType}-container show-content`">
    <component :is="componentData.component" v-if="width" ref="componentRef" class="html-2-canvas-component" :style="chartStyle" />
  </div>
</template>

<style scoped lang="scss">
.show-content {
    pointer-events: none;
}

.component-chart-container {
    position: relative;
    width: 100%;
    height: 100%;
}

.component-element-container {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
</style>

<style lang="scss">
.html-2-canvas-component {
    transform-origin: 0 0;
}
</style>
