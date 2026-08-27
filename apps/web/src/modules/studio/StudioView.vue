<script setup lang="ts">
import type { ProjectConfig, Widget } from '@well-insight/shared'
import { ArrowUpDown, Cloud, Moon, Sun, Trash2 } from '@lucide/vue'
import {
  message,
  toast,
  useTheme,
  WiButton,
  WiFlex,
  WiInput,
  WiLayout,
  WiLayoutContent,
  WiLayoutHeader,
  WiLayoutSider,
  WiPopover,
  WiSelect,
  WiTabs,
  WiTag
} from '@well-insight/ui'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { deleteProject, getProjectDatasources } from '../../api/projects'
import { useConfigStore } from '../../styles/stores/configStore'
import { useDataStore } from '../../styles/stores/dataStore'
import { useProjectStore } from '../../styles/stores/projectStore'

import { useWidgetStore } from '../../styles/stores/widgetStore'
import CanvasContainer from './components/CanvasContainer.vue'
import CanvasToolbar from './components/CanvasToolbar.vue'
import DataPanel from './components/DataPanel.vue'
import LayersPanel from './components/LayersPanel.vue'
import PropsPanel from './components/PropsPanel.vue'
import { exportElementsToPDF } from './utils/export'

const ConfigModal = defineAsyncComponent(() => import('./components/config/ConfigModal.vue'))
const DatasourceManager = defineAsyncComponent(() => import('./components/DatasourceManager.vue'))

const store = useWidgetStore()
const configStore = useConfigStore()
const projectStore = useProjectStore()
const dataStore = useDataStore()


const router = useRouter()
const { isDark, toggleTheme } = useTheme()
const modalRef = ref<InstanceType<typeof ConfigModal> | null>(null)
const rightTab = ref<'props' | 'layers'>('props')
const importInput = ref<HTMLInputElement | null>(null)
const projectMenuOpen = ref(false)
const newProjectName = ref('')
const editingName = ref(false)
const nameInput = ref<InstanceType<typeof WiInput> | null>(null)
const datasourceManagerVisible = ref(false)
const canvasLoading = ref(false)

const datasourceOptions = computed(() => projectStore.currentDatasources.map(ds => ({ label: ds.name, value: ds.id })))
const rightTabs = computed(() => [
  { label: '属性', value: 'props' },
  { label: `图层 ${store.widgets.length}`, value: 'layers' },
])

watch(editingName, async (val) => {
  if (val) {
    await nextTick()
    nameInput.value?.$el?.querySelector('input')?.focus()
  }
})

onMounted(() => {
  projectStore.refreshList()

  const projectId = new URLSearchParams(window.location.search).get('project')
  if (projectId) {
    loadProject(projectId)
  }
})

function onZoom(delta: number) {
  const next = Math.min(1.6, Math.max(0.4, Math.round((projectStore.canvasZoom + delta) * 100) / 100))
  projectStore.canvasZoom = next
  projectStore.markDirty()
}

function onConfigure(id: string) {
  const widget = store.widgets.find(w => w.id === id)
  if (!widget) return
  modalRef.value?.open(widget)
}

// ---- 项目操作 ----
async function createProject() {
  const name = newProjectName.value.trim() || '未命名项目'
  await projectStore.create(name, {
    version: 1,
    widgets: [],
    canvas: { zoom: 1 },
  })
  newProjectName.value = ''
  projectMenuOpen.value = false
  message.success(`已创建项目「${projectStore.projectName}」`)
  await projectStore.refreshList()
}

async function loadProject(id: string) {
  canvasLoading.value = true
  try {
    await projectStore.load(id)
    await dataStore.loadDatasource(projectStore.currentDatasourceId)
    projectMenuOpen.value = false
    message.success(`已加载项目「${projectStore.projectName}」`)
  } finally {
    canvasLoading.value = false
  }
}

async function refreshCanvas() {
  canvasLoading.value = true
  try {
    dataStore.clearCache()
    if (projectStore.currentDatasourceId) {
      await dataStore.loadDatasource(projectStore.currentDatasourceId)
    }
    message.success('画布数据已刷新')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '刷新画布失败')
  } finally {
    canvasLoading.value = false
  }
}

async function manualSave() {
  await projectStore.save()
  if (!projectStore.autoSaveError) {
    message.success('已保存')
  }
}

function startRename() {
  editingName.value = true
}

function finishRename() {
  editingName.value = false
  projectStore.updateProjectName(projectStore.projectName)
}

function onRenameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') finishRename()
  if (e.key === 'Escape') {
    editingName.value = false
  }
}

function toggleMenu() {
  projectMenuOpen.value = !projectMenuOpen.value
  if (projectMenuOpen.value) projectStore.refreshList()
}

async function onSwitchDatasource(id: string) {
  projectStore.setDatasource(id)
  await dataStore.loadDatasource(id)
  message.success('已切换数据源')
}

function returnToProjectList() {
  router.push('/')
}

async function onDeleteProject(id: string, name: string) {
  if (!window.confirm(`确定删除项目「${name}」？此操作不可恢复。`)) return
  try {
    await deleteProject(id)
    message.success('已删除项目')
    if (projectStore.currentId === id) {
      projectStore.currentId = null
      projectStore.projectName = '未命名项目'
      projectStore.currentDatasources = []
      projectStore.currentDatasourceId = null
      dataStore.loadDatasource(null)
      store.widgets = []
    }
    await projectStore.refreshList()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败')
  }
}

async function refreshDatasources() {
  if (!projectStore.currentId) return
  const datasources = await getProjectDatasources(projectStore.currentId)
  projectStore.currentDatasources = datasources
  if (!datasources.some(d => d.id === projectStore.currentDatasourceId)) {
    projectStore.currentDatasourceId = datasources[0]?.id ?? null
  }
  await dataStore.loadDatasource(projectStore.currentDatasourceId)
}

async function onSelectDatasource(id: string) {
  projectStore.setDatasource(id)
  await dataStore.loadDatasource(id)
}

// ---- 导入 / 导出 ----
function exportProject() {
  const payload: ProjectConfig = {
    version: 1,
    widgets: store.widgets,
    canvas: { zoom: projectStore.canvasZoom },
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `well-insight-project-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  message.success('已导出项目 JSON')
}

const canvasRef = ref<InstanceType<typeof CanvasContainer> | null>(null)

async function exportProjectPDF() {
  try {
    // 先切换所有组件为可见，确保导出完整
    store.widgets.forEach(w => { w.visible = true })
    await nextTick()

    const widgetEls = canvasRef.value?.$el?.querySelectorAll('.canvas-widget') as NodeListOf<HTMLElement> | undefined
    const elements = widgetEls ? Array.from(widgetEls) : []
    if (elements.length === 0) {
      message.warn('当前画布没有可导出的组件')
      return
    }
    await exportElementsToPDF(elements, projectStore.projectName || 'well-insight')
    message.success('已导出 PDF')
  } catch (err) {
    toast.error({
      summary: 'PDF 导出失败',
      detail: err instanceof Error ? err.message : undefined,
    })
  }
}

function openPresent() {
  if (!projectStore.currentId) return
  const url = router.resolve({ path: '/present', query: { project: projectStore.currentId } }).href
  window.open(url, '_blank')
}

function onImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result)) as Partial<ProjectConfig>
      if (!Array.isArray(data.widgets)) throw new Error('invalid')
      store.pushHistory()
      store.widgets = data.widgets as Widget[]
      store.selectWidget(null)
      message.success(`已导入 ${data.widgets.length} 个组件`)
    } catch {
      toast.error({ summary: '导入失败', detail: '文件格式不正确' })
    }
  }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}

// ---- 快捷键 ----
function onKeydown(e: KeyboardEvent) {
  const target = document.activeElement
  const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    if (inInput) return
    e.preventDefault()
    store.undo()
    return
  }
  if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
    if (inInput) return
    e.preventDefault()
    store.redo()
    return
  }
  if (e.key === 'Delete' && store.selectedId && !inInput) {
    if (window.confirm('删除选中的组件？')) store.removeWidget(store.selectedId)
    return
  }
  if (e.key === 'Escape') {
    store.selectWidget(null)
  }
}

const collapsed = ref(false)
const collapsedRight = ref(false)

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <WiLayout class="h-full w-full overflow-hidden">
    <WiLayoutHeader>
      <WiFlex class="w-full h-full" justify="space-between" align="center">
        <WiSpace>
          <div class="flex items-center gap-2">
            <div class="grid size-[26px] place-items-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-[11px] font-extrabold text-white">
              WI
            </div>
            <span class="text-[13px] font-bold text-[var(--wi-color-text)]">Well-Insight Studio</span>
          </div>

          <div class="flex min-w-0 items-center overflow-hidden">
            <WiPopover v-model="projectMenuOpen" placement="bottom-start">
              <WiButton text size="small" @click="projectMenuOpen = !projectMenuOpen">
                <ArrowUpDown :size="10" />
              </WiButton>
              <template #content>
                <div>
                  <div class="border-b border-[var(--wi-color-border)] px-2.5 pb-2">
                    <div class="py-1 text-[9px] uppercase tracking-wide text-[var(--wi-color-text-muted)]">
                      新建项目
                    </div>
                    <div class="flex gap-1">
                      <WiInput v-model="newProjectName" class="min-w-0 flex-1" placeholder="项目名称" size="small" @keydown.enter="createProject" />
                      <WiButton icon="plus" size="small" @click="createProject" />
                    </div>
                  </div>
                  <div class="px-2.5">
                    <div class="py-1 text-[9px] uppercase tracking-wide text-[var(--wi-color-text-muted)]">
                      打开项目
                    </div>
                    <div v-if="projectStore.projects.length === 0" class="py-2 text-center text-xs text-[var(--wi-color-text-muted)]">
                      暂无项目
                    </div>
                    <button
                      v-for="p in projectStore.projects"
                      :key="p.id"
                      class="flex w-full items-center justify-between gap-1.5 rounded px-1.5 py-1 text-left text-xs text-[var(--wi-color-text-muted)] hover:bg-[var(--wi-color-surface-hover)] hover:text-[var(--wi-color-text)]"
                      :class="{ active: projectStore.currentId === p.id }"
                      @click="loadProject(p.id)"
                    >
                      <span class="min-w-0 flex-1 truncate">{{ p.name }}</span>
                      <span class="flex shrink-0 items-center gap-1.5">
                        <span class="text-[8px] text-[var(--wi-color-text-muted)]">{{ new Date(p.updatedAt).toLocaleDateString() }}</span>
                        <WiButton
                          severity="danger"
                          text
                          size="small"
                          aria-label="删除项目"
                          @click.stop="onDeleteProject(p.id, p.name)"
                        >
                          <Trash2 :size="10" />
                        </WiButton>
                      </span>
                    </button>
                  </div>
                </div>
              </template>
            </WiPopover>

            <div class="min-w-0 max-w-[220px] overflow-hidden">
              <WiInput
                v-if="editingName"
                ref="nameInput"
                v-model="projectStore.projectName"
                size="small"
                @blur="finishRename"
                @keydown="onRenameKeydown"
              />
              <WiButton
                v-else
                severity="secondary"
                text
                size="small"
                class="max-w-[180px] truncate"
                @click="startRename"
              >
                <span v-if="projectStore.currentId">{{ projectStore.projectName }}</span>
                <span v-else class="unsaved">未保存项目</span>
              </WiButton>
            </div>

            <WiSelect
              v-if="projectStore.currentDatasources.length > 0"
              class="min-w-0"
              :model-value="projectStore.currentDatasourceId ?? undefined"
              :options="datasourceOptions"
              placeholder="选择数据源"
              size="small"
              @update:model-value="id => id && onSwitchDatasource(id as string)"
            />
          </div>
        </WiSpace>

        <WiSpace>
          <div class="ml-auto flex shrink-0 items-center gap-1 text-[10px] text-[var(--wi-color-text-muted)]">
            <Cloud :size="11" />
            <WiTag
              v-if="projectStore.isLoading"
              value="保存中"
              severity="info"
              class="save-tag"
            />
            <WiTag
              v-else-if="projectStore.autoSaveError"
              value="保存失败"
              severity="danger"
              class="save-tag"
              :title="projectStore.autoSaveError"
            />
            <WiTag
              v-else-if="projectStore.currentId && projectStore.isDirty"
              value="待保存"
              severity="warn"
              class="save-tag"
            />
            <WiTag
              v-else-if="projectStore.currentId"
              value="已保存"
              severity="success"
              class="save-tag"
            />
            <WiTag
              v-else
              value="未保存"
              severity="secondary"
              class="save-tag"
            />
          </div>
          <WiButton
            severity="secondary"
            size="small"
            :disabled="!projectStore.currentId"
            @click="datasourceManagerVisible = true"
          >
            数据源
          </WiButton>
          <WiButton
            severity="secondary"
            size="small"
            :disabled="!projectStore.currentId"
            :loading="projectStore.isLoading"
            @click="manualSave"
          >
            保存
          </WiButton>
          <WiButton
            severity="secondary"
            size="small"
            @click="importInput?.click()"
          >
            导入
          </WiButton>
          <WiButton
            severity="secondary"
            size="small"
            @click="exportProject"
          >
            JSON
          </WiButton>
          <WiButton
            severity="secondary"
            size="small"
            @click="exportProjectPDF"
          >
            PDF
          </WiButton>
          <WiButton
            severity="secondary"
            size="small"
            :disabled="!projectStore.currentId"
            @click="openPresent"
          >
            大屏
          </WiButton>
          <WiButton
            severity="secondary"
            text
            size="small"
            @click="returnToProjectList"
          >
            返回
          </WiButton>
          <WiButton
            severity="secondary"
            text
            size="small"
            aria-label="切换主题"
            @click="toggleTheme"
          >
            <Sun v-if="isDark" :size="12" />
            <Moon v-else :size="12" />
          </WiButton>
          <input ref="importInput" type="file" accept="application/json,.json" hidden @change="onImportFile">
        </WiSpace>
      </WiFlex>
    </WiLayoutHeader>
    <WiLayout has-sider class="min-h-0">
      <WiLayoutSider
        v-model:collapsed="collapsed"
        bordered
        show-trigger="arrow-circle"
        :width="250"
        :collapsed-width="10"
        :content-style="{ overflow: 'hidden' }"
      >
        <DataPanel />
      </WiLayoutSider>

      <WiLayout
        has-sider
        sider-placement="right"
        class="min-h-0 min-w-0"
      >
        <WiLayoutSider
          v-model:collapsed="collapsedRight"
          bordered
          :width="250"
          :collapsed-width="10"
          show-trigger="arrow-circle"
          :content-style="{ overflow: 'hidden' }"
        >
          <WiTabs v-model="rightTab" :tabs="rightTabs" type="line" class="right-tabs h-full min-h-0 flex-1">
            <template #default>
              <div class="flex h-full min-h-0 flex-col overflow-hidden">
                <PropsPanel v-show="rightTab === 'props'" class="min-h-0 flex-1" />
                <LayersPanel v-show="rightTab === 'layers'" class="min-h-0 flex-1" />
              </div>
            </template>
          </WiTabs>
        </WiLayoutSider>

        <WiLayoutContent
          embedded
          class="min-h-0 min-w-0"
          :content-style="{ padding: 0, overflow: 'hidden' }"
        >
          <CanvasToolbar :zoom="projectStore.canvasZoom" :loading="canvasLoading" @zoom="onZoom" @refresh="refreshCanvas" />
          <CanvasContainer ref="canvasRef" :zoom="projectStore.canvasZoom" :loading="canvasLoading" @update-zoom="v => { projectStore.canvasZoom = v; projectStore.markDirty() }" @configure="onConfigure" />
        </WiLayoutContent>
      </WiLayout>
    </WiLayout>

    <ConfigModal ref="modalRef" />

    <DatasourceManager
      v-model="datasourceManagerVisible"
      :project-id="projectStore.currentId"
      :datasources="projectStore.currentDatasources"
      :current-id="projectStore.currentDatasourceId"
      @close="datasourceManagerVisible = false"
      @refresh="refreshDatasources"
      @select="onSelectDatasource"
    />
  </WiLayout>
</template>

<style scoped>
.right-tabs :deep(.wi-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.right-tabs :deep(.wi-tabs__panel) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
