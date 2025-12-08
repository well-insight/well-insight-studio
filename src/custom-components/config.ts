import { uuid } from '@/utils'

export default [
  {
    title: '图表',
    icon: '图表',
    list: [
      {
        name: '柱状图',
        components: [
          {
            id: uuid(),
            type: 'chart',
            component: 'WMixedLineBarChart', // 组件名称，需要提前注册到 Vue
            label: '柱状图', // 左侧组件列表中显示的名字
          },
          {
            id: uuid(),
            type: 'chart',
            component: 'WHorizontalBarChart', // 组件名称，需要提前注册到 Vue
            label: '横向条形图', // 左侧组件列表中显示的名字
          },
        ],
      },
      {
        name: '折线图',
        components: [
          {
            id: uuid(),
            type: 'chart',
            component: 'WSmoothedLineChart', // 组件名称，需要提前注册到 Vue
            label: '平滑折线图', // 左侧组件列表中显示的名字
          },
          {
            id: uuid(),
            type: 'chart',
            component: 'WBasicAreaChart', // 组件名称，需要提前注册到 Vue
            label: '基础面积图', // 左侧组件列表中显示的名字
          },
          {
            id: uuid(),
            type: 'chart',
            component: 'WStackedLineChart', // 组件名称，需要提前注册到 Vue
            label: '堆叠折线图', // 左侧组件列表中显示的名字
          },
        ],
      },
      {
        name: '饼图',
        components: [
          {
            id: uuid(),
            type: 'chart',
            component: 'WBasicPieChart', // 组件名称，需要提前注册到 Vue
            label: '基础饼图', // 左侧组件列表中显示的名字
          },
        ],
      },
    ],
  },
  {
    title: '信息',
    icon: '信息',
    list: [],
  },
  {
    title: '列表',
    icon: '列表',
    list: [],
  },
  {
    title: '小组件',
    icon: '小组件',
    list: [
      {
        name: '按钮',
        components: [
          {
            id: uuid(),
            type: 'element',
            component: 'WButton', // 组件名称，需要提前注册到 Vue
            label: '按钮', // 左侧组件列表中显示的名字
          },
        ],
      },
    ],
  },
]
