<script lang="ts" setup>
import type { PageType } from '@/api/pages'
import type { FormSchema } from '@/form-designer/types'
import { DataLine } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, onActivated, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { fetchPage } from '@/api/pages'
import { ELayout, ELayoutContent, ELayoutSider } from '@/components/e-layout'
import { FormDesigner } from '@/form-designer'
import { getEmptyFormSchema, isValidFormSchema } from '@/form-designer/form-designer.utils'
import { useControlStore } from '@/stores/controlStore'
import { usePageStore } from '@/stores/pageStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import SimulatorEditor from '@/visual-editor/ui/canvas/simulator-grid-editor/SimulatorEditor.vue'
import LeftAside from '@/visual-editor/ui/workbench/left-aside/LeftAside.vue'
import { isPageDirty, saveCounter, updateVisualDSL } from './visualEditorState'

const route = useRoute()
const router = useRouter()
const pageStore = usePageStore()

const controlStore = useControlStore()
const { layoutCollapse } = storeToRefs(controlStore)

const { overrideProject, updateVisualLoading, isDirty, jsonData, syncSavedBaseline } = useVisualData()

/** 表单设计器相关状态 */
const formDesignerRef = ref<InstanceType<typeof FormDesigner> | null>(null)
const formSchemaRef = ref<FormSchema | null>(null)
const formDirty = ref(false)

/** 并发/重复进入时只应用最后一次请求结果 */
let loadSeq = 0

const loading = ref(false)
const pageName = ref('')
const pageType = ref<PageType>('visualization')

/** 确定当前是编辑已有页面还是新建页面 */
const isNew = computed(() => route.params.type != null && route.path.includes('/new/'))
const pageId = computed(() => isNew.value ? null : (route.params.id as string))

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
    }
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
  updateVisualLoading(false)
}

watch(
  () => route.params,
  () => {
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
  return JSON.parse(JSON.stringify(jsonData)) as Record<string, unknown>
}

/** 保存页面 */
async function _savePageDraft() {
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
      status: 'draft',
    })
    ElMessage.success('保存成功')
    // 如果是新建页面，保存后跳转到编辑模式
    if (isNew.value && saved.id) {
      router.replace({ name: 'PageEditor', params: { id: saved.id } })
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
      status: 'published',
    })
    ElMessage.success('发布成功')
    if (isNew.value && saved.id) {
      router.replace({ name: 'PageEditor', params: { id: saved.id } })
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
  const dirty = pageType.value === 'form' ? formDirty.value : isDirty.value
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
  const ok = await confirmLeaveIfDirty()
  next(ok)
})

// 当 header 操作栏保存/发布后，同步 isDirty 基线
watch(saveCounter, () => {
  if (pageType.value === 'visualization') {
    syncSavedBaseline()
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
  }
})

watch(formDirty, (val) => {
  if (pageType.value === 'form') {
    isPageDirty.value = val
  }
})

// 编辑过程中实时同步 visualDSL，确保 header 保存时拿到最新数据
watch(jsonData, (data) => {
  if (data && pageType.value === 'visualization') {
    updateVisualDSL(JSON.parse(JSON.stringify(data)) as Record<string, unknown>)
  }
}, { deep: true })

// 表单 schema 变化时同步到 visualDSL
watch(formSchemaRef, (schema) => {
  if (schema && pageType.value === 'form') {
    updateVisualDSL(schema as unknown as Record<string, unknown>)
  }
}, { deep: true })

function onBeforeUnload(e: BeforeUnloadEvent) {
  const dirty = pageType.value === 'form' ? formDirty.value : isDirty.value
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
    <ELayout v-if="pageType === 'visualization'" class="relative flex flex-1 overflow-hidden">
      <ELayoutSider
        v-model:collapsed="layoutCollapse"
        show-trigger="button"
        :width="280"
        :collapsed-width="0"
      >
        <LeftAside />
      </ELayoutSider>
      <ELayoutContent>
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
    <div v-else class="flex flex-1 items-center justify-center bg-[var(--el-bg-color-page)]">
      <div class="text-center">
        <el-icon :size="72" color="#e6a23c">
          <DataLine />
        </el-icon>
        <h2 class="mt-4 mb-2 text-xl font-semibold">
          报表设计器
        </h2>
        <p class="text-[var(--el-text-color-secondary)]">
          报表设计器正在开发中，敬请期待...
        </p>
      </div>
    </div>
  </div>
</template>
