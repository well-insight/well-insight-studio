import type { EChartsOption } from 'echarts'
import type { BaseChartOptionParams } from './common'
import { getColor } from './common'
import { getEChartsThemeColors } from '../theme'

export type RadarChartOptionParams = BaseChartOptionParams

export function buildRadarChartOption(params: RadarChartOptionParams): EChartsOption {
  const { data, colors, compact = false } = params
  const theme = getEChartsThemeColors()
  const maxVal = Math.max(...data.map(d => d.value), 10)

  return {
    animation: !compact,
    color: colors,
    tooltip: {
      trigger: 'item',
      confine: true,
    },
    radar: {
      radius: compact ? '58%' : '62%',
      center: ['50%', compact ? '52%' : '50%'],
      indicator: data.map(d => ({
        name: d.category,
        max: Math.ceil(maxVal * 1.2),
      })),
      axisName: {
        color: theme.textRegular,
        fontSize: compact ? 10 : 11,
      },
      splitLine: {
        lineStyle: { color: theme.border },
      },
      splitArea: {
        show: false,
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: data.map(d => d.value),
            name: '指标',
            areaStyle: {
              color: `${getColor(colors, 0)}33`,
            },
            lineStyle: {
              color: getColor(colors, 0),
              width: 2,
            },
            itemStyle: {
              color: getColor(colors, 0),
            },
          },
        ],
      },
    ],
  }
}
