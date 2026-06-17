import type { VisualEditorBlockData, VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { computed, h, inject } from 'vue'
import SlotGridCanvas from '../shared/SlotGridCanvas.vue'
import { EditingContainerIdKey } from '../container'
import { createEditorTableProp } from '@/visual-editor/visual-editor.props'

export default {
  key: 'group',
  moduleName: 'containerComponents',
  label: '组',
  icon: 'comp-icon-group',
  // 不在组件列表中显示，只能通过多选合并创建
  hiddenInList: true,
  preview: () => (
    <div style={{ padding: '12px', border: '1px dashed #409eff', borderRadius: '6px', fontSize: '12px', color: '#409eff', textAlign: 'center' }}>
      组
    </div>
  ),
  render: ({ props, styles, block }) => {
    // 注入当前处于编辑模式的容器 id
    const editingContainerId = inject<string | null>(EditingContainerIdKey, null)

    // 获取插槽子组件
    const children = computed<VisualEditorBlockData[]>({
      get: () => props.slots?.default?.children || [],
      set: (val) => {
        if (props.slots?.default) {
          props.slots.default.children = val
        }
      },
    })

    // 容器是否被选中
    const isFocus = computed(() => block?.focus || false)
    // 是否处于编辑模式
    const isEditing = computed(() => editingContainerId === block?._vid)

    // 创建插槽画布
    const renderSlotCanvas = () => {
      return h(SlotGridCanvas, {
        slotKey: 'default',
        children: children.value,
        colNum: 12, // 容器内使用较少的列数
        rowHeight: 15,
        parentFocus: isFocus.value,
        isEditing: isEditing.value,
        'onUpdate:children': (newChildren: VisualEditorBlockData[]) => {
          children.value = newChildren
        },
      })
    }

    return () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
          ...styles,
        }}
      >
        {renderSlotCanvas()}
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
