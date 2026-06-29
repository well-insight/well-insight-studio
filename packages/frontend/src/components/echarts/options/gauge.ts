import type { EChartsOption } from 'echarts'
import type { BaseChartOptionParams } from './common'
import { getColor } from './common'
import { getEChartsThemeColors } from '../theme'

export type GaugeChartOptionParams = BaseChartOptionParams

export function buildGaugeChartOption(params: GaugeChartOptionParams): EChartsOption {
  const { data, colors, compact = false } = params
  const theme = getEChartsThemeColors()
  const current = data[data.length - 1]?.value ?? data[0]?.value ?? 0
  const max = Math.max(Math.ceil(Math.max(...data.map(d => d.value), current) * 1.25), 100)
  const label = data[data.length - 1]?.category ?? data[0]?.category ?? '完成度'

  return {
    animation: !compact,
    series: [
      {
        type: 'gauge',
        min: 0,
        max,
        radius: compact ? '88%' : '90%',
        center: ['50%', compact ? '58%' : '55%'],
        progress: {
          show: true,
          width: compact ? 10 : 14,
          itemStyle: { color: getColor(colors, 0) },
        },
        axisLine: {
          lineStyle: {
            width: compact ? 10 : 14,
            color: [[1, theme.border]],
          },
        },
        axisTick: { show: false },
        splitLine: {
          length: compact ? 6 : 8,
          lineStyle: { color: theme.border, width: 1 },
        },
        axisLabel: {
          color: theme.textSecondary,
          fontSize: compact ? 9 : 10,
          distance: compact ? 12 : 16,
        },
        pointer: {
          itemStyle: { color: getColor(colors, 0) },
          width: compact ? 4 : 5,
        },
        anchor: {
          show: true,
          size: compact ? 6 : 8,
          itemStyle: { color: getColor(colors, 0) },
        },
        title: {
          show: !compact,
          offsetCenter: [0, '72%'],
          color: theme.textRegular,
          fontSize: 12,
        },
        detail: {
          valueAnimation: true,
          fontSize: compact ? 16 : 22,
          fontWeight: 600,
          color: theme.text,
          offsetCenter: [0, compact ? '18%' : '24%'],
          formatter: '{value}',
        },
        data: [{ value: current, name: label }],
      },
    ],
  }
}
