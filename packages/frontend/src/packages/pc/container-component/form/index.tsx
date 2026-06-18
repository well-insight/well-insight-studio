import type { VisualEditorBlockData, VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { ElForm } from 'element-plus'
import { computed, h } from 'vue'
import GridCanvas from '../shared/GridCanvas.vue'
import { type ContainerRenderCustom, resolveEditingContainerId } from '../container'
import { compProps } from './compProps'

function ensureDefaultSlot(props: Record<string, any>) {
  props.slots ??= {}
  props.slots.default ??= { key: 'default', children: [] }
  props.slots.default.children ??= []
}

export default {
  key: 'form',
  moduleName: 'containerComponents',
  label: '表单容器',
  icon: 'comp-icon-form',
  preview: () => (
    <div style={{
      padding: '8px',
      border: '1px solid #dcdfe6',
      borderRadius: '4px',
      fontSize: '12px',
      color: '#606266',
    }}
    >
      <div style={{ marginBottom: '6px' }}>用户名</div>
      <div style={{ marginBottom: '6px', height: '24px', border: '1px solid #dcdfe6', borderRadius: '4px' }} />
      <div style={{ marginBottom: '6px' }}>密码</div>
      <div style={{ marginBottom: '8px', height: '24px', border: '1px solid #dcdfe6', borderRadius: '4px' }} />
      <div style={{ textAlign: 'center' }}>
        <span style={{ display: 'inline-block', padding: '2px 12px', background: '#409eff', color: '#fff', borderRadius: '4px' }}>提交</span>
      </div>
    </div>
  ),
  render: ({ props, styles, block, custom }) => {
    ensureDefaultSlot(props)
    const editingContainerId = resolveEditingContainerId(custom as ContainerRenderCustom | undefined)

    const children = computed<VisualEditorBlockData[]>({
      get: () => props.slots?.default?.children || [],
      set: (val) => {
        if (props.slots?.default)
          props.slots.default.children = val
      },
    })

    const isFocus = computed(() => block?.focus || false)
    const isEditing = computed(() => editingContainerId.value === block?._vid)

    const { slots: _slots, ...formProps } = props

    return () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
          backgroundColor: styles.backgroundColor || 'transparent',
        }}
      >
        <ElForm
          {...formProps}
          style={{ width: '100%', height: '100%', position: 'relative' }}
        >
          {h(GridCanvas, {
            slotKey: 'default',
            containerVid: block?._vid || '',
            children: children.value,
            rowHeight: 1,
            parentFocus: isFocus.value,
            isEditing: isEditing.value,
            'onUpdate:children': (newChildren: VisualEditorBlockData[]) => {
              children.value = newChildren
            },
          })}
        </ElForm>
      </div>
    )
  },
  resize: {
    height: true,
    width: true,
  },
  events: [
    { label: '提交表单且验证通过后触发', value: 'submit' },
    { label: '提交表单且验证不通过后触发', value: 'failed' },
  ],
  props: compProps,
} as VisualEditorComponent
