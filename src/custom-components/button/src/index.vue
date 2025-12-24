<script lang='ts' setup>
import type { ButtonProps } from './props'
import { computed, ref } from 'vue'

const props = withDefaults(defineProps<ButtonProps>(), {
  configs: () => ({
    inputValue: '这是按钮',
  }),
  style: () => {
    return {
      width: 'auto',
      height: '32px',
    }
  },
})

const buttonOriginProps = computed(() => {
  return {
    ...props?.configs,
    inputValue: undefined,
  }
})

const compRef = ref()
defineExpose({
  compRef,
})
</script>

<template>
  <el-button v-bind="buttonOriginProps" ref="compRef" :style="style">
    {{ configs?.inputValue }}
  </el-button>
</template>

<style lang='scss' scoped></style>
