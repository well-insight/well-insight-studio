<script lang='ts' setup>
import type { ButtonProps } from './props'
import { ref } from 'vue'

withDefaults(defineProps<ButtonProps>(), {

})

const compRef = ref()
defineExpose({
  compRef,
})
</script>

<template>
  <el-button v-bind="configs" ref="compRef">
    {{ configs?.text }}
  </el-button>
</template>

<style lang='scss' scoped src="./index.scss"></style>
