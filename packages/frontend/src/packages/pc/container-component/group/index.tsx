import type { VisualEditorBlockData, VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { computed, h, ref } from 'vue'
import GridCanvas from '../shared/GridCanvas.vue' // 统一内层网格画布（插槽、组、布局等全部使用同一套网格度量 + CanvasItem）
import { type ContainerRenderCustom, resolveEditingContainerId } from '../container'
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
  render: ({ props, styles, block, custom }) => {
    const editingContainerId = resolveEditingContainerId(custom as ContainerRenderCustom | undefined)

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
    const isEditing = computed(() => editingContainerId.value === block?._vid)

    /**
     * 组内部网格的列数（稳定值）。
     * - 合并成组时会把“组的跨度(groupW)”作为 innerColNum 存下来。
     * - 这样组内子组件的相对 x/w（也是按该跨度计算的）在组的像素宽度上能得到与合并前一致的布局。
     * - 如果没有存储，回退到组自身在父画布上的 w（随组的尺寸变化）。
     */
    const innerColNum = computed(() => {
      const p: any = props || {}
      const stored = Number(p.innerColNum)
      if (stored && stored > 0) return Math.floor(stored)
      return Math.max(1, block?.w ?? 12)
    })

    // 统一使用网格度量的内层画布（GridCanvas），组与其它容器插槽行为一致。
    const renderGridCanvas = () => {
      return h(GridCanvas, {
        slotKey: 'default',
        containerVid: block?._vid || '',
        children: children.value,
        colNum: innerColNum.value,
        rowHeight: 1, // 1px 步长
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
          backgroundColor: styles.backgroundColor || 'transparent',
        }}
      >
        {renderGridCanvas()}
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
