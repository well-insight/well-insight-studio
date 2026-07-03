<script lang="ts" setup>
import type { PageType } from '@/api/pages'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  pageName: string
  pageType: PageType
  isNew: boolean
  isDirty: boolean
}>()

const emit = defineEmits<{
  'update:pageName': [value: string]
  save: []
  publish: []
}>()

const router = useRouter()

const typeLabel = computed(() => {
  const map: Record<string, string> = {
    visualization: '可视化大屏',
    form: '表单管理',
    report: '复杂报表',
  }
  return map[props.pageType] || props.pageType
})

function onNameChange(val: string) {
  emit('update:pageName', val)
}

function goBack() {
  router.push({ name: 'VisualDesign' })
}
</script>

<template>
  <div class="editor-toolbar">
    <div class="toolbar-left">
      <el-button text @click="goBack">
        <el-icon><el-icon-arrow-left /></el-icon>
        返回
      </el-button>
      <el-divider direction="vertical" />
      <el-input
        :model-value="pageName"
        class="page-name-input"
        placeholder="输入页面名称"
        :maxlength="50"
        @input="onNameChange"
      />
      <el-tag size="small" style="margin-left: 8px">{{ typeLabel }}</el-tag>
    </div>
    <div class="toolbar-right">
      <el-button @click="emit('save')">保存</el-button>
      <el-button type="primary" @click="emit('publish')">发布</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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

.toolbar-right {
  display: flex;
  gap: 8px;
}

.page-name-input {
  width: 240px;

  :deep(.el-input__wrapper) {
    background: transparent;
    box-shadow: none;
    font-size: 15px;
    font-weight: 600;

    &:hover,
    &.is-focus {
      box-shadow: 0 1px 0 var(--el-color-primary) !important;
    }
  }
}
</style>
