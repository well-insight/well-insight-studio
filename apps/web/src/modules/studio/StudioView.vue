<script setup lang="ts">
import type { ProjectConfig, Widget } from '@well-insight/shared'
import { Cloud, FolderOpen, Moon, Sun, Trash2 } from '@lucide/vue'
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
  WiSelect,
  WiTabs,
  WiTag,
} from '@well-insight/ui'
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { deleteProject, getProjectDatasources } from '../../api/projects'
import { useConfigStore } from '../../stores/configStore'
import { useDataStore } from '../../stores/dataStore'
import { useProjectStore } from '../../stores/projectStore'

import { useWidgetStore } from '../../stores/widgetStore'
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

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <WiLayout class="studio-view" :native-scrollbar="false">
    <WiLayoutHeader class="studio-header">
      <WiFlex class="w-full h-full" justify="space-between" align="center">
        <WiSpace>
          <div class="logo-area">
            <div class="logo-icon">
              WI
            </div>
            <span class="logo-text">Well-Insight Studio</span>
          </div>

          <div class="project-bar">
            <div class="project-menu-wrapper">
              <WiButton
                severity="secondary"
                text
                size="small"
                @click="toggleMenu"
              >
                <FolderOpen :size="12" />
                <span>{{ projectStore.currentId ? projectStore.projectName : '选择项目' }}</span>
              </WiButton>
              <div v-if="projectMenuOpen" class="project-dropdown">
                <div class="dropdown-section">
                  <div class="dropdown-title">
                    新建项目
                  </div>
                  <div class="new-project-row">
                    <WiInput v-model="newProjectName" placeholder="项目名称" size="small" @keydown.enter="createProject" />
                    <WiButton icon="plus" size="small" @click="createProject" />
                  </div>
                </div>
                <div class="dropdown-section">
                  <div class="dropdown-title">
                    打开项目
                  </div>
                  <div v-if="projectStore.projects.length === 0" class="dropdown-empty">
                    暂无项目
                  </div>
                  <button
                    v-for="p in projectStore.projects"
                    :key="p.id"
                    class="project-item"
                    :class="{ active: projectStore.currentId === p.id }"
                    @click="loadProject(p.id)"
                  >
                    <span class="project-name">{{ p.name }}</span>
                    <span class="project-actions">
                      <span class="project-date">{{ new Date(p.updatedAt).toLocaleDateString() }}</span>
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
            </div>

            <div class="project-name-editor">
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
                class="rename-btn"
                @click="startRename"
              >
                <span v-if="projectStore.currentId">{{ projectStore.projectName }}</span>
                <span v-else class="unsaved">未保存项目</span>
              </WiButton>
            </div>

            <WiSelect
              v-if="projectStore.currentDatasources.length > 0"
              class="datasource-selector"
              :model-value="projectStore.currentDatasourceId ?? undefined"
              :options="datasourceOptions"
              placeholder="选择数据源"
              size="small"
              @update:model-value="id => id && onSwitchDatasource(id as string)"
            />
          </div>
        </WiSpace>

        <WiSpace>
          <div class="save-status">
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

    <WiLayoutContent
      class="studio-body"
      :native-scrollbar="false"
      :content-style="{ overflow: 'hidden' }"
    >
      <WiLayout
        class="studio-main-layout"
        :has-sider="true"
        sider-placement="right"
      >
        <!-- `sider-placement="right"` reverses the flex row, so declare the
             right panel first and the data panel last. -->
        <WiLayoutSider
          class="right-panel"
          width="clamp(220px, 24vw, 300px)"
          :native-scrollbar="false"
          :content-style="{ overflow: 'hidden' }"
        >
          <WiTabs v-model="rightTab" :tabs="rightTabs" type="line" class="right-tabs">
            <template #default>
              <div class="right-body">
                <PropsPanel v-show="rightTab === 'props'" />
                <LayersPanel v-show="rightTab === 'layers'" />
              </div>
            </template>
          </WiTabs>
        </WiLayoutSider>

        <WiLayoutContent
          class="canvas-wrapper"
          :content-style="{ overflow: 'hidden' }"
        >
          <CanvasToolbar :zoom="projectStore.canvasZoom" :loading="canvasLoading" @zoom="onZoom" @refresh="refreshCanvas" />
          <CanvasContainer ref="canvasRef" :zoom="projectStore.canvasZoom" :loading="canvasLoading" @update-zoom="v => { projectStore.canvasZoom = v; projectStore.markDirty() }" @configure="onConfigure" />
        </WiLayoutContent>

        <WiLayoutSider
          class="data-sider"
          :width="200"
          :native-scrollbar="false"
          :content-style="{ overflow: 'hidden' }"
        >
          <DataPanel />
        </WiLayoutSider>
      </WiLayout>
    </WiLayoutContent>

    <ConfigModal ref="modalRef" />

    <DatasourceManager
      v-model:visible="datasourceManagerVisible"
      :project-id="projectStore.currentId"
      :datasources="projectStore.currentDatasources"
      :current-id="projectStore.currentDatasourceId"
      @close="datasourceManagerVisible = false"
      @refresh="refreshDatasources"
      @select="onSelectDatasource"
    />

    <div v-if="projectStore.autoSaveError" class="error-banner" role="alert">
      <span class="error-dot" /> 保存失败：{{ projectStore.autoSaveError }}
      <WiButton severity="danger" text size="small" @click="manualSave">
        重试
      </WiButton>
    </div>

    <div v-if="dataStore.schemaError" class="error-banner" role="alert">
      <span class="error-dot" /> 数据源加载失败：{{ dataStore.schemaError }}
      <WiButton severity="danger" text size="small" @click="onSwitchDatasource(projectStore.currentDatasourceId ?? '')">
        重试
      </WiButton>
      <WiButton severity="secondary" text size="small" @click="dataStore.schemaError = null">
        忽略
      </WiButton>
    </div>
  </WiLayout>
</template>

<style scoped>
.studio-view {
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  user-select: none;
}
.studio-view :deep(.wi-layout__scroll),
.studio-body :deep(.wi-layout__scroll),
.studio-main-layout :deep(.wi-layout__scroll) {
  min-height: 0;
}
.studio-header {
  min-height: 52px;
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid var(--wi-color-border);
  background: var(--wi-color-surface-elevated);
  flex-shrink: 0;
  gap: 12px;
  z-index: 10;
}
.studio-header :deep(.wi-toolbar__start),
.studio-header :deep(.wi-toolbar__center),
.studio-header :deep(.wi-toolbar__end) {
  min-width: 0;
  display: flex;
  align-items: center;
}
.studio-header :deep(.wi-toolbar__center) {
  flex: 1;
}
.studio-header :deep(.wi-toolbar__end) {
  justify-content: flex-end;
}
.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
}
.logo-icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-text {
  font-size: 13px;
  font-weight: 700;
  color: var(--wi-color-text);
}
.project-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}
.project-menu-wrapper {
  position: relative;
  flex-shrink: 0;
}
.project-menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid var(--wi-border-color, #1e2638);
  color: var(--wi-text-secondary, #8a9bb5);
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.project-menu-trigger:hover {
  color: var(--wi-text-color, #e8edf5);
  border-color: var(--wi-primary, #3b82f6);
}
.project-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 220px;
  background: var(--wi-surface, #0c111c);
  border: 1px solid var(--wi-border-color, #1e2638);
  border-radius: 8px;
  padding: 8px 0;
  z-index: 200;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
.dropdown-section {
  padding: 0 10px 8px;
  border-bottom: 1px solid var(--wi-border-color, #1a212e);
}
.dropdown-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.dropdown-title {
  font-size: 9px;
  color: var(--wi-text-secondary, #6a7b98);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 0;
}
.new-project-row {
  display: flex;
  gap: 4px;
}
.new-project-row input {
  flex: 1;
  background: var(--wi-surface-hover, #141c2a);
  border: 1px solid var(--wi-border-color, #1e2638);
  border-radius: 4px;
  color: var(--wi-text-color, #e8edf5);
  font-size: 11px;
  padding: 4px 6px;
  outline: none;
}
.new-project-row input:focus {
  border-color: var(--wi-primary, #3b82f6);
}
.btn-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--wi-primary, #3b82f6);
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}
.project-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 6px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--wi-text-secondary, #a8b4c8);
  font-size: 11px;
  cursor: pointer;
  text-align: left;
}
.project-item:hover,
.project-item.active {
  background: var(--wi-surface-hover, #141c2a);
  color: var(--wi-text-color, #e8edf5);
}
.project-item .project-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
.project-item .project-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.project-date {
  font-size: 8px;
  color: var(--wi-text-secondary, #4a5a78);
}
.project-delete {
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--wi-text-secondary, #4a5a78);
  cursor: pointer;
  border-radius: 3px;
  padding: 0;
}
.project-delete:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
.project-name-editor {
  min-width: 0;
  max-width: 220px;
  overflow: hidden;
}
.datasource-selector select {
  background: var(--wi-surface-hover, #141c2a);
  border: 1px solid var(--wi-border-color, #1e2638);
  border-radius: 4px;
  color: var(--wi-text-color, #e8edf5);
  font-size: 10px;
  padding: 4px 6px;
  outline: none;
  cursor: pointer;
}
.datasource-selector select:focus {
  border-color: var(--wi-primary, #3b82f6);
}
.rename-btn,
.name-input {
  background: transparent;
  border: 1px solid transparent;
  color: var(--wi-text-color, #e8edf5);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rename-btn:hover {
  border-color: var(--wi-border-color, #2a3448);
}
.rename-btn .unsaved {
  color: var(--wi-text-secondary, #6a7b98);
  font-weight: 400;
}
.name-input {
  border-color: var(--wi-primary, #3b82f6);
  cursor: text;
  outline: none;
  color: var(--wi-text-color, #e8edf5);
}
.save-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--wi-text-secondary, #6a7b98);
  margin-left: auto;
  flex-shrink: 0;
}
.save-status .error {
  color: #ef4444;
}
.dropdown-empty {
  font-size: 11px;
  color: var(--wi-text-secondary, #4a5a78);
  padding: 8px 6px;
  text-align: center;
}
.header-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.header-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 1px solid var(--wi-border-color, #1e2638);
  color: var(--wi-text-secondary, #8a9bb5);
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
}
.studio-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  background: var(--wi-surface, #0a0f18);
}
.loading-tip {
  font-size: 12px;
  color: var(--wi-text-secondary, #6a7b98);
}
.error-banner {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 6px;
  background: #1a0f0f;
  border: 1px solid #ef4444;
  color: #ef4444;
  font-size: 11px;
  z-index: 300;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}
.error-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
}
.error-retry,
.error-dismiss {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  cursor: pointer;
  margin-left: 4px;
}
.error-dismiss {
  color: var(--wi-text-secondary, #8a9bb5);
  border-color: var(--wi-border-color, #2a3448);
}
.error-retry:hover,
.error-dismiss:hover {
  opacity: 0.8;
}
.header-btn:hover {
  color: var(--wi-text-color, #e8edf5);
  background: var(--wi-surface-hover, #1e2638);
}
.header-btn.primary {
  background: var(--wi-primary, #3b82f6);
  border-color: var(--wi-primary, #3b82f6);
  color: white;
}
.header-btn.primary:hover {
  opacity: 0.9;
}
.studio-body {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}
.studio-main-layout {
  height: 100%;
  min-height: 0;
  min-width: 0;
}
.data-sider {
  flex-shrink: 0;
  min-height: 0;
}
.data-sider :deep(.wi-layout-sider__scroll),
.right-panel :deep(.wi-layout-sider__scroll) {
  height: 100%;
}
.canvas-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
.right-panel {
  flex-shrink: 0;
  min-height: 0;
  border-left: 1px solid var(--wi-color-border);
  background: var(--wi-color-surface);
}
.right-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.right-tabs :deep(.wi-tabs__bar) {
  flex-shrink: 0;
  padding: 0 8px;
  border-bottom: 1px solid var(--wi-color-border);
}
.right-tabs :deep(.wi-tabs__list) {
  width: 100%;
}
.right-tabs :deep(.wi-tabs__item) {
  flex: 1;
}
.right-tabs :deep(.wi-tabs__tab) {
  width: 100%;
  font-size: 11px;
}
.right-tabs :deep(.wi-tabs__panel) {
  flex: 1;
  min-height: 0;
  padding: 0;
}
.right-body {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.right-body > * {
  flex: 1;
  min-height: 0;
}

@media (max-width: 1100px) {
  .logo-text {
    display: none;
  }
  .project-bar {
    gap: 4px;
  }
  .header-actions :deep(.wi-button) {
    padding-inline: 7px;
  }
  .header-actions :deep(.wi-button:not(:last-child)) {
    font-size: 0;
  }
  .header-actions :deep(.wi-button svg) {
    margin: 0;
  }
}

@media (max-width: 760px) {
  .studio-header {
    min-height: 48px;
    padding-inline: 8px;
  }
  .studio-header :deep(.wi-toolbar__center) {
    min-width: 0;
  }
  .project-name-editor,
  .save-status {
    display: none;
  }
  .data-panel {
    width: 168px;
  }
  .right-panel {
    width: 210px;
    max-width: 210px;
  }
  .header-actions :deep(.wi-button:nth-child(n + 4):nth-child(-n + 6)) {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .studio-view * {
    transition-duration: 0ms !important;
  }
}
</style>
