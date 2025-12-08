<script lang='ts' setup>
import type { InputEmits, InputProps } from 'element-plus'
import { ElInput, inputEmits } from 'element-plus'

const props = withDefaults(defineProps<InputProps>(), {
  size: 'default',
  placeholder: '请输入',
})

const emits = defineEmits(inputEmits)

const events: Partial<InputEmits> = {
  'update:modelValue': (e) => {
    emits('update:modelValue', e)
    return true
  },
  'change': (v) => {
    emits('change', v)
    return true
  },
}
</script>

<template>
  <ElInput v-bind="props" v-on="events" />
</template>

<style lang='scss' module></style>
