import { buildGaugeChartOption } from '@/components/echarts'
import { createChartWidget } from '../shared/createChartWidget'

export default createChartWidget({
  key: 'gauge-chart',
  label: '仪表盘',
  description: '单指标进度或完成度展示，突出当前达成情况。',
  defaultTitle: '仪表盘',
  buildOption: buildGaugeChartOption,
})
