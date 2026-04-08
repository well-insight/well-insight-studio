<script setup lang="ts">
import { provide } from 'vue'
import { initVisualData, injectKey, localKey } from '@/visual-editor/hooks/useVisualData'

const visualData = initVisualData()
// 注入可视化编辑器所有配置
provide(injectKey, visualData)

const { jsonData } = visualData

window.addEventListener('beforeunload', () => {
  sessionStorage.setItem(localKey, JSON.stringify(jsonData))
})
</script>

<template>
  <el-config-provider>
    <router-view>
      <template #default="{ Component, route }">
        <component :is="Component" v-if="route.meta.noKeepAlive" />
        <keep-alive v-else>
          <component :is="Component" />
        </keep-alive>
      </template>
    </router-view>
  </el-config-provider>
</template>
