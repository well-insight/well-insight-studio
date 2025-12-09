<script lang='ts' setup>
import type { CSSProperties } from 'vue'

const repeatValue = defineModel<CSSProperties['backgroundRepeat']>({ required: true, default: 'no-repeat' })
</script>

<template>
  <el-select v-model="repeatValue">
    <el-option value="repeat" label="repeat" />
    <el-option value="repeat-x" label="repeat-x" />
    <el-option value="repeat-y" label="repeat-y" />
    <el-option value="no-repeat" label="no-repeat" />
  </el-select>
</template>

<style lang='scss' module></style>
