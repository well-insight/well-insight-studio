<template>
  <main class="home">
    <p class="eyebrow">WELL INSIGHT / STUDIO</p>
    <h1>业务系统</h1>
    <p>这里是业务前端入口，使用本地的 @well-insight/ui 组件库。</p>

    <WiButton>按钮</WiButton>
  </main>
</template>

<script setup lang="ts">
import { WiButton } from '@well-insight/ui'
</script>

<style>
:root {
  color: var(--wi-color-text);
  background: var(--wi-color-surface);
  font-family: var(--wi-font-sans);
}

html,body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: var(--wi-font-sans);
}
</style>
