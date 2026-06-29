import { buildFunnelChartOption } from '@/components/echarts'
import { createChartWidget } from '../shared/createChartWidget'

export default createChartWidget({
  key: 'funnel-chart',
  label: '漏斗图',
  description: '展示转化流程各阶段的数据对比与流失情况。',
  defaultTitle: '漏斗图',
  buildOption: buildFunnelChartOption,
})
