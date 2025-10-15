<script lang="ts" setup>
import type { PropType } from 'vue'
import type { Compnents } from '@/type'
import { reactive, ref } from 'vue'
import { getComponentType } from '@/utils/component'

const props = defineProps({
  componentData: {
    type: Object as PropType<Compnents>,
    default: {},
  },
})
const componentRef = ref()
// const componentType = ref('normal');
const componentContainerRef = ref()
const chartStyle = reactive({
  'height': '100%',
  'width': '100%',
  'transform': 'scale(1)',
  'z-index': '100',
})

// 组件类性
const componentType = ref('element')
componentType.value = getComponentType(props.componentData)[0]

const { width, height } = props.componentData.style
const scale = 93 / Number.parseInt(width)
chartStyle.width = `${158 / scale}px` // 158
chartStyle.height = `${93 / scale}px` // 93
chartStyle.transform = `scale(${scale})`
</script>

<template>
  <div ref="componentContainerRef" :class="`component-${componentType}-container show-content`">
    <component :is="componentData.component" ref="componentRef" class="html-2-canvas-component" :style="{ width: chartStyle.width, height: chartStyle.height, transform: chartStyle.transform }" />
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
