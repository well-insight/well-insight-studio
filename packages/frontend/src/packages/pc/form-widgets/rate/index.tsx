import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { ElFormItem, ElRate } from 'element-plus'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import {
  createEditorColorProp,
  createEditorInputNumberProp,
  createEditorInputProp,
  createEditorModelBindProp,
  createEditorSelectProp,
  createEditorSwitchProp
} from '@/visual-editor/visual-editor.props'
import { createFieldProps } from '../createFieldProps'

// 图标类型选项（Element Plus 支持）
const iconClasses = [
  { label: '星星', value: 'star' },
  { label: '笑脸', value: 'smile' },
  { label: '心形', value: 'heart' }
]

export default {
  key: 'rate',
  moduleName: 'formWidgets',
  label: '表单项类型 - 评分',
  preview: () => (
    <ElFormItem label='评分' style={{ width: '100%' }}>
      <ElRate modelValue={3} />
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
          <ElRate
            ref={el => registerRef(el, block._vid)}
            v-model={props.modelValue}
            max={props.max}
            disabled={props.disabled}
            allowHalf={props.allowHalf}
            lowThreshold={props.lowThreshold}
            highThreshold={props.highThreshold}
            colors={props.colors}
            voidColor={props.voidColor}
            disabledVoidColor={props.disabledVoidColor}
            voidIconClass={props.voidIconClass}
            disabledVoidIconClass={props.disabledVoidIconClass}
            showText={props.showText}
            showScore={props.showScore}
            textColor={props.textColor}
            texts={props.texts}
            scoreTemplate={props.scoreTemplate}
            clearable={props.clearable}
            size={props.size}
            {...props}
            onChange={(val: number) => props.onChange?.(val)}
          />
        </ElFormItem>
      </div>
    )
  },
  props: {
    // 基础绑定
    modelValue: createEditorInputNumberProp({
      label: '默认值',
      defaultValue: 0,
      min: 0
    }),
    name: createEditorModelBindProp({ label: '字段绑定', defaultValue: '' }),
    label: createEditorInputProp({ label: '表单项标签', defaultValue: '评分' }),

    // 评分控制
    max: createEditorInputNumberProp({
      label: '最大分值',
      defaultValue: 5,
      min: 1
    }),
    allowHalf: createEditorSwitchProp({
      label: '允许半选',
      defaultValue: false
    }),
    lowThreshold: createEditorInputNumberProp({
      label: '低分阈值',
      defaultValue: 2,
      min: 0,
      max: 5,
      tips: '低于此值的显示为低分颜色'
    }),
    highThreshold: createEditorInputNumberProp({
      label: '高分阈值',
      defaultValue: 4,
      min: 0,
      max: 5,
      tips: '高于此值的显示为高分颜色'
    }),
    clearable: createEditorSwitchProp({
      label: '可清除',
      defaultValue: false,
      tips: '再次点击可清除当前值'
    }),
    disabled: createEditorSwitchProp({ label: '禁用', defaultValue: false }),

    // 颜色配置（全部使用颜色选择器）
    colors: createEditorColorProp({
      label: '颜色数组',
      defaultValue: '',
      tips: '例如 ["#F7BA2A", "#F7BA2A", "#F7BA2A"]，支持数组格式，输入JSON字符串'
    }),
    voidColor: createEditorColorProp({
      label: '未选中图标颜色',
      defaultValue: '#C6D1DE'
    }),
    disabledVoidColor: createEditorColorProp({
      label: '禁用时未选中颜色',
      defaultValue: '#EFF2F7'
    }),
    textColor: createEditorColorProp({
      label: '辅助文字颜色',
      defaultValue: '#1F2D3D'
    }),

    // 图标配置
    voidIconClass: createEditorSelectProp({
      label: '未选中图标',
      options: iconClasses,
      defaultValue: 'star'
    }),
    disabledVoidIconClass: createEditorSelectProp({
      label: '禁用时未选中图标',
      options: iconClasses,
      defaultValue: 'star'
    }),

    // 文字显示
    showText: createEditorSwitchProp({
      label: '显示辅助文字',
      defaultValue: false,
      tips: '根据当前值显示对应的文字'
    }),
    showScore: createEditorSwitchProp({
      label: '显示分数',
      defaultValue: false,
      tips: '显示当前分值，不显示辅助文字'
    }),
    texts: createEditorInputProp({
      label: '辅助文字数组',
      defaultValue: '',
      tips: '如 ["极差", "失望", "一般", "满意", "惊喜"]，JSON格式'
    }),
    scoreTemplate: createEditorInputProp({
      label: '分数模板',
      defaultValue: '{value} 分',
      tips: '显示分数时的模板，{value} 会被替换'
    }),

    // 尺寸（Element Plus 支持 large / default / small）
    size: createEditorSelectProp({
      label: '尺寸',
      options: [
        { label: '大', value: 'large' },
        { label: '默认', value: 'default' },
        { label: '小', value: 'small' }
      ],
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
