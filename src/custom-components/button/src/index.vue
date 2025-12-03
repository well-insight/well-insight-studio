<script lang='ts' setup>
import type { ButtonProps } from './props'
import { ref } from 'vue'

const props = withDefaults(defineProps<ButtonProps>(), {
  configs: () => ({
    inputValue: '这是按钮',
  }),
})

const compRef = ref()
defineExpose({
  compRef,
})
</script>

<template>
  <el-button v-bind="configs" ref="compRef">
    {{ configs?.inputValue }}
  </el-button>
</template>

<style lang='scss' scoped></style>
