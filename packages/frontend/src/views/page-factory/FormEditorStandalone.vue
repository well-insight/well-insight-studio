<script lang="ts" setup>
/**
 * 表单设计器 - 独立全屏工作区
 * 脱离主 Layout，自带顶栏工具栏
 */
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import PageEditorBasicActions from './components/PageEditorBasicActions.vue'
import PageTitle from './components/PageTitle.vue'
import PageEditor from './PageEditor.vue'

const router = useRouter()

function goBack() {
  router.push({ name: 'PageListForm' })
}
</script>

<template>
  <div class="form-workspace">
    <header class="form-workspace__header">
      <button class="form-workspace__back" type="button" title="返回列表" @click="goBack">
        <el-icon :size="18">
          <ArrowLeft />
        </el-icon>
      </button>

      <div class="form-workspace__title">
        <PageTitle />
      </div>

      <div class="form-workspace__actions">
        <PageEditorBasicActions />
      </div>
    </header>

    <main class="form-workspace__body">
      <PageEditor />
    </main>
  </div>
</template>

<style scoped>
.form-workspace {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.form-workspace__header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(82, 124, 181, 0.14);
  background: var(--el-bg-color);
  z-index: 10;
}

.form-workspace__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(82, 124, 181, 0.12);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.2s ease;
}

.form-workspace__back:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  border-color: rgba(37, 99, 235, 0.2);
}

.form-workspace__title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.form-workspace__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.form-workspace__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
