import { buildRadarChartOption } from '@/components/echarts'
import { createChartWidget } from '../shared/createChartWidget'

export default createChartWidget({
  key: 'radar-chart',
  label: '雷达图',
  description: '多维度指标对比，适合能力模型与综合评估展示。',
  defaultTitle: '雷达图',
  buildOption: buildRadarChartOption,
})
