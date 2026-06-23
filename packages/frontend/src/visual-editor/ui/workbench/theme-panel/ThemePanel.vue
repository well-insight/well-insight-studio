<script setup lang="ts">
import { Check, Delete, Edit, Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { ref } from 'vue'
import { useCanvasThemeStore } from '@/stores/canvasThemeStore'
import ThemeEditorDialog from './ThemeEditorDialog.vue'

const themeStore = useCanvasThemeStore()

const editorVisible = ref(false)
const editingId = ref<string | null>(null)

function openNewEditor() {
  editingId.value = null
  editorVisible.value = true
}

function openEditEditor(id: string) {
  editingId.value = id
  editorVisible.value = true
}

function handleSaved() {
  editorVisible.value = false
}

async function handleDelete(id: string, name: string) {
  try {
    await ElMessageBox.confirm(`确定删除主题「${name}」？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    themeStore.deleteUserTheme(id)
  }
  catch {
    // cancelled
  }
}
</script>

<template>
  <div class="theme-panel-content">
    <el-scrollbar max-height="380px">
      <!-- 预设主题 + 用户主题列表 -->
      <div class="theme-panel-list">
        <div
          v-for="meta in themeStore.allThemeMetas"
          :key="meta.id"
          class="theme-panel-item" :class="[
            themeStore.activeThemeId === meta.id && 'theme-panel-item--active',
          ]"
        >
          <div class="theme-panel-item__info" @click="themeStore.selectTheme(meta.id)">
            <div class="theme-panel-item__preview" :style="{ background: meta.previewBg }">
              <div
                v-for="(color, i) in meta.previewColors"
                :key="i"
                class="theme-panel-item__dot"
                :style="{ backgroundColor: color }"
              />
            </div>
            <div class="theme-panel-item__name">
              <span>{{ meta.name }}</span>
              <span v-if="themeStore.activeThemeId === meta.id" class="theme-panel-item__check">
                <el-icon :size="12"><Check /></el-icon>
              </span>
            </div>
          </div>
          <div class="theme-panel-item__actions">
            <el-tooltip content="编辑主题" placement="top">
              <el-button
                text
                size="small"
                :icon="Edit"
                @click="openEditEditor(meta.id)"
              />
            </el-tooltip>
            <el-tooltip v-if="!meta.isPreset" content="删除主题" placement="top">
              <el-button
                text
                size="small"
                type="danger"
                :icon="Delete"
                @click="handleDelete(meta.id, meta.name)"
              />
            </el-tooltip>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <!-- 新增主题（固定在底部） -->
    <div class="theme-panel-add">
      <el-button class="theme-panel-add__btn" @click="openNewEditor">
        <el-icon><Plus /></el-icon>
        新增主题
      </el-button>
    </div>

    <!-- 编辑弹窗 -->
    <ThemeEditorDialog
      v-model:visible="editorVisible"
      :edit-theme-id="editingId"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
.theme-panel-content {
  padding: 8px;
}

.theme-panel-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.theme-panel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--el-fill-color-lighter);
}

.theme-panel-item:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.theme-panel-item--active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.theme-panel-item__info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.theme-panel-item__preview {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 5px;
  border-radius: 6px;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-light);
}

.theme-panel-item__dot {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.theme-panel-item__name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.theme-panel-item__check {
  color: var(--el-color-primary);
}

.theme-panel-item__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.theme-panel-item:hover .theme-panel-item__actions,
.theme-panel-item--active .theme-panel-item__actions {
  opacity: 1;
}

.theme-panel-add {
  margin-top: 10px;
}

.theme-panel-add__btn {
  width: 100%;
  border-style: dashed;
  height: 34px;
  font-size: 13px;
  border-radius: 8px;
}
</style>
