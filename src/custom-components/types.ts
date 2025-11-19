import type { Component, CSSProperties } from 'vue'

export interface BaseProps {
  id?: string
  type: 'chart' | 'element' // 元素类性
  component: string // 组件名称，需要提前注册到 Vue
  label: string // 左侧组件列表中显示的名字
  icon?: string // 左侧组件列表中显示的图标
  animations?: string[] // 动画列表
  events?: Record<string, any> // 事件列表
  chartOption?: Record<string, any> // 图表组件的定制化样式
  style?: CSSProperties
  configs?: Record<string, any>
}

export interface ComponentExport<T = BaseProps> {
  name: string
  component: Component
  default?: T

}
