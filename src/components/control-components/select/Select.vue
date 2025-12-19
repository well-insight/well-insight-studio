<script lang='ts' setup>
import { selectProps } from 'element-plus'

const props = defineProps(selectProps)

const selectValue = defineModel<string>({ required: true, default: '' })
debugger
</script>

<template>
  <div class="w-full">
    <el-select-v2 v-bind="$attrs" v-model="selectValue" :options="options!" />
  </div>
</template>

<style lang='scss' module></style>
