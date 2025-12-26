<script lang='ts' setup>
import type { ButtonProps } from './props'
import { fontStyle } from 'html2canvas/dist/types/css/property-descriptors/font-style'
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<ButtonProps>(), {
  configs: () => ({
    inputValue: '这是按钮',
  }),
})

const buttonOriginProps = computed(() => {
  return {
    ...props?.configs,
    inputValue: undefined,
    font: undefined,
  }
})

const compRef = ref()

const getStyle = computed(() => {
  const { fontSize, fontStyle, fontWeight } = props.configs?.font || {}
  return {
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
  <el-button v-bind="buttonOriginProps" ref="compRef" :class="$style.input" :style="getStyle">
    {{ configs?.inputValue }}
  </el-button>
</template>

<style lang='scss' module>
.input {
  width: 100%;
  height: 100%;
}
</style>
