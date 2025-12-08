import BasicAreaChart from './src/BasicAreaChart.vue'
import { componentConfig } from './src/props'
import SmoothedLineChart from './src/SmoothedLineChart.vue'
import StackedLineChart from './src/StackedLineChart.vue'

export default [
  {
    name: 'WBasicAreaChart',
    component: BasicAreaChart,
    config: componentConfig,
  },
  {
    name: 'WSmoothedLineChart',
    component: SmoothedLineChart,
    config: componentConfig,
  },
  {
    name: 'WStackedLineChart',
    component: StackedLineChart,
    config: componentConfig,
  },
]

export {
  componentConfig,
  SmoothedLineChart,
  StackedLineChart,
}
