<script setup lang="ts">
import { useMotion, WdConfigProvider, WdMessage, WdToast, zhCN } from '@wex-design/ui'
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

const { setMotion } = useMotion()

onMounted(() => {
  setMotion('full')
})
</script>

<template>
  <WdConfigProvider :locale="zhCN">
    <div class="app-shell">
      <RouterView />
    </div>
    <WdMessage placement="top" />
    <WdToast position="bottom-right" />
  </WdConfigProvider>
</template>

<style>
.app-shell {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
