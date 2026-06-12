import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { ElFormItem, ElInput } from 'element-plus'
import { computed } from 'vue'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import {
  createEditorInputNumberProp,
  createEditorInputProp,
  createEditorModelBindProp,
  createEditorSelectProp,
  createEditorSwitchProp,
} from '@/visual-editor/visual-editor.props'
import { createFieldProps } from '../createFieldProps'

// 输入框类型选项
const inputTypes = [
  { label: '文本', value: 'text' },
  { label: '密码', value: 'password' },
  { label: '文本域', value: 'textarea' },
]

// 尺寸选项
const sizeOptions = [
  { label: '大', value: 'large' },
  { label: '默认', value: 'default' },
  { label: '小', value: 'small' },
]

// 缩放选项（仅 textarea 有效）
const resizeOptions = [
  { label: '无', value: 'none' },
  { label: '水平', value: 'horizontal' },
  { label: '垂直', value: 'vertical' },
  { label: '两者', value: 'both' },
]

export default {
  key: 'input',
  moduleName: 'baseWidgets',
  label: '输入框',
  description: '单行文本输入框，支持文本、密码和文本域类型。',
  icon: 'comp-icon-input',
  preview: () => (
    <ElFormItem label="输入框" style={{ width: '100%' }}>
      <ElInput placeholder="请输入" />
    </ElFormItem>
  ),
  render: ({ styles, block, props }) => {
    const { registerRef } = useGlobalProperties()

    // 动态处理不同输入框类型的特殊属性
    const inputProps = computed(() => {
      const base = { ...props }
      if (props.type === 'textarea') {
        if (props.rows)
          base.rows = props.rows
        if (props.autosize)
          base.autosize = props.autosize
        if (props.resize)
          base.resize = props.resize
      }
      if (props.type === 'password') {
        base.showPassword = props.showPassword
      }
      return base
    })

    return () => (
      <div style={{ width: '100%', height: '100%', ...styles }}>
        <ElFormItem
          style={{ width: '100%' }}
          label={props.label}
          prop={Array.isArray(props.name) ? props.name[0] : props.name}
          required={props.required}
          rules={props.rules}
        >
          <ElInput
            ref={el => registerRef(el, block._vid)}
            v-model={props.modelValue}
            {...inputProps.value}
          />
        </ElFormItem>
      </div>
    )
  },
  props: {
    // 基础绑定
    modelValue: createEditorInputProp({ label: '默认值', defaultValue: '' }),
    name: createEditorModelBindProp({ label: '字段绑定', defaultValue: '' }),
    label: createEditorInputProp({ label: '表单项标签', defaultValue: '输入框' }),

    // 类型与基本配置
    type: createEditorSelectProp({
      label: '输入框类型',
      options: inputTypes,
      defaultValue: 'text',
    }),
    placeholder: createEditorInputProp({ label: '占位符', defaultValue: '请输入' }),

    // 功能开关
    disabled: createEditorSwitchProp({ label: '禁用' }),
    readonly: createEditorSwitchProp({ label: '只读' }),
    clearable: createEditorSwitchProp({ label: '可清除', defaultValue: true }),
    size: createEditorSelectProp({
      label: '尺寸',
      options: sizeOptions,
    }),
    maxlength: createEditorInputNumberProp({ label: '最大长度' }),
    minlength: createEditorInputNumberProp({ label: '最小长度' }),
    showWordLimit: createEditorSwitchProp({ label: '显示字数统计' }),

    // 图标
    prefixIcon: createEditorInputProp({ label: '前缀图标' }),
    suffixIcon: createEditorInputProp({ label: '后缀图标' }),

    // 文本域专用
    rows: createEditorInputNumberProp({
      label: '文本域行数',
      tips: '仅在 type 为 textarea 时有效',
    }),
    autosize: createEditorSwitchProp({
      label: '自适应高度',
      tips: '仅在 type 为 textarea 时有效',
    }),
    resize: createEditorSelectProp({
      label: '缩放控制',
      options: resizeOptions,
      tips: '仅 textarea 有效',
    }),

    // 密码框专用
    showPassword: createEditorSwitchProp({
      label: '显示切换图标',
      tips: '仅在 type 为 password 时有效',
    }),

    // 表单通用属性
    ...createFieldProps(),
  },
  events: [
    { label: '输入时触发', value: 'input' },
    { label: '值变化时触发', value: 'change' },
    { label: '失去焦点', value: 'blur' },
    { label: '获得焦点', value: 'focus' },
    { label: '点击清除按钮', value: 'clear' },
    { label: '组合输入开始', value: 'compositionstart' },
    { label: '组合输入更新', value: 'compositionupdate' },
    { label: '组合输入结束', value: 'compositionend' },
    { label: '键盘按下', value: 'keydown' },
    { label: '键盘抬起', value: 'keyup' },
    { label: '鼠标移入', value: 'mouseenter' },
    { label: '鼠标移出', value: 'mouseleave' },
  ],
  resize: {
    width: true,
  },
  model: {
    default: '绑定字段',
  },
} as VisualEditorComponent
