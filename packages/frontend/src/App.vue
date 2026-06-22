<script setup lang="ts">
import { provide, toValue } from 'vue'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useThemeStore } from '@/stores/themeStore'
import { initVisualData, injectKey, localKey } from '@/visual-editor/hooks/useVisualData'

const visualData = initVisualData()
// 注入可视化编辑器所有配置
provide(injectKey, visualData)

const { jsonData } = visualData
const workspaceStore = useWorkspaceStore()
// 初始化主题（会自动读取 localStorage / 系统偏好并应用 dark class）
useThemeStore()

window.addEventListener('beforeunload', () => {
  const id = workspaceStore.currentApp?.id
  const key = id != null && String(id) !== '' ? `${localKey}_${id}` : localKey
  try {
    const snapshot = JSON.stringify(toValue(jsonData))
    sessionStorage.setItem(key, snapshot)
    sessionStorage.setItem(localKey, snapshot)
  }
  catch {
    /* ignore quota */
  }
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
