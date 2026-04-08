import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { ElDivider } from 'element-plus'
import {
  createEditorInputProp,
  createEditorSelectProp,
  createEditorSwitchProp
} from '@/visual-editor/visual-editor.props'

// 方向选项
const directionOptions = [
  { label: '水平', value: 'horizontal' },
  { label: '垂直', value: 'vertical' }
]

// 内容位置选项
const contentPositionOptions = [
  { label: '左', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右', value: 'right' }
]

// 边框样式选项
const borderStyleOptions = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' }
]

export default {
  key: 'divider',
  moduleName: 'baseWidgets',
  label: '分割线',
  preview: () => <ElDivider>分割线</ElDivider>,
  render: ({ styles, block, props }) => {
    return () => (
      <div style={{ width: '100%', height: '100%', ...styles }}>
        <ElDivider {...props}>{props.content}</ElDivider>
      </div>
    )
  },
  props: {
    // 基础配置
    content: createEditorInputProp({
      label: '显示文字',
      defaultValue: '分割线'
    }),
    direction: createEditorSelectProp({
      label: '方向',
      options: directionOptions,
      defaultValue: 'horizontal'
    }),
    contentPosition: createEditorSelectProp({
      label: '文字位置',
      options: contentPositionOptions,
      defaultValue: 'center'
    }),
    borderStyle: createEditorSelectProp({
      label: '边框样式',
      options: borderStyleOptions,
      defaultValue: 'solid'
    }),
    // 保留 dashed 作为兼容（若启用则覆盖 borderStyle）
    dashed: createEditorSwitchProp({
      label: '是否虚线（旧属性）',
      defaultValue: false
    })
  },
  events: [
    { label: '点击', value: 'click' }
    // 可根据需要添加更多原生事件（如 mouseenter、mouseleave）
  ],
  resize: {
    width: true,
    height: true
  }
} as VisualEditorComponent
