/**
 * 表单设计器核心类型定义
 * 参考 Element Plus 表单组件体系设计
 */

/**
 * 表单标签位置 — 对应 ElForm label-position
 */
export type FormLabelPosition = 'left' | 'right' | 'top'

/** 表单组件尺寸 — 对应 ElForm / ElFormItem size */
export type FormSize = 'large' | 'default' | 'small'

/** 按钮位置 */
export type ButtonPosition = 'left' | 'center' | 'right'

/**
 * 表单全局配置
 * 参考 Element Plus Form API 设计
 */
export interface FormConfig {
  /** 标签宽度 (px) — 对应 ElForm label-width */
  labelWidth: number
  /** 标签位置 — 对应 ElForm label-position */
  labelPosition: FormLabelPosition
  /** 表单尺寸 — 对应 ElForm size */
  size: FormSize
  /** 是否禁用所有表单项 — 对应 ElForm disabled */
  disabled: boolean
  /** 栅格列数，默认 24（自定义扩展，非 ElForm 原生） */
  gridColumns: number
  /** 是否显示必填星号 — 对应 ElForm hide-required-asterisk（反向） */
  requiredAsterisk: boolean
  /** 标签后缀文本 — 对应 ElForm label-suffix */
  labelSuffix: string
  /** 是否显示校验错误信息 — 对应 ElForm show-message */
  showMessage: boolean
  /** 是否以内联形式展示校验信息 — 对应 ElForm inline-message */
  inlineMessage: boolean
  /** 是否展示校验状态图标 — 对应 ElForm status-icon */
  statusIcon: boolean
  /** 校验失败时滚动到第一个错误 — 对应 ElForm scroll-to-error */
  scrollToError: boolean
  /** 是否行内模式 — 对应 ElForm inline */
  inline: boolean
  /** 是否在 rules 变化后重新校验 — 对应 ElForm validate-on-rule-change */
  validateOnRuleChange: boolean
  /** 提交按钮配置 */
  submitBtn: {
    show: boolean
    text: string
    position: ButtonPosition
  }
  /** 重置按钮配置 */
  resetBtn: {
    show: boolean
    text: string
  }
}

/**
 * 表单选项（select/radio/checkbox 等）
 */
export interface FormOption {
  label: string
  value: string | number
  disabled?: boolean
}

/**
 * 校验规则类型
 */
export type FormRuleType
  = | 'required'
    | 'min'
    | 'max'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'email'
    | 'url'
    | 'integer'
    | 'float'

/**
 * 校验规则
 */
export interface FormRule {
  type: FormRuleType
  message: string
  value?: any
  trigger?: 'blur' | 'change' | 'submit'
}

/**
 * 表单字段数据模型
 * 参考 Element Plus FormItem API 设计
 */
export interface FormField {
  /** 唯一标识 */
  _vid: string
  /** 组件类型 key：'input' | 'select' | 'checkbox' | 'radio' | 'datePicker' | 'switch' | ... */
  componentKey: string
  /** 标签文本 — 对应 ElFormItem label */
  label: string
  /** 数据字段名（用于表单数据收集）— 对应 ElFormItem prop */
  field: string
  /** 占位提示 */
  placeholder: string
  /** 默认值 */
  defaultValue: any
  /** 是否必填 — 对应 ElFormItem required */
  required: boolean
  /** 是否禁用 */
  disabled: boolean
  /** 是否隐藏 */
  hidden: boolean
  /** 是否只读 */
  readonly: boolean
  /** 栅格占宽 (1-24) */
  colSpan: number
  /** 画布网格位置 */
  layout?: {
    x: number
    y: number
  }
  /** 校验规则 */
  rules: FormRule[]
  /** 选项列表（select/radio/checkbox 等） */
  options?: FormOption[]
  /** 组件特定属性（透传给具体组件） */
  props: Record<string, any>
  /** 排序序号 */
  sort: number
  /** 数据集绑定 */
  datasetBinding?: {
    datasetId: string
    datasetFieldId: string
    /** 兼容旧数据：历史上用字段名存储 */
    field?: string
  } | null
  /** ===== ElFormItem 扩展属性 ===== */
  /** 单独设置标签宽度（px）— 对应 ElFormItem label-width */
  labelWidth?: number
  /** 单独设置是否显示校验信息 — 对应 ElFormItem show-message */
  showMessage?: boolean
  /** 单独设置内联校验信息 — 对应 ElFormItem inline-message */
  inlineMessage?: boolean
  /** 单独设置表单项尺寸 — 对应 ElFormItem size */
  size?: FormSize
  /** 自定义错误信息 — 对应 ElFormItem error */
  error?: string
}

/**
 * 表单 DSL
 */
export interface FormSchema {
  /** 表单全局配置 */
  config: FormConfig
  /** 字段列表（有序） */
  fields: FormField[]
}

/**
 * 组件分类
 */
export interface FormComponentCategory {
  /** 分类标识 */
  key: string
  /** 分类名称 */
  label: string
  /** 分类下的组件 key 列表 */
  components: string[]
}

/**
 * 表单组件注册项
 */
export interface FormComponentDefinition {
  /** 组件 key */
  key: string
  /** 组件中文名称 */
  label: string
  /** 组件图标 */
  icon?: string
  /** 组件描述 */
  description?: string
  /** 所属分类 */
  category: string
  /** 默认属性值 */
  defaultProps?: Record<string, any>
  /** 默认选项（select/radio/checkbox 等） */
  defaultOptions?: FormOption[]
  /** 默认 colSpan */
  defaultColSpan?: number
  /** 禁止拖拽排序 */
  noDrag?: boolean
}

/**
 * 表单设计器状态
 */
export interface FormDesignerState {
  /** 当前选中字段的 _vid */
  activeFieldId: string | null
  /** 整个表单 schema */
  formSchema: FormSchema
  /** 是否处于预览模式 */
  isPreview: boolean
  /** 是否有未保存的更改 */
  isDirty: boolean
}
