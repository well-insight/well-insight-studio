<script lang="ts" setup>
import {
  RefreshLeft,
  RefreshRight,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useCanvasThemeStore } from '@/stores/canvasThemeStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { ThemePanel } from '@/visual-editor/ui/workbench/theme-panel'
import { markVisualDirty } from '../visualEditorState'
import PageEditorBasicActions from './PageEditorBasicActions.vue'

const canvasThemeStore = useCanvasThemeStore()
const { canUndo, canRedo, undo, redo } = useVisualData()

function handleUndo() {
  if (!undo()) { ElMessage.info('没有可撤回的操作'); return }
  markVisualDirty()
}

function handleRedo() {
  if (!redo()) { ElMessage.info('没有可重做的操作'); return }
  markVisualDirty()
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

    <!-- 基础操作：保存/发布/预览/返回 -->
    <PageEditorBasicActions />
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
