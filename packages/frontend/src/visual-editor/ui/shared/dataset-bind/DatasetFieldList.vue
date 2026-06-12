<script setup lang="ts">
import type { ApiDatasetField } from '@/api/dataset'
import { Calendar, Document, Histogram, Search } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'

const props = defineProps<{
  fields: ApiDatasetField[]
  loading?: boolean
}>()

const emit = defineEmits<{
  fieldDragStart: [field: ApiDatasetField]
}>()

const keyword = ref('')

const filteredFields = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  const list = [...props.fields].sort((a, b) => a.sort_order - b.sort_order)
  if (!q)
    return list
  return list.filter(f => f.name.toLowerCase().includes(q))
})

function fieldIcon(type: ApiDatasetField['field_type']) {
  if (type === 'number')
    return Histogram
  if (type === 'datetime')
    return Calendar
  return Document
}

function iconClass(type: ApiDatasetField['field_type']) {
  return `field-item__icon--${type}`
}

function onDragStart(e: DragEvent, field: ApiDatasetField) {
  e.dataTransfer?.setData('application/x-dataset-field', JSON.stringify(field))
  e.dataTransfer!.effectAllowed = 'copy'
  emit('fieldDragStart', field)
}
</script>

<template>
  <div class="field-panel">
    <header class="section-head">
      <span class="section-head__title">字段</span>
    </header>
    <div class="field-panel__search-wrap">
      <el-input
        v-model="keyword"
        size="default"
        placeholder="搜索字段"
        clearable
        class="field-panel__search"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>
    <el-scrollbar v-loading="loading" class="field-panel__list">
      <div
        v-for="field in filteredFields"
        :key="field.id"
        class="field-item"
        draggable="true"
        @dragstart="(e) => onDragStart(e, field)"
      >
        <span class="field-item__icon-wrap" :class="iconClass(field.field_type)">
          <el-icon :size="14">
            <component :is="fieldIcon(field.field_type)" />
          </el-icon>
        </span>
        <span class="field-item__name">{{ field.name }}</span>
      </div>
      <el-empty
        v-if="!loading && filteredFields.length === 0"
        :image-size="56"
        description="暂无字段"
      />
    </el-scrollbar>
  </div>
</template>

<style scoped>
.field-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.section-head {
  flex-shrink: 0;
  padding: 14px 16px 0;
}

.section-head__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.field-panel__search-wrap {
  flex-shrink: 0;
  padding: 10px 16px 8px;
}

.field-panel__search {
  width: 100%;
}

.field-panel__list {
  flex: 1;
  min-height: 0;
  padding: 4px 12px 12px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  margin-bottom: 4px;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: grab;
  font-size: 13px;
  color: var(--el-text-color-regular);
  transition:
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}

.field-item:hover {
  background: #fff;
  border-color: var(--el-border-color-lighter);
  box-shadow: 0 1px 4px rgb(0 0 0 / 4%);
}

.field-item:active {
  cursor: grabbing;
}

.field-item__icon-wrap {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
}

.field-item__icon-wrap--text {
  background: #f0f2f5;
  color: #606266;
}

.field-item__icon-wrap--number {
  background: #e8f3ff;
  color: var(--el-color-primary);
}

.field-item__icon-wrap--datetime {
  background: #fff7e6;
  color: #e6a23c;
}

.field-item__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
