/**
 * 图表主题色 composable
 * 从画布主题 store 获取图表调色板，支持自定义覆盖
 * 仿照 echarts-theme-builder 的主题色体系设计
 */
import { computed } from 'vue'
import { useCanvasThemeStore } from '@/stores/canvasThemeStore'

/**
 * 默认图表调色板（theme 未提供时的后备）
 */
const FALLBACK_CHART_COLORS = [
  '#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399',
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
]

/**
 * 解析用户自定义颜色字符串为数组
 * 支持格式：'#409eff,#67c23a' 或 '#409eff, #67c23a'
 */
function parseColors(colorsStr?: string): string[] | null {
  if (!colorsStr || !colorsStr.trim()) {
    return null
  }
  const colors = colorsStr
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  return colors.length > 0 ? colors : null
}

/**
 * 获取图表颜色配置
 *
 * @param customColorsStr - 用户自定义颜色字符串（逗号分隔），可选
 * @returns 包含颜色数组和设置方法的对象
 *
 * @example
 * ```ts
 * const { chartColors } = useChartThemeColors()
 * // 或带自定义覆盖
 * const { chartColors } = useChartThemeColors(() => props.colors)
 * ```
 */
export function useChartThemeColors(customColorsStr?: () => string | undefined) {
  const themeStore = useCanvasThemeStore()

  /** 当前主题的图表调色板 */
  const themeChartColors = computed(() => {
    const colors = themeStore.chartColors
    return colors.length > 0 ? colors : FALLBACK_CHART_COLORS
  })

  /** 最终生效的图表颜色 */
  const chartColors = computed(() => {
    if (customColorsStr) {
      const parsed = parseColors(customColorsStr())
      if (parsed) {
        return parsed
      }
    }
    return themeChartColors.value
  })

  return {
    /** 图表颜色数组 */
    chartColors,
    /** 主题颜色数组（无自定义覆盖） */
    themeChartColors,
    /** 格式化颜色为 ECharts option 中的 color 字段 */
    toEChartsColor: computed(() => {
      return chartColors.value.map((color, index) => {
        // 对柱状图等需要区分每个条的场景，直接返回颜色本身
        return color
      })
    }),
  }
}
