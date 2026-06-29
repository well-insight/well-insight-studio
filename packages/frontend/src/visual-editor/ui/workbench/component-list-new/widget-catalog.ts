import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { cloneDeep } from 'lodash-es'
import { createNewBlock } from '@/visual-editor/visual-editor.utils'
import { visualConfig } from '@/visual.config'

/** 目录第三级：具体组件项 */
export interface WidgetVariantItem {
  key: string
  label: string
  description?: string
  componentKey: string
  preset?: Record<string, unknown>
  comingSoon?: boolean
}

/** 目录第二级：分组 */
export interface WidgetGroupItem {
  key: string
  label: string
  icon?: string
  variants: WidgetVariantItem[]
}

export interface WidgetCatalogConfig {
  title: string
  icon: string
  /** 左侧分组列标题 */
  groupColumnLabel: string
  groups: WidgetGroupItem[]
}

export const BASE_WIDGET_CATALOG: WidgetCatalogConfig = {
  title: '基础组件',
  icon: 'component-base',
  groupColumnLabel: '组件分类',
  groups: [
    {
      key: 'common',
      label: '常用',
      icon: 'component-base',
      variants: [
        {
          key: 'button',
          label: '按钮',
          description: '触发操作，如提交、跳转、调用 API',
          componentKey: 'button',
        },
        {
          key: 'text',
          label: '文本',
          description: '展示静态或动态文本，支持样式配置',
          componentKey: 'text',
        },
      ],
    },
    {
      key: 'media',
      label: '媒体展示',
      icon: 'component-base',
      variants: [
        {
          key: 'image',
          label: '图片',
          description: '展示图片，支持懒加载与预览',
          componentKey: 'image',
        },
        {
          key: 'carousel',
          label: '轮播图',
          description: '循环播放多张图片或内容',
          componentKey: 'carousel',
        },
      ],
    },
    {
      key: 'layout',
      label: '布局分割',
      icon: 'component-base',
      variants: [
        {
          key: 'divider',
          label: '分割线',
          description: '视觉分隔内容，可带文字',
          componentKey: 'divider',
        },
      ],
    },
    {
      key: 'feedback',
      label: '状态反馈',
      icon: 'component-base',
      variants: [
        {
          key: 'progress',
          label: '进度条',
          description: '展示任务完成进度',
          componentKey: 'progress',
        },
      ],
    },
  ],
}

export const FORM_WIDGET_CATALOG: WidgetCatalogConfig = {
  title: '表单组件',
  icon: 'component-form',
  groupColumnLabel: '字段类型',
  groups: [
    {
      key: 'text-input',
      label: '文本输入',
      icon: 'component-form',
      variants: [
        {
          key: 'input-text',
          label: '单行输入框',
          description: '单行文本、密码输入',
          componentKey: 'input',
        },
        {
          key: 'input-textarea',
          label: '多行文本框',
          description: '多行文本输入',
          componentKey: 'input',
          preset: { type: 'textarea' },
        },
      ],
    },
    {
      key: 'selector',
      label: '选择器',
      icon: 'component-form',
      variants: [
        {
          key: 'select',
          label: '下拉框',
          description: '单选/多选下拉，支持搜索',
          componentKey: 'select',
        },
        {
          key: 'checkbox',
          label: '复选框',
          description: '一组选项中可选择多个',
          componentKey: 'checkbox',
        },
        {
          key: 'radio',
          label: '单选框',
          description: '一组选项中只能选择一个',
          componentKey: 'radio',
        },
      ],
    },
    {
      key: 'number-switch',
      label: '数值与开关',
      icon: 'component-form',
      variants: [
        {
          key: 'switch',
          label: '开关',
          description: '布尔值切换',
          componentKey: 'switch',
        },
        {
          key: 'slider',
          label: '滑块',
          description: '数值范围选择',
          componentKey: 'slider',
        },
        {
          key: 'rate',
          label: '评分',
          description: '星级评分输入',
          componentKey: 'rate',
        },
      ],
    },
    {
      key: 'datetime',
      label: '日期时间',
      icon: 'component-form',
      variants: [
        {
          key: 'datetimePicker',
          label: '时间选择器',
          description: '日期、时间、日期时间选择',
          componentKey: 'datetimePicker',
        },
      ],
    },
  ],
}

export const CHART_WIDGET_CATALOG: WidgetCatalogConfig = {
  title: '图表组件',
  icon: 'component-chart',
  groupColumnLabel: '图表类型',
  groups: [
    {
      key: 'bar',
      label: '柱状图',
      icon: 'component-chart',
      variants: [
        {
          key: 'bar-basic',
          label: '基础柱状图',
          description: '分类维度 + 单一指标，适合对比分析',
          componentKey: 'bar-chart',
          preset: { chartVariant: 'basic' },
        },
        {
          key: 'bar-gradient',
          label: '渐变柱状图',
          description: '柱体渐变填充，突出视觉层次',
          componentKey: 'bar-chart',
          preset: { chartVariant: 'gradient' },
        },
        {
          key: 'bar-stack',
          label: '堆叠柱状图',
          description: '多系列堆叠，展示构成与总量',
          componentKey: 'bar-chart',
          comingSoon: true,
        },
        {
          key: 'bar-horizontal',
          label: '条形图',
          description: '横向柱状，适合长标签类目',
          componentKey: 'bar-chart',
          preset: { chartVariant: 'horizontal' },
        },
      ],
    },
    {
      key: 'line',
      label: '折线图',
      icon: 'component-chart',
      variants: [
        {
          key: 'line-basic',
          label: '基础折线图',
          description: '展示趋势变化',
          componentKey: 'line-chart',
          preset: { chartVariant: 'basic' },
        },
        {
          key: 'line-smooth',
          label: '平滑折线图',
          description: '曲线平滑，适合连续趋势',
          componentKey: 'line-chart',
          preset: { chartVariant: 'smooth' },
        },
        {
          key: 'line-area',
          label: '面积图',
          description: '折线下方填充，强调量级',
          componentKey: 'line-chart',
          preset: { chartVariant: 'area' },
        },
      ],
    },
    {
      key: 'pie',
      label: '饼图',
      icon: 'component-chart',
      variants: [
        {
          key: 'pie-basic',
          label: '基础饼图',
          description: '展示占比构成',
          componentKey: 'pie-chart',
          preset: { chartVariant: 'basic' },
        },
        {
          key: 'pie-doughnut',
          label: '环形图',
          description: '中空环形，中心可放摘要',
          componentKey: 'pie-chart',
          preset: { chartVariant: 'doughnut' },
        },
        {
          key: 'pie-rose',
          label: '玫瑰图',
          description: '半径映射数值，对比更直观',
          componentKey: 'pie-chart',
          preset: { chartVariant: 'rose' },
        },
      ],
    },
    {
      key: 'scatter',
      label: '散点图',
      icon: 'component-chart',
      variants: [
        {
          key: 'scatter-basic',
          label: '基础散点图',
          description: '二维分布与相关性',
          componentKey: 'scatter-chart',
          preset: { chartVariant: 'basic' },
        },
        {
          key: 'scatter-bubble',
          label: '气泡图',
          description: '第三维用气泡大小表达',
          componentKey: 'scatter-chart',
          preset: { chartVariant: 'bubble' },
        },
      ],
    },
    {
      key: 'other',
      label: '其他',
      icon: 'component-chart',
      variants: [
        {
          key: 'radar-basic',
          label: '雷达图',
          description: '多维度指标对比',
          componentKey: 'radar-chart',
        },
        {
          key: 'gauge-basic',
          label: '仪表盘',
          description: '单指标进度/完成度',
          componentKey: 'gauge-chart',
        },
        {
          key: 'funnel-basic',
          label: '漏斗图',
          description: '转化流程各阶段对比',
          componentKey: 'funnel-chart',
        },
      ],
    },
  ],
}

export const CONTAINER_WIDGET_CATALOG: WidgetCatalogConfig = {
  title: '容器组件',
  icon: 'component-content',
  groupColumnLabel: '容器类型',
  groups: [
    {
      key: 'layout',
      label: '布局容器',
      icon: 'component-content',
      variants: [
        {
          key: 'container',
          label: '页面容器',
          description: '顶栏、侧边栏、主区域、底栏布局',
          componentKey: 'container',
        },
        {
          key: 'layout',
          label: '分栏容器',
          description: '多列栅格分栏，可拖入子组件',
          componentKey: 'layout',
        },
      ],
    },
    {
      key: 'business',
      label: '业务容器',
      icon: 'component-content',
      variants: [
        {
          key: 'form',
          label: '表单容器',
          description: '表单布局与校验，包裹表单字段',
          componentKey: 'form',
        },
      ],
    },
  ],
}

export const WIDGET_CATALOGS: WidgetCatalogConfig[] = [
  BASE_WIDGET_CATALOG,
  FORM_WIDGET_CATALOG,
  CHART_WIDGET_CATALOG,
  CONTAINER_WIDGET_CATALOG,
]

export function resolveWidgetComponent(componentKey: string) {
  const direct = visualConfig.componentMap[componentKey]
  if (direct)
    return direct

  return Object.values(visualConfig.componentMap).find(c => c.key === componentKey)
}

export function isWidgetVariantAvailable(variant: WidgetVariantItem): boolean {
  if (variant.comingSoon)
    return false
  return !!resolveWidgetComponent(variant.componentKey)
}

export function createBlockFromWidgetVariant(variant: WidgetVariantItem): VisualEditorBlockData | null {
  const component = resolveWidgetComponent(variant.componentKey)
  if (!component || variant.comingSoon)
    return null

  const block = createNewBlock(cloneDeep(component))
  block.label = variant.label

  if (variant.preset && block.props) {
    Object.assign(block.props, variant.preset)
  }

  return block
}
