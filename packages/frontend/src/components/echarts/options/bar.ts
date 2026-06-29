import type { EChartsOption } from 'echarts'
import type { BaseChartOptionParams } from './common'
import { categoryAxis, defaultGrid, getColor, valueAxis } from './common'
import { getEChartsThemeColors } from '../theme'

export type BarChartOptionParams = BaseChartOptionParams

export function buildBarChartOption(params: BarChartOptionParams): EChartsOption {
  const { data, colors, compact = false, chartVariant = 'basic' } = params
  const theme = getEChartsThemeColors()
  const isHorizontal = chartVariant === 'horizontal'

  const gradientColor = {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: isHorizontal ? 1 : 0,
    y2: isHorizontal ? 0 : 1,
    colorStops: [
      { offset: 0, color: getColor(colors, 0) },
      { offset: 1, color: `${getColor(colors, 0)}66` },
    ],
  }

  const barColor = chartVariant === 'gradient' ? gradientColor : getColor(colors, 0)

  return {
    animation: !compact,
    color: colors,
    grid: defaultGrid(compact),
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      confine: true,
    },
    xAxis: isHorizontal ? valueAxis(compact, theme) : categoryAxis(data, compact, theme),
    yAxis: isHorizontal ? categoryAxis(data, compact, theme) : valueAxis(compact, theme),
    series: [
      {
        type: 'bar',
        data: data.map(d => d.value),
        barMaxWidth: compact ? 28 : 48,
        itemStyle: {
          color: barColor,
          borderRadius: isHorizontal ? [0, 3, 3, 0] : [3, 3, 0, 0],
        },
        label: compact
          ? { show: false }
          : {
              show: true,
              position: isHorizontal ? 'right' : 'top',
              color: theme.text,
              fontSize: 10,
            },
      },
    ],
  }
}

export type { BaseChartOptionParams } from './common'
