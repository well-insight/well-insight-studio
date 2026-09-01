<script setup lang="ts">
import type { Widget } from '@well-insight/shared'
import { computed, ref, watchEffect } from 'vue'
import { readCssColor } from '../../../../styles/color-utils'
import { useConfigStore } from '../../../../styles/stores/configStore'
import { useDataStore } from '../../../../styles/stores/dataStore'
import { applyFieldOps } from '../../utils/fieldOps'
import ChartWidget from '../widgets/ChartWidget.vue'
import KpiWidget from '../widgets/KpiWidget.vue'
import TableWidget from '../widgets/TableWidget.vue'

const config = useConfigStore()
const dataStore = useDataStore()

const previewWidget = computed<Widget>(() => ({
  id: 'preview',
  type: 'bar',
  title: '预览',
  dataSource: config.dataSource,
  x: 0,
  y: 0,
  width: 300,
  height: 200,
  color: readCssColor('--wi-color-primary'),
  visible: true,
  locked: true,
  config: {
    fieldOps: config.fieldOps,
    visibleFields: config.fields.filter(f => {
      const ops = config.fieldOps[f]
      return ops && !ops.hidden
    }),
  },
}))

const isEmpty = computed(() => previewWidget.value.config.visibleFields.length === 0)

const previewType = ref<'bar' | 'table' | 'kpi'>('bar')

const hasData = computed(() => {
  if (isEmpty.value) return false
  const data = dataStore.getTable(config.dataSource)
  const processed = applyFieldOps(data, config.fieldOps, previewWidget.value.config.visibleFields)
  return processed.rows.length > 0
})

// 当聚合字段存在时，柱状图可能比表格更直观，这里只提供预览容器
watchEffect(() => {
  if (isEmpty.value) previewType.value = 'bar'
})
</script>

<template>
  <div class="preview-panel">
    <div class="preview-header">
      <span>实时预览</span>
      <div class="preview-tabs">
        <button :class="{ active: previewType === 'bar' }" @click="previewType = 'bar'">
          柱状
        </button>
        <button :class="{ active: previewType === 'table' }" @click="previewType = 'table'">
          表格
        </button>
        <button :class="{ active: previewType === 'kpi' }" @click="previewType = 'kpi'">
          指标
        </button>
      </div>
    </div>

    <div class="preview-body">
      <div v-if="isEmpty" class="preview-empty">
        所有字段已隐藏，请显示至少一个字段
      </div>
      <div v-else-if="!hasData" class="preview-empty">
        过滤后无数据
      </div>
      <div v-else class="preview-widget">
        <KpiWidget v-if="previewType === 'kpi'" :widget="previewWidget" />
        <ChartWidget v-else-if="previewType === 'bar'" :widget="previewWidget" />
        <TableWidget v-else-if="previewType === 'table'" :widget="previewWidget" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid var(--wi-color-border);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.preview-tabs {
  display: flex;
  gap: 2px;
}
.preview-tabs button {
  background: transparent;
  border: 1px solid var(--wi-color-border);
  color: var(--wi-color-text-muted);
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
}
.preview-tabs button.active {
  background: var(--wi-color-primary);
  border-color: var(--wi-color-primary);
  color: white;
}
.preview-body {
  flex: 1;
  overflow: hidden;
  padding: 8px;
  min-height: 0;
}
.preview-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--wi-color-text-muted);
  text-align: center;
}
.preview-widget {
  height: 100%;
  border: 1px dashed var(--wi-color-border);
  border-radius: 6px;
  padding: 4px;
  overflow: hidden;
}
</style>
