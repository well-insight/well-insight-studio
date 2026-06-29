import type { EChartsOption } from 'echarts'
import type { BaseChartOptionParams } from './common'
import { categoryAxis, defaultGrid, getColor, valueAxis } from './common'
import { getEChartsThemeColors } from '../theme'

export type LineChartOptionParams = BaseChartOptionParams

export function buildLineChartOption(params: LineChartOptionParams): EChartsOption {
  const { data, colors, compact = false, chartVariant = 'basic' } = params
  const theme = getEChartsThemeColors()
  const isSmooth = chartVariant === 'smooth'
  const isArea = chartVariant === 'area'

  return {
    animation: !compact,
    color: colors,
    grid: defaultGrid(compact),
    tooltip: {
      trigger: 'axis',
      confine: true,
    },
    xAxis: categoryAxis(data, compact, theme),
    yAxis: valueAxis(compact, theme),
    series: [
      {
        type: 'line',
        data: data.map(d => d.value),
        smooth: isSmooth,
        symbol: compact ? 'none' : 'circle',
        symbolSize: compact ? 4 : 6,
        lineStyle: {
          width: compact ? 2 : 2.5,
          color: getColor(colors, 0),
        },
        itemStyle: {
          color: getColor(colors, 0),
        },
        areaStyle: isArea
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: `${getColor(colors, 0)}55` },
                  { offset: 1, color: `${getColor(colors, 0)}08` },
                ],
              },
            }
          : undefined,
      },
    ],
  }
}
