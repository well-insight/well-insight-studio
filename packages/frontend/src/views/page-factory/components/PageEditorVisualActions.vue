<script lang="ts" setup>
import {
  RefreshLeft,
  RefreshRight,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCanvasThemeStore } from '@/stores/canvasThemeStore'
import { usePageStore } from '@/stores/pageStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { ThemePanel } from '@/visual-editor/ui/workbench/theme-panel'

const route = useRoute()
const router = useRouter()
const pageStore = usePageStore()
const canvasThemeStore = useCanvasThemeStore()
const { canUndo, canRedo, undo, redo, jsonData } = useVisualData()

const saving = ref(false)
const lastSavedDSL = ref('')

const pageId = computed(() => {
  const raw = route.params.id
  if (!raw) return undefined
  return Array.isArray(raw) ? raw[0] : String(raw)
})
const isNew = computed(() => !pageId.value || pageId.value === 'new')

/** 保存后写入的缓存键 */
const dslCacheKey = computed(() => `page-dsl-snapshot-${pageId.value || 'new'}`)

/** 当前是否真的有未保存改动 */
const hasUnsavedChanges = computed(() => {
  const current = JSON.stringify(jsonData.value)
  return current !== lastSavedDSL.value
})

async function handleSave() {
  saving.value = true
  try {
    const dsl = jsonData.value as Record<string, unknown>
    await pageStore.savePage({
      id: isNew.value ? undefined : pageId.value,
      name: pageStore.currentPage?.name || '未命名页面',
      type: 'visualization',
      dsl,
    })
    // 记录已保存的 DSL 快照
    const snap = JSON.stringify(dsl)
    lastSavedDSL.value = snap
    sessionStorage.setItem(dslCacheKey.value, snap)
    ElMessage.success('保存成功')
  }
  catch (e) {
    ElMessage.error((e as Error).message || '保存失败')
  }
  finally {
    saving.value = false
  }
}

async function handlePublish() {
  saving.value = true
  try {
    const dsl = jsonData.value as Record<string, unknown>
    await pageStore.savePage({
      id: isNew.value ? undefined : pageId.value,
      name: pageStore.currentPage?.name || '未命名页面',
      type: 'visualization',
      dsl,
      status: 'published',
    })
    const snap = JSON.stringify(dsl)
    lastSavedDSL.value = snap
    sessionStorage.setItem(dslCacheKey.value, snap)
    ElMessage.success('已发布')
  }
  catch (e) {
    ElMessage.error((e as Error).message || '发布失败')
  }
  finally {
    saving.value = false
  }
}

// 初始化时从缓存读取上次保存的快照
const initSnapshot = () => {
  const cached = sessionStorage.getItem(dslCacheKey.value)
  if (cached) {
    lastSavedDSL.value = cached
  }
  else {
    lastSavedDSL.value = JSON.stringify(jsonData.value)
  }
}
initSnapshot()

function handleUndo() {
  if (!undo()) ElMessage.info('没有可撤回的操作')
}

function handleRedo() {
  if (!redo()) ElMessage.info('没有可重做的操作')
}

async function goBack() {
  if (hasUnsavedChanges.value) {
    try {
      await ElMessageBox.confirm('当前有未保存的更改，确定要离开吗？', '提示', {
        confirmButtonText: '离开',
        cancelButtonText: '取消',
        type: 'warning',
      })
    }
    catch { return }
  }
  // 清理该页面的缓存
  sessionStorage.removeItem(dslCacheKey.value)
  router.push({ name: 'VisualDesign' })
}
</script>

<template>
  <div class="flex items-center gap-0">
    <!-- 撤回/重做 -->
    <el-tooltip content="撤回" placement="bottom">
      <el-button text :icon="RefreshLeft" :disabled="!canUndo" @click="handleUndo" />
    </el-tooltip>
    <el-tooltip content="重做" placement="bottom">
      <el-button text :icon="RefreshRight" :disabled="!canRedo" @click="handleRedo" />
    </el-tooltip>

    <el-divider direction="vertical" />

    <!-- 主题 -->
    <el-popover placement="bottom" trigger="click" :width="340" transition="el-zoom-in-top">
      <template #reference>
        <el-button text title="主题设置">
          <span
            class="theme-swatch"
            :style="{ backgroundColor: canvasThemeStore.currentTheme?.bg?.page || '#fff' }"
          >
            <span
              v-for="(color, i) in canvasThemeStore.chartColors?.slice(0, 5) || []"
              :key="i"
              class="theme-dot"
              :style="{ backgroundColor: color }"
            />
          </span>
        </el-button>
      </template>
      <ThemePanel />
    </el-popover>

    <el-divider direction="vertical" />

    <!-- 保存/发布/返回 -->
    <el-button :loading="saving" size="small" @click="handleSave">保存</el-button>
    <el-button size="small" type="primary" @click="handlePublish">发布</el-button>
    <el-divider direction="vertical" />
    <el-button size="small" @click="goBack">返回</el-button>
  </div>
</template>

<style scoped>
.theme-swatch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
  cursor: pointer;
}

.theme-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
</style>
