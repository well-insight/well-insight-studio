<script lang="ts" setup>
import type { ApiApplicationListItem } from '@/api/application'
import { CloseBold } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { onActivated, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { fetchApplication } from '@/api/application'
import { ELayout, ELayoutContent, ELayoutSider } from '@/components/e-layout'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { CustomComponents } from '@/visual-editor/ui/component-list'
import LeftAside from '@/visual-editor/ui/left-aside/LeftAside.vue'
import RightAttributePanel from '@/visual-editor/ui/right-attribute-panel/RightAttributePanel.vue'
import SimulatorEditor from '@/visual-editor/ui/simulator-editor/SimulatorEditor.vue'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { appList } = storeToRefs(workspaceStore)

const controlStore = useControlStore()
const { layoutCollapse, settingCollapse, floatingSettingVisible } = storeToRefs(controlStore)

const { overrideProject } = useVisualData()

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
  controlStore.floatingSettingVisible = false
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
      <ELayoutSider v-model:collapsed="layoutCollapse" show-trigger="button" :width="280" :collapsed-width="0">
        <LeftAside />
      </ELayoutSider>

      <ELayoutContent>
        <SimulatorEditor />
      </ELayoutContent>

      <ELayoutSider
        v-model:collapsed="settingCollapse"
        show-trigger="button"
        :width="360"
        :collapsed-width="0"
        position="right"
      >
        <RightAttributePanel />
      </ELayoutSider>

      <CustomComponents />
    </ELayout>

    <transition name="floating-setting-panel">
      <div v-if="floatingSettingVisible" ref="floatingPanelRef" class="floating-setting-panel">
        <div class="floating-setting-panel__header">
          <span>更多选项</span>
          <el-button text circle @click="controlStore.floatingSettingVisible = false">
            <el-icon><CloseBold /></el-icon>
          </el-button>
        </div>
        <div class="floating-setting-panel__body">
          <RightAttributePanel />
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.floating-setting-panel {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 380px;
  height: calc(100% - 32px);
  z-index: 1200;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgb(0 0 0 / 12%);
  overflow: hidden;
}

.floating-setting-panel__header {
  height: 46px;
  flex-shrink: 0;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-fill-color-blank);
  font-size: 13px;
  font-weight: 600;
}

.floating-setting-panel__body {
  flex: 1;
  min-height: 0;
}

.floating-setting-panel-enter-active,
.floating-setting-panel-leave-active {
  transition: all 0.2s ease;
}

.floating-setting-panel-enter-from,
.floating-setting-panel-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
