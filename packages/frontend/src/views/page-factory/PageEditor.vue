<script lang="ts" setup>
import type { PageType } from '@/api/pages'
import { DataLine, EditPen, Monitor } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ELayout, ELayoutContent, ELayoutSider } from '@/components/e-layout'
import { useControlStore } from '@/stores/controlStore'
import { usePageStore } from '@/stores/pageStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import SimulatorEditor from '@/visual-editor/ui/canvas/simulator-grid-editor/SimulatorEditor.vue'
import LeftAside from '@/visual-editor/ui/workbench/left-aside/LeftAside.vue'

const route = useRoute()
const router = useRouter()
const pageStore = usePageStore()

const controlStore = useControlStore()
const { layoutCollapse } = storeToRefs(controlStore)
const { overrideProject, updateVisualLoading, isDirty } = useVisualData()

const pageId = computed(() => {
  const raw = route.params.id
  if (!raw)
    return undefined
  return Array.isArray(raw) ? raw[0] : String(raw)
})
const isNew = computed(() => !pageId.value || pageId.value === 'new')
const pageType = computed<PageType>(() => {
  if (isNew.value) {
    return (route.params.type as PageType) || 'visualization'
  }
  return pageStore.currentPage?.type || 'visualization'
})

const isVisualization = computed(() => pageType.value === 'visualization')

const pageName = ref('')
const loading = ref(false)
let loadSeq = 0

const placeholderConfig: Record<PageType, { icon: typeof Monitor, title: string, desc: string }> = {
  visualization: {
    icon: Monitor,
    title: '可视化编辑器',
    desc: '拖拽图表组件，构建数据大屏',
  },
  form: {
    icon: EditPen,
    title: '表单设计器',
    desc: '表单设计器正在开发中，敬请期待...',
  },
  report: {
    icon: DataLine,
    title: '报表设计器',
    desc: '报表设计器正在开发中，敬请期待...',
  },
}

const currentPlaceholder = computed(() => placeholderConfig[pageType.value])

/** 默认可视化 DSL 模板 */
function defaultVisualDSL(): Record<string, unknown> {
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
    actions: {
      fetch: { name: '接口请求', apis: [] },
      dialog: { name: '对话框', handlers: [] },
    },
  }
}

/** 校验 DSL 是否为有效的可视化模型（必须含 pages 对象） */
function isValidVisualDSL(dsl: unknown): dsl is Record<string, unknown> {
  return !!dsl && typeof dsl === 'object' && 'pages' in (dsl as Record<string, unknown>)
}

async function loadPage() {
  if (isNew.value) {
    pageName.value = '未命名页面'
    if (isVisualization.value) {
      updateVisualLoading(true)
      overrideProject(defaultVisualDSL())
      updateVisualLoading(false)
    }
    return
  }

  loading.value = true
  const seq = ++loadSeq
  try {
    const page = await pageStore.loadPage(pageId.value!)
    if (seq !== loadSeq) return
    pageName.value = page.name

    // 可视化：注入 DSL 到编辑器
    if (page.type === 'visualization') {
      updateVisualLoading(true)
      const dsl = isValidVisualDSL(page.dsl) ? page.dsl : defaultVisualDSL()
      overrideProject(dsl)
      updateVisualLoading(false)
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
    }
  }
}

async function handleSave() {
  if (!isVisualization.value) {
    ElMessage.info('该类型编辑器尚未开放，仅可保存页面基本信息')
    return
  }

  try {
    await pageStore.savePage({
      id: isNew.value ? undefined : pageId.value,
      name: pageName.value || '未命名页面',
      type: pageType.value,
      dsl: {},
    })
    ElMessage.success('保存成功')
  }
  catch (error) {
    ElMessage.error((error as Error).message || '保存失败')
  }
}

function goBack() {
  router.push({ name: 'VisualDesign' })
}

// 离开确认
async function confirmLeaveIfDirty(): Promise<boolean> {
  if (!isDirty.value)
    return true
  try {
    await ElMessageBox.confirm('当前有未保存的更改，确定要离开吗？', '提示', {
      confirmButtonText: '离开',
      cancelButtonText: '取消',
      type: 'warning',
    })
    return true
  }
  catch { return false }
}

onBeforeRouteLeave(async (_to, _from, next) => {
  const ok = isVisualization.value ? await confirmLeaveIfDirty() : true
  next(ok)
})

watch(() => pageId.value, () => { loadPage() }, { immediate: true })

onMounted(() => {
  if (isNew.value)
    pageName.value = '未命名页面'
})

onBeforeUnmount(() => {
  pageStore.resetCurrentPage()
  controlStore.floatingSettingVisible = false
})
</script>

<template>
  <div v-loading="loading" class="page-editor-container" element-loading-text="加载页面数据…">
    <!-- 可视化编辑器：完整编辑器布局 -->
    <template v-if="isVisualization">
      <ELayout class="visual-layout">
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
    </template>

    <!-- 表单/报表占位 -->
    <template v-else>
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <el-button text @click="goBack">
            <el-icon><el-icon-arrow-left /></el-icon>
            返回
          </el-button>
          <el-divider direction="vertical" />
          <el-input
            v-model="pageName"
            class="page-name-input"
            placeholder="输入页面名称"
            :maxlength="50"
          />
          <el-tag type="warning" size="small" style="margin-left: 8px">
            开发中
          </el-tag>
        </div>
        <div class="toolbar-right">
          <el-button @click="handleSave">
            保存
          </el-button>
        </div>
      </div>
      <div class="editor-body placeholder-mode">
        <div class="placeholder-content">
          <el-icon :size="64">
            <component :is="currentPlaceholder.icon" />
          </el-icon>
          <h2>{{ currentPlaceholder.title }}</h2>
          <p>{{ currentPlaceholder.desc }}</p>
          <div class="placeholder-actions">
            <el-button @click="goBack">
              返回列表
            </el-button>
            <el-button type="primary" @click="handleSave">
              保存页面信息
            </el-button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.page-editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.visual-layout {
  flex: 1;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-name-input {
  width: 240px;

  :deep(.el-input__wrapper) {
    background: transparent;
    box-shadow: none;
    font-size: 16px;
    font-weight: 600;

    &:hover,
    &.is-focus {
      box-shadow: 0 1px 0 var(--el-color-primary) !important;
    }
  }
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.editor-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color-page, #f5f7fa);
}

.placeholder-content {
  text-align: center;
  color: var(--el-text-color-secondary);

  h2 {
    margin: 16px 0 8px;
    font-size: 24px;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0 0 16px;
    font-size: 14px;
  }
}

.placeholder-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}
</style>
