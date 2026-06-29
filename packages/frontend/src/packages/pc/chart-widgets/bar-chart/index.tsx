import { buildBarChartOption } from '@/components/echarts'
import { createChartWidget } from '../shared/createChartWidget'

export default createChartWidget({
  key: 'bar-chart',
  label: '柱状图',
  description: '在右侧「数据配置」中选择数据源，拖入维度与指标字段展示柱状图。',
  defaultTitle: '柱状图',
  defaultVariant: 'basic',
  variantOptions: [
    { label: '基础柱状图', value: 'basic' },
    { label: '渐变柱状图', value: 'gradient' },
    { label: '条形图', value: 'horizontal' },
  ],
  buildOption: buildBarChartOption,
})
