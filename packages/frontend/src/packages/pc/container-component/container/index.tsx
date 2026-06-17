import type { VisualEditorBlockData, VisualEditorComponent } from '@/visual-editor/visual-editor.utils'
import { ElAside, ElContainer, ElFooter, ElHeader, ElMain } from 'element-plus'
import { type Ref, computed, h, ref } from 'vue'
import SlotGridCanvas from '../shared/SlotGridCanvas.vue'
import {
  createEditorInputProp,
  createEditorSelectProp,
  createEditorSwitchProp,
  createEditorTableProp,
} from '@/visual-editor/visual-editor.props'

// 容器编辑模式的注入 key
export const EditingContainerIdKey = Symbol('editingContainerId')

/** 画布容器编辑上下文（选中、右键、历史记录） */
export const ContainerEditorContextKey = Symbol('containerEditorContext')

export interface ContainerEditorContext {
  selectComp: (block: VisualEditorBlockData, event?: MouseEvent) => void
  selectedBlockIds: Ref<string[]>
  onContextmenuBlock: (e: MouseEvent, block: VisualEditorBlockData, parentBlocks?: VisualEditorBlockData[]) => void
  recordHistory: () => void
  enterContainerEditMode: (containerVid: string) => void
  selectContainerByVid: (containerVid: string, event?: MouseEvent) => void
  updateGroupInnerBlockPosition?: (vid: string, left: number, top: number) => void
  updateGroupInnerBlockSize?: (vid: string, width: number, height: number) => void
  onGroupInnerDragEnd?: () => void
}

export interface ContainerRenderCustom {
  editingContainerId?: Ref<string | null>
  editorCtx?: ContainerEditorContext | null
}

const CONTAINER_SLOT_KEYS = ['header', 'aside', 'main', 'footer'] as const

export function ensureContainerSlots(props: Record<string, any>) {
  props.slots ??= {}
  for (const key of CONTAINER_SLOT_KEYS) {
    props.slots[key] ??= { key, children: [] }
    props.slots[key].children ??= []
  }
}

export function resolveEditingContainerId(custom?: ContainerRenderCustom) {
  return custom?.editingContainerId ?? ref(null)
}

export default {
  key: 'container',
  moduleName: 'containerComponents',
  label: '页面容器',
  icon: 'comp-icon-container',
  preview: () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gridTemplateRows: 'auto 1fr auto',
      gridTemplateAreas: '"header header" "aside main" "footer footer"',
      gap: '2px',
      minHeight: '72px',
      border: '1px solid #dcdfe6',
      fontSize: '11px',
      textAlign: 'center',
    }}
    >
      <div style={{ gridArea: 'header', background: '#ecf5ff', padding: '4px' }}>Header</div>
      <div style={{ gridArea: 'aside', background: '#f5f7fa', padding: '4px' }}>Aside</div>
      <div style={{ gridArea: 'main', background: '#ecf5ff', padding: '4px' }}>Main</div>
      <div style={{ gridArea: 'footer', background: '#ecf5ff', padding: '4px' }}>Footer</div>
    </div>
  ),
  render: ({ props, styles, block, custom }) => {
    ensureContainerSlots(props)
    const editingContainerId = resolveEditingContainerId(custom as ContainerRenderCustom | undefined)
    // 控制各区域的显示
    const showHeader = props.showHeader !== false
    const showAside = props.showAside !== false
    const showMain = props.showMain !== false
    const showFooter = props.showFooter !== false

    // 布局方向：aside在左(horizontal)或在上(vertical)
    const asidePosition = props.asidePosition || 'left'

    // 各区域尺寸
    const headerHeight = props.headerHeight || '60px'
    const footerHeight = props.footerHeight || '60px'
    const asideWidth = props.asideWidth || '240px'

    // 获取各插槽的子组件
    const slots = computed(() => props.slots || {})
    const headerChildren = computed<VisualEditorBlockData[]>({
      get: () => slots.value.header?.children || [],
      set: (val) => { if (props.slots?.header) props.slots.header.children = val },
    })
    const asideChildren = computed<VisualEditorBlockData[]>({
      get: () => slots.value.aside?.children || [],
      set: (val) => { if (props.slots?.aside) props.slots.aside.children = val },
    })
    const mainChildren = computed<VisualEditorBlockData[]>({
      get: () => slots.value.main?.children || [],
      set: (val) => { if (props.slots?.main) props.slots.main.children = val },
    })
    const footerChildren = computed<VisualEditorBlockData[]>({
      get: () => slots.value.footer?.children || [],
      set: (val) => { if (props.slots?.footer) props.slots.footer.children = val },
    })

    // 根据容器尺寸计算网格列数（与设计画布一致）
    const containerWidth = 1200 // 默认宽度，实际使用时通过 ref 获取
    const colNum = computed(() => {
      return Math.max(1, Math.floor(containerWidth / 15))
    })

    // 容器是否被选中
    const isFocus = computed(() => block?.focus || false)
    // 是否处于编辑模式（通过注入的 editingContainerId 判断）
    const isEditing = computed(() => editingContainerId.value === block?._vid)

    // 创建插槽画布渲染函数
    const renderSlotCanvas = (slotKey: string, children: VisualEditorBlockData[]) => {
      return h(SlotGridCanvas, {
        slotKey,
        containerVid: block?._vid || '',
        children,
        colNum: 12, // 容器内使用较少的列数
        rowHeight: 15,
        parentFocus: isFocus.value,
        isEditing: isEditing.value,
        'onUpdate:children': (newChildren: VisualEditorBlockData[]) => {
          // 更新子组件
          const slot = slots.value[slotKey]
          if (slot) {
            slot.children = newChildren
          }
        },
      })
    }

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
        <ElContainer
          direction="vertical"
          style={{
            width: '100%',
            height: '100%',
            minHeight: '100%',
          }}
        >
          {/* Header 顶栏 */}
          {showHeader && (
            <ElHeader
              height={headerHeight}
              style={{
                flex: 'none',
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {renderSlotCanvas('header', headerChildren.value)}
            </ElHeader>
          )}

          {/* 中间区域：Aside + Main */}
          <ElContainer style={{ flex: '1', overflow: 'hidden' }}>
            {/* Aside 侧边栏 - 左侧 */}
            {showAside && asidePosition !== 'right' && (
              <ElAside
                width={asideWidth}
                style={{
                  flex: 'none',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {renderSlotCanvas('aside', asideChildren.value)}
              </ElAside>
            )}

            {/* Main 主要区域 */}
            {showMain && (
              <ElMain
                style={{
                  flex: '1',
                  overflow: 'hidden',
                  position: 'relative',
                  padding: 0,
                }}
              >
                {renderSlotCanvas('main', mainChildren.value)}
              </ElMain>
            )}

            {/* Aside 侧边栏 - 右侧 */}
            {showAside && asidePosition === 'right' && (
              <ElAside
                width={asideWidth}
                style={{
                  flex: 'none',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {renderSlotCanvas('aside', asideChildren.value)}
              </ElAside>
            )}
          </ElContainer>

          {/* Footer 底栏 */}
          {showFooter && (
            <ElFooter
              height={footerHeight}
              style={{
                flex: 'none',
                padding: 0,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {renderSlotCanvas('footer', footerChildren.value)}
            </ElFooter>
          )}
        </ElContainer>
      </div>
    )
  },
  resize: {
    height: true,
    width: true,
  },
  props: {
    // 显示控制
    'showHeader': createEditorSwitchProp({
      label: '显示顶栏',
      defaultValue: true,
    }),
    'showAside': createEditorSwitchProp({
      label: '显示侧边栏',
      defaultValue: true,
    }),
    'showMain': createEditorSwitchProp({
      label: '显示主区域',
      defaultValue: true,
    }),
    'showFooter': createEditorSwitchProp({
      label: '显示底栏',
      defaultValue: true,
    }),
    // 各区域内容配置
    'slots.header.children': createEditorTableProp({
      label: '顶栏内容',
      option: {
        options: [
          { label: '名称', field: 'label' },
          { label: '类型', field: 'componentKey' },
        ],
        showKey: 'label',
      },
      defaultValue: [],
    }),
    'slots.aside.children': createEditorTableProp({
      label: '侧边栏内容',
      option: {
        options: [
          { label: '名称', field: 'label' },
          { label: '类型', field: 'componentKey' },
        ],
        showKey: 'label',
      },
      defaultValue: [],
    }),
    'slots.main.children': createEditorTableProp({
      label: '主区域内容',
      option: {
        options: [
          { label: '名称', field: 'label' },
          { label: '类型', field: 'componentKey' },
        ],
        showKey: 'label',
      },
      defaultValue: [],
    }),
    'slots.footer.children': createEditorTableProp({
      label: '底栏内容',
      option: {
        options: [
          { label: '名称', field: 'label' },
          { label: '类型', field: 'componentKey' },
        ],
        showKey: 'label',
      },
      defaultValue: [],
    }),
    // 尺寸配置
    'asidePosition': createEditorSelectProp({
      label: '侧边栏位置',
      defaultValue: 'left',
      options: [
        { label: '左侧', value: 'left' },
        { label: '右侧', value: 'right' },
      ],
    }),
    'asideWidth': createEditorInputProp({
      label: '侧边栏宽度',
      defaultValue: '240px',
    }),
    'headerHeight': createEditorInputProp({
      label: '顶栏高度',
      defaultValue: '60px',
    }),
    'footerHeight': createEditorInputProp({
      label: '底栏高度',
      defaultValue: '60px',
    }),
  },
} as VisualEditorComponent
