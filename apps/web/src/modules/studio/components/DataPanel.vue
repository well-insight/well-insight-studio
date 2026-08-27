<script setup lang="ts">
import { ChevronRight, Database, GripVertical, Hash, Type } from '@lucide/vue'
import { WiScrollbar } from '@well-insight/ui'
import { ref } from 'vue'
import { useDataStore } from '../../../stores/dataStore'
import { isNumericField } from '../utils/sampleData'

const dataStore = useDataStore()

/** 默认展开所有表 */
const collapsed = ref<Record<string, boolean>>({})

function toggleTable(name: string) {
  collapsed.value[name] = !collapsed.value[name]
}

function onFieldDragStart(e: DragEvent, table: string, field: string) {
  e.dataTransfer?.setData('text/plain', JSON.stringify({ table, field }))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}
</script>

<template>
  <aside class="data-panel">
    <div class="panel-header">
      <Database :size="13" class="header-icon" />
      <h3>数据源</h3>
      <span class="table-count">{{ dataStore.tableNames.length }} 表</span>
    </div>

    <WiScrollbar class="data-tree" :native="false" trigger="hover" aria-label="数据表和字段">
      <div v-if="dataStore.isLoadingSchema" class="data-empty">
        正在加载真实数据源结构…
      </div>
      <div v-else-if="!dataStore.datasourceId" class="data-empty">
        请先配置并选择真实数据源
      </div>
      <div v-else-if="dataStore.tableNames.length === 0" class="data-empty">
        数据源中暂无可用数据表
      </div>
      <div v-for="name in dataStore.tableNames" :key="name" class="table-node">
        <button class="table-header" @click="toggleTable(name)">
          <ChevronRight :size="11" class="chevron" :class="{ open: !collapsed[name] }" />
          <span class="table-name">{{ name }}</span>
          <span class="row-badge">{{ dataStore.getTable(name).rows.length }}</span>
        </button>
        <ul v-show="!collapsed[name]" class="field-list">
          <li
            v-for="field in dataStore.getTable(name).fields"
            :key="field"
            class="field-item"
            draggable="true"
            :title="`拖拽 ${field} 到画布`"
            @dragstart="onFieldDragStart($event, name, field)"
          >
            <GripVertical :size="11" class="grip" />
            <component :is="isNumericField(dataStore.getTable(name), field) ? Hash : Type" :size="11" class="type-icon" />
            <span class="field-name">{{ field }}</span>
            <span class="field-type">{{ isNumericField(dataStore.getTable(name), field) ? 'num' : 'str' }}</span>
          </li>
        </ul>
      </div>
    </WiScrollbar>

    <div class="panel-footer">
      拖入画布生成组件
    </div>
  </aside>
</template>

<style scoped>
.data-panel {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--wi-border-color, #1a212e);
  background: var(--wi-surface, #0a0f18);
  min-height: 0;
}
.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--wi-border-color, #1a212e);
}
.header-icon {
  color: var(--wi-primary, #3b82f6);
}
.panel-header h3 {
  font-size: 12px;
  font-weight: 600;
  margin: 0;
}
.table-count {
  margin-left: auto;
  font-size: 10px;
  color: var(--wi-text-secondary, #6a7b98);
}
.data-tree {
  flex: 1;
  min-height: 0;
  padding: 4px 0;
}
.data-tree :deep(.wi-scrollbar__wrap) {
  height: 100%;
}
.data-tree :deep(.wi-scrollbar__view) {
  min-height: 100%;
}
.table-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: transparent;
  border: none;
  color: var(--wi-text-color, #e8edf5);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}
.table-header:hover {
  background: var(--wi-surface-hover, #141c2a);
}
.chevron {
  color: var(--wi-text-secondary, #6a7b98);
  transition: transform 0.15s;
}
.chevron.open {
  transform: rotate(90deg);
}
.row-badge {
  margin-left: auto;
  font-size: 9px;
  color: var(--wi-text-secondary, #6a7b98);
  background: var(--wi-surface-hover, #1a212e);
  padding: 0 5px;
  border-radius: 8px;
}
.field-list {
  list-style: none;
  margin: 0;
  padding: 0 0 4px;
}
.field-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px 4px 22px;
  font-size: 11px;
  color: var(--wi-text-secondary, #a8b4c8);
  cursor: grab;
  user-select: none;
}
.field-item:hover {
  background: var(--wi-surface-hover, #141c2a);
  color: var(--wi-text-color, #e8edf5);
}
.field-item:active {
  cursor: grabbing;
}
.grip {
  color: var(--wi-text-secondary, #4a5a78);
  flex-shrink: 0;
}
.type-icon {
  color: var(--wi-primary, #3b82f6);
  flex-shrink: 0;
}
.field-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.field-type {
  margin-left: auto;
  font-size: 8px;
  color: var(--wi-text-secondary, #4a5a78);
  border: 1px solid var(--wi-border-color, #1e2638);
  padding: 0 3px;
  border-radius: 3px;
  flex-shrink: 0;
}
.data-empty {
  padding: 24px 14px;
  color: var(--wi-text-secondary, #6a7b98);
  font-size: 11px;
  line-height: 1.6;
  text-align: center;
}
.panel-footer {
  padding: 8px 12px;
  font-size: 10px;
  color: var(--wi-text-secondary, #4a5a78);
  border-top: 1px solid var(--wi-border-color, #1a212e);
}
</style>
