<script lang="ts" setup>
import {
  DocumentChecked,
  RefreshLeft,
  RefreshRight,
  VideoPlay,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, ref, toRaw, toValue } from 'vue'
import { useRoute } from 'vue-router'
import { updateApplication } from '@/api/application'
import { useCanvasThemeStore } from '@/stores/canvasThemeStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { localKey, useVisualData } from '@/visual-editor/hooks/useVisualData'
import { ThemePanel } from '@/visual-editor/ui/workbench/theme-panel'
import Preview from './components/Preview.vue'

const workspaceStore = useWorkspaceStore()
const { currentApp } = storeToRefs(workspaceStore)
const route = useRoute()

const { jsonData, saveStatus, saveError, isDirty, canUndo, canRedo, saveProject, undo, redo }
  = useVisualData()

const canvasThemeStore = useCanvasThemeStore()

const previewVisible = ref(false)

const statusActive = computed({
  get: () => currentApp.value?.status === 1,
  set: async (v: boolean) => {
    const app = currentApp.value
    if (!app?.id)
      return
    try {
      await updateApplication(String(app.id), { status: v ? 1 : 0 })
      app.status = v ? 1 : 0
    }
    catch (error) {
      ElMessage.error((error as Error).message || '更新状态失败')
    }
  },
})

const saveStatusTooltip = computed(() => {
  if (saveStatus.value === 'saving') {
    return '保存中…'
  }
  if (saveStatus.value === 'error') {
    return saveError.value || '保存失败'
  }
  if (saveStatus.value === 'saved') {
    return '已保存'
  }
  if (isDirty.value) {
    return '有未保存的更改'
  }
  return '已同步至服务器'
})

const saveStatusColor = computed(() => {
  if (saveStatus.value === 'error' || isDirty.value) {
    return `var(--el-color-danger)`
  }
  if (saveStatus.value === 'saved') {
    return `var(--el-color-success)`
  }
  return `var(--el-color-info)`
})

async function saveAll() {
  const ok = await saveProject()
  if (ok) {
    ElMessage.success('保存成功')
  }
  else if (saveError.value) {
    ElMessage.error(saveError.value)
  }
  else {
    ElMessage.warning('未找到当前应用')
  }
}

function handleUndo() {
  if (!undo()) {
    ElMessage.info('没有可撤回的操作')
  }
}

function handleRedo() {
  if (!redo()) {
    ElMessage.info('没有可重做的操作')
  }
}

function previewPage() {
  sessionStorage.setItem(localKey, JSON.stringify(toRaw(toValue(jsonData))))
  sessionStorage.setItem('canvas-theme-vars', JSON.stringify(canvasThemeStore.themeCSSVars))
  window.open(`${location.origin + location.pathname}#/project/application/view/${route?.params?.id?.[0]}`, '_blank')
}
</script>

<template>
  <div class="flex h-full shrink-0 items-center">
    <el-tooltip content="撤回" placement="bottom">
      <el-button text :icon="RefreshLeft" :disabled="!canUndo" @click="handleUndo" />
    </el-tooltip>
    <el-tooltip content="重做" placement="bottom">
      <el-button text :icon="RefreshRight" :disabled="!canRedo" @click="handleRedo" />
    </el-tooltip>
    <el-divider direction="vertical" />

    <el-popover
      placement="bottom"
      trigger="click"
      :width="340"
      transition="el-zoom-in-top"
      :popper-class="$style['theme-popover']"
    >
      <template #reference>
        <el-button text title="主题设置" :class="$style['theme-trigger']">
          <span
            :class="$style['theme-swatch']"
            :style="{ backgroundColor: canvasThemeStore.currentTheme.bg.page }"
          >
            <span
              v-for="(color, i) in canvasThemeStore.chartColors.slice(0, 5)"
              :key="i"
              :class="$style['theme-dot']"
              :style="{ backgroundColor: color }"
            />
          </span>
        </el-button>
      </template>
      <ThemePanel />
    </el-popover>

    <el-divider direction="vertical" />

    <el-tooltip :content="saveStatusTooltip" placement="bottom">
      <el-button text :icon="DocumentChecked" :loading="saveStatus === 'saving'" @click="saveAll">
        <el-badge is-dot :offset="[10, 0]" :color="saveStatusColor">
          保存
        </el-badge>
      </el-button>
    </el-tooltip>

    <el-divider direction="vertical" />
    <el-button text :icon="VideoPlay" @click="previewPage">
      预览
    </el-button>
    <el-divider direction="vertical" />
    <el-space>
      <el-button text>
        <span
          class="mr-2"
          :class="[$style.status, statusActive ? $style.enable : $style.disable]"
        />
        <el-text>{{ statusActive ? "激活" : "关闭" }}</el-text>
      </el-button>
      <el-switch v-model="statusActive" />
    </el-space>
  </div>

  <Preview v-model="previewVisible" :device="currentApp?.clientType === 1 ? 'pc' : 'mobile'" />
</template>

<style lang="scss" module>
.status {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  display: inline-block;

  &.enable {
    background-color: green;
  }

  &.disable {
    background-color: red;
  }
}

.theme-popover {
  --el-popover-padding: 0;
  --el-popover-border-radius: 12px;

  padding: 0 !important;
  overflow: hidden;
  width: 340px !important;
}

.theme-trigger {
  padding: 0 6px !important;
  height: 28px !important;
}

.theme-swatch {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-light);
}

.theme-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}
</style>
