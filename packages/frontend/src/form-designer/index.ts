/**
 * 表单设计器模块入口
 */

export { default as FormDesigner } from './FormDesigner.vue'
export { default as FormRenderer } from './ui/renderer/FormRenderer.vue'
export { default as JsonEditor } from './ui/workbench/right-panel/JsonEditor.vue'

export * from './types'
export * from './form-designer.utils'
export * from './form-component-registry'
export { useFormData, FORM_DATA_KEY } from './hooks/useFormData'
