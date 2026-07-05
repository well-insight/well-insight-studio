/**
 * 表单设计器工具函数
 */
import type { FormConfig, FormField, FormOption, FormSchema } from './types'
import { generateNanoid } from '@/visual-editor/lib'

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
  switch (componentKey) {
    case 'select':
      return [
        { label: '选项一', value: '1' },
        { label: '选项二', value: '2' },
        { label: '选项三', value: '3' },
      ]
    case 'radio':
      return [
        { label: '选项一', value: '1' },
        { label: '选项二', value: '2' },
        { label: '选项三', value: '3' },
      ]
    case 'checkbox':
      return [
        { label: '选项一', value: '1' },
        { label: '选项二', value: '2' },
        { label: '选项三', value: '3' },
      ]
    default:
      return []
  }
}

/** 根据组件 key 获取默认 colSpan */
export function getDefaultColSpan(componentKey: string): number {
  switch (componentKey) {
    case 'input':
    case 'select':
    case 'datePicker':
    case 'timePicker':
    case 'datetimePicker':
    case 'cascader':
    case 'treeSelect':
      return 12
    case 'textarea':
    case 'richText':
    case 'upload':
      return 24
    case 'switch':
    case 'radio':
    case 'checkbox':
    case 'rate':
    case 'slider':
    case 'colorPicker':
      return 12
    case 'number':
      return 8
    default:
      return 12
  }
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
  const map: Record<string, string> = {
    input: '输入框',
    textarea: '文本域',
    number: '数字',
    select: '下拉框',
    switch: '开关',
    radio: '单选框',
    checkbox: '复选框',
    datePicker: '日期选择',
    timePicker: '时间选择',
    datetimePicker: '日期时间',
    rate: '评分',
    slider: '滑块',
    colorPicker: '颜色选择',
    cascader: '级联选择',
    treeSelect: '树形选择',
    upload: '上传',
    richText: '富文本',
    transfer: '穿梭框',
  }
  return map[componentKey] ?? componentKey
}

/** 根据组件 key 获取默认字段名 */
export function getDefaultFieldName(componentKey: string): string {
  return `field_${componentKey}_${createFieldId().slice(-6)}`
}

/**
 * 根据组件 key 创建默认 FormField
 */
export function createFormField(
  componentKey: string,
  overrides?: Partial<FormField>,
): FormField {
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
    rules: [],
    options: getDefaultOptions(componentKey),
    props: {},
    sort: Date.now(),
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
  return JSON.parse(JSON.stringify(schema))
}

/**
 * 校验 DSL 是否为有效的 FormSchema
 */
export function isValidFormSchema(dsl: unknown): dsl is FormSchema {
  if (!dsl || typeof dsl !== 'object') return false
  const obj = dsl as Record<string, unknown>
  return 'config' in obj && 'fields' in obj && Array.isArray(obj.fields)
}
