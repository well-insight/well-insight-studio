<script setup lang="ts">
import type { Widget } from '@well-insight/shared'
import { computed } from 'vue'
import { useDataStore } from '../../../../styles/stores/dataStore'
import { useWidgetData } from '../../composables/useWidgetData'

const props = defineProps<{ widget: Widget }>()

const dataStore = useDataStore()

const { processed, isLoading } = useWidgetData(props.widget, dataStore.getTable(props.widget.dataSource))

const hasOps = computed(() => props.widget.config.visibleFields.length > 0)

interface KpiItem {
  label: string
  value: string
}

const items = computed<KpiItem[]>(() => {
  const { fields, displayFields, rows } = processed.value
  if (rows.length === 0 || fields.length === 0) return []

  if (hasOps.value) {
    // 配置生效：展示处理后第一行的各字段值
    const sampleRow = rows[0]!
    return fields.slice(0, 4).map((f, i) => {
      const val = sampleRow[i]
      return {
        label: displayFields[i] ?? f,
        value: typeof val === 'number' ? val.toLocaleString() : String(val ?? '—'),
      }
    })
  }

  // 默认概览统计
  const total = rows.reduce((sum, r) => sum + (parseFloat(String(r[0])) || 0), 0)
  const count = rows.length
  return [
    { label: '总记录', value: String(count) },
    { label: '总和', value: total.toFixed(1) },
    { label: '平均值', value: count ? (total / count).toFixed(2) : '0' },
    { label: '字段数', value: String(fields.length) },
  ]
})
</script>

<template>
  <div v-if="isLoading" class="widget-empty">
    加载数据中…
  </div>
  <div v-else-if="items.length" class="kpi-grid">
    <div
      v-for="item in items"
      :key="item.label"
      class="kpi-item"
      :style="{ borderLeftColor: widget.color }"
    >
      <div class="kpi-value" :style="{ color: widget.color }">
        {{ item.value }}
      </div>
      <div class="kpi-label">
        {{ item.label }}
      </div>
    </div>
  </div>
  <div v-else class="widget-empty">
    无数据，双击配置字段
  </div>
</template>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  height: 100%;
  align-content: center;
  overflow: hidden;
}
.kpi-item {
  border-left: 3px solid;
  padding: 2px 6px;
  min-width: 0;
}
.kpi-value {
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kpi-label {
  font-size: 9px;
  color: var(--wi-color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.widget-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--wi-color-text-muted);
  text-align: center;
}
</style>
