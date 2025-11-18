export interface BaseProps {
  id: string
  type: 'chart' | 'element' // 元素类性
  component: string // 组件名称，需要提前注册到 Vue
  label: string // 左侧组件列表中显示的名字
  propValue: '柱状图' // 组件所使用的值
  icon: '平台' // 左侧组件列表中显示的图标
  animations: [] // 动画列表
  events: {} // 事件列表
  chartOption: {} // 图表组件的定制化样式
  style: { // 组件样式
    width: '500px'
    height: '300px'
    fontSize: 14
    fontWeight: 500
    lineHeight: ''
    letterSpacing: 0
    textAlign: ''
    color: ''
  }
}
