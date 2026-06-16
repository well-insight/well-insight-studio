import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { renderSlot, useSlots } from 'vue'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import { createEditorTableProp } from '@/visual-editor/visual-editor.props'

export default {
  key: 'group',
  moduleName: 'containerComponents',
  label: '组',
  icon: 'comp-icon-group',
  preview: () => <div style={{ padding: '12px', border: '1px dashed #409eff', borderRadius: '6px', fontSize: '12px', color: '#409eff', textAlign: 'center' }}>组</div>,
  render: ({ props, styles, block }) => {
    const slots = useSlots()
    const { registerRef } = useGlobalProperties()

    return () => (
      <div
        ref={el => registerRef(el, block._vid)}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'visible',
          boxSizing: 'border-box',
          ...styles,
        }}
      >
        {renderSlot(slots, 'default')}
      </div>
    )
  },
  resize: {
    height: true,
    width: true,
  },
  props: {
    'slots.default.children': createEditorTableProp({
      label: '组内组件',
      option: {
        options: [
          { label: '名称', field: 'label' },
          { label: '类型', field: 'componentKey' },
        ],
        showKey: 'label',
      },
    }),
  },
} as VisualEditorComponent
