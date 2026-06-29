import type { EChartsOption } from 'echarts'
import type { BaseChartOptionParams } from './common'
import { defaultGrid, getColor, valueAxis } from './common'
import { getEChartsThemeColors } from '../theme'

export type ScatterChartOptionParams = BaseChartOptionParams

export function buildScatterChartOption(params: ScatterChartOptionParams): EChartsOption {
  const { data, colors, compact = false, chartVariant = 'basic' } = params
  const theme = getEChartsThemeColors()
  const isBubble = chartVariant === 'bubble'
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return {
    animation: !compact,
    color: colors,
    grid: defaultGrid(compact),
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: (p: { name?: string, value?: number[] }) =>
        `${p.name ?? ''}: ${p.value?.[1] ?? ''}`,
    },
    xAxis: {
      ...valueAxis(compact, theme),
      splitLine: { show: false },
    },
    yAxis: valueAxis(compact, theme),
    series: [
      {
        type: 'scatter',
        symbolSize: (val: number[]) => {
          if (!isBubble)
            return compact ? 8 : 12
          const size = val[2] ?? val[1]
          return compact ? 6 + (size / maxValue) * 14 : 10 + (size / maxValue) * 22
        },
        data: data.map((d, i) => ({
          name: d.category,
          value: [i + 1, d.value, d.value],
          itemStyle: { color: getColor(colors, i) },
        })),
      },
    ],
  }
}
