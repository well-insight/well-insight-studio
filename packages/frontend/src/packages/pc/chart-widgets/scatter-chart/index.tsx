import { buildScatterChartOption } from '@/components/echarts'
import { createChartWidget } from '../shared/createChartWidget'

export default createChartWidget({
  key: 'scatter-chart',
  label: '散点图',
  description: '展示数据分布与相关性，支持气泡大小映射数值。',
  defaultTitle: '散点图',
  defaultVariant: 'basic',
  variantOptions: [
    { label: '基础散点图', value: 'basic' },
    { label: '气泡图', value: 'bubble' },
  ],
  buildOption: buildScatterChartOption,
})
