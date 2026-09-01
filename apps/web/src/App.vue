<script setup lang="ts">
import { useMotion, WiConfigProvider, WiMessage, WiToast, zhCN } from '@well-insight/ui'
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'

const { setMotion } = useMotion()

onMounted(() => {
  setMotion('full')
})
</script>

<template>
  <WiConfigProvider :locale="zhCN">
    <div class="app-shell">
      <RouterView />
    </div>
    <WiMessage placement="top" />
    <WiToast position="bottom-right" />
  </WiConfigProvider>
</template>

<style>
.app-shell {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
