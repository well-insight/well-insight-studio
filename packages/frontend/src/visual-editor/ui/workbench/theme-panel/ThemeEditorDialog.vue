<script setup lang="ts">
import type { CanvasTheme } from '@/common/types/canvasTheme'
import type { EChartsThemeData } from '@/common/types/echartsTheme'
import * as echarts from 'echarts'
import { cloneDeep, debounce } from 'lodash-es'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { themeToCSSVars } from '@/common/types/canvasTheme'
import { applyBrandColorsFromMap, ensureEchartsTheme, syncCanvasToEcharts, syncEchartsToCanvas } from '@/common/utils/themeBridge'
import { generateEChartsTheme } from '@/common/utils/themeGenerator'
import { useCanvasThemeStore } from '@/stores/canvasThemeStore'
import EchartsThemeConfigPanel from './components/EchartsThemeConfigPanel.vue'

const props = withDefaults(
  defineProps<{
    editThemeId?: string | null
    visible?: boolean
  }>(),
  { editThemeId: null, visible: false },
)

const emit = defineEmits<{
  'update:visible': [val: boolean]
  'saved': []
}>()

const themeStore = useCanvasThemeStore()
const THEME_PREVIEW_NAME = 'canvas-theme-preview'

const themeName = ref('')
const editingTheme = ref<CanvasTheme>(themeStore.getDefaultTheme())
const echartsTheme = ref<EChartsThemeData>(ensureEchartsTheme(editingTheme.value))
const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

function initEditing() {
  if (props.editThemeId) {
    const theme = themeStore.getThemeById(props.editThemeId)
    if (theme) {
      editingTheme.value = cloneDeep(theme)
      echartsTheme.value = ensureEchartsTheme(editingTheme.value)
      const meta = themeStore.allThemeMetas.find(m => m.id === props.editThemeId)
      themeName.value = meta?.name ?? theme.name
      return
    }
  }
  editingTheme.value = themeStore.getDefaultTheme()
  echartsTheme.value = ensureEchartsTheme(editingTheme.value)
  themeName.value = ''
}

function getBarChartOption() {
  const defaultAxis = echartsTheme.value.axis?.[0]
  return {
    backgroundColor: echartsTheme.value.backgroundColor,
    color: echartsTheme.value.color,
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'cross' as const,
        lineStyle: {
          color: echartsTheme.value.tooltipAxisColor,
          width: echartsTheme.value.tooltipAxisWidth,
        },
        crossStyle: {
          color: echartsTheme.value.tooltipAxisColor,
          width: echartsTheme.value.tooltipAxisWidth,
        },
      },
    },
    legend: {
      data: ['系列一', '系列二'],
      textStyle: { color: echartsTheme.value.legendTextColor },
      right: 0,
      top: 0,
    },
    grid: {
      left: echartsTheme.value.gridLeft === '' ? '10%' : echartsTheme.value.gridLeft,
      right: echartsTheme.value.gridRight === '' ? '10%' : echartsTheme.value.gridRight,
      top: echartsTheme.value.gridTop === '' ? 60 : echartsTheme.value.gridTop,
      bottom: echartsTheme.value.gridBottom === '' ? 60 : echartsTheme.value.gridBottom,
    },
    xAxis: {
      type: 'category' as const,
      data: ['一月', '二月', '三月', '四月', '五月', '六月'],
      axisLine: {
        show: defaultAxis?.axisLineShow ?? true,
        lineStyle: { color: defaultAxis?.axisLineColor ?? '#54555a' },
      },
      axisTick: {
        show: defaultAxis?.axisTickShow ?? true,
        lineStyle: { color: defaultAxis?.axisTickColor ?? '#54555a' },
      },
      axisLabel: {
        show: defaultAxis?.axisLabelShow ?? true,
        color: defaultAxis?.axisLabelColor ?? '#54555a',
      },
      splitLine: {
        show: defaultAxis?.splitLineShow ?? false,
        lineStyle: { color: defaultAxis?.splitLineColor ?? ['#dbdee4'] },
      },
      splitArea: {
        show: defaultAxis?.splitAreaShow ?? false,
        areaStyle: { color: defaultAxis?.splitAreaColor ?? ['rgba(234,237,245,0.5)'] },
      },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: {
        show: defaultAxis?.axisLineShow ?? true,
        lineStyle: { color: defaultAxis?.axisLineColor ?? '#54555a' },
      },
      axisTick: {
        show: defaultAxis?.axisTickShow ?? true,
        lineStyle: { color: defaultAxis?.axisTickColor ?? '#54555a' },
      },
      axisLabel: {
        show: defaultAxis?.axisLabelShow ?? true,
        color: defaultAxis?.axisLabelColor ?? '#54555a',
      },
      splitLine: {
        show: true,
        lineStyle: { color: defaultAxis?.splitLineColor ?? ['#dbdee4'] },
      },
    },
    series: [
      {
        name: '系列一',
        type: 'bar' as const,
        data: [120, 200, 150, 80, 70, 110],
        barWidth: '35%',
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '系列二',
        type: 'bar' as const,
        data: [90, 140, 120, 100, 90, 70],
        barWidth: '35%',
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
    ],
  }
}

const renderChart = debounce(() => {
  if (!chartRef.value)
    return
  const themeConfig = generateEChartsTheme(echartsTheme.value)
  echarts.registerTheme(THEME_PREVIEW_NAME, themeConfig)

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value, THEME_PREVIEW_NAME)
  }
  else {
    chartInstance.dispose()
    chartInstance = echarts.init(chartRef.value, THEME_PREVIEW_NAME)
  }
  chartInstance.setOption(getBarChartOption())
}, 100)

watch(echartsTheme, () => {
  applyBrandColorsFromMap(editingTheme.value, echartsTheme.value.color)
  renderChart()
}, { deep: true })

// 当画布主题的背景/文字/边框/填充/阴影变化时同步到 echartsTheme
watch(
  () => [
    editingTheme.value.bg,
    editingTheme.value.text,
    editingTheme.value.border,
    editingTheme.value.fill,
    editingTheme.value.shadow,
  ],
  () => {
    echartsTheme.value = ensureEchartsTheme(editingTheme.value)
  },
  { deep: true, flush: 'post' },
)

watch(
  () => [props.visible, props.editThemeId] as const,
  ([visible]) => {
    if (visible) {
      initEditing()
      nextTick(renderChart)
    }
    else {
      chartInstance?.dispose()
      chartInstance = null
    }
  },
)

const previewStyle = computed(() => {
  const vars = themeToCSSVars(editingTheme.value)
  return {
    ...vars,
    color: editingTheme.value.text.primary,
    backgroundColor: editingTheme.value.bg.page,
  } as Record<string, string>
})

function handleConfirm() {
  const name = themeName.value.trim() || '自定义主题'
  syncEchartsToCanvas(editingTheme.value, echartsTheme.value)
  syncCanvasToEcharts(editingTheme.value)

  themeStore.saveUserTheme(props.editThemeId || null, name, cloneDeep(editingTheme.value))
  emit('saved')
  emit('update:visible', false)
}

function handleCancel() {
  emit('update:visible', false)
}

onBeforeUnmount(() => {
  chartInstance?.dispose()
  chartInstance = null
  renderChart.cancel()
})
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="editThemeId ? '编辑主题' : '新建主题'"
    width="1100px"
    top="4vh"
    :close-on-click-modal="false"
    destroy-on-close
    class="theme-editor-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="theme-editor-layout">
      <div class="theme-editor-left">
        <div class="theme-editor-name">
          <el-input v-model="themeName" placeholder="输入主题名称" clearable />
        </div>
        <el-scrollbar max-height="calc(80vh - 180px)">
          <EchartsThemeConfigPanel
            v-model:echarts-theme="echartsTheme"
            v-model:canvas-theme="editingTheme"
          />
        </el-scrollbar>
      </div>

      <div class="theme-editor-right" :style="previewStyle">
        <div class="theme-editor-preview-title">
          预览
        </div>
        <div class="theme-editor-preview-section">
          <div class="theme-editor-preview-label">
            柱状图
          </div>
          <div ref="chartRef" class="theme-editor-chart" />
        </div>
        <div class="theme-editor-preview-section">
          <div class="theme-editor-preview-label">
            按钮组件
          </div>
          <div class="theme-editor-buttons">
            <div class="theme-editor-buttons__row">
              <el-button type="primary" size="small">
                主色
              </el-button>
              <el-button type="success" size="small">
                成功
              </el-button>
              <el-button type="warning" size="small">
                警告
              </el-button>
              <el-button type="danger" size="small">
                危险
              </el-button>
              <el-button type="info" size="small">
                信息
              </el-button>
            </div>
            <div class="theme-editor-buttons__row">
              <el-button plain type="primary" size="small">
                幽灵按钮
              </el-button>
              <el-button text type="primary" size="small">
                文字按钮
              </el-button>
            </div>
            <div class="theme-editor-buttons__row">
              <el-input placeholder="输入框预览" size="small" style="max-width: 200px" />
              <el-tag type="primary" size="small">
                标签
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">
        取消
      </el-button>
      <el-button type="primary" :disabled="!themeName.trim()" @click="handleConfirm">
        确认保存
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.theme-editor-layout {
  display: flex;
  gap: 0;
  min-height: 520px;
}

.theme-editor-left {
  flex: 1;
  min-width: 0;
  padding-right: 16px;
  border-right: 1px solid var(--el-border-color-lighter);
}

.theme-editor-name {
  margin-bottom: 12px;
}

.theme-editor-name :deep(.el-input__wrapper) {
  border-radius: 8px;
}

.theme-editor-right {
  width: 340px;
  flex-shrink: 0;
  padding: 0 0 0 16px;
  display: flex;
  flex-direction: column;
}

.theme-editor-preview-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.theme-editor-preview-section {
  margin-bottom: 12px;
}

.theme-editor-preview-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.theme-editor-chart {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.theme-editor-buttons__row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.theme-editor-buttons__row:last-child {
  margin-bottom: 0;
}

/* Dialog 全局样式 */
:global(.theme-editor-dialog) {
  --el-dialog-content-font-size: 14px;
}

:global(.theme-editor-dialog .el-dialog__body) {
  padding: 16px 20px;
  overflow: hidden;
}

:global(.theme-editor-dialog .el-dialog__header) {
  padding: 16px 20px 0;
  margin: 0;
}

:global(.theme-editor-dialog .el-dialog__footer) {
  padding: 8px 20px 16px;
}

:global(.theme-editor-dialog .el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
}
</style>
