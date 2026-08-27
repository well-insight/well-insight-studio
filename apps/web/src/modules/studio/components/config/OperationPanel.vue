<script setup lang="ts">
import type { FieldOperation } from '@well-insight/shared'
import { WiInput, WiSelectButton } from '@well-insight/ui'
import { computed } from 'vue'
import { useConfigStore } from '../../../../styles/stores/configStore'

const config = useConfigStore()

const hasSelection = computed(() => config.selectedFields.length > 0)
const isMulti = computed(() => config.selectedFields.length > 1)
const label = computed(() =>
  hasSelection.value
    ? `${config.selectedFields.length} 个字段${isMulti.value ? ' (批量)' : ''}`
    : '未选择',
)

const ALIAS_EMPTY = ''
const aliasModel = computed({
  get() {
    const aliases = config.selectedFields.map(f => config.fieldOps[f]?.alias).filter(Boolean)
    return aliases.length > 0 && aliases.every(a => a === aliases[0]) ? aliases[0]! : ALIAS_EMPTY
  },
  set(v: string) {
    config.setAlias(v)
  },
})

const aggOptions = [
  { label: 'none', value: 'none' },
  { label: 'sum', value: 'sum' },
  { label: 'avg', value: 'avg' },
  { label: 'count', value: 'count' },
  { label: 'min', value: 'min' },
  { label: 'max', value: 'max' },
]

const aggModel = computed({
  get() {
    if (!config.allNumeric) return 'none'
    const aggs = config.selectedFields.map(f => config.fieldOps[f]?.agg)
    return aggs.every(a => a === aggs[0]) ? aggs[0] ?? 'none' : 'none'
  },
  set(v: FieldOperation['agg']) {
    config.setAgg(v)
  },
})

const sortOptions = [
  { label: 'none', value: 'none' },
  { label: 'asc', value: 'asc' },
  { label: 'desc', value: 'desc' },
]

const sortModel = computed({
  get() {
    const sorts = config.selectedFields.map(f => config.fieldOps[f]?.sort)
    return sorts.every(s => s === sorts[0]) ? sorts[0] ?? 'none' : 'none'
  },
  set(v: FieldOperation['sort']) {
    config.setSort(v)
  },
})

const filterModel = computed({
  get() {
    const filters = config.selectedFields.map(f => config.fieldOps[f]?.filter)
    return filters.every(f => f === filters[0]) ? filters[0] ?? '' : ''
  },
  set(v: string) {
    config.setFilter(v)
  },
})

const hiddenModel = computed({
  get() {
    const hidden = config.selectedFields.map(f => config.fieldOps[f]?.hidden)
    return hidden.every(h => h === hidden[0]) ? hidden[0] ?? false : false
  },
  set(v: boolean) {
    config.setHidden(v)
  },
})
</script>

<template>
  <div class="operation-panel">
    <div class="panel-title">
      字段操作
    </div>
    <div class="selected-label">
      {{ label }}
    </div>

    <div v-if="!hasSelection" class="no-selection">
      请勾选左侧字段进行配置
    </div>

    <template v-else>
      <div class="op-group">
        <label>批量设置别名</label>
        <WiInput v-model="aliasModel" placeholder="统一别名（空则使用原字段名）" />
      </div>

      <div v-if="config.allNumeric" class="op-group">
        <label>批量聚合</label>
        <WiSelectButton v-model="aggModel" :options="aggOptions" />
      </div>

      <div class="op-group">
        <label>批量排序</label>
        <WiSelectButton v-model="sortModel" :options="sortOptions" />
      </div>

      <div class="op-group">
        <label>批量过滤条件</label>
        <WiInput v-model="filterModel" placeholder="例如: > 1000" />
      </div>

      <div class="op-group">
        <label>批量可见性</label>
        <div class="visibility-row">
          <button class="op-btn" :class="{ active: !hiddenModel }" @click="hiddenModel = false">
            显示
          </button>
          <button class="op-btn" :class="{ active: hiddenModel }" @click="hiddenModel = true">
            隐藏
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.operation-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  height: 100%;
  overflow-y: auto;
  min-width: 0;
}
.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--wi-text-color, #e8edf5);
  flex-shrink: 0;
}
.selected-label {
  font-size: 10px;
  color: var(--wi-text-secondary, #6a7b98);
  flex-shrink: 0;
}
.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--wi-text-secondary, #4a5a78);
  text-align: center;
}
.op-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.op-group label {
  font-size: 10px;
  color: var(--wi-text-secondary, #8a9bb5);
}
.visibility-row {
  display: flex;
  gap: 4px;
}
.op-btn {
  flex: 1;
  background: transparent;
  border: 1px solid var(--wi-border-color, #2a3448);
  color: var(--wi-text-secondary, #8a9bb5);
  font-size: 10px;
  padding: 5px 0;
  border-radius: 4px;
  cursor: pointer;
}
.op-btn.active {
  background: var(--wi-primary, #3b82f6);
  border-color: var(--wi-primary, #3b82f6);
  color: white;
}
.op-btn:hover:not(.active) {
  border-color: var(--wi-primary, #3b82f6);
  color: var(--wi-text-color, #e8edf5);
}
</style>
