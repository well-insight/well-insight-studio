import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { ElFormItem, ElSwitch } from 'element-plus'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import {
  createEditorColorProp,
  createEditorInputProp,
  createEditorModelBindProp,
  createEditorSelectProp,
  createEditorSwitchProp
} from '@/visual-editor/visual-editor.props'
import { createFieldProps } from '../createFieldProps'

// 尺寸选项
const sizeOptions = [
  { label: '大', value: 'large' },
  { label: '默认', value: 'default' },
  { label: '小', value: 'small' }
]

export default {
  key: 'switch',
  moduleName: 'formWidgets',
  label: '表单项类型 - 开关',
  preview: () => (
    <ElFormItem label='开关' style={{ width: '100%' }}>
      <ElSwitch />
    </ElFormItem>
  ),
  render: ({ styles, block, props }) => {
    const { registerRef } = useGlobalProperties()

    return () => (
      <div style={{ width: '100%', height: '100%', ...styles }}>
        <ElFormItem
          style={{ width: '100%' }}
          label={props.label}
          prop={Array.isArray(props.name) ? props.name[0] : props.name}
          required={props.required}
          rules={props.rules}
        >
          <ElSwitch
            ref={el => registerRef(el, block._vid)}
            v-model={props.modelValue}
            disabled={props.disabled}
            loading={props.loading}
            size={props.size}
            active-color={props.activeColor}
            inactive-color={props.inactiveColor}
            active-value={props.activeValue}
            inactive-value={props.inactiveValue}
            active-text={props.activeText}
            inactive-text={props.inactiveText}
            inline-prompt={props.inlinePrompt}
            width={props.width}
            {...props}
            onChange={(val: any) => props.onChange?.(val)}
          />
        </ElFormItem>
      </div>
    )
  },
  props: {
    // 基础绑定
    modelValue: createEditorInputProp({
      label: '默认值',
      defaultValue: false,
      tips: '布尔值或自定义值，如 true/false'
    }),
    name: createEditorModelBindProp({ label: '字段绑定', defaultValue: '' }),
    label: createEditorInputProp({ label: '表单项标签', defaultValue: '开关' }),

    // 开关值定义
    activeValue: createEditorInputProp({
      label: '开启时的值',
      defaultValue: true
    }),
    inactiveValue: createEditorInputProp({
      label: '关闭时的值',
      defaultValue: false
    }),

    // 文本（内置提示）
    activeText: createEditorInputProp({
      label: '开启时的文字',
      defaultValue: ''
    }),
    inactiveText: createEditorInputProp({
      label: '关闭时的文字',
      defaultValue: ''
    }),
    inlinePrompt: createEditorSwitchProp({
      label: '文字内联提示',
      defaultValue: false,
      tips: '文字显示在开关内部'
    }),

    // 颜色（使用颜色选择器）
    activeColor: createEditorColorProp({
      label: '开启时背景色',
      defaultValue: '#409EFF'
    }),
    inactiveColor: createEditorColorProp({
      label: '关闭时背景色',
      defaultValue: '#C0CCDA'
    }),

    // 状态与样式
    disabled: createEditorSwitchProp({ label: '禁用', defaultValue: false }),
    loading: createEditorSwitchProp({ label: '加载中', defaultValue: false }),
    size: createEditorSelectProp({
      label: '尺寸',
      options: sizeOptions,
      defaultValue: 'default'
    }),

    // 表单通用属性
    ...createFieldProps()
  },
  events: [{ label: '值变化时触发', value: 'change' }],
  resize: {
    width: true
  },
  model: {
    default: '绑定字段'
  }
} as VisualEditorComponent
