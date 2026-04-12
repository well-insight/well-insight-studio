<script lang="ts" setup>
import type { ApiApplicationListItem } from '@/api/application'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { onActivated, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchApplication } from '@/api/application'
import { ELayout, ELayoutContent, ELayoutSider } from '@/components/e-layout'
import { useControlStore } from '@/store/useControlStore/useControlStore'
import { useWorkspaceStore } from '@/store/workspaceStore/workspaceStore'
import { CustomComponents } from '@/visual-editor/components/component-list'
import LeftAside from '@/visual-editor/components/left-aside/LeftAside.vue'
import RightAttributePanel from '@/visual-editor/components/right-attribute-panel/RightAttributePanel.vue'
import SimulatorEditor from '@/visual-editor/components/simulator-editor/SimulatorEditor.vue'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { appList } = storeToRefs(workspaceStore)

const controlStore = useControlStore()
const { layoutCollapse, settingCollapse } = storeToRefs(controlStore)

const { overrideProject } = useVisualData()

/** 并发/重复进入时只应用最后一次请求结果 */
let loadSeq = 0

const loading = ref(false)

function normalizeAppId(): string | null {
  const raw = route.params.id
  if (raw == null) return null
  if (Array.isArray(raw)) {
    return raw.filter(Boolean).join('/') || null
  }
  const s = String(raw).trim()
  return s || null
}

function toWorkspaceApp(row: ApiApplicationListItem) {
  const iso = row.lastUpdated || row.updated_at
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    clientType: row.client_type,
    starred: row.starred,
    lastUpdated: iso ? iso.slice(0, 10) : undefined
  }
}

async function loadApplicationById(id: string) {
  const seq = ++loadSeq
  loading.value = true
  try {
    const detail = await fetchApplication(id)
    if (seq !== loadSeq) {
      return
    }
    workspaceStore.setCurrentApp(toWorkspaceApp(detail))
    overrideProject(detail.schema)
  } catch (e) {
    if (seq !== loadSeq) {
      return
    }
    ElMessage.error((e as Error).message || '加载应用失败')
    const fallback = appList.value?.find(e => String(e?.id) === id)
    if (fallback) {
      workspaceStore.setCurrentApp(fallback)
    }
  } finally {
    if (seq === loadSeq) {
      loading.value = false
    }
  }
}

watch(
  () => normalizeAppId(),
  id => {
    if (id) {
      loadApplicationById(id)
    }
  },
  { immediate: true }
)

/**
 * keep-alive 下再次进入同一应用时路由 id 不变，watch 不会触发，需在激活时重新请求。
 * 首次激活与 immediate watch 重合，跳过一次以免重复请求。
 */
let skipNextActivateLoad = true
onActivated(() => {
  const id = normalizeAppId()
  if (!id) {
    return
  }
  if (skipNextActivateLoad) {
    skipNextActivateLoad = false
    return
  }
  loadApplicationById(id)
})

onUnmounted(() => {
  workspaceStore.setCurrentApp(null)
})
</script>

<template>
  <div
    id="application-edit-wrapper"
    v-loading="loading"
    class="w-full h-full flex overflow-hidden relative"
    element-loading-text="加载应用配置…"
  >
    <ELayout class="w-full h-full flex overflow-hidden relative">
      <ELayoutSider v-model:collapsed="layoutCollapse" show-trigger="bar" :width="280" :collapsed-width="0">
        <LeftAside />
      </ELayoutSider>

      <ELayoutContent>
        <SimulatorEditor />
      </ELayoutContent>

      <ELayoutSider
        v-model:collapsed="settingCollapse"
        show-trigger="bar"
        :width="360"
        :collapsed-width="0"
        position="right"
      >
        <RightAttributePanel />
      </ELayoutSider>

      <CustomComponents />
    </ELayout>
  </div>
</template>

<style lang="scss" module></style>
