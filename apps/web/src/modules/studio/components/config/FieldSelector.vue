<script setup lang="ts">
import { Hash, Type } from '@lucide/vue'
import { computed } from 'vue'
import { useConfigStore } from '../../../../styles/stores/configStore'
import { isNumericField } from '../../utils/sampleData'

const config = useConfigStore()

const items = computed(() =>
  config.fields.map(field => {
    const ops = config.fieldOps[field]!
    return {
      field,
      checked: config.selectedFields.includes(field),
      alias: ops.alias || field,
      hidden: ops.hidden,
      isNum: isNumericField(config.tableData, field),
    }
  }),
)

function batchToggle(checked: boolean) {
  if (checked) config.selectAll()
  else config.deselectAll()
}

function toggle(field: string) {
  config.toggleField(field)
}

function toggleVisibility(field: string, e: Event) {
  e.stopPropagation()
  const ops = config.fieldOps[field]
  if (!ops) return
  ops.hidden = !ops.hidden
  // 确保隐藏的字段不被选中
  if (ops.hidden && config.selectedFields.includes(field)) config.toggleField(field)
}
</script>

<template>
  <div class="field-selector">
    <div class="selector-header">
      <span>字段列表</span>
      <div class="selector-actions">
        <button @click="batchToggle(true)">
          全选
        </button>
        <button @click="batchToggle(false)">
          取消
        </button>
        <span class="selected-count">{{ config.selectedFields.length }}</span>
      </div>
    </div>

    <div class="selector-body">
      <div
        v-for="item in items"
        :key="item.field"
        class="field-row"
        :class="{ selected: item.checked, hidden: item.hidden }"
        @click="toggle(item.field)"
      >
        <input
          type="checkbox"
          :checked="item.checked"
          @click.stop
          @change="toggle(item.field)"
        >
        <component :is="item.isNum ? Hash : Type" :size="12" class="type-icon" />
        <span class="field-name" :title="item.field">{{ item.alias }}</span>
        <span class="field-type">{{ item.isNum ? 'num' : 'str' }}</span>
        <button
          class="visibility-btn"
          :title="item.hidden ? '显示' : '隐藏'"
          @click="toggleVisibility(item.field, $event)"
        >
          <span class="eye" :class="{ closed: item.hidden }" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-selector {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}
.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid var(--wi-border-color, #1a212e);
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}
.selector-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.selector-actions button {
  background: transparent;
  border: 1px solid var(--wi-border-color, #2a3448);
  color: var(--wi-text-secondary, #8a9bb5);
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  cursor: pointer;
}
.selector-actions button:hover {
  border-color: var(--wi-primary, #3b82f6);
  color: var(--wi-text-color, #e8edf5);
}
.selected-count {
  font-size: 9px;
  color: var(--wi-text-secondary, #4a5a78);
  margin-left: 2px;
}
.selector-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.field-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-size: 11px;
  cursor: pointer;
  color: var(--wi-text-secondary, #a8b4c8);
  user-select: none;
}
.field-row:hover {
  background: var(--wi-surface-hover, #141c2a);
}
.field-row.selected {
  background: rgba(59, 130, 246, 0.1);
  color: var(--wi-text-color, #e8edf5);
}
.field-row.hidden {
  opacity: 0.4;
}
.type-icon {
  color: var(--wi-primary, #3b82f6);
  flex-shrink: 0;
}
.field-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.field-type {
  font-size: 8px;
  color: var(--wi-text-secondary, #4a5a78);
  border: 1px solid var(--wi-border-color, #1e2638);
  padding: 0 3px;
  border-radius: 3px;
  flex-shrink: 0;
}
.visibility-btn {
  background: transparent;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: var(--wi-text-secondary, #6a7b98);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.eye::before {
  content: '👁';
  font-size: 10px;
  filter: grayscale(1);
}
.eye.closed::before {
  content: '🚫';
  font-size: 9px;
}
input[type='checkbox'] {
  cursor: pointer;
  accent-color: var(--wi-primary, #3b82f6);
}
</style>
