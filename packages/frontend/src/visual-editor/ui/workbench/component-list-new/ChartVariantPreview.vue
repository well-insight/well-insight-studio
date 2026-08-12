<script lang="ts" setup>
import { computed } from 'vue'
import { getChartOptionBuilder } from '@/packages/pc/chart-widgets/shared/chartOptionBuilders'
import DatasetChartView from '@/packages/pc/chart-widgets/shared/DatasetChartView'

const props = defineProps<{
  componentKey: string
  chartVariant?: string
}>()

const buildOption = computed(() => getChartOptionBuilder(props.componentKey))
const variant = computed(() => props.chartVariant ?? 'basic')
</script>

<template>
  <div class="chart-variant-preview">
    <DatasetChartView
      compact
      :chart-variant="variant"
      :build-option="buildOption"
    />
  </div>
</template>

<style scoped>
.chart-variant-preview {
  width: 100%;
  height: 168px;
  min-height: 168px;
}

.chart-variant-preview :deep(.dataset-chart-view) {
  width: 100%;
  height: 100%;
}
</style>
