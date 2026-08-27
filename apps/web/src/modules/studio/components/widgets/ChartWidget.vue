<script setup lang="ts">
import type { Widget } from '@well-insight/shared'
import type {ChartKind} from '../../utils/chart';
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDataStore } from '../../../../styles/stores/dataStore'
import { useWidgetData } from '../../composables/useWidgetData'
import { buildChartOption  } from '../../utils/chart'

const props = defineProps<{ widget: Widget }>()

echarts.use([BarChart, LineChart, PieChart, GridComponent, TooltipComponent, CanvasRenderer])

const dataStore = useDataStore()
const chartEl = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const { processed, isLoading } = useWidgetData(props.widget, dataStore.getTable(props.widget.dataSource))

const option = computed(() =>
  buildChartOption(
    props.widget.type as ChartKind,
    processed.value,
    props.widget.color,
  ),
)

const isEmpty = computed(() => processed.value.rows.length === 0 || processed.value.fields.length === 0)

function render() {
  if (!chartEl.value) return
  if (!chart) chart = echarts.init(chartEl.value)
  chart.setOption(option.value, true)
}

onMounted(() => {
  render()
  resizeObserver = new ResizeObserver(() => chart?.resize())
  if (chartEl.value) resizeObserver.observe(chartEl.value)
})

watch(option, render)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div v-if="isLoading" class="widget-empty">
    加载数据中…
  </div>
  <div v-else-if="!isEmpty" ref="chartEl" class="chart-body" />
  <div v-else class="widget-empty">
    无数据，双击配置字段
  </div>
</template>

<style scoped>
.chart-body {
  width: 100%;
  height: 100%;
  min-height: 0;
}
.widget-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--wi-text-secondary, #4a5a78);
  text-align: center;
}
</style>
