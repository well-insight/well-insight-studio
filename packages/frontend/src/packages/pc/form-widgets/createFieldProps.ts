import {
  createEditorInputProp,
  createEditorSelectProp,
  createEditorSwitchProp
} from '@/visual-editor/visual-editor.props'

export function createFieldProps() {
  return {
    readonly: createEditorSwitchProp({ label: '是否为只读状态' }),
    required: createEditorSwitchProp({ label: '是否显示表单必填星号' })
  }
}
