<script setup lang="ts">
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { Connection } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import {
  getChartBindings,
  isChartDataBound,
} from '@/utils/datasetBinding'
import ChartDatasetBindDialog from './ChartDatasetBindDialog.vue'

const props = defineProps<{
  block: VisualEditorBlockData
}>()

const dialogVisible = ref(false)

const chartBindings = computed(() => getChartBindings(props.block.datasetBindings))

const isBound = computed(() => isChartDataBound(props.block))

const summaryLines = computed(() => {
  const lines: { label: string, value: string, type: 'dimension' | 'metric' }[] = []
  const dim = chartBindings.value.dimension
  const met = chartBindings.value.metric
  if (dim?.field) {
    lines.push({ label: '维度', value: dim.field, type: 'dimension' })
  }
  if (met?.field) {
    lines.push({ label: '指标', value: met.field, type: 'metric' })
  }
  return lines
})
</script>

<template>
  <div class="chart-bind-panel">
    <div v-if="isBound" class="chart-bind-panel__summary">
      <div
        v-for="(line, index) in summaryLines"
        :key="`${line.type}-${index}`"
        class="chart-bind-panel__chip"
        :class="`chart-bind-panel__chip--${line.type}`"
      >
        <span class="chart-bind-panel__chip-label">{{ line.label }}</span>
        <span class="chart-bind-panel__chip-value">{{ line.value }}</span>
      </div>
    </div>
    <p v-else class="chart-bind-panel__empty">
      选择数据源，将字段拖入维度与指标区域以驱动图表展示。
    </p>
    <el-button type="primary" plain class="chart-bind-panel__btn" @click="dialogVisible = true">
      <el-icon class="mr-4px">
        <Connection />
      </el-icon>
      {{ isBound ? "修改图表数据" : "配置图表数据" }}
    </el-button>
    <ChartDatasetBindDialog v-model="dialogVisible" :block="block" />
  </div>
</template>

<style scoped>
.chart-bind-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-bind-panel__empty {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.chart-bind-panel__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chart-bind-panel__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  height: 28px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 12px;
}

.chart-bind-panel__chip--dataset {
  background: #f4f4f5;
  color: var(--el-text-color-regular);
}

.chart-bind-panel__chip--dimension {
  background: #e6f7f4;
  color: #0d9b8a;
}

.chart-bind-panel__chip--metric {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}

.chart-bind-panel__chip-label {
  opacity: 0.75;
  flex-shrink: 0;
}

.chart-bind-panel__chip-value {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-bind-panel__btn {
  align-self: flex-start;
}
</style>
