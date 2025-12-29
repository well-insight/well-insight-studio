import { uuid } from '@/utils'

export interface ComponentList {
  title: string
  icon: string
  list: {
    id: string
    type: string
    component: string
    label: string
  }[]
}

export default [
  {
    title: '基础',
    icon: '小组件',
    list: [
      {
        id: uuid(),
        type: 'element',
        component: 'WButton', // 组件名称，需要提前注册到 Vue
        label: '按钮', // 左侧组件列表中显示的名字
      },
      {
        id: uuid(),
        type: 'element',
        component: 'WText', // 组件名称，需要提前注册到 Vue
        label: '文本', // 左侧组件列表中显示的名字
      },
      {
        id: uuid(),
        type: 'element',
        component: 'WDivider', // 组件名称，需要提前注册到 Vue
        label: '分割线', // 左侧组件列表中显示的名字
      },
      {
        id: uuid(),
        type: 'element',
        component: 'WIcon', // 组件名称，需要提前注册到 Vue
        label: '图标', // 左侧组件列表中显示的名字
      },
    ],
  },
  {
    title: '表单',
    icon: '信息',
    list: [
      {
        id: uuid(),
        type: 'element',
        component: 'WInput', // 组件名称，需要提前注册到 Vue
        label: '输入框', // 左侧组件列表中显示的名字
      },
      {
        id: uuid(),
        type: 'element',
        component: 'WSelect', // 组件名称，需要提前注册到 Vue
        label: '下拉选择', // 左侧组件列表中显示的名字
      },
      {
        id: uuid(),
        type: 'element',
        component: 'WRadio', // 组件名称，需要提前注册到 Vue
        label: '单选框', // 左侧组件列表中显示的名字
      },
      {
        id: uuid(),
        type: 'element',
        component: 'WCheckBox', // 组件名称，需要提前注册到 Vue
        label: '复选框', // 左侧组件列表中显示的名字
      },
    ],
  },
  {
    title: '数据',
    icon: '信息',
    list: [],
  },
  {
    title: '图表',
    icon: '图表',
    list: [
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
      {
        id: uuid(),
        type: 'chart',
        component: 'WBasicPieChart', // 组件名称，需要提前注册到 Vue
        label: '基础饼图', // 左侧组件列表中显示的名字
      },
    ],
  },
  {
    title: '交互',
    icon: '列表',
    list: [],
  },
  {
    title: '媒体',
    icon: '列表',
    list: [],
  },
  {
    title: '容器',
    icon: '列表',
    list: [],
  },
  {
    title: '自定义',
    icon: '列表',
    list: [],
  },
] as ComponentList[]
