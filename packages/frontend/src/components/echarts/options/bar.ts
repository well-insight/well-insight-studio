import type { EChartsOption } from 'echarts'
import type { ChartDatum } from '@/utils/datasetChart'
import { getEChartsThemeColors } from '../theme'

export interface BarChartOptionParams {
  data: ChartDatum[]
  /** 颜色调色板，按类目索引分配 */
  colors?: string[]
  compact?: boolean
}

/**
 * 根据调色板获取指定索引的颜色
 */
function getColor(colors: string[] | undefined, index: number): string {
  if (!colors || colors.length === 0) {
    return '#409EFF'
  }
  return colors[index % colors.length]
}

export function buildBarChartOption(params: BarChartOptionParams): EChartsOption {
  const { data, colors, compact = false } = params
  const theme = getEChartsThemeColors()

  return {
    animation: !compact,
    color: colors,
    grid: {
      left: compact ? 36 : 44,
      right: 12,
      top: compact ? 8 : 12,
      bottom: compact ? 24 : 32,
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      confine: true,
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.category),
      axisLine: { lineStyle: { color: theme.border } },
      axisTick: { show: false },
      axisLabel: {
        color: theme.textRegular,
        fontSize: compact ? 10 : 11,
        interval: 0,
        formatter: (value: string) => (value.length > 6 ? `${value.slice(0, 5)}…` : value),
      },
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: { color: theme.border, type: 'dashed' },
      },
      axisLabel: {
        color: theme.textSecondary,
        fontSize: compact ? 10 : 11,
      },
    },
    series: [
      {
        type: 'bar',
        data: data.map((d, i) => ({
          value: d.value,
          itemStyle: { color: getColor(colors, i), borderRadius: [3, 3, 0, 0] },
        })),
        barMaxWidth: compact ? 28 : 48,
        label: compact
          ? { show: false }
          : {
              show: true,
              position: 'top',
              color: theme.text,
              fontSize: 10,
              formatter: (p: { value: number }) => p.value,
            },
      },
    ],
  }
}
