<script lang="ts" setup>
import type { PageType } from '@/api/pages'
import type { FormSchema } from '@/form-designer/types'
import { DataLine } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

import { computed, onActivated, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { fetchPage } from '@/api/pages'
import { ELayout, ELayoutContent } from '@/components/e-layout'
import { FormDesigner } from '@/form-designer'
import { getEmptyFormSchema, isValidFormSchema } from '@/form-designer/form-designer.utils'
import { useControlStore } from '@/stores/controlStore'
import { usePageStore } from '@/stores/pageStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import SimulatorEditor from '@/visual-editor/ui/canvas/simulator-grid-editor/SimulatorEditor.vue'
import { isPageDirty, markVisualClean, saveCounter, updateVisualDSL } from './visualEditorState'

const route = useRoute()
const router = useRouter()
const pageStore = usePageStore()

const controlStore = useControlStore()

const { overrideProject, updateVisualLoading, isDirty, jsonData, syncSavedBaseline } = useVisualData()

/** 表单设计器相关状态 */
const formDesignerRef = ref<InstanceType<typeof FormDesigner> | null>(null)
const formSchemaRef = ref<FormSchema | null>(null)
const formDirty = ref(false)

/** 页面级自动保存状态 */
const AUTO_SAVE_DELAY = 3000
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
let autoSaveInFlight = false
let autoSaveQueued = false
const autoSaveReady = ref(false)
const autoSaveBaseline = ref('')
let loadSeq = 0

const loading = ref(false)
const pageName = ref('')
const pageType = ref<PageType>('visualization')

/** 确定当前是编辑已有页面还是新建页面 */
const isNew = computed(() => {
  const rawId = route.params.id
  return route.path.includes('/new/') || rawId === 'new' || (Array.isArray(rawId) && rawId[0] === 'new')
})
const pageId = computed(() => {
  if (isNew.value)
    return null
  const raw = route.params.id
  return Array.isArray(raw) ? (raw[0] ? String(raw[0]) : null) : (raw ? String(raw) : null)
})

function getEditorRouteName(type: PageType) {
  if (type === 'form')
    return 'FormPageEditor'
  if (type === 'report')
    return 'ReportPageEditor'
  return 'VisualPageEditor'
}

/** 根据类型获取默认 schema */
function getDefaultSchema(type: PageType): Record<string, unknown> {
  switch (type) {
    case 'visualization':
      return {
        pages: {
          '/': {
            title: '首页',
            path: '/',
            config: {
              bgColor: '',
              bgImage: '',
              keepAlive: false,
              pageSize: { name: '', width: 1920, height: 1080 },
            },
            blocks: [],
          },
        },
        models: [],
        actions: { fetch: { name: '接口请求', apis: [] }, dialog: { name: '对话框', handlers: [] } },
      }
    case 'form':
      return getEmptyFormSchema() as unknown as Record<string, unknown>
    case 'report':
      return {
        pages: {
          '/': {
            title: '报表页',
            path: '/',
            config: {
              bgColor: '',
              bgImage: '',
              keepAlive: false,
              pageSize: { name: '', width: 1920, height: 1080 },
            },
            blocks: [],
          },
        },
        models: [],
        actions: { fetch: { name: '接口请求', apis: [] }, dialog: { name: '对话框', handlers: [] } },
      }
  }
}

/** 校验 DSL 是否包含有效的 pages 对象（可视化页面） */
function isValidVisualDSL(dsl: unknown): dsl is Record<string, unknown> {
  return !!dsl && typeof dsl === 'object' && 'pages' in (dsl as Record<string, unknown>)
}

/** 校验 DSL 是否为表单页面类型 */
function isFormTypeDSL(dsl: unknown): boolean {
  return isValidFormSchema(dsl)
}

async function loadPageById(id: string) {
  const seq = ++loadSeq
  loading.value = true

  // 可视化页面需要 loading 态
  if (pageType.value === 'visualization') {
    updateVisualLoading(true)
  }

  try {
    const detail = await fetchPage(id)
    if (seq !== loadSeq)
      return
    pageName.value = detail.name
    pageType.value = detail.type
    // 同步到 store，供 header 操作栏读取
    await pageStore.loadPage(id)

    if (detail.type === 'form') {
      // 表单页面：使用 FormSchema
      const dsl = isFormTypeDSL(detail.dsl)
        ? (detail.dsl as unknown as FormSchema)
        : getEmptyFormSchema()
      formSchemaRef.value = dsl
    }
    else {
      // 可视化页面
      const dsl = isValidVisualDSL(detail.dsl) ? detail.dsl : getDefaultSchema(detail.type)
      overrideProject(dsl as any)
      updateVisualDSL(dsl as Record<string, unknown>)
      syncSavedBaseline()
      autoSaveBaseline.value = JSON.stringify(getCurrentDSL())
    }
    autoSaveReady.value = true
  }
  catch (error) {
    if (seq !== loadSeq)
      return
    ElMessage.error((error as Error).message || '加载页面失败')
  }
  finally {
    if (seq === loadSeq) {
      loading.value = false
      updateVisualLoading(false)
    }
  }
}

function initNewPage(type: PageType) {
  pageType.value = type
  pageName.value = ''
  clearAutoSaveState()

  if (type === 'form') {
    formSchemaRef.value = getEmptyFormSchema()
    formDirty.value = false
    updateVisualLoading(false)
    return
  }

  const defaultSchema = getDefaultSchema(type)
  overrideProject(defaultSchema as any)
  updateVisualDSL(defaultSchema)
  syncSavedBaseline()
  autoSaveBaseline.value = JSON.stringify(getCurrentDSL())
  updateVisualLoading(false)
}

watch(
  () => route.params,
  () => {
    clearAutoSaveState()
    if (isNew.value) {
      initNewPage(route.params.type as PageType)
    }
    else if (pageId.value) {
      loadPageById(pageId.value)
    }
  },
  { immediate: true },
)

/** keep-alive 支持 */
let skipNextActivateLoad = true
onActivated(() => {
  if (skipNextActivateLoad) {
    skipNextActivateLoad = false
    return
  }
  if (pageId.value) {
    loadPageById(pageId.value)
  }
})

/** 获取当前待保存的 DSL */
function getCurrentDSL(): Record<string, unknown> {
  if (pageType.value === 'form') {
    // 从表单设计器获取最新 Schema
    if (formDesignerRef.value) {
      return formDesignerRef.value.getSchema() as unknown as Record<string, unknown>
    }
    return (formSchemaRef.value ?? getEmptyFormSchema()) as unknown as Record<string, unknown>
  }
  return JSON.parse(JSON.stringify(jsonData.value)) as Record<string, unknown>
}

function cancelAutoSave() {
  if (autoSaveTimer !== null) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
}

function clearAutoSaveState() {
  cancelAutoSave()
  autoSaveReady.value = false
  autoSaveQueued = false
  autoSaveBaseline.value = ''
}

function hasAutoSaveChanges() {
  if (pageType.value === 'form')
    return formDirty.value
  return Boolean(autoSaveBaseline.value) && JSON.stringify(getCurrentDSL()) !== autoSaveBaseline.value
}

function currentPageIsPersisted() {
  return Boolean(pageId.value) && !isNew.value && (pageType.value === 'visualization' || pageType.value === 'form')
}

async function performAutoSave(): Promise<boolean> {
  if (!autoSaveReady.value || !currentPageIsPersisted())
    return false
  if (autoSaveInFlight) {
    autoSaveQueued = true
    return false
  }

  const dirty = hasAutoSaveChanges()
  if (!dirty)
    return true

  autoSaveInFlight = true
  try {
    const name = pageName.value.trim() || `未命名${pageType.value === 'visualization' ? '可视化' : '表单'}`
    const dsl = getCurrentDSL()
    const savedSnapshot = JSON.stringify(dsl)
    await pageStore.savePage({
      id: pageId.value || undefined,
      name,
      type: pageType.value,
      dsl,
      dataset_bindings: pageStore.currentPage?.dataset_bindings ?? undefined,
      status: 'draft',
    })

    if (JSON.stringify(getCurrentDSL()) !== savedSnapshot) {
      scheduleAutoSave()
      return false
    }

    autoSaveBaseline.value = savedSnapshot
    if (pageType.value === 'visualization') {
      syncSavedBaseline()
      markVisualClean()
    }
    else if (formDesignerRef.value) {
      formDesignerRef.value.syncSavedBaseline()
      formDirty.value = false
    }
    return true
  }
  catch {
    // 自动保存保持静默，脏状态会保留并在下一次修改时重试
    return false
  }
  finally {
    autoSaveInFlight = false
    if (autoSaveQueued) {
      autoSaveQueued = false
      scheduleAutoSave()
    }
  }
}

function scheduleAutoSave() {
  cancelAutoSave()
  if (!autoSaveReady.value || !currentPageIsPersisted())
    return
  const dirty = hasAutoSaveChanges()
  if (!dirty)
    return
  autoSaveTimer = setTimeout(() => {
    autoSaveTimer = null
    void performAutoSave()
  }, AUTO_SAVE_DELAY)
}

async function flushAutoSave() {
  cancelAutoSave()
  if (!autoSaveReady.value || !currentPageIsPersisted())
    return
  await performAutoSave()
}

/** 保存页面 */
async function _savePageDraft() {
  cancelAutoSave()
  if (pageType.value === 'visualization') {
    updateVisualLoading(true)
  }
  try {
    const name = pageName.value.trim() || `未命名${pageType.value === 'visualization' ? '可视化' : pageType.value === 'form' ? '表单' : '报表'}`
    const dsl = getCurrentDSL()
    const saved = await pageStore.savePage({
      id: pageId.value || undefined,
      name,
      type: pageType.value,
      dsl,
      dataset_bindings: pageStore.currentPage?.dataset_bindings ?? undefined,
      status: 'draft',
    })
    ElMessage.success('保存成功')
    // 如果是新建页面，保存后跳转到编辑模式
    if (isNew.value && saved.id) {
      router.replace({ name: getEditorRouteName(pageType.value), params: { id: saved.id } })
    }
    if (pageType.value === 'visualization') {
      syncSavedBaseline()
      autoSaveBaseline.value = JSON.stringify(getCurrentDSL())
      markVisualClean()
    }
    // 同步表单保存基线
    if (pageType.value === 'form' && formDesignerRef.value) {
      formDesignerRef.value.syncSavedBaseline()
      formDirty.value = false
    }
  }
  catch (e) {
    ElMessage.error((e as Error).message || '保存失败')
  }
  finally {
    if (pageType.value === 'visualization') {
      updateVisualLoading(false)
    }
  }
}

/** 发布页面 */
async function _publishPage() {
  cancelAutoSave()
  if (pageType.value === 'visualization') {
    updateVisualLoading(true)
  }
  try {
    const name = pageName.value.trim() || `未命名${pageType.value === 'visualization' ? '可视化' : pageType.value === 'form' ? '表单' : '报表'}`
    const dsl = getCurrentDSL()
    const saved = await pageStore.savePage({
      id: pageId.value || undefined,
      name,
      type: pageType.value,
      dsl,
      dataset_bindings: pageStore.currentPage?.dataset_bindings ?? undefined,
      status: 'published',
    })
    ElMessage.success('发布成功')
    if (isNew.value && saved.id) {
      router.replace({ name: getEditorRouteName(pageType.value), params: { id: saved.id } })
    }
    if (pageType.value === 'visualization') {
      syncSavedBaseline()
      autoSaveBaseline.value = JSON.stringify(getCurrentDSL())
      markVisualClean()
    }
    if (pageType.value === 'form' && formDesignerRef.value) {
      formDesignerRef.value.syncSavedBaseline()
      formDirty.value = false
    }
  }
  catch (e) {
    ElMessage.error((e as Error).message || '发布失败')
  }
  finally {
    if (pageType.value === 'visualization') {
      updateVisualLoading(false)
    }
  }
}

/** 离开确认 */
async function confirmLeaveIfDirty(): Promise<boolean> {
  const dirty = pageType.value === 'form' ? formDirty.value : hasAutoSaveChanges()
  if (!dirty)
    return true
  try {
    await ElMessageBox.confirm('当前有未保存的更改，离开后修改将丢失，确定要离开吗？', '提示', {
      confirmButtonText: '离开',
      cancelButtonText: '取消',
      type: 'warning',
      distinguishCancelAndClose: true,
    })
    return true
  }
  catch { return false }
}

onBeforeRouteLeave(async (_to, _from, next) => {
  await flushAutoSave()
  const ok = await confirmLeaveIfDirty()
  next(ok)
})

// 当 header 操作栏保存/发布后，同步 isDirty 基线
watch(saveCounter, () => {
  if (pageType.value === 'visualization') {
    syncSavedBaseline()
    autoSaveBaseline.value = JSON.stringify(getCurrentDSL())
  }
  else if (pageType.value === 'form' && formDesignerRef.value) {
    formDesignerRef.value.syncSavedBaseline()
    formDirty.value = false
  }
})

// 同步 dirty 状态到共享状态，供 header 标题栏显示保存标识
watch(isDirty, (val) => {
  if (pageType.value === 'visualization') {
    isPageDirty.value = val
    scheduleAutoSave()
  }
})

watch(formDirty, (val) => {
  if (pageType.value === 'form') {
    isPageDirty.value = val
    scheduleAutoSave()
  }
})

// 编辑过程中实时同步 visualDSL，确保 header 保存时拿到最新数据
watch(
  () => JSON.stringify(jsonData.value),
  (serialized) => {
    if (pageType.value === 'visualization') {
      updateVisualDSL(JSON.parse(serialized) as Record<string, unknown>)
      scheduleAutoSave()
    }
  },
)

// 表单 schema 变化时同步到 visualDSL
watch(formSchemaRef, (schema) => {
  if (schema && pageType.value === 'form') {
    updateVisualDSL(schema as unknown as Record<string, unknown>)
    scheduleAutoSave()
  }
}, { deep: true })

function onBeforeUnload(e: BeforeUnloadEvent) {
  const dirty = pageType.value === 'form' ? formDirty.value : hasAutoSaveChanges()
  if (dirty) {
    e.preventDefault()
    e.returnValue = ''
  }
}

/** 表单设计器 Schema 更新回调 */
function onFormSchemaUpdate(schema: FormSchema) {
  // 防止循环更新：比较新旧 schema 是否真正变化
  const oldStr = JSON.stringify(formSchemaRef.value)
  const newStr = JSON.stringify(schema)
  if (oldStr !== newStr) {
    formSchemaRef.value = schema
  }
}

/** 表单设计器脏状态回调 */
function onFormDirtyChange(dirty: boolean) {
  formDirty.value = dirty
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  cancelAutoSave()
  window.removeEventListener('beforeunload', onBeforeUnload)
})

onUnmounted(() => {
  controlStore.floatingSettingVisible = false
})
</script>

<template>
  <div
    id="page-editor-wrapper"
    v-loading="loading"
    class="relative flex h-full w-full flex-col overflow-hidden"
    element-loading-text="加载页面配置…"
  >
    <!-- 可视化编辑器 -->
    <ELayout v-if="pageType === 'visualization'" class="visual-editor-shell">
      <ELayoutContent class="visual-editor-shell__content">
        <SimulatorEditor />
      </ELayoutContent>
    </ELayout>

    <!-- 表单设计器 -->
    <FormDesigner
      v-else-if="pageType === 'form'"
      ref="formDesignerRef"
      :initial-schema="formSchemaRef"
      @update:schema="onFormSchemaUpdate"
      @dirty-change="onFormDirtyChange"
    />

    <!-- 报表占位 -->
    <div v-else class="flex flex-1 items-center justify-center bg-(--el-bg-color-page)">
      <div class="text-center">
        <el-icon :size="72" color="#e6a23c">
          <DataLine />
        </el-icon>
        <h2 class="mt-4 mb-2 text-xl font-semibold">
          报表设计器
        </h2>
        <p class="text-(--el-text-color-secondary)">
          报表设计器正在开发中，敬请期待...
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.visual-editor-shell {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
  background:
    radial-gradient(circle at 14% 10%, rgba(37, 99, 235, 0.08), transparent 28%),
    linear-gradient(135deg, rgba(38, 99, 235, 0.06), transparent 32%), var(--el-bg-color-page);
}

.visual-editor-shell__content {
  position: relative;
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

:global(html.dark) .visual-editor-shell {
  background:
    radial-gradient(circle at 14% 10%, rgba(67, 156, 255, 0.13), transparent 30%),
    linear-gradient(135deg, rgba(37, 99, 235, 0.14), transparent 34%), var(--el-bg-color-page);
}
</style>
