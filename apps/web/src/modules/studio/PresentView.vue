<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { message, WiButton, WiProgressSpinner, WiSkeleton } from '@well-insight/ui'
import { RefreshCw, Fullscreen, Minimize } from '@lucide/vue'
import type { ProjectConfig, Widget } from '@well-insight/shared'
import { getProject, getProjectDatasources } from '../../api/projects'
import { useDataStore } from '../../stores/dataStore'
import { useProjectStore } from '../../stores/projectStore'
import KpiWidget from './components/widgets/KpiWidget.vue'
import ChartWidget from './components/widgets/ChartWidget.vue'
import TableWidget from './components/widgets/TableWidget.vue'

const route = useRoute()
const projectStore = useProjectStore()
const dataStore = useDataStore()

const loading = ref(true)
const error = ref<string | null>(null)
const widgets = ref<Widget[]>([])
const isFullscreen = ref(false)

const projectId = ref(route.query.project as string | undefined)

onMounted(loadProject)

watch(() => route.query.project, (id) => {
  if (id && id !== projectId.value) {
    projectId.value = id as string
    loadProject()
  }
})

async function loadProject() {
  if (!projectId.value) {
    error.value = '缺少 project 参数'
    loading.value = false
    return
  }
  loading.value = true
  error.value = null
  try {
    const project = await getProject(projectId.value)
    projectStore.projectName = project.name
    projectStore.currentId = project.id
    const config = project.config as ProjectConfig
    widgets.value = config.widgets.filter(w => w.visible)

    const datasources = await getProjectDatasources(project.id)
    projectStore.currentDatasources = datasources
    projectStore.currentDatasourceId = datasources[0]?.id ?? null
    if (projectStore.currentDatasourceId) {
      await dataStore.loadDatasource(projectStore.currentDatasourceId)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function refreshAll() {
  dataStore.clearCache()
  widgets.value = [...widgets.value]
  message.success('已刷新数据')
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => { isFullscreen.value = true }).catch(() => {})
  } else {
    document.exitFullscreen().then(() => { isFullscreen.value = false }).catch(() => {})
  }
}
</script>

<template>
  <div class="present-view">
    <header class="present-header">
      <div class="brand">
        <div class="brand-logo">WI</div>
        <div class="brand-title">{{ projectStore.projectName || '数据大屏' }}</div>
      </div>
      <div class="header-actions">
        <WiButton
          severity="secondary"
          text
          size="small"
          aria-label="刷新数据"
          @click="refreshAll"
        >
          <RefreshCw :size="14" />
        </WiButton>
        <WiButton
          severity="secondary"
          text
          size="small"
          aria-label="切换全屏"
          @click="toggleFullscreen"
        >
          <Minimize v-if="isFullscreen" :size="14" />
          <Fullscreen v-else :size="14" />
        </WiButton>
      </div>
    </header>

    <main class="present-body">
      <div v-if="loading" class="present-loading">
        <WiProgressSpinner class="spin" stroke-width="3" />
        <p>正在加载大屏…</p>
      </div>
      <div v-else-if="error" class="present-error">
        <p>加载失败</p>
        <p class="sub">{{ error }}</p>
        <WiButton severity="danger" size="small" @click="loadProject">重试</WiButton>
      </div>
      <div v-else-if="widgets.length === 0" class="present-empty">
        <p>当前项目没有可见组件</p>
      </div>
      <div v-else class="present-grid">
        <div
          v-for="widget in widgets"
          :key="widget.id"
          class="present-card"
          :style="{
            gridColumn: `span ${Math.min(4, Math.max(1, Math.round((widget.width / 220) * 2)))}`,
            gridRow: `span ${Math.min(4, Math.max(1, Math.round((widget.height / 140) * 2)))}`,
          }"
        >
          <div class="card-header" :style="{ borderColor: widget.color + '55' }">
            <span class="card-title">{{ widget.title }}</span>
          </div>
          <div class="card-body">
            <KpiWidget v-if="widget.type === 'kpi'" :widget="widget" />
            <ChartWidget v-else-if="widget.type === 'bar' || widget.type === 'line' || widget.type === 'pie'" :widget="widget" />
            <TableWidget v-else-if="widget.type === 'table'" :widget="widget" />
            <div v-else class="widget-unknown">未知类型</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.present-view {
  min-height: 100vh;
  background: var(--wi-ground-background, #f8fafc);
  color: var(--wi-text-color, #1e293b);
  display: flex;
  flex-direction: column;
}
.present-header {
  height: 56px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--wi-border-color, #e2e8f0);
  flex-shrink: 0;
  background: var(--wi-surface-elevated, #ffffff);
  backdrop-filter: blur(8px);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #22d3ee);
}
.brand-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--wi-text-color, #1e293b);
}
.header-actions {
  display: flex;
  gap: 8px;
}
.present-body {
  flex: 1;
  padding: 24px;
  overflow: auto;
}
.present-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  grid-auto-rows: 120px;
  gap: 16px;
  min-height: 100%;
}
.present-card {
  background: var(--wi-surface-elevated, #ffffff);
  border: 1px solid var(--wi-border-color, #e2e8f0);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.present-card:hover {
  border-color: var(--wi-primary, #3b82f6);
  box-shadow: var(--wi-shadow-sm, 0 2px 8px rgba(0, 0, 0, 0.06));
}
.card-header {
  height: 34px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--wi-border-color, #e2e8f0);
  border-left: 3px solid;
  flex-shrink: 0;
  background: var(--wi-surface, #f8fafc);
}
.card-title {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--wi-text-color, #1e293b);
}
.card-body {
  flex: 1;
  padding: 10px;
  min-height: 0;
}
.present-loading,
.present-error,
.present-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--wi-text-secondary, #64748b);
  font-size: 14px;
}
.present-error .sub {
  font-size: 12px;
  color: var(--wi-text-secondary, #64748b);
}
.widget-unknown {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--wi-text-secondary, #64748b);
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
