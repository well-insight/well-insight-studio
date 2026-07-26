<script lang="ts" setup>
import type { ApiApplicationListItem } from '@/api/application'
import { onClickOutside } from '@vueuse/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { onActivated, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { fetchApplication } from '@/api/application'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import SimulatorEditorPreview from '@/visual-editor/ui/canvas/simulator-editor-preview/SimulatorEditorPreview.vue'
// import SimulatorEditor from "@/visual-editor/ui/canvas/simulator-editor/SimulatorEditor.vue";

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { appList } = storeToRefs(workspaceStore)

const controlStore = useControlStore()

const { overrideProject, updateVisualLoading, isDirty } = useVisualData()

/** 并发/重复进入时只应用最后一次请求结果 */
let loadSeq = 0

const loading = ref(false)
const floatingPanelRef = ref<HTMLElement | null>(null)

onClickOutside(floatingPanelRef, () => {
  if (controlStore.floatingSettingVisible) {
    controlStore.floatingSettingVisible = false
  }
})

function normalizeAppId(): string | null {
  const raw = route.params.id
  if (raw == null)
    return null
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
    lastUpdated: iso ? iso.slice(0, 10) : undefined,
  }
}

async function loadApplicationById(id: string) {
  updateVisualLoading(true)
  const seq = ++loadSeq
  loading.value = true
  try {
    const detail = await fetchApplication(id)
    if (seq !== loadSeq) {
      return
    }
    workspaceStore.setCurrentApp(toWorkspaceApp(detail))
    overrideProject(detail.schema)
  }
  catch (error) {
    if (seq !== loadSeq) {
      return
    }
    ElMessage.error((error as Error).message || '加载应用失败')
    const fallback = appList.value?.find(e => String(e?.id) === id)
    if (fallback) {
      workspaceStore.setCurrentApp(fallback)
    }
  }
  finally {
    if (seq === loadSeq) {
      loading.value = false
      updateVisualLoading(false)
    }
  }
}

watch(
  () => normalizeAppId(),
  (id) => {
    if (id) {
      loadApplicationById(id)
    }
  },
  { immediate: true },
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

async function confirmLeaveIfDirty(): Promise<boolean> {
  if (!isDirty.value) {
    return true
  }
  try {
    await ElMessageBox.confirm('当前有未保存的更改，确定要离开吗？', '提示', {
      confirmButtonText: '离开',
      cancelButtonText: '取消',
      type: 'warning',
    })
    return true
  }
  catch {
    return false
  }
}

onBeforeRouteLeave(async (_to, _from, next) => {
  const ok = await confirmLeaveIfDirty()
  next(ok)
})

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  // 从 sessionStorage 恢复主题 CSS 变量（预览入口写入）
  try {
    const themeVars = sessionStorage.getItem('canvas-theme-vars')
    if (themeVars) {
      const vars = JSON.parse(themeVars) as Record<string, string>
      Object.entries(vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value)
      })
    }
  }
  catch {
    // ignore
  }

  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
})

onUnmounted(() => {
  workspaceStore.setCurrentApp(null)
  controlStore.floatingSettingVisible = false
})
</script>

<template>
  <div
    id="application-edit-wrapper"
    v-loading="loading"
    class="relative flex h-full w-full overflow-hidden"
    element-loading-text="加载应用配置…"
  >
    <SimulatorEditorPreview active />
  </div>
</template>
