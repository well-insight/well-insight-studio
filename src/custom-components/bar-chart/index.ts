import HorizontalBarChart from './src/HorizontalBarChart.vue'
import MixedLineBarChart from './src/MixedLineBarChart.vue'
import { componentConfig } from './src/props'

export default [
  {
    name: 'WHorizontalBarChart',
    component: HorizontalBarChart,
    config: componentConfig,
  },
  {
    name: 'WMixedLineBarChart',
    component: MixedLineBarChart,
    config: componentConfig,
  },
]

export {
  HorizontalBarChart,
  MixedLineBarChart,
}
