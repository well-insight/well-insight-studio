import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { ElFormItem, ElRadio, ElRadioButton, ElRadioGroup } from 'element-plus'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import {
  createEditorColorProp, // 新增颜色选择器
  createEditorCrossSortableProp,
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

// 方向选项
const directionOptions = [
  { label: '水平', value: 'horizontal' },
  { label: '垂直', value: 'vertical' }
]

// 按钮样式选项
const buttonStyleOptions = [
  { label: '普通样式', value: 'default' },
  { label: '按钮样式', value: 'button' }
]

interface RadioOption {
  value: string | number
  label: string
  disabled?: boolean
  [prop: string]: any
}

export default {
  key: 'radio',
  moduleName: 'formWidgets',
  label: '表单项类型 - 单选框',
  preview: () => (
    <ElFormItem label='单选框' style={{ width: '100%' }}>
      <ElRadioGroup modelValue='1'>
        <ElRadio label='1'>选项一</ElRadio>
        <ElRadio label='2'>选项二</ElRadio>
      </ElRadioGroup>
    </ElFormItem>
  ),
  render: ({ styles, block, props }) => {
    const { registerRef } = useGlobalProperties()
    const RadioComponent = props.buttonStyle === 'button' ? ElRadioButton : ElRadio
    const groupStyle = {
      display: 'flex',
      flexDirection: props.direction === 'vertical' ? 'column' : 'row',
      gap: props.direction === 'vertical' ? '8px' : '16px',
      flexWrap: 'wrap'
    }

    return () => (
      <div style={{ width: '100%', height: '100%', ...styles }}>
        <ElFormItem
          style={{ width: '100%' }}
          label={props.label}
          prop={Array.isArray(props.name) ? props.name[0] : props.name}
          required={props.required}
          rules={props.rules}
        >
          <ElRadioGroup
            ref={el => registerRef(el, block._vid)}
            v-model={props.modelValue}
            size={props.size}
            disabled={props.disabled}
            text-color={props.textColor}
            fill={props.fill}
            border={props.border}
            {...props}
            style={groupStyle}
            onChange={(val: any) => props.onChange?.(val)}
          >
            {props.options?.map((item: RadioOption) => (
              <RadioComponent
                key={item.value}
                label={item.value}
                disabled={item.disabled || props.disabled}
                border={props.border}
                size={props.size}
              >
                {item.label}
              </RadioComponent>
            ))}
          </ElRadioGroup>
        </ElFormItem>
      </div>
    )
  },
  props: {
    modelValue: createEditorInputProp({ label: '默认值', defaultValue: '' }),
    name: createEditorModelBindProp({ label: '字段绑定', defaultValue: '' }),
    label: createEditorInputProp({ label: '表单项标签', defaultValue: '单选框' }),
    options: createEditorCrossSortableProp({
      label: '选项列表',
      labelPosition: 'top',
      multiple: true,
      showItemPropsConfig: true,
      defaultValue: [
        { value: '1', label: '选项一' },
        { value: '2', label: '选项二' },
        { value: '3', label: '选项三' }
      ]
    }),
    direction: createEditorSelectProp({
      label: '排列方向',
      options: directionOptions,
      defaultValue: 'horizontal'
    }),
    buttonStyle: createEditorSelectProp({
      label: '按钮样式',
      options: buttonStyleOptions,
      defaultValue: 'default'
    }),
    size: createEditorSelectProp({
      label: '尺寸',
      options: sizeOptions,
      defaultValue: 'default'
    }),
    disabled: createEditorSwitchProp({ label: '禁用', defaultValue: false }),
    border: createEditorSwitchProp({ label: '显示边框', defaultValue: false }),
    // 改为颜色选择器
    textColor: createEditorColorProp({
      label: '激活时文字颜色',
      defaultValue: '',
      tips: '普通模式下有效'
    }),
    fill: createEditorColorProp({
      label: '激活时填充颜色',
      defaultValue: '',
      tips: '普通模式下有效'
    }),
    ...createFieldProps()
  },
  events: [{ label: '值变化时触发', value: 'change' }],
  resize: { width: true },
  model: { default: '绑定字段' }
} as VisualEditorComponent
