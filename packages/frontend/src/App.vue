<script setup lang="ts">
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { storeToRefs } from 'pinia'
import { computed, provide, toValue } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { initVisualData, injectKey, localKey } from '@/visual-editor/hooks/useVisualData'

const visualData = initVisualData()
provide(injectKey, visualData)

const { jsonData } = visualData
const workspaceStore = useWorkspaceStore()

const themeStore = useThemeStore()
const { epConfig } = storeToRefs(themeStore)

const configProviderProps = computed(() => ({
  locale: zhCn,
  ...epConfig.value,
}))

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
  <el-config-provider v-bind="configProviderProps">
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
