import type { BaseChartOptionParams } from '@/components/echarts'
import {
  buildBarChartOption,
  buildFunnelChartOption,
  buildGaugeChartOption,
  buildLineChartOption,
  buildPieChartOption,
  buildRadarChartOption,
  buildScatterChartOption,
} from '@/components/echarts'
import type { EChartsOption } from 'echarts'

const CHART_OPTION_BUILDERS: Record<string, (params: BaseChartOptionParams) => EChartsOption> = {
  'bar-chart': buildBarChartOption,
  'line-chart': buildLineChartOption,
  'pie-chart': buildPieChartOption,
  'scatter-chart': buildScatterChartOption,
  'radar-chart': buildRadarChartOption,
  'gauge-chart': buildGaugeChartOption,
  'funnel-chart': buildFunnelChartOption,
}

export function getChartOptionBuilder(componentKey: string) {
  return CHART_OPTION_BUILDERS[componentKey] ?? buildBarChartOption
}
