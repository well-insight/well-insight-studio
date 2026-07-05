<script lang="ts" setup>
import type { PageType } from '@/api/pages'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataLine, EditPen, Monitor } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { computed, onActivated, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { fetchPage } from '@/api/pages'
import { ELayout, ELayoutContent, ELayoutSider } from '@/components/e-layout'
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
      return {
        pages: {
          '/': {
            title: '表单页',
            path: '/',
            config: {
              bgColor: '',
              bgImage: '',
              keepAlive: false,
              pageSize: { name: '', width: 1280, height: 800 },
            },
            blocks: [],
          },
        },
        models: [],
        actions: { fetch: { name: '接口请求', apis: [] }, dialog: { name: '对话框', handlers: [] } },
      }
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

/** 校验 DSL 是否包含有效的 pages 对象 */
function isValidDSL(dsl: unknown): dsl is Record<string, unknown> {
  return !!dsl && typeof dsl === 'object' && 'pages' in (dsl as Record<string, unknown>)
}

async function loadPageById(id: string) {
  updateVisualLoading(true)
  const seq = ++loadSeq
  loading.value = true
  try {
    const detail = await fetchPage(id)
    if (seq !== loadSeq)
      return
    pageName.value = detail.name
    pageType.value = detail.type
    // 同步到 store，供 header 操作栏读取
    await pageStore.loadPage(id)
    const dsl = isValidDSL(detail.dsl) ? detail.dsl : getDefaultSchema(detail.type)
    overrideProject(dsl as any)
    updateVisualDSL(dsl as Record<string, unknown>)
    syncSavedBaseline()
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

/** 保存页面 */
async function savePageDraft() {
  updateVisualLoading(true)
  try {
    const name = pageName.value.trim() || `未命名${pageType.value === 'visualization' ? '可视化' : pageType.value === 'form' ? '表单' : '报表'}`
    const dsl = JSON.parse(JSON.stringify(jsonData))
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
  }
  catch (e) {
    ElMessage.error((e as Error).message || '保存失败')
  }
  finally {
    updateVisualLoading(false)
  }
}

/** 发布页面 */
async function publishPage() {
  updateVisualLoading(true)
  try {
    const name = pageName.value.trim() || `未命名${pageType.value === 'visualization' ? '可视化' : pageType.value === 'form' ? '表单' : '报表'}`
    const dsl = JSON.parse(JSON.stringify(jsonData))
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
  }
  catch (e) {
    ElMessage.error((e as Error).message || '发布失败')
  }
  finally {
    updateVisualLoading(false)
  }
}

/** 离开确认 */
async function confirmLeaveIfDirty(): Promise<boolean> {
  if (!isDirty.value) return true
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
  syncSavedBaseline()
})

// 同步 dirty 状态到共享状态，供 header 标题栏显示保存标识
watch(isDirty, (val) => {
  isPageDirty.value = val
})

// 编辑过程中实时同步 visualDSL，确保 header 保存时拿到最新数据
watch(jsonData, (data) => {
  if (data) {
    updateVisualDSL(JSON.parse(JSON.stringify(data)) as Record<string, unknown>)
  }
}, { deep: true })

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
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

    <!-- 表单/报表占位 -->
    <div v-else class="flex flex-1 items-center justify-center bg-[var(--el-bg-color-page)]">
      <div class="text-center">
        <el-icon :size="72" :color="pageType === 'form' ? '#67c23a' : '#e6a23c'">
          <EditPen v-if="pageType === 'form'" />
          <DataLine v-else />
        </el-icon>
        <h2 class="mt-4 mb-2 text-xl font-semibold">
          {{ pageType === 'form' ? '表单设计器' : '报表设计器' }}
        </h2>
        <p class="text-[var(--el-text-color-secondary)]">
          {{ pageType === 'form' ? '表单设计器正在开发中，敬请期待...' : '报表设计器正在开发中，敬请期待...' }}
        </p>
      </div>
    </div>
  </div>
</template>
