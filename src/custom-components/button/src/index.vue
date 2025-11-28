<script lang='ts' setup>
import type { ButtonProps } from './props'
import { kMaxLength } from 'node:buffer'
import { objectEntries } from '@vueuse/core'
import { isBoolean, isNull, isNumber, isString, isUndefined } from 'lodash-es'
import { ref } from 'vue'
import { withConfig } from './props'

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
