import type { EChartsOption } from 'echarts'
import type { BaseChartOptionParams } from './common'
import { getColor } from './common'
import { getEChartsThemeColors } from '../theme'

export type FunnelChartOptionParams = BaseChartOptionParams

export function buildFunnelChartOption(params: FunnelChartOptionParams): EChartsOption {
  const { data, colors, compact = false } = params
  const theme = getEChartsThemeColors()
  const sorted = [...data].sort((a, b) => b.value - a.value)

  return {
    animation: !compact,
    color: colors,
    tooltip: {
      trigger: 'item',
      confine: true,
    },
    legend: compact
      ? undefined
      : {
          bottom: 0,
          textStyle: { color: theme.textRegular, fontSize: 11 },
        },
    series: [
      {
        type: 'funnel',
        left: compact ? '8%' : '10%',
        top: compact ? 8 : 16,
        bottom: compact ? 8 : 16,
        width: compact ? '84%' : '80%',
        min: 0,
        max: Math.max(...sorted.map(d => d.value), 1),
        minSize: '12%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: !compact,
          color: theme.text,
          fontSize: 11,
        },
        itemStyle: {
          borderColor: theme.bg,
          borderWidth: 1,
        },
        data: sorted.map((d, i) => ({
          name: d.category,
          value: d.value,
          itemStyle: colors ? { color: getColor(colors, i) } : undefined,
        })),
      },
    ],
  }
}
