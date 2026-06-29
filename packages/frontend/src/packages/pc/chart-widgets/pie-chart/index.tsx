import { buildPieChartOption } from '@/components/echarts'
import { createChartWidget } from '../shared/createChartWidget'

export default createChartWidget({
  key: 'pie-chart',
  label: '饼图',
  description: '展示各部分占整体的比例构成，支持环形与玫瑰图样式。',
  defaultTitle: '饼图',
  defaultVariant: 'basic',
  variantOptions: [
    { label: '基础饼图', value: 'basic' },
    { label: '环形图', value: 'doughnut' },
    { label: '玫瑰图', value: 'rose' },
  ],
  buildOption: buildPieChartOption,
})
