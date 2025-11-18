<script lang='ts' setup>
import { ref } from 'vue'

defineProps({
  propValue: {
    type: String,
    default: '这是button',
  },
})
const compRef = ref()
defineExpose({
  compRef,
})
</script>

<template>
  <el-button ref="compRef">
    {{ propValue }}
  </el-button>
</template>

<style lang='scss' scoped src="./index.scss"></style>
