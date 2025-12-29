<script lang='ts' setup>
import type { TextProps } from './props'
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<TextProps>(), {
  configs: () => ({
    value: '这是文本',
  }),
})

const originProps = computed(() => {
  return {
    ...props?.configs,
    value: undefined,
  }
})

const compRef = ref()

const getStyle = computed(() => {
  const { fontSize, fontStyle, fontWeight } = props.configs?.font || {}
  return {
    ...props?.style || {},
    fontSize,
    fontStyle,
    fontWeight,
  }
})
defineExpose({
  compRef,
})
</script>

<template>
  <el-text v-bind="originProps" ref="compRef" :class="$style.text" :style="getStyle">
    {{ configs?.value }}
  </el-text>
</template>

<style lang='scss' module>
.text {
  // width: 100%;
  // height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
