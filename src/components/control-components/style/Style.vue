<script lang='ts' setup>
import type { CSSProperties } from 'vue'

const styles = defineModel<CSSProperties>({ default: () => ({}) })
</script>

<template>
  <div class="w-full h-full">
    <div class="styles-setting-item h-[50px] w-full flex items-center">
      <el-text>宽度</el-text>
      <el-input v-model="styles.width" type="number" />
    </div>
  </div>
</template>

<style lang='scss' scoped>
.styles-setting-item {
    border-bottom: 1px solid var(--el-collapse-border-color);
  }
</style>
