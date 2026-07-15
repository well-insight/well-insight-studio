/**
 * 表单设计器组件目录
 * 基于 Element Plus 表单组件体系
 */
import type { FormComponentCategory, FormComponentDefinition } from './types'

/**
 * 表单组件分类
 */
export const FORM_COMPONENT_CATEGORIES: FormComponentCategory[] = [
  {
    key: 'basic',
    label: '基础字段',
    components: ['input', 'textarea', 'number', 'password'],
  },
  {
    key: 'selection',
    label: '选择字段',
    components: ['select', 'radio', 'checkbox', 'switch', 'rate', 'slider'],
  },
  {
    key: 'datetime',
    label: '日期时间',
    components: ['datePicker', 'timePicker', 'datetimePicker'],
  },
  {
    key: 'advanced',
    label: '高级字段',
    components: ['cascader', 'treeSelect', 'colorPicker', 'upload', 'transfer'],
  },
]

/**
 * 所有表单组件定义
 */
export const FORM_COMPONENT_REGISTRY: Record<string, FormComponentDefinition> = {
  /* ========== 基础字段 ========== */
  input: {
    key: 'input',
    label: '输入框',
    icon: 'el-icon-edit',
    description: '单行文本输入，支持前缀/后缀图标',
    category: 'basic',
    defaultColSpan: 12,
    defaultProps: {
      type: 'text',
      clearable: true,
      maxlength: undefined,
      showWordLimit: false,
      prefixIcon: '',
      suffixIcon: '',
    },
  },
  textarea: {
    key: 'textarea',
    label: '文本域',
    icon: 'el-icon-document',
    description: '多行文本输入，支持自适应高度',
    category: 'basic',
    defaultColSpan: 24,
    defaultProps: {
      rows: 3,
      autosize: false,
      maxlength: undefined,
      showWordLimit: false,
    },
  },
  number: {
    key: 'number',
    label: '数字',
    icon: 'el-icon-s-data',
    description: '数字输入框，支持步长和范围限制',
    category: 'basic',
    defaultColSpan: 8,
    defaultProps: {
      min: undefined,
      max: undefined,
      step: 1,
      precision: undefined,
      controls: true,
      controlsPosition: '',
    },
  },
  password: {
    key: 'password',
    label: '密码',
    icon: 'el-icon-lock',
    description: '密码输入框，支持显示/隐藏切换',
    category: 'basic',
    defaultColSpan: 12,
    defaultProps: {
      showPassword: true,
      clearable: true,
    },
  },

  /* ========== 选择字段 ========== */
  select: {
    key: 'select',
    label: '下拉框',
    icon: 'el-icon-arrow-down',
    description: '下拉选择器，支持单选/多选/搜索/远程',
    category: 'selection',
    defaultColSpan: 12,
    defaultOptions: [
      { label: '选项一', value: '1' },
      { label: '选项二', value: '2' },
      { label: '选项三', value: '3' },
    ],
    defaultProps: {
      multiple: false,
      filterable: false,
      clearable: true,
      allowCreate: false,
      collapseTags: false,
    },
  },
  radio: {
    key: 'radio',
    label: '单选框',
    icon: 'el-icon-circle-check',
    description: '单选框组，适合选项较少的场景',
    category: 'selection',
    defaultColSpan: 12,
    defaultOptions: [
      { label: '选项一', value: '1' },
      { label: '选项二', value: '2' },
      { label: '选项三', value: '3' },
    ],
    defaultProps: {
      border: false,
    },
  },
  checkbox: {
    key: 'checkbox',
    label: '复选框',
    icon: 'el-icon-check',
    description: '复选框组，支持全选和限制数量',
    category: 'selection',
    defaultColSpan: 12,
    defaultOptions: [
      { label: '选项一', value: '1' },
      { label: '选项二', value: '2' },
      { label: '选项三', value: '3' },
    ],
    defaultProps: {
      min: undefined,
      max: undefined,
      border: false,
    },
  },
  switch: {
    key: 'switch',
    label: '开关',
    icon: 'el-icon-switch',
    description: '开关选择器，表示两种对立状态',
    category: 'selection',
    defaultColSpan: 6,
    defaultProps: {
      activeText: '',
      inactiveText: '',
      activeValue: true,
      inactiveValue: false,
      inlinePrompt: false,
    },
  },
  rate: {
    key: 'rate',
    label: '评分',
    icon: 'el-icon-star',
    description: '星级评分组件，支持半星和文案',
    category: 'selection',
    defaultColSpan: 12,
    defaultProps: {
      max: 5,
      allowHalf: false,
      showText: false,
      showScore: false,
      texts: ['极差', '失望', '一般', '满意', '惊喜'],
    },
  },
  slider: {
    key: 'slider',
    label: '滑块',
    icon: 'el-icon-s-operation',
    description: '滑块选择器，适合范围数值选择',
    category: 'selection',
    defaultColSpan: 12,
    defaultProps: {
      min: 0,
      max: 100,
      step: 1,
      showInput: false,
      showStops: false,
      range: false,
    },
  },

  /* ========== 日期时间 ========== */
  datePicker: {
    key: 'datePicker',
    label: '日期选择',
    icon: 'el-icon-date',
    description: '日期选择器，支持多种日期格式',
    category: 'datetime',
    defaultColSpan: 12,
    defaultProps: {
      type: 'date',
      format: 'YYYY-MM-DD',
      valueFormat: 'YYYY-MM-DD',
      clearable: true,
      editable: true,
    },
  },
  timePicker: {
    key: 'timePicker',
    label: '时间选择',
    icon: 'el-icon-time',
    description: '时间选择器，支持固定/任意时间点',
    category: 'datetime',
    defaultColSpan: 8,
    defaultProps: {
      format: 'HH:mm:ss',
      valueFormat: 'HH:mm:ss',
      clearable: true,
      editable: true,
      isRange: false,
    },
  },
  datetimePicker: {
    key: 'datetimePicker',
    label: '日期时间',
    icon: 'el-icon-timer',
    description: '日期时间选择器，同时选择日期和时间',
    category: 'datetime',
    defaultColSpan: 12,
    defaultProps: {
      type: 'datetime',
      format: 'YYYY-MM-DD HH:mm:ss',
      valueFormat: 'YYYY-MM-DD HH:mm:ss',
      clearable: true,
      editable: true,
    },
  },

  /* ========== 高级字段 ========== */
  cascader: {
    key: 'cascader',
    label: '级联选择',
    icon: 'el-icon-s-operation',
    description: '级联选择器，适合层级数据选择',
    category: 'advanced',
    defaultColSpan: 12,
    defaultOptions: [
      { label: '选项一', value: '1' },
      { label: '选项二', value: '2' },
    ],
    defaultProps: {
      clearable: true,
      filterable: false,
      showAllLevels: true,
      checkStrictly: false,
    },
  },
  treeSelect: {
    key: 'treeSelect',
    label: '树形选择',
    icon: 'el-icon-s-data',
    description: '树形选择器，适合树形结构数据',
    category: 'advanced',
    defaultColSpan: 12,
    defaultProps: {
      clearable: true,
      filterable: false,
      multiple: false,
      checkStrictly: false,
    },
  },
  colorPicker: {
    key: 'colorPicker',
    label: '颜色选择',
    icon: 'el-icon-brush',
    description: '颜色选择器，支持预定义和自定义颜色',
    category: 'advanced',
    defaultColSpan: 6,
    defaultProps: {
      showAlpha: false,
      colorFormat: '',
      predefine: [
        '#ff4500',
        '#ff8c00',
        '#ffd700',
        '#90ee90',
        '#00ced1',
        '#1e90ff',
        '#c71585',
        'rgba(255, 69, 0, 0.68)',
      ],
    },
  },
  upload: {
    key: 'upload',
    label: '上传',
    icon: 'el-icon-upload',
    description: '文件上传组件，支持图片/文件多类型',
    category: 'advanced',
    defaultColSpan: 24,
    defaultProps: {
      accept: '',
      limit: 1,
      multiple: false,
      autoUpload: true,
      listType: 'text',
      drag: false,
    },
  },
  transfer: {
    key: 'transfer',
    label: '穿梭框',
    icon: 'el-icon-sort',
    description: '双列穿梭选择框，适合数据转移场景',
    category: 'advanced',
    defaultColSpan: 24,
    defaultProps: {
      filterable: false,
      filterPlaceholder: '请输入搜索内容',
      titles: ['列表一', '列表二'],
      buttonTexts: [],
    },
  },
}

/**
 * 获取所有已注册的表单组件
 */
export function getFormComponents(): FormComponentDefinition[] {
  return Object.values(FORM_COMPONENT_REGISTRY)
}

/**
 * 根据 key 获取组件定义
 */
export function getFormComponent(key: string): FormComponentDefinition | undefined {
  return FORM_COMPONENT_REGISTRY[key]
}

/**
 * 按分类获取组件定义
 */
export function getFormComponentsByCategory(category: string): FormComponentDefinition[] {
  return Object.values(FORM_COMPONENT_REGISTRY).filter(c => c.category === category)
}
