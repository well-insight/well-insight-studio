import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { ProjectConfig, Widget } from '@well-insight/shared'
import type { ProjectSummary } from '../api/projects'
import { useWidgetStore } from './widgetStore'
import { createProject, getProject, updateProject, listProjects, getProjectDatasources, type DatasourceSummary } from '../api/projects'

const AUTO_SAVE_MS = 1000

export const useProjectStore = defineStore('project', () => {
  const widgetStore = useWidgetStore()

  const currentId = ref<string | null>(null)
  const projectName = ref<string>('未命名项目')
  const isLoading = ref(false)
  const lastSavedAt = ref<Date | null>(null)
  const autoSaveError = ref<string | null>(null)

  const isDirty = ref(false)
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  const canvasZoom = ref(1)
  const projects = ref<ProjectSummary[]>([])
  const currentDatasources = ref<DatasourceSummary[]>([])
  const currentDatasourceId = ref<string | null>(null)

  const config = computed<ProjectConfig>(() => ({
    version: 1,
    widgets: widgetStore.widgets,
    canvas: { zoom: canvasZoom.value },
  }))

  function setConfig(value: ProjectConfig) {
    widgetStore.widgets = value.widgets
    canvasZoom.value = value.canvas.zoom
  }

  function markDirty() {
    isDirty.value = true
    autoSaveError.value = null
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => save(), AUTO_SAVE_MS)
  }

  async function save() {
    if (!currentId.value || !isDirty.value) return
    isLoading.value = true
    try {
      await updateProject(currentId.value, { config: config.value })
      isDirty.value = false
      lastSavedAt.value = new Date()
    } catch (err) {
      autoSaveError.value = err instanceof Error ? err.message : String(err)
    } finally {
      isLoading.value = false
    }
  }

  async function create(name: string, initial?: ProjectConfig) {
    const project = await createProject(name, initial)
    currentId.value = project.id
    projectName.value = project.name
    if (project.config) setConfig(project.config)
    isDirty.value = false
    lastSavedAt.value = new Date()
    return project.id
  }

  async function load(id: string) {
    isLoading.value = true
    try {
      const project = await getProject(id)
      currentId.value = project.id
      projectName.value = project.name
      if (project.config) setConfig(project.config)

      const datasources = await getProjectDatasources(id)
      currentDatasources.value = datasources
      currentDatasourceId.value = datasources[0]?.id ?? null

      isDirty.value = false
      lastSavedAt.value = new Date()
      widgetStore.undoStack = []
      widgetStore.redoStack = []
    } finally {
      isLoading.value = false
    }
  }

  function setDatasource(id: string | null) {
    currentDatasourceId.value = id
  }

  function updateProjectName(name: string) {
    projectName.value = name
    markDirty()
  }

  async function refreshList() {
    projects.value = await listProjects()
  }

  // 自动保存监听：widgets 变化即触发
  watch(
    () => widgetStore.widgets,
    () => markDirty(),
    { deep: true },
  )

  return {
    currentId,
    projectName,
    isLoading,
    lastSavedAt,
    autoSaveError,
    isDirty,
    canvasZoom,
    projects,
    currentDatasources,
    currentDatasourceId,
    save,
    create,
    load,
    setDatasource,
    updateProjectName,
    refreshList,
    markDirty,
  }
})
