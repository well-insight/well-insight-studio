import type { ChartDatum } from '@/utils/datasetChart'
import { getEChartsThemeColors } from '../theme'

export interface BaseChartOptionParams {
  data: ChartDatum[]
  colors?: string[]
  compact?: boolean
  /** 目录 preset 或属性面板传入的样式变体 */
  chartVariant?: string
}

export type ChartThemeColors = ReturnType<typeof getEChartsThemeColors>

export function getColor(colors: string[] | undefined, index: number): string {
  if (!colors || colors.length === 0) {
    return '#409EFF'
  }
  return colors[index % colors.length]
}

export function truncateCategory(value: string, max = 6): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

export function defaultGrid(compact: boolean) {
  return {
    left: compact ? 36 : 44,
    right: 12,
    top: compact ? 8 : 12,
    bottom: compact ? 24 : 32,
    containLabel: false,
  }
}

export function categoryAxis(data: ChartDatum[], compact: boolean, theme: ChartThemeColors) {
  return {
    type: 'category' as const,
    data: data.map(d => d.category),
    axisLine: { lineStyle: { color: theme.border } },
    axisTick: { show: false },
    axisLabel: {
      color: theme.textRegular,
      fontSize: compact ? 10 : 11,
      interval: 0,
      formatter: (value: string) => truncateCategory(value),
    },
  }
}

export function valueAxis(compact: boolean, theme: ChartThemeColors) {
  return {
    type: 'value' as const,
    splitLine: {
      lineStyle: { color: theme.border, type: 'dashed' as const },
    },
    axisLabel: {
      color: theme.textSecondary,
      fontSize: compact ? 10 : 11,
    },
  }
}
