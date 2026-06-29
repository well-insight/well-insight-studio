import type { EChartsOption } from 'echarts'
import type { BaseChartOptionParams } from './common'
import { getColor } from './common'
import { getEChartsThemeColors } from '../theme'

export type PieChartOptionParams = BaseChartOptionParams

export function buildPieChartOption(params: PieChartOptionParams): EChartsOption {
  const { data, colors, compact = false, chartVariant = 'basic' } = params
  const theme = getEChartsThemeColors()
  const isDoughnut = chartVariant === 'doughnut'
  const isRose = chartVariant === 'rose'

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
          orient: 'vertical',
          right: 8,
          top: 'center',
          textStyle: { color: theme.textRegular, fontSize: 11 },
        },
    series: [
      {
        type: 'pie',
        radius: isDoughnut ? ['42%', '68%'] : isRose ? [20, compact ? 52 : 72] : '68%',
        center: compact ? ['50%', '50%'] : ['40%', '50%'],
        roseType: isRose ? 'radius' : undefined,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: theme.bg,
          borderWidth: 2,
        },
        label: compact
          ? { show: false }
          : {
              color: theme.text,
              fontSize: 11,
            },
        data: data.map((d, i) => ({
          name: d.category,
          value: d.value,
          itemStyle: colors ? { color: getColor(colors, i) } : undefined,
        })),
      },
    ],
  }
}
