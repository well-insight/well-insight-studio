<script lang="ts" setup>
import {
  RefreshLeft,
  RefreshRight,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { markVisualDirty } from '../visualEditorState'
import PageEditorBasicActions from './PageEditorBasicActions.vue'

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
  <div class="visual-actions">
    <el-tooltip content="撤回" placement="bottom">
      <el-button text :icon="RefreshLeft" :disabled="!canUndo" @click="handleUndo" />
    </el-tooltip>
    <el-tooltip content="重做" placement="bottom">
      <el-button text :icon="RefreshRight" :disabled="!canRedo" @click="handleRedo" />
    </el-tooltip>

    <el-divider direction="vertical" />

    <PageEditorBasicActions />
  </div>
</template>

<style scoped>
.visual-actions {
  display: flex;
  align-items: center;
  gap: 0;
}
</style>
