<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>

<template>
  <ElConfigProvider :locale="zhCn" :z-index="999">
    <router-view />
  </ElConfigProvider>
</template>

<style lang="scss">
@use './styles/index.scss';
#app {
  width: 100%;
  height: 100%;
  //border: 1px solid ridge;
  color: #575a64;
  background-color: #f6f8f9;
}

// white-theme:
// nobg-color: #575a64;
// bgc: #0ca296;
// color: #ffffff;
// font color: #575a64
</style>
