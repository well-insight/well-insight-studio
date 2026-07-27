/**
 * 表单设计器工具函数
 */
import type { FormConfig, FormField, FormOption, FormSchema } from './types'
import { cloneDeep } from 'lodash-es'
import { generateNanoid } from '@/visual-editor/lib'
import { getFormComponent } from './form-component-registry'

/** 生成唯一 _vid */
export function createFieldId(): string {
  return `fd_${generateNanoid()}`
}

/** 获取默认表单配置 */
export function getDefaultFormConfig(): FormConfig {
  return {
    labelWidth: 100,
    labelPosition: 'right',
    size: 'default',
    disabled: false,
    gridColumns: 24,
    requiredAsterisk: true,
    labelSuffix: '',
    showMessage: true,
    inlineMessage: false,
    statusIcon: false,
    scrollToError: false,
    inline: false,
    validateOnRuleChange: true,
    submitBtn: {
      show: true,
      text: '提交',
      position: 'center',
    },
    resetBtn: {
      show: true,
      text: '重置',
    },
  }
}

/** 获取组件的默认选项 */
export function getDefaultOptions(componentKey: string): FormOption[] {
  return cloneDeep(getFormComponent(componentKey)?.defaultOptions ?? [])
}

/** 根据组件 key 获取默认 colSpan */
export function getDefaultColSpan(componentKey: string): number {
  return getFormComponent(componentKey)?.defaultColSpan ?? 12
}

/** 根据组件 key 获取默认 placeholder */
export function getDefaultPlaceholder(componentKey: string): string {
  switch (componentKey) {
    case 'input':
      return '请输入'
    case 'textarea':
      return '请输入'
    case 'number':
      return '请输入数字'
    case 'select':
      return '请选择'
    case 'datePicker':
      return '请选择日期'
    case 'timePicker':
      return '请选择时间'
    case 'datetimePicker':
      return '请选择日期时间'
    case 'cascader':
      return '请选择'
    case 'treeSelect':
      return '请选择'
    default:
      return '请输入'
  }
}

/** 根据组件 key 获取默认 label */
export function getDefaultLabel(componentKey: string): string {
  return getFormComponent(componentKey)?.label ?? componentKey
}

/** 根据组件 key 获取默认字段名 */
export function getDefaultFieldName(componentKey: string): string {
  return `field_${componentKey}_${createFieldId().slice(-6)}`
}

/**
 * 根据组件 key 创建默认 FormField
 */
export function createFormField(componentKey: string, overrides?: Partial<FormField>): FormField {
  const _vid = createFieldId()
  return {
    _vid,
    componentKey,
    label: getDefaultLabel(componentKey),
    field: getDefaultFieldName(componentKey),
    placeholder: getDefaultPlaceholder(componentKey),
    defaultValue: undefined,
    required: false,
    disabled: false,
    hidden: false,
    readonly: false,
    colSpan: getDefaultColSpan(componentKey),
    layout: undefined,
    rules: [],
    options: getDefaultOptions(componentKey),
    props: cloneDeep(getFormComponent(componentKey)?.defaultProps ?? {}),
    sort: Date.now(),
    // ElFormItem 扩展属性（默认缺省即为 undefined，使 ElForm 全局值生效）
    labelWidth: undefined,
    showMessage: undefined,
    inlineMessage: undefined,
    size: undefined,
    error: undefined,
    ...overrides,
  }
}

/** 获取空表单 Schema */
export function getEmptyFormSchema(): FormSchema {
  return {
    config: getDefaultFormConfig(),
    fields: [],
  }
}

/** 深拷贝 FormSchema */
export function cloneFormSchema(schema: FormSchema): FormSchema {
  return cloneDeep(schema)
}

/** 归一化 FormSchema，兼容旧 DSL 或手写 JSON 缺省字段 */
export function normalizeFormSchema(schema: FormSchema): FormSchema {
  const defaultConfig = getDefaultFormConfig()
  return {
    config: {
      ...defaultConfig,
      ...(schema.config ?? {}),
      submitBtn: {
        ...defaultConfig.submitBtn,
        ...(schema.config?.submitBtn ?? {}),
      },
      resetBtn: {
        ...defaultConfig.resetBtn,
        ...(schema.config?.resetBtn ?? {}),
      },
    },
    fields: (schema.fields ?? []).map((field, index) => {
      const normalizedBinding = field.datasetBinding
        ? {
            datasetId: field.datasetBinding.datasetId,
            datasetFieldId: field.datasetBinding.datasetFieldId ?? field.datasetBinding.field ?? '',
          }
        : null
      return {
        ...createFormField(field.componentKey || 'input'),
        ...field,
        datasetBinding: normalizedBinding,
        props: {
          ...cloneDeep(getFormComponent(field.componentKey)?.defaultProps ?? {}),
          ...(field.props ?? {}),
        },
        options: field.options ? cloneDeep(field.options) : getDefaultOptions(field.componentKey),
        rules: field.rules ?? [],
        sort: typeof field.sort === 'number' ? field.sort : index,
      }
    }),
  }
}

/**
 * 校验 DSL 是否为有效的 FormSchema
 */
export function isValidFormSchema(dsl: unknown): dsl is FormSchema {
  if (!dsl || typeof dsl !== 'object')
    return false
  const obj = dsl as Record<string, unknown>
  return 'config' in obj && 'fields' in obj && Array.isArray(obj.fields)
}
