/**
 * 表单设计器模块入口
 */

export * from './form-component-registry'
export * from './form-designer.utils'
export { default as FormDesigner } from './FormDesigner.vue'

export { FORM_DATA_KEY, useFormData } from './hooks/useFormData'
export * from './types'
export { default as FormRenderer } from './ui/renderer/FormRenderer.vue'
export { default as JsonEditor } from './ui/workbench/right-panel/JsonEditor.vue'
