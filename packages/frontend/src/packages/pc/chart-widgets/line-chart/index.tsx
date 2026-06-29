import { buildLineChartOption } from '@/components/echarts'
import { createChartWidget } from '../shared/createChartWidget'

export default createChartWidget({
  key: 'line-chart',
  label: '折线图',
  description: '展示数据随类目变化的趋势，支持平滑曲线与面积填充。',
  defaultTitle: '折线图',
  defaultVariant: 'basic',
  variantOptions: [
    { label: '基础折线图', value: 'basic' },
    { label: '平滑折线图', value: 'smooth' },
    { label: '面积图', value: 'area' },
  ],
  buildOption: buildLineChartOption,
})
