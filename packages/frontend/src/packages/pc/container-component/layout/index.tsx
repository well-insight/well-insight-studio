import type { VisualEditorBlockData, VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { ElCol, ElRow } from 'element-plus'
import { computed, h, ref, watchEffect } from 'vue'
import GridCanvas from '../shared/GridCanvas.vue'
import { type ContainerRenderCustom, resolveEditingContainerId } from '../container'
import {
  createEditorInputNumberProp,
  createEditorSelectProp,
} from '@/visual-editor/visual-editor.props'

interface SlotItem {
  value: string // 原始比例字符串，如 "12:12"
  [key: string]: any // 包含 slot0, slot1... 等属性
}

// 全局存储每个 block 的插槽临时数据（用于保留子组件）
const slotsTemp = {} as Record<string, any>

/**
 * 根据比例字符串生成包含各列信息的对象
 * @example createSlots("12:12") => { value: "12:12", slot0: { span: "12", children: [] }, slot1: { span: "12", children: [] } }
 */
function createSlots(str: string): SlotItem {
  const parts = str.split(':')
  const result: SlotItem = { value: str }
  parts.forEach((span, index) => {
    result[`slot${index}`] = {
      key: `slot${index}`,
      span,
      children: [],
    }
  })
  return result
}

export default {
  key: 'layout',
  moduleName: 'containerComponents',
  label: '分栏容器',
  icon: 'comp-icon-layout',
  preview: () => (
    <ElRow gutter={20}>
      <ElCol span={8}>span: 8</ElCol>
      <ElCol span={8}>span: 8</ElCol>
      <ElCol span={8}>span: 8</ElCol>
    </ElRow>
  ),
  render: ({ props, styles, block, custom }) => {
    const editingContainerId = resolveEditingContainerId(custom as ContainerRenderCustom | undefined)

    // 初始化当前 block 的临时存储
    if (!slotsTemp[block._vid])
      slotsTemp[block._vid] = {}

    // 监听列比例变化，将已保存的子组件内容恢复到新比例的对应插槽中
    watchEffect(() => {
      const currentSlots = props.slots || {}
      if (Object.keys(currentSlots).length === 0)
        return

      Object.entries<SlotItem>(currentSlots).forEach(([key, slot]) => {
        const cached = slotsTemp[block._vid][key]
        if (cached?.children) {
          slot.children = cached.children
        }
      })
    })

    // 获取所有列配置（排除 value 字段）
    const slotEntries = computed(() =>
      Object.entries<SlotItem>(props.slots || createSlots('12:12'))
        .filter(([key]) => key !== 'value'),
    )

    // 容器是否被选中
    const isFocus = computed(() => block?.focus || false)
    // 是否处于编辑模式
    const isEditing = computed(() => editingContainerId.value === block?._vid)

    // 创建插槽画布渲染函数
    const renderSlotCanvas = (slotKey: string, children: VisualEditorBlockData[]) => {
      return h(GridCanvas, {
        slotKey,
        containerVid: block?._vid || '',
        children,
        colNum: 12, // 固定列数（与 GridLayoutPlus 一致：列数不随容器像素宽度变化）
        rowHeight: 15,
        parentFocus: isFocus.value,
        isEditing: isEditing.value,
        'onUpdate:children': (newChildren: VisualEditorBlockData[]) => {
          const slot = props.slots?.[slotKey]
          if (slot) {
            slot.children = newChildren
          }
        },
      })
    }

    return () => (
      <div style={{ width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'hidden', backgroundColor: styles.backgroundColor || 'transparent' }}>
        <ElRow
          {...custom}
          {...props}
          class="h-full w-full"
        >
          {slotEntries.value.map(([slotKey, slotItem]) => {
            // 保存当前插槽的 children 到临时存储（拖拽时会自动更新）
            slotsTemp[block._vid][slotKey] = slotItem

            return (
              <ElCol
                key={slotKey}
                class="h-full"
                span={Number(slotItem.span)}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                {renderSlotCanvas(slotKey, slotItem.children || [])}
              </ElCol>
            )
          })}
        </ElRow>
      </div>
    )
  },
  resize: {
    height: true,
    width: true,
  },
  props: {
    gutter: createEditorInputNumberProp({
      label: '列间隔',
      defaultValue: 0,
      min: 0,
    }),
    slots: createEditorSelectProp({
      label: '列比例',
      options: [
        { label: '24', value: createSlots('24') },
        { label: '12:12', value: createSlots('12:12') },
        { label: '6:18', value: createSlots('6:18') },
        { label: '18:6', value: createSlots('18:6') },
        { label: '8:8:8', value: createSlots('8:8:8') },
        { label: '6:12:6', value: createSlots('6:12:6') },
        { label: '6:6:6:6', value: createSlots('6:6:6:6') },
      ],
      defaultValue: createSlots('12:12'),
    }),
    justify: createEditorSelectProp({
      label: '主轴对齐方式',
      options: [
        { label: '左对齐', value: 'start' },
        { label: '居中排列', value: 'center' },
        { label: '均匀对齐', value: 'space-around' },
        { label: '两端对齐', value: 'space-between' },
        { label: '右对齐', value: 'end' },
      ],
      defaultValue: 'start',
    }),
    align: createEditorSelectProp({
      label: '交叉轴对齐方式',
      options: [
        { label: '顶部对齐', value: 'top' },
        { label: '垂直居中', value: 'middle' },
        { label: '底部对齐', value: 'bottom' },
      ],
      defaultValue: 'top',
    }),
  },
} as VisualEditorComponent
