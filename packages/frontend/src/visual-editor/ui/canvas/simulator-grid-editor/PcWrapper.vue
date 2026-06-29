<script lang="tsx" setup>
import type { ScrollbarInstance } from 'element-plus'
import type { CSSProperties } from 'vue'

import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useMouseInElement, useResizeObserver } from '@vueuse/core'
import { vLoading } from 'element-plus'
import { cloneDeep, debounce, throttle } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onBeforeUnmount, onMounted, provide, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAnimate } from '@/hooks/useAnimate'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import { ContainerEditorContextKey, EditingContainerIdKey } from '@/packages/pc/container-component/container'
import CanvasItem from '@/packages/pc/container-component/shared/CanvasItem.vue'
import { calcSlotDropLayout } from '@/packages/pc/container-component/shared/slot-grid.utils'
import { useCanvasThemeStore } from '@/stores/canvasThemeStore'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { resolveBlockBorderCss } from '@/utils/blockBorder'
import {
  DEFAULT_BLOCK_HEIGHT,
  DEFAULT_BLOCK_WIDTH,
  getBlockTitleInlineStyle,
  getBlockTitleText,
  isInnerBlockTitle,
} from '@/visual-editor/core/visual-editor.utils'
import { useModal } from '@/visual-editor/hooks/useModal'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { generateNanoid } from '@/visual-editor/lib'
import { $$dropdown, DropdownOption } from '@/visual-editor/lib/dropdown-service'
import ReferenceGuides from '@/visual-editor/ui/canvas/shared/ReferenceGuides.vue'
import { buildSnapTargets, snapDrag } from '@/visual-editor/ui/canvas/shared/snap'
import MonacoEditor from '@/visual-editor/ui/shared/monaco-editor/MonacoEditor'
import { createNewBlock, getBlockAnimationElement } from '@/visual-editor/visual-editor.utils'
import { visualConfig } from '@/visual.config'
import CompRender from './comp-render'
import SlotItem from './SlotItem.vue'

defineOptions({
  name: 'SimulatorEditor',
})

const props = withDefaults(defineProps<{
  autoFixScale?: boolean
  scale?: number
}>(), {
  autoFixScale: true,
  scale: 1,
})

const emits = defineEmits<{
  changeScale: [value: number]
}>()

const currentScale = ref(props?.scale)

const workspaceStore = useWorkspaceStore()

const { currentApp } = storeToRefs(workspaceStore)

const { currentPage, setCurrentBlock, currentBlock, updateCurrentBlock, visualLoading, recordHistory } = useVisualData()
const { globalProperties } = useGlobalProperties()

const controlStore = useControlStore()

const { floatingSettingVisible } = storeToRefs(controlStore)

const drag = ref(false)
const selectedBlockIds = ref<string[]>([])

/** 当前处于容器编辑模式的容器 _vid（双击容器进入，Esc/点击画布退出）支持 group, container, layout, form */
const editingContainerId = ref<string | null>(null)

// 提供编辑状态给子组件
provide(EditingContainerIdKey, editingContainerId)

/** 容器组件类型 */
const CONTAINER_COMPONENT_KEYS = ['group', 'container', 'layout', 'form']

/** 子块的外层包装样式映射（用于组内绝对定位） */
const blockWrapperStyles = ref<Record<string, CSSProperties>>({})

// ---- 多选拖动状态 ----
const multiDragState = reactive({
  active: false,
  dragVid: '',
  startPositions: {} as Record<string, { x: number, y: number }>,
})

function startMultiDrag(vid: string) {
  if (selectedBlockIds.value.length < 2)
    return
  if (!selectedBlockIds.value.includes(vid))
    return

  multiDragState.active = true
  multiDragState.dragVid = vid
  multiDragState.startPositions = {}

  // 记录所有选中块的初始位置
  const collectPositions = (blocks: VisualEditorBlockData[]) => {
    blocks.forEach((block) => {
      if (selectedBlockIds.value.includes(block._vid)) {
        multiDragState.startPositions[block._vid] = { x: block.x, y: block.y }
      }
      const slots = block.props?.slots || {}
      Object.keys(slots).forEach((key) => {
        const children = slots[key]?.children
        if (children)
          collectPositions(children)
      })
    })
  }
  collectPositions(currentPage.value.blocks)
}

function clearMultiDrag() {
  multiDragState.active = false
  multiDragState.dragVid = ''
  multiDragState.startPositions = {}
}

function applyMultiDrag() {
  if (!multiDragState.active || !multiDragState.startPositions[multiDragState.dragVid])
    return

  const dragBlock = findBlockByVid(multiDragState.dragVid, currentPage.value.blocks)
  if (!dragBlock)
    return

  const startPos = multiDragState.startPositions[multiDragState.dragVid]
  const dx = dragBlock.x - startPos.x
  const dy = dragBlock.y - startPos.y

  if (dx === 0 && dy === 0)
    return

  // 将偏移量应用到其他选中块，并夹在主画布边界内（避免多选拖动导致组件移出）
  const m = getGridMetrics()
  selectedBlockIds.value.forEach((vid) => {
    if (vid === multiDragState.dragVid)
      return
    const otherStart = multiDragState.startPositions[vid]
    if (!otherStart)
      return
    const otherBlock = findBlockByVid(vid, currentPage.value.blocks)
    if (otherBlock) {
      let nx = otherStart.x + dx
      let ny = otherStart.y + dy
      const maxX = Math.max(0, m.cols - (otherBlock.w || DEFAULT_BLOCK_WIDTH))
      nx = Math.max(0, Math.min(nx, maxX))
      ny = Math.max(0, ny)
      otherBlock.x = nx
      otherBlock.y = ny
    }
  })
}

const route = useRoute()

const canvasId = String(route.query?.key) || ''

const componentLoading = ref(false)

const wrapper = ref<HTMLElement>()
const canvasRef = useTemplateRef('canvasRef')
const canvasScrollbarRef = useTemplateRef<ScrollbarInstance>('canvasScrollbarRef')
const rootGridRef = useTemplateRef<HTMLElement>('rootGridRef')

const rootWidth = ref(0)
const rootHeight = ref(0)
/** .wrap-container 可视高度（作为画布默认高度） */
const wrapContainerHeight = ref(0)

function getCanvasScrollWrap(): HTMLElement | null {
  return canvasScrollbarRef.value?.wrapRef ?? null
}

/** 将屏幕坐标转为画布内局部坐标（考虑 el-scrollbar 滚动） */
function mouseToCanvasLocal(clientX: number, clientY: number) {
  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect)
    return null
  return {
    x: clientX - canvasRect.left,
    y: clientY - canvasRect.top,
  }
}

/** 鼠标是否在画布滚动视口内 */
function isMouseInCanvasViewport(clientX: number, clientY: number) {
  const viewport = getCanvasScrollWrap()?.getBoundingClientRect()
    ?? wrapper.value?.getBoundingClientRect()
  if (!viewport)
    return false
  return clientX >= viewport.left
    && clientX <= viewport.right
    && clientY >= viewport.top
    && clientY <= viewport.bottom
}

useResizeObserver(wrapper, (entries) => {
  const rect = entries[0]?.contentRect
  if (rect && rect.height > 0)
    wrapContainerHeight.value = rect.height
})

useResizeObserver(rootGridRef, (entries) => {
  const rect = entries[0]?.contentRect
  rootWidth.value = rect?.width ?? 0
  rootHeight.value = rect?.height ?? 0
})

const sketchRuleKey = ref<string>('')

const { isOutside } = useMouseInElement(wrapper)

const lines = reactive({
  h: [],
  v: [],
})

const thick = ref(20)
const lang = ref('zh-CN')
const shadow = reactive({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
})

const isEnterSpace = ref(false)
function getBlockBorderStyle(item: VisualEditorBlockData): CSSProperties {
  return resolveBlockBorderCss(item, currentPage.value?.config)
}

// 监听键盘按键事件componentData
function keyEvent() {
  document.addEventListener('keydown', (e: any) => {
    if (e && e.code === 'Space' && !isOutside.value) {
      isEnterSpace.value = true
      e.preventDefault() // 阻止默认事件行为
    }
    // Delete / Backspace 删除选中组件（支持多选）
    if ((e.code === 'Delete' || e.code === 'Backspace') && selectedBlockIds.value.length > 0) {
      const activeEl = document.activeElement
      const isEditable = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.getAttribute('contenteditable') === 'true'
      if (!isEditable) {
        e.preventDefault()
        deleteComp()
      }
    }
    // Esc 退出容器编辑模式
    if (e.code === 'Escape' && editingContainerId.value && !isOutside.value) {
      const container = findBlockByVid(editingContainerId.value, currentPage.value.blocks)
      exitContainerEditMode()
      if (container)
        selectComp(container)
      e.preventDefault()
    }
  })
  document.addEventListener('keyup', (e: any) => {
    if (e && e.code === 'Space') {
      isEnterSpace.value = false
      e.preventDefault() // 阻止默认事件行为
    }
  })
}

onMounted(() => {
  currentPage.value?.blocks?.forEach((block) => {
    if (!block.i) {
      block.i = block._vid
    }
  })

  controlStore.registerCanvasSelectHandler((block, options) => {
    if (options?.multiSelect) {
      selectComp(block, { ctrlKey: true, metaKey: false } as MouseEvent)
    }
    else {
      selectComp(block)
    }
  })
  controlStore.registerCanvasClearSelectionHandler(() => {
    deSelectComp()
  })

  keyEvent()

  nextTick(() => {
    resetAllContainerGridLocks()
    syncContainerGridAfterLockChange()
    syncGroupWrapperStyles()
    setTimeout(() => {
      initAnimate()
    }, 1000)
  })
})

watch(selectedBlockIds, (ids) => {
  controlStore.setCanvasSelectedBlockIds([...ids])
}, { deep: true, immediate: true })

/**
 * @description 操作当前页面样式表
 */
const editCanvasStyle = computed(() => {
  const { bgImage, bgColor, pageSize, bgRepeat, bgSize } = currentPage.value.config
  // 当未设置背景色时，使用 CSS 变量自适应暗黑/明亮模式
  const normalizedBgColor = bgColor || 'var(--el-bg-color)'
  const normalizedBgImage = bgImage ? `url(${bgImage})` : 'none'
  const normalizedBgRepeat = bgRepeat || 'no-repeat'
  const normalizedBgSize = bgSize || 'cover'
  return {
    width: '100%',
    minHeight: rootCanvasMinHeightStyle.value,
    backgroundColor: normalizedBgColor,
    backgroundImage: normalizedBgImage,
    backgroundRepeat: normalizedBgRepeat,
    backgroundSize: normalizedBgSize,
    cursor: isEnterSpace.value ? 'grab' : 'auto',
  } as CSSProperties
})

// gridLayoutPlus 已移除，根画布使用自研 CanvasItem + 像素绝对定位 + 网格度量
// 所有位置计算改用 getGridMetrics + calc* 函数

/** 基于页面设计宽度计算固定列数（1px 步长：列数 = 设计宽度，每个单位 1px） */
const gridColNum = computed(() => {
  const designWidth = currentPage.value?.config?.pageSize?.width || 1920
  return Math.max(1, Math.floor(designWidth))
})

interface MainGridMetrics {
  containerWidth: number
  cols: number
  rowHeight: number
  margin: [number, number]
}

function getGridMetrics(): MainGridMetrics & { colWidth: number } {
  const rowHeight = 1
  const margin: [number, number] = [0, 0]
  // 优先使用 resize observer 测量的实际容器宽度（像 GridCanvas 的 slotWidth）
  // 回退到页面设计宽度（显式固定宽度）
  const containerWidth = rootWidth.value > 0
    ? rootWidth.value
    : (currentPage.value?.config?.pageSize?.width || 1920)
  const cols = gridColNum.value
  const totalSpace = containerWidth - margin[0] * (cols + 1)
  const colWidth = totalSpace / cols
  return { rowHeight, colWidth, containerWidth, cols, margin }
}

/** Root canvas logical width for drag clamping (prevents items moving out horizontally) */
const rootContainerWidth = computed(() => getGridMetrics().containerWidth)

/** 获取根块的像素位置（用于 CanvasItem） */
function getRootItemPixelRect(block: VisualEditorBlockData) {
  return calcGridItemPixelRect(
    block.x || 0,
    block.y || 0,
    block.w || DEFAULT_BLOCK_WIDTH,
    block.h || DEFAULT_BLOCK_HEIGHT,
    getGridMetrics(),
  )
}

/** 像素 -> 网格（用于拖拽结束提交） */
function pixelToGrid(left: number, top: number, m = getGridMetrics()) {
  const x = Math.max(0, Math.round(left / m.colWidth))
  const y = Math.max(0, Math.round(top / m.rowHeight))
  return { x, y }
}

/** 与 grid-layout-plus 中 calcGridColLeft 保持一致 */
function calcGridColLeft(col: number, metrics: MainGridMetrics) {
  const totalSpace = metrics.containerWidth - metrics.margin[0] * (metrics.cols + 1)
  return Math.round(totalSpace * col / metrics.cols) + metrics.margin[0] * (col + 1)
}

/** 与 grid-layout-plus 中 calcGridRowTop 保持一致 */
function calcGridRowTop(row: number, metrics: MainGridMetrics) {
  return Math.round(metrics.rowHeight * row) + metrics.margin[1] * (row + 1)
}

/** 计算网格项在画布中的像素矩形（与 GridItem calcPosition 一致） */
function calcGridItemPixelRect(
  x: number,
  y: number,
  w: number,
  h: number,
  metrics: MainGridMetrics,
) {
  const left = calcGridColLeft(x, metrics)
  const top = calcGridRowTop(y, metrics)
  const width = calcGridColLeft(x + w, metrics) - left - metrics.margin[0]
  const height = calcGridRowTop(y + h, metrics) - top - metrics.margin[1]
  return { left, top, width, height }
}

function getBlockDomRect(vid: string, originEl: HTMLElement) {
  const el = document.querySelector(`.list-group-item-${vid}`) as HTMLElement | null
  if (!el)
    return null
  const originRect = originEl.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return {
    left: elRect.left - originRect.left,
    top: elRect.top - originRect.top,
    width: elRect.width,
    height: elRect.height,
  }
}

function toPxStyle(value: number) {
  return `${Math.round(value)}px`
}

function toPxString(value: string | number | undefined, fallback: string) {
  if (value == null || value === '')
    return fallback
  return typeof value === 'number' ? `${value}px` : String(value)
}

/** 将旧版写入 block.styles 的组内定位迁移到 groupInnerLayout */
function migrateGroupInnerStyles(block: VisualEditorBlockData) {
  if (block.groupInnerLayout)
    return

  const styles = block.styles || {}
  if (styles.position !== 'absolute' || styles.left == null || styles.top == null)
    return

  const childRect = calcGridItemPixelRect(block.x || 0, block.y || 0, block.w || DEFAULT_BLOCK_WIDTH, block.h || DEFAULT_BLOCK_HEIGHT, getGridMetrics())
  block.groupInnerLayout = {
    left: toPxString(styles.left, '0px'),
    top: toPxString(styles.top, '0px'),
    width: toPxString(styles.width, toPxStyle(childRect.width)),
    height: toPxString(styles.height, toPxStyle(childRect.height)),
  }

  const { position, left, top, width, height, right, bottom, ...rest } = styles
  block.styles = rest
}

function setGroupInnerLayout(
  block: VisualEditorBlockData,
  layout: { left: string, top: string, width: string, height: string },
) {
  block.groupInnerLayout = layout
}

function buildGroupInnerWrapperStyle(
  block: VisualEditorBlockData,
  metrics: MainGridMetrics,
  originLeft = 0,
  originTop = 0,
): CSSProperties {
  migrateGroupInnerStyles(block)

  const saved = block.groupInnerLayout
  if (saved) {
    return {
      position: 'absolute',
      left: saved.left,
      top: saved.top,
      width: saved.width,
      height: saved.height,
      margin: '0',
      padding: '0',
      boxSizing: 'border-box',
      flex: 'none',
      overflow: 'visible',
    }
  }

  const rect = calcGridItemPixelRect(block.x || 0, block.y || 0, block.w || DEFAULT_BLOCK_WIDTH, block.h || DEFAULT_BLOCK_HEIGHT, metrics)
  return {
    position: 'absolute',
    left: toPxStyle(rect.left - originLeft),
    top: toPxStyle(rect.top - originTop),
    width: toPxStyle(rect.width),
    height: toPxStyle(rect.height),
    margin: '0',
    padding: '0',
    boxSizing: 'border-box',
    flex: 'none',
    overflow: 'visible',
  }
}

/** 根据页面中的组块，同步组内组件的绝对定位样式 */
function syncGroupWrapperStyles() {
  const metrics = getGridMetrics()
  const styles: Record<string, CSSProperties> = { ...blockWrapperStyles.value }

  const syncGroupChildren = (blocks: VisualEditorBlockData[]) => {
    blocks.forEach((block) => {
      if (block.componentKey === 'group') {
        const children = block.props?.slots?.default?.children || []
        // 新模型（合并后）：子组件使用相对网格 x/y，不再生成旧的绝对 wrapper 样式。
        // 只有仍携带 groupInnerLayout 的老数据才需要同步绝对定位样式。
        const hasLegacy = children.some((c: any) => c.groupInnerLayout)
        if (hasLegacy) {
          const groupOriginLeft = calcGridColLeft(block.x || 0, metrics)
          const groupOriginTop = calcGridRowTop(block.y || 0, metrics)
          children.forEach((child: VisualEditorBlockData) => {
            migrateGroupInnerStyles(child)
            const existing = styles[child._vid]
            const childRect = calcGridItemPixelRect(
              child.x || 0,
              child.y || 0,
              child.w || DEFAULT_BLOCK_WIDTH,
              child.h || DEFAULT_BLOCK_HEIGHT,
              metrics,
            )
            styles[child._vid] = existing
              ? {
                  ...existing,
                  width: child.groupInnerLayout?.width ?? toPxStyle(childRect.width),
                  height: child.groupInnerLayout?.height ?? toPxStyle(childRect.height),
                }
              : buildGroupInnerWrapperStyle(child, metrics, groupOriginLeft, groupOriginTop)
          })
        }
        // 对于新模型的组，不写入任何 blockWrapperStyles 条目，避免用“相对小数字”在外部度量下算出错误像素样式。
      }

      const slots = block.props?.slots || {}
      Object.keys(slots).forEach((key) => {
        const children = slots[key]?.children
        if (children)
          syncGroupChildren(children)
      })
    })
  }

  syncGroupChildren(currentPage.value.blocks)
  blockWrapperStyles.value = styles
}

/** 更新组内组件拖拽后的位置 */
function updateGroupInnerBlockPosition(vid: string, left: number, top: number) {
  const prev = blockWrapperStyles.value[vid] || {}
  blockWrapperStyles.value = {
    ...blockWrapperStyles.value,
    [vid]: {
      ...prev,
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
    },
  }

  const block = findBlockByVid(vid, currentPage.value.blocks)
  if (block?.groupInnerLayout) {
    block.groupInnerLayout = {
      ...block.groupInnerLayout,
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
    }
  }
}

/** 更新组内组件拖拽后的尺寸 */
function updateGroupInnerBlockSize(vid: string, width: number, height: number) {
  const widthPx = `${Math.max(20, Math.round(width))}px`
  const heightPx = `${Math.max(20, Math.round(height))}px`
  const prev = blockWrapperStyles.value[vid] || {}
  blockWrapperStyles.value = {
    ...blockWrapperStyles.value,
    [vid]: {
      ...prev,
      width: widthPx,
      height: heightPx,
    },
  }

  const block = findBlockByVid(vid, currentPage.value.blocks)
  if (block?.groupInnerLayout) {
    block.groupInnerLayout = {
      ...block.groupInnerLayout,
      width: widthPx,
      height: heightPx,
    }
    block.hasResize = true
  }
}

function onGroupInnerDragEnd() {
  recordHistory()
}

/** 主题 CSS 变量（直接在模板中通过 :style 绑定，保证实时响应） */
const themeStore = useCanvasThemeStore()
const themeStyle = computed(() => themeStore.themeCSSVars)

onBeforeUnmount(() => {
  document.removeEventListener('dragover', syncMousePosition)
  document.removeEventListener('mousemove', syncMousePosition, true)
  controlStore.unregisterCanvasSelectHandler()
  controlStore.unregisterCanvasClearSelectionHandler()
})

const mouseAt = { x: -1, y: -1 }

function syncMousePosition(event: MouseEvent) {
  mouseAt.x = event.clientX
  mouseAt.y = event.clientY
}

const dropId = 'drop'
const dragItem = ref(defaultDragItem())

/** 从组件库拖入时的临时占位块（完整渲染容器时会自带 slot，需排除插槽命中） */
function isPaletteGhostBlock(block: VisualEditorBlockData | null | undefined) {
  return block?.i === dropId || block?._vid === dropId
}

function defaultDragItem() {
  return {
    x: -1,
    y: -1,
    i: '',
    w: 10,
    h: 10,
  }
}

const dragging = throttle(() => {
  const mouseInGrid = isMouseInCanvasViewport(mouseAt.x, mouseAt.y)
  const local = mouseToCanvasLocal(mouseAt.x, mouseAt.y)
  if (!local)
    return

  const overSlot = Boolean(findSlotContextAtPoint(mouseAt.x, mouseAt.y))

  // 确保有占位 ghost
  let ghostIndex = currentPage.value.blocks.findIndex(item => item.i === dropId)
  if (mouseInGrid && ghostIndex === -1 && !overSlot && controlStore.moveVisualData) {
    const m = getGridMetrics()
    const moveData: any = {
      ...controlStore.moveVisualData,
      i: dropId,
      _vid: dropId, // 临时
    }
    const w = moveData.w || DEFAULT_BLOCK_WIDTH
    const h = moveData.h || DEFAULT_BLOCK_HEIGHT
    moveData.x = Math.max(0, Math.min(Math.round(local.x / m.colWidth), m.cols - w))
    moveData.y = Math.max(0, Math.round(local.y / m.rowHeight))
    dragItem.value.h = h
    dragItem.value.w = w
    dragItem.value.i = dropId
    dragItem.value.x = moveData.x
    dragItem.value.y = moveData.y
    currentPage.value.blocks.push(moveData)
    ghostIndex = currentPage.value.blocks.length - 1
  }

  if (overSlot) {
    currentPage.value.blocks = currentPage.value.blocks.filter(item => item.i !== dropId)
    return
  }

  if (ghostIndex !== -1) {
    const ghost = currentPage.value.blocks[ghostIndex]
    if (!ghost)
      return

    // 直接用鼠标像素算网格坐标（不再依赖 GridLayoutPlus）
    const m = getGridMetrics()
    const gx = Math.max(0, Math.round(local.x / m.colWidth))
    const gy = Math.max(0, Math.round(local.y / m.rowHeight))

    const w = ghost.w || dragItem.value.w || DEFAULT_BLOCK_WIDTH
    const h = ghost.h || dragItem.value.h || DEFAULT_BLOCK_HEIGHT
    const clampedX = Math.max(0, Math.min(gx, m.cols - w))
    const clampedY = Math.max(0, gy)

    if (mouseInGrid) {
      if (ghost.x !== clampedX)
        ghost.x = clampedX
      if (ghost.y !== clampedY)
        ghost.y = clampedY
      dragItem.value.i = String(ghostIndex)
      dragItem.value.x = ghost.x
      dragItem.value.y = ghost.y

      // Auto-scroll when dragging a new component (from palette) downward.
      // Canvas height grows automatically because the temp ghost block participates in rootContentMinHeight computation.
      autoScrollDuringDrag(mouseAt.y)
    }
    else {
      currentPage.value.blocks = currentPage.value.blocks.filter(item => item.i !== dropId)
    }
  }
})

/**
 * 在块树中递归查找指定 _vid 的块
 */
function findBlockByVid(vid: string, blocks: VisualEditorBlockData[]): VisualEditorBlockData | null {
  for (const block of blocks) {
    if (block._vid === vid)
      return block
    const slots = block.props?.slots || {}
    for (const key of Object.keys(slots)) {
      const children = slots[key]?.children
      if (children) {
        const found = findBlockByVid(vid, children)
        if (found)
          return found
      }
    }
  }
  return null
}

/**
 * 通过鼠标坐标检测是否落在某个容器插槽内。
 * 优先使用 elementsFromPoint + closest；失败时回退到几何命中所有 .slot-grid-canvas，
 * 选择面积最小的（最内层嵌套优先），以支持拖拽加入容器/组插槽。
 */
function findSlotContextAtPoint(x: number, y: number): { parentBlock: VisualEditorBlockData, slotKey: string } | null {
  // 1) 快速路径：elementsFromPoint
  const elements = document.elementsFromPoint(x, y)
  for (const el of elements) {
    const slotCanvasEl = (el as HTMLElement).closest('.slot-grid-canvas') as HTMLElement | null
    if (slotCanvasEl) {
      const ctx = extractSlotContextFromCanvas(slotCanvasEl)
      if (ctx)
        return ctx
    }
  }

  // 2) 几何回退：遍历所有 slot 画布，找包含点的（优先最小面积=更内层）
  const all = Array.from(document.querySelectorAll<HTMLElement>('.slot-grid-canvas'))
  let best: { el: HTMLElement, area: number } | null = null
  for (const slot of all) {
    if (slot.closest(`.list-group-item-${dropId}`))
      continue
    const r = slot.getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      const area = Math.max(1, r.width * r.height)
      if (!best || area < best.area)
        best = { el: slot, area }
    }
  }
  if (best) {
    const ctx = extractSlotContextFromCanvas(best.el)
    if (ctx)
      return ctx
  }
  return null
}

function extractSlotContextFromCanvas(slotCanvasEl: HTMLElement): { parentBlock: VisualEditorBlockData, slotKey: string } | null {
  const parentEl = slotCanvasEl.closest('[class*="list-group-item-"]') as HTMLElement | null
  if (!parentEl)
    return null
  const classList = Array.from(parentEl.classList)
  const vidClass = classList.find(c => c.startsWith('list-group-item-'))
  const parentVid = vidClass?.replace('list-group-item-', '')
  if (!parentVid || parentVid === dropId)
    return null
  const parentBlock = findBlockByVid(parentVid, currentPage.value.blocks)
  if (!parentBlock || isPaletteGhostBlock(parentBlock))
    return null
  const slotKey = slotCanvasEl.getAttribute('data-slot-key') || 'default'
  if (!parentBlock.props?.slots?.[slotKey])
    return null
  return { parentBlock, slotKey }
}

function findSlotElementAtPoint(x: number, y: number): HTMLElement | null {
  // 优先 elementsFromPoint
  const elements = document.elementsFromPoint(x, y)
  for (const el of elements) {
    const slot = (el as HTMLElement).closest('.slot-grid-canvas') as HTMLElement | null
    if (slot && !slot.closest(`.list-group-item-${dropId}`))
      return slot
  }
  // 几何回退
  const all = Array.from(document.querySelectorAll<HTMLElement>('.slot-grid-canvas'))
  let best: { el: HTMLElement, area: number } | null = null
  for (const slot of all) {
    if (slot.closest(`.list-group-item-${dropId}`))
      continue
    const r = slot.getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      const area = Math.max(1, r.width * r.height)
      if (!best || area < best.area)
        best = { el: slot, area }
    }
  }
  return best ? best.el : null
}

function dragEnd() {
  const mouseInGrid = isMouseInCanvasViewport(mouseAt.x, mouseAt.y)

  if (!mouseInGrid) {
    // 清理 ghost
    currentPage.value.blocks = currentPage.value.blocks.filter(item => item.i !== dropId)
    dragItem.value = defaultDragItem()
    return
  }

  const slotContext = findSlotContextAtPoint(mouseAt.x, mouseAt.y)

  // 移除临时 ghost
  currentPage.value.blocks = currentPage.value.blocks.filter(item => item.i !== dropId)

  if (!controlStore.moveVisualData) {
    dragItem.value = defaultDragItem()
    return
  }

  const sourceBlock = controlStore.moveVisualData!
  const slotEl = slotContext ? findSlotElementAtPoint(mouseAt.x, mouseAt.y) : null
  const slotLayout = slotEl
    ? calcSlotDropLayout(slotEl, mouseAt.x, mouseAt.y, sourceBlock)
    : null

  // 如果没有 slotLayout，用最后记录的 dragItem 像素位置转网格
  const m = getGridMetrics()
  let finalX = dragItem.value.x ?? 0
  let finalY = dragItem.value.y ?? 0
  if (!slotLayout && dragItem.value.x != null) {
    // dragItem 存的是网格坐标（我们在 dragging 里已经转过了）
    finalX = dragItem.value.x
    finalY = dragItem.value.y
  }

  const moveData: any = {
    ...sourceBlock,
    x: slotLayout?.x ?? finalX,
    y: slotLayout?.y ?? finalY,
    w: slotLayout?.w ?? (dragItem.value.w || sourceBlock.w || DEFAULT_BLOCK_WIDTH),
    h: slotLayout?.h ?? (dragItem.value.h || sourceBlock.h || DEFAULT_BLOCK_HEIGHT),
    i: sourceBlock._vid ?? sourceBlock.i,
  }

  if (slotContext) {
    const slotChildren = slotContext.parentBlock.props!.slots![slotContext.slotKey]!.children
    if (slotChildren) {
      slotChildren.push(moveData)

      // Auto-extend the target container's height if the dropped item lands below its current bottom
      const neededH = (moveData.y || 0) + (moveData.h || DEFAULT_BLOCK_HEIGHT) + 3
      if ((slotContext.parentBlock.h || 0) < neededH) {
        slotContext.parentBlock.h = neededH
      }
    }
  }
  else {
    currentPage.value.blocks.push(moveData)
  }

  selectComp(moveData)
  controlStore.setMoveVisualData(null)

  dragItem.value = defaultDragItem()
  recordHistory()
}

/**
 * 双击添加组件到画布中心
 */
function addBlock(componentData: VisualEditorBlockData) {
  if (!canvasRef.value)
    return

  const viewport = getCanvasScrollWrap()?.getBoundingClientRect()
    ?? wrapper.value?.getBoundingClientRect()
  const canvasRect = canvasRef.value.getBoundingClientRect()
  if (!viewport)
    return

  const centerX = viewport.left + viewport.width / 2
  const centerY = viewport.top + viewport.height / 2

  const m = getGridMetrics()
  const localX = centerX - canvasRect.left
  const localY = centerY - canvasRect.top
  let x = Math.max(0, Math.round(localX / m.colWidth))
  let y = Math.max(0, Math.round(localY / m.rowHeight))

  const w = componentData.w || DEFAULT_BLOCK_WIDTH
  const h = componentData.h || DEFAULT_BLOCK_HEIGHT
  const colNum = gridColNum.value
  x = Math.max(0, Math.min(x, colNum - w))
  y = Math.max(0, y)

  const newBlock = {
    ...componentData,
    x,
    y,
    w,
    h,
  }

  currentPage.value.blocks.push(newBlock)

  selectComp(newBlock)
  recordHistory()

  // 同步组包装样式（如果组件是组内组件）
  syncGroupWrapperStyles()
}

// 递归实现
// @leafId  为你要查找的id，
// @nodes   为原始Json数据
// @path    供递归使用，不要赋值
function findPathByLeafId(leafId: string, nodes: VisualEditorBlockData[] = [], path: VisualEditorBlockData[] = []): VisualEditorBlockData[] {
  for (let i = 0; i < nodes.length; i++) {
    const tmpPath = path.concat()
    tmpPath.push(nodes[i])
    if (leafId === nodes[i]._vid) {
      return tmpPath
    }
    const slots = nodes[i].props?.slots || {}
    const keys = Object.keys(slots)
    for (let j = 0; j < keys.length; j++) {
      const children = slots[keys[j]]?.children
      if (children) {
        const findResult = findPathByLeafId(leafId, children, tmpPath)
        if (findResult) {
          return findResult
        }
      }
    }
  }
}

/**
 * 递归清除所有块的选中状态
 */
function clearAllBlockFocus(blocks: VisualEditorBlockData[]) {
  blocks.forEach((block) => {
    block.focus = false
    block.focusWithChild = false
    const slots = block.props?.slots || {}
    Object.keys(slots).forEach((key) => {
      const children = slots[key]?.children
      if (children) {
        clearAllBlockFocus(children)
      }
    })
  })
}

/**
 * 递归为指定 ID 列表的块设置 focus
 */
function setMultiFocus(blocks: VisualEditorBlockData[], ids: string[]) {
  blocks.forEach((block) => {
    block.focus = ids.includes(block._vid)
    const slots = block.props?.slots || {}
    Object.keys(slots).forEach((key) => {
      const children = slots[key]?.children
      if (children) {
        setMultiFocus(children, ids)
      }
    })
  })
}

/**
 * 查找组内组件所属的组
 */
function findParentContainer(
  vid: string,
  blocks: VisualEditorBlockData[] = currentPage.value.blocks,
): VisualEditorBlockData | null {
  for (const block of blocks) {
    if (isContainerComponent(block.componentKey)) {
      const slots = block.props?.slots || {}
      for (const key of Object.keys(slots)) {
        const children = slots[key]?.children || []
        if (children.some((child: any) => child._vid === vid))
          return block
      }
    }
    const slots = block.props?.slots || {}
    for (const key of Object.keys(slots)) {
      const children = slots[key]?.children
      if (children) {
        const found = findParentContainer(vid, children)
        if (found)
          return found
      }
    }
  }
  return null
}

function isContainerInnerBlockData(block: VisualEditorBlockData) {
  if (block.groupInnerLayout || blockWrapperStyles.value[block._vid])
    return true
  return Boolean(findParentContainer(block._vid))
}

function setContainerGridLocked(block: VisualEditorBlockData, locked: boolean) {
  if (!isContainerComponent(block.componentKey))
    return

  if (locked) {
    block.static = true
    block._containerEditLocked = true
    // 编辑容器时，外层 grid-item 忽略插槽内交互，避免与内层 grid 拖拽冲突
    // 覆盖自定义插槽画布（不再使用 grid-layout-plus 内部的 GridItem）
    block.dragIgnoreFrom = '.slot-grid-canvas, .slot-grid-canvas *, .slot-grid-item, .slot-grid-item *, .group-absolute-canvas, .group-absolute-canvas *'
  }
  else {
    delete block.static
    delete block.isDraggable
    delete block.isResizable
    delete block._containerEditLocked
    delete block.dragIgnoreFrom
  }
}

/** 容器编辑锁（自研画布下主要靠 isEditing + dragIgnoreFrom 控制，保留字段兼容老逻辑） */
function restoreContainerGridInteract(_blocks: VisualEditorBlockData[] = currentPage.value.blocks) {
  // 根画布已不再使用 GridLayoutPlus，内层 GridCanvas/CanvasItem 通过 isEditing 控制交互。
  // 此函数保留为空实现，避免历史调用报错。
}

function resetAllContainerGridLocks(blocks: VisualEditorBlockData[] = currentPage.value.blocks) {
  blocks.forEach((block) => {
    if (isContainerComponent(block.componentKey))
      setContainerGridLocked(block, false)

    const slots = block.props?.slots || {}
    Object.keys(slots).forEach((key) => {
      const children = slots[key]?.children
      if (children)
        resetAllContainerGridLocks(children)
    })
  })
}

function syncContainerGridAfterLockChange() {
  nextTick(() => {
    restoreContainerGridInteract(currentPage.value.blocks)
    // 不再需要 gridLayout.layoutUpdate
  })
}

function unlockAllEditingContainers() {
  resetAllContainerGridLocks()
  syncContainerGridAfterLockChange()
}

function lockContainerAndAncestors(containerVid: string) {
  resetAllContainerGridLocks()
  let currentVid: string | null = containerVid
  while (currentVid) {
    const block = findBlockByVid(currentVid, currentPage.value.blocks)
    if (block && isContainerComponent(block.componentKey))
      setContainerGridLocked(block, true)
    currentVid = findParentContainer(currentVid)?._vid ?? null
  }
  syncContainerGridAfterLockChange()
}

/** 检查是否为容器组件 */
function isContainerComponent(componentKey: string): boolean {
  return CONTAINER_COMPONENT_KEYS.includes(componentKey)
}

/** 容器自身或子孙容器处于编辑模式（用于锁定外层交互） */
function isContainerInEditHierarchy(vid: string) {
  if (!editingContainerId.value)
    return false
  if (vid === editingContainerId.value)
    return true
  let current: string | null = editingContainerId.value
  while (current) {
    const parent = findParentContainer(current)
    if (parent?._vid === vid)
      return true
    current = parent?._vid ?? null
  }
  return false
}

/** 进入容器编辑模式 */
function enterContainerEditMode(containerVid: string) {
  const container = findBlockByVid(containerVid, currentPage.value.blocks)
  if (!container || !isContainerComponent(container.componentKey))
    return
  editingContainerId.value = containerVid
  lockContainerAndAncestors(containerVid)
}

/** 退出容器编辑模式 */
function exitContainerEditMode() {
  editingContainerId.value = null
  unlockAllEditingContainers()
}

/** 保留空实现，供 SlotItem 拖放事件兼容 */
function handleDragEnterContainer(_containerVid: string, _immediate?: boolean) {}

function handleDragLeaveContainer() {}

/** 当前正在拖拽的画布组件 */
const draggingBlockId = ref<string | null>(null)

/** Live pixel rect (in the main canvas coordinate) of the item being dragged, for reference guides */
const activeDragRect = ref<{ vid: string, left: number, top: number, width: number, height: number } | null>(null)

watch(draggingBlockId, (val) => {
  if (!val)
    activeDragRect.value = null
})

/** Live rect while resizing on main canvas (for guides) */
const activeResizeRect = ref<{ vid: string, left: number, top: number, width: number, height: number } | null>(null)

// 旧的 GridLayoutPlus resize tracker 已移除（CanvasItem 直接通过 resize-update 事件驱动 activeResizeRect）。

// Other top-level rects for guides on main canvas (pixel space)
const mainOtherRects = computed(() => {
  const active = activeDragRect.value || activeResizeRect.value
  if (!active)
    return []
  const m = getGridMetrics()
  return currentPage.value.blocks
    .filter(b => b._vid !== active.vid && !isPaletteGhostBlock(b))
    .map(b => calcGridItemPixelRect(b.x || 0, b.y || 0, b.w || DEFAULT_BLOCK_WIDTH, b.h || DEFAULT_BLOCK_HEIGHT, m))
})

// Approximate canvas pixel size for main guides overlay (uses measured root size when available)
/** 由页面内容（块位置 + 拖拽/缩放视觉态）推算的最小高度（不含视口 100% 基准）。 */
const rootContentHeightFromBlocks = computed(() => {
  const m = getGridMetrics()
  let maxBottom = 0
  currentPage.value.blocks.forEach((b) => {
    const bottom = calcGridRowTop((b.y || 0) + (b.h || DEFAULT_BLOCK_HEIGHT), m) + 400
    if (bottom > maxBottom)
      maxBottom = bottom
  })
  const live = activeDragRect.value || activeResizeRect.value
  if (live) {
    const liveBottom = (live.top + live.height) + 300
    if (liveBottom > maxBottom)
      maxBottom = liveBottom
  }
  if (rootHeight.value > maxBottom)
    maxBottom = rootHeight.value
  return Math.ceil(maxBottom)
})

/** 画布默认高度基准：.wrap-container 可视高度，回退到页面设计高度 */
function getCanvasBaselineHeight() {
  if (wrapContainerHeight.value > 0)
    return wrapContainerHeight.value
  const pageH = Number(currentPage.value?.config?.pageSize?.height) || 0
  if (pageH > 0)
    return pageH
  return 720
}

/** 画布 min-height：默认填满可视区域，内容超出时继续增高（使用 px，避免 % 在 flex 下塌陷） */
const rootCanvasMinHeightStyle = computed(() => {
  const baseline = getCanvasBaselineHeight()
  const content = rootContentHeightFromBlocks.value
  return `${Math.max(baseline, content)}px`
})

/** 画布实际最小高度（像素） */
const rootContentMinHeight = computed(() => {
  return Math.max(getCanvasBaselineHeight(), rootContentHeightFromBlocks.value)
})

const mainGuidesSize = computed(() => {
  const m = getGridMetrics()
  const h = Math.max(rootContentHeightFromBlocks.value, getCanvasBaselineHeight(), rootHeight.value || 0)
  return { width: m.containerWidth, height: h }
})

// 根画布的吸附目标（所有其他块 + 画布边界/中线）
const mainSnapTargets = computed(() => {
  const m = getGridMetrics()
  const others = currentPage.value.blocks
    .filter(b => !isPaletteGhostBlock(b))
    .map(b =>
      calcGridItemPixelRect(
        b.x || 0,
        b.y || 0,
        b.w || DEFAULT_BLOCK_WIDTH,
        b.h || DEFAULT_BLOCK_HEIGHT,
        m,
      ),
    )
  const estH = Math.max(rootContentHeightFromBlocks.value, getCanvasBaselineHeight())
  return buildSnapTargets(others, m.containerWidth, estH)
})

/** 拖拽时靠近边缘自动滚动（在 wrap-container 内的 el-scrollbar 上滚动） */
function autoScrollDuringDrag(clientY: number) {
  const scroller = getCanvasScrollWrap()
  if (!scroller)
    return
  const r = scroller.getBoundingClientRect()
  const thresholdBottom = 70
  const thresholdTop = 50
  const stepBase = 18
  const distBottom = r.bottom - clientY
  const distTop = clientY - r.top
  if (distBottom < thresholdBottom && distBottom > 0) {
    const speed = Math.max(6, (thresholdBottom - distBottom) / 2.5)
    scroller.scrollTop += stepBase + speed
  }
  if (distTop < thresholdTop && distTop > 0) {
    const speed = Math.max(6, (thresholdTop - distTop) / 2.5)
    scroller.scrollTop -= stepBase + speed
  }
}

/**
 * 检查块是否是另一个块的子孙（防止拖拽到自身或子孙容器中）
 */
function isDescendantOf(parentBlock: VisualEditorBlockData, childVid: string): boolean {
  const slots = parentBlock.props?.slots || {}
  for (const key of Object.keys(slots)) {
    const children = slots[key]?.children || []
    for (const child of children) {
      if (child._vid === childVid)
        return true
      if (isDescendantOf(child, childVid))
        return true
    }
  }
  return false
}

// 旧的 GridLayoutPlus 移动处理函数已移除（根画布现使用 CanvasItem 自研逻辑）。

// ===================== 自研根画布（CanvasItem）事件处理 =====================

function onRootDragStart(block: VisualEditorBlockData) {
  if (isRootItemDisabled(block) || isPaletteGhostBlock(block))
    return
  draggingBlockId.value = block._vid
  activeResizeRect.value = null
}

function onRootDragUpdate(block: VisualEditorBlockData, pos: { left: number, top: number }) {
  // Prefer measured ref, fallback to query (for live relative rect of guides)
  const container = rootGridRef.value || document.querySelector('.main-grid-canvas') || document.querySelector('.edit-canvas-inner')
  const base = getRootItemPixelRect(block)
  if (container) {
    const cRect = (container as HTMLElement).getBoundingClientRect()
    activeDragRect.value = {
      vid: block._vid,
      left: pos.left,
      top: pos.top,
      width: base.width,
      height: base.height,
    }
    activeResizeRect.value = null
  }

  // Auto-scroll the outer viewport to follow the drag (height grows reactively via rootContentMinHeight from live rect)
  autoScrollDuringDrag(mouseAt.y)

  // 复用原有的悬停插槽检测
  const el = document.querySelector(`.list-group-item-${block._vid}`) as HTMLElement | null
  if (el) {
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const slotCtx = findSlotContextAtPoint(cx, cy)
    if (slotCtx && slotCtx.parentBlock._vid !== block._vid && !isDescendantOf(block, slotCtx.parentBlock._vid)) {
      if (editingContainerId.value !== slotCtx.parentBlock._vid) {
        handleDragEnterContainer(slotCtx.parentBlock._vid)
      }
    }
    else {
      handleDragLeaveContainer()
    }
  }
}

function onRootDragEnd(block: VisualEditorBlockData, pos: { left: number, top: number }) {
  if (isPaletteGhostBlock(block))
    return
  draggingBlockId.value = null
  activeDragRect.value = null
  handleDragLeaveContainer()

  const m = getGridMetrics()
  // 结束时吸附（与原来 onGridItemMoved 里的 post-commit snap 一致）
  try {
    const others = currentPage.value.blocks
      .filter(b => b._vid !== block._vid)
      .map(b => calcGridItemPixelRect(b.x || 0, b.y || 0, b.w || DEFAULT_BLOCK_WIDTH, b.h || DEFAULT_BLOCK_HEIGHT, m))
    const estH = Math.max(
      getCanvasBaselineHeight(),
      (block.y || 0) * m.rowHeight + (block.h || DEFAULT_BLOCK_HEIGHT) * m.rowHeight + 300,
    )
    const targets = buildSnapTargets(others, m.containerWidth, estH)
    const cur = { left: pos.left, top: pos.top, width: getRootItemPixelRect(block).width, height: getRootItemPixelRect(block).height }
    const s = snapDrag(cur, targets, 8)
    const sl = cur.left + s.dx
    const st = cur.top + s.dy
    const snapped = pixelToGrid(sl, st, m)

    // 检测是否落在插槽上
    const el = document.querySelector(`.list-group-item-${block._vid}`) as HTMLElement | null
    const cx = el ? (el.getBoundingClientRect().left + el.getBoundingClientRect().width / 2) : sl + 20
    const cy = el ? (el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2) : st + 20
    const slotCtx = findSlotContextAtPoint(cx, cy)

    const blockIndex = currentPage.value.blocks.findIndex(b => b._vid === block._vid)
    if (blockIndex === -1)
      return

    if (slotCtx && slotCtx.parentBlock._vid !== block._vid && !isDescendantOf(block, slotCtx.parentBlock._vid)) {
      const [moved] = currentPage.value.blocks.splice(blockIndex, 1)
      const slotChildren = slotCtx.parentBlock.props?.slots?.[slotCtx.slotKey]?.children
      if (slotChildren) {
        const slotEl = findSlotElementAtPoint(cx, cy)
        const slotLayout = slotEl ? calcSlotDropLayout(slotEl, cx, cy, moved) : null
        // slotLayout already clamps; fallback to origin of the target slot (snapped is in root coords)
        moved.x = Math.max(0, slotLayout?.x ?? 0)
        moved.y = Math.max(0, slotLayout?.y ?? 0)
        moved.w = slotLayout?.w ?? moved.w
        moved.h = slotLayout?.h ?? moved.h
        slotChildren.push(moved)

        // If the item dropped inside requires more vertical room than the container currently has, grow the container
        const neededH = (moved.y || 0) + (moved.h || DEFAULT_BLOCK_HEIGHT) + 3
        if ((slotCtx.parentBlock.h || 0) < neededH) {
          slotCtx.parentBlock.h = neededH
        }
      }
    }
    else {
      // Final safety clamp for root canvas bounds (x limited by item width)
      const maxX = Math.max(0, m.cols - (block.w || DEFAULT_BLOCK_WIDTH))
      block.x = Math.max(0, Math.min(snapped.x, maxX))
      block.y = Math.max(0, snapped.y)
    }

    // Multi-select: apply offset to siblings (post-commit, since root is self-managed)
    if (multiDragState.active) {
      applyMultiDrag()
      clearMultiDrag()
    }
  }
  catch {}
  recordHistory()
}

function onRootResizeUpdate(block: VisualEditorBlockData, size: { width: number, height: number }) {
  if (isRootItemDisabled(block))
    return
  const container = rootGridRef.value || document.querySelector('.main-grid-canvas') || document.querySelector('.edit-canvas-inner')
  const base = getRootItemPixelRect(block)
  if (container) {
    activeResizeRect.value = {
      vid: block._vid,
      left: base.left,
      top: base.top,
      width: size.width,
      height: size.height,
    }
    activeDragRect.value = null
  }
  // Auto-scroll while vertically resizing downward (height grows from activeResizeRect in the computed)
  autoScrollDuringDrag(mouseAt.y)
}

function onRootResizeEnd(block: VisualEditorBlockData, size: { width: number, height: number }) {
  activeResizeRect.value = null
  const m = getGridMetrics()
  const maxW = Math.max(1, m.cols - (block.x || 0))
  block.w = Math.max(1, Math.min(maxW, Math.round(size.width / m.colWidth)))
  block.h = Math.max(1, Math.round(size.height / m.rowHeight))

  recordHistory()
}

// 保留旧函数名用于兼容
function enterGroupEditMode(groupVid: string) {
  enterContainerEditMode(groupVid)
}

function exitGroupEditMode() {
  exitContainerEditMode()
}

function selectBlockByVid(vid: string, event?: MouseEvent) {
  const block = findBlockByVid(vid, currentPage.value.blocks)
  if (block)
    selectComp(block, event)
}

/**
 * 取消选择当前组件
 */
function deSelectComp() {
  exitGroupEditMode()
  floatingSettingVisible.value = false
  selectedBlockIds.value = []
  clearAllBlockFocus(currentPage.value.blocks)
  setCurrentBlock(null)
}

/**
 * 选择要操作的组件
 * @param element
 */
function selectComp(element: VisualEditorBlockData, event?: MouseEvent) {
  if (!element?._vid) {
    return
  }

  // 未进入容器编辑模式时，点击容器内组件应选中其所属容器
  if (isContainerInnerBlockData(element)) {
    const parentContainer = findParentContainer(element._vid)
    if (!parentContainer || editingContainerId.value !== parentContainer._vid) {
      if (parentContainer)
        selectComp(parentContainer, event)
      return
    }
  }

  // 选中容器外元素时退出容器编辑模式
  if (editingContainerId.value) {
    const isEditingContainer = element._vid === editingContainerId.value
    const isInnerOfEditingContainer = isContainerInnerBlockData(element)
      && findParentContainer(element._vid)?._vid === editingContainerId.value
    if (!isEditingContainer && !isInnerOfEditingContainer)
      exitContainerEditMode()
  }

  const multiSelect = Boolean(event?.metaKey || event?.ctrlKey)
  if (multiSelect) {
    // Ctrl+Click：切换选中
    clearMultiDragIfNeeded()
    selectedBlockIds.value = selectedBlockIds.value.includes(element._vid)
      ? selectedBlockIds.value.filter(id => id !== element._vid)
      : [...selectedBlockIds.value, element._vid]
  }
  else {
    const alreadySelected = selectedBlockIds.value.includes(element._vid)
    if (!alreadySelected || selectedBlockIds.value.length === 0) {
      clearMultiDragIfNeeded()
      selectedBlockIds.value = [element._vid]
    }
    // 如果点击的是已选中的块且多选数量 > 1，启动多选拖动
    if (alreadySelected && selectedBlockIds.value.length > 1) {
      startMultiDrag(element._vid)
    }
  }

  controlStore.customComponentsVisible = false
  setCurrentBlock(element)

  // 先清除所有 focus
  clearAllBlockFocus(currentPage.value.blocks)
  // 再设置选中的
  setMultiFocus(currentPage.value.blocks, selectedBlockIds.value)

  // 设置父链路的 focusWithChild
  selectedBlockIds.value.forEach((vid) => {
    const arr = findPathByLeafId(vid, currentPage.value.blocks)
    arr?.forEach(n => (n.focusWithChild = true))
  })
}

function getCompRenderPointerEvents(item: VisualEditorBlockData) {
  // For containers/groups:
  // - When this container is the one being edited (inner GridCanvas active), let its content receive events.
  // - Otherwise, punch through so the outer frame or inner slot logic can handle as before.
  if (isContainerComponent(item.componentKey)) {
    if (editingContainerId.value === item._vid) {
      return 'auto'
    }
    return 'none'
  }
  const hasSlots = !!Object.keys(item.props?.slots || {}).length
  return hasSlots ? 'auto' : 'none'
}

/** Root level equivalent of inner canInteract / isChildGridLocked.
 * When a container is being edited, its representation on the parent canvas should be locked (no drag/resize on the frame).
 */
function isRootItemDisabled(item: VisualEditorBlockData) {
  if (isPaletteGhostBlock(item))
    return true
  if (item._layerLocked)
    return true
  if (item.static || item._containerEditLocked)
    return true
  if (editingContainerId.value && item._vid === editingContainerId.value)
    return true
  return false
}

function isEditingContainerVid(vid: string) {
  return editingContainerId.value === vid
}

function onBlockMousedown(item: VisualEditorBlockData, e: MouseEvent) {
  const target = e.target as HTMLElement
  // 容器编辑模式下，插槽内交互由 GridCanvas（统一网格画布）处理
  if (isContainerInEditHierarchy(item._vid)) {
    if (target.closest('.slot-grid-canvas, .group-absolute-canvas'))
      return
  }
  e.stopPropagation()
  selectComp(item, e)
}

/** 阻止插槽内 pointer 事件冒泡到主画布 grid-layout（interact.js 使用 pointerdown） */
function onBlockPointerdown(item: VisualEditorBlockData, e: PointerEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.slot-grid-canvas.is-editing, .group-absolute-canvas.is-editing')) {
    e.stopPropagation()
    return
  }
  if (isContainerInEditHierarchy(item._vid) && target.closest('.slot-grid-canvas, .group-absolute-canvas'))
    e.stopPropagation()
}

function onBlockDblClick(item: VisualEditorBlockData, e: MouseEvent) {
  if (!isContainerComponent(item.componentKey))
    return
  // If this representation is currently locked (e.g. we are editing inside it), don't re-enter via dblclick on frame
  if (isRootItemDisabled(item))
    return
  e.stopPropagation()
  enterContainerEditMode(item._vid)
  selectComp(item, e)
}

function onInnerGroupDblClick(groupVid: string, e: MouseEvent) {
  e.stopPropagation()
  enterGroupEditMode(groupVid)
  selectBlockByVid(groupVid, e)
}

function onCanvasMousedown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (
    target.classList.contains('edit-canvas')
    || target.classList.contains('edit-canvas-inner')
    || target.classList.contains('main-grid-canvas')
  ) {
    deSelectComp()
    // 开始框选
    startBoxSelection(e)
  }
}

// ---- 框选（画圈选中）逻辑 ----
const isBoxSelecting = ref(false)
const boxSelectStart = ref({ x: 0, y: 0 })
const boxSelectEnd = ref({ x: 0, y: 0 })

function startBoxSelection(e: MouseEvent) {
  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect)
    return

  isBoxSelecting.value = true
  boxSelectStart.value = {
    x: e.clientX - canvasRect.left,
    y: e.clientY - canvasRect.top,
  }
  boxSelectEnd.value = { ...boxSelectStart.value }

  document.addEventListener('mousemove', onBoxSelectMouseMove)
  document.addEventListener('mouseup', onBoxSelectMouseUp)
}

function onBoxSelectMouseMove(e: MouseEvent) {
  if (!isBoxSelecting.value)
    return
  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect)
    return

  boxSelectEnd.value = {
    x: e.clientX - canvasRect.left,
    y: e.clientY - canvasRect.top,
  }
}

function onBoxSelectMouseUp() {
  document.removeEventListener('mousemove', onBoxSelectMouseMove)
  document.removeEventListener('mouseup', onBoxSelectMouseUp)

  if (!isBoxSelecting.value)
    return

  // 先捕获选区矩形，再清除状态，避免 computed 失效
  const sx = boxSelectStart.value.x
  const sy = boxSelectStart.value.y
  const ex = boxSelectEnd.value.x
  const ey = boxSelectEnd.value.y
  const finalRect = {
    left: Math.min(sx, ex),
    top: Math.min(sy, ey),
    width: Math.abs(ex - sx),
    height: Math.abs(ey - sy),
  }

  isBoxSelecting.value = false

  finishBoxSelection(finalRect)
}

/**
 * 框选矩形（相对 canvas 坐标）
 */
const boxSelectionRect = computed(() => {
  if (!isBoxSelecting.value)
    return null
  const sx = boxSelectStart.value.x
  const sy = boxSelectStart.value.y
  const ex = boxSelectEnd.value.x
  const ey = boxSelectEnd.value.y
  return {
    left: Math.min(sx, ex),
    top: Math.min(sy, ey),
    width: Math.abs(ex - sx),
    height: Math.abs(ey - sy),
  }
})

/**
 * 框选矩形样式
 */
const boxSelectionStyle = computed((): CSSProperties | null => {
  const r = boxSelectionRect.value
  if (!r)
    return null
  return {
    position: 'absolute',
    zIndex: 100,
    background: 'rgba(64, 158, 255, 0.1)',
    border: '1px solid var(--el-color-primary)',
    pointerEvents: 'none',
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
  }
})

/**
 * 完成框选：检测哪些 block 与矩形相交
 */
function finishBoxSelection(rect: { left: number, top: number, width: number, height: number } | null) {
  if (!rect || rect.width < 3 || rect.height < 3)
    return

  const canvasRect = canvasRef.value?.getBoundingClientRect()
  if (!canvasRect)
    return

  const hitIds: string[] = []

  // 遍历所有可交互的 block（递归 slots）
  const collectBlocks = (blocks: VisualEditorBlockData[]) => {
    blocks.forEach((block) => {
      const isInner = isContainerInnerBlockData(block)

      // 普通模式：不参与框选容器内组件
      if (!editingContainerId.value && isInner)
        return

      // 容器编辑模式：仅框选当前容器内的组件
      if (editingContainerId.value && isInner) {
        const parentContainer = findParentContainer(block._vid)
        if (parentContainer?._vid !== editingContainerId.value)
          return
      }

      const el = document.querySelector(`.list-group-item-${block._vid}`) as HTMLElement | null
      if (el) {
        const elRect = el.getBoundingClientRect()
        const elLeft = elRect.left - canvasRect.left
        const elTop = elRect.top - canvasRect.top
        const elRight = elLeft + elRect.width
        const elBottom = elTop + elRect.height
        // AABB 相交检测
        if (
          elLeft < rect.left + rect.width
          && elRight > rect.left
          && elTop < rect.top + rect.height
          && elBottom > rect.top
        ) {
          hitIds.push(block._vid)
        }
      }
      // 递归 slots
      const slots = block.props?.slots || {}
      Object.keys(slots).forEach((key) => {
        const children = slots[key]?.children
        if (children)
          collectBlocks(children)
      })
    })
  }

  collectBlocks(currentPage.value.blocks)

  if (hitIds.length === 0)
    return

  // 设置选中
  selectedBlockIds.value = hitIds
  clearAllBlockFocus(currentPage.value.blocks)
  setMultiFocus(currentPage.value.blocks, selectedBlockIds.value)

  // 设置父链路 focusWithChild
  hitIds.forEach((vid) => {
    const arr = findPathByLeafId(vid, currentPage.value.blocks)
    arr?.forEach(n => (n.focusWithChild = true))
  })

  // 将第一个命中的设为主选中块
  const first = findBlockByVid(hitIds[0], currentPage.value.blocks)
  if (first)
    setCurrentBlock(first)
}
// ---- 框选结束 ----

function onDragover(e: DragEvent) {
  // HTML5 拖拽期间 mousemove 被抑制，必须从 dragover 事件同步鼠标位置
  mouseAt.x = e.clientX
  mouseAt.y = e.clientY
  e.preventDefault()
}

/** 原生 drop 处理器 — 使用 drop 事件本身的坐标而非 mouseAt */
function onDrop(e: DragEvent) {
  e.preventDefault()
  const compKey = e.dataTransfer?.getData('text/plain')
  if (!compKey)
    return

  const comp = visualConfig.componentMap[compKey]
  if (!comp)
    return

  const local = mouseToCanvasLocal(e.clientX, e.clientY)
  if (!local)
    return

  const m = getGridMetrics()
  const newBlock = createNewBlock(comp)
  newBlock.x = Math.max(0, Math.min(Math.round(local.x / m.colWidth), m.cols - newBlock.w))
  newBlock.y = Math.max(0, Math.round(local.y / m.rowHeight))
  newBlock.focus = true

  // 清除之前的选中
  currentPage.value.blocks.forEach((b) => {
    b.focus = false
  })
  currentPage.value.blocks.push(newBlock)
  setCurrentBlock(newBlock)
  controlStore.setMoveVisualData(null)
  recordHistory()
}

// onLayoutUpdated (原 GridLayoutPlus 事件) 已移除

// 清理多选拖动状态（在 selectComp 被再次调用时触发）
function clearMultiDragIfNeeded() {
  if (multiDragState.active) {
    clearMultiDrag()
  }
}

/**
 * 递归删除组件（支持多选）
 */
function deleteComp(block?: VisualEditorBlockData, parentBlocks = currentPage.value.blocks) {
  // 多选删除
  if (!block && selectedBlockIds.value.length > 0) {
    selectedBlockIds.value.forEach((vid) => {
      // 递归查找并删除
      const removeById = (blocks: VisualEditorBlockData[]) => {
        for (let i = blocks.length - 1; i >= 0; i--) {
          if (blocks[i]._vid === vid) {
            delete globalProperties.$$refs[blocks[i]._vid]
            blocks.splice(i, 1)
          }
          else {
            const slots = blocks[i].props?.slots || {}
            Object.keys(slots).forEach((key) => {
              const children = slots[key]?.children
              if (children) {
                removeById(children)
              }
            })
          }
        }
      }
      removeById(currentPage.value.blocks)
    })
    selectedBlockIds.value = []
    setCurrentBlock(null)
    recordHistory()
    return
  }

  if (!block)
    return

  const index = parentBlocks.findIndex(item => item._vid === block._vid)
  if (index !== -1) {
    delete globalProperties.$$refs[parentBlocks[index]._vid]
    const delTarget = parentBlocks.splice(index, 1)[0]
    if (delTarget.focus) {
      setCurrentBlock({} as VisualEditorBlockData)
    }
    recordHistory()
  }
}

/**
 * 合并选中组件为组
 */
function mergeToGroup() {
  if (selectedBlockIds.value.length < 2)
    return

  const ids = [...selectedBlockIds.value]

  // 收集所有选中块的原始数据
  const selectedBlocks: VisualEditorBlockData[] = []

  const collectSelected = (blocks: VisualEditorBlockData[]) => {
    for (let i = blocks.length - 1; i >= 0; i--) {
      if (ids.includes(blocks[i]._vid)) {
        selectedBlocks.push(blocks[i])
        blocks.splice(i, 1)
      }
      else {
        const slots = blocks[i].props?.slots || {}
        Object.keys(slots).forEach((key) => {
          const children = slots[key]?.children
          if (children)
            collectSelected(children)
        })
      }
    }
  }
  collectSelected(currentPage.value.blocks)

  if (selectedBlocks.length < 2) {
    // 没找到足够块，还原
    currentPage.value.blocks.push(...selectedBlocks)
    return
  }

  // 计算边界框（网格单位）。maxX/maxY 是“右/下边缘列号”
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  selectedBlocks.forEach((b) => {
    minX = Math.min(minX, b.x ?? 0)
    minY = Math.min(minY, b.y ?? 0)
    maxX = Math.max(maxX, (b.x ?? 0) + (b.w || DEFAULT_BLOCK_WIDTH))
    maxY = Math.max(maxY, (b.y ?? 0) + (b.h || DEFAULT_BLOCK_HEIGHT))
  })

  const groupW = Math.max(1, maxX - minX)
  const groupH = Math.max(1, maxY - minY)

  // 统一使用相对网格坐标（不再使用绝对像素 groupInnerLayout）
  // 组内子组件的 x/y 是相对于组左上角的网格偏移，单位与“组的跨度 groupW”一致。
  // 这样在组内部使用 colNum = groupW 时，子组件的像素位置/大小与合并前在父画布上一致。
  selectedBlocks.forEach((b) => {
    b.x = (b.x ?? 0) - minX
    b.y = (b.y ?? 0) - minY
    b.focus = false
    // 清理可能的旧绝对布局数据（新数据不使用）
    delete (b as any).groupInnerLayout
  })

  const groupVid = `vid_${generateNanoid()}`

  // 创建组容器块
  const groupBlock: VisualEditorBlockData = {
    _vid: groupVid,
    i: groupVid,
    moduleName: 'containerComponents',
    componentKey: 'group',
    label: '组',
    adjustPosition: true,
    focus: false,
    focusWithChild: false,
    w: groupW,
    h: groupH,
    x: minX,
    y: minY,
    styles: {
      position: 'relative',
      overflow: 'visible',
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
    },
    hasResize: false,
    props: {
      // 记录组内部网格的列数 = 合并时计算的跨度。
      // GridCanvas 将使用这个固定的列数，保证子项的相对网格坐标映射到正确的像素尺寸。
      innerColNum: groupW,
      slots: {
        default: {
          key: 'default',
          children: selectedBlocks,
        },
      },
    },
    model: {},
    draggable: true,
    showStyleConfig: true,
    showTitle: true,
    titleStyle: {
      show: true,
      text: '组',
      position: 'outer-top',
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#409eff',
      background: 'transparent',
    },
    animations: [],
    actions: [],
    events: [],
  }

  currentPage.value.blocks.push(groupBlock)

  // 清理这些子组件在旧的绝对定位 wrapper styles 里的残留记录（新模型的组内部使用 GridCanvas 自己的网格定位）
  const newWrapperStyles = { ...blockWrapperStyles.value }
  selectedBlocks.forEach((b) => { delete newWrapperStyles[b._vid] })
  blockWrapperStyles.value = newWrapperStyles

  exitGroupEditMode()
  selectedBlockIds.value = [groupVid]
  clearAllBlockFocus(currentPage.value.blocks)
  setMultiFocus(currentPage.value.blocks, [groupVid])
  setCurrentBlock(groupBlock)
  recordHistory()
}

/**
 * 拆分选中的组
 * 将组内的子组件释放到画布上，并恢复它们的原始位置
 */
function ungroup() {
  // 查找选中的组块
  const groupVid = selectedBlockIds.value.find((vid) => {
    const block = findBlockByVid(vid, currentPage.value.blocks)
    return block?.componentKey === 'group'
  })

  if (!groupVid)
    return

  const group = findBlockByVid(groupVid, currentPage.value.blocks)
  if (!group || group.componentKey !== 'group')
    return

  // 获取组内的子组件（从 default 插槽）
  const children = group.props?.slots?.default?.children || []

  if (children.length === 0) {
    // 空组直接删除
    const index = currentPage.value.blocks.findIndex(item => item._vid === groupVid)
    if (index !== -1) {
      currentPage.value.blocks.splice(index, 1)
    }
    selectedBlockIds.value = []
    setCurrentBlock(null)
    recordHistory()
    return
  }

  // 获取网格度量以计算位置
  const metrics = getGridMetrics()
  const groupOriginLeft = calcGridColLeft(group.x || 0, metrics)
  const groupOriginTop = calcGridRowTop(group.y || 0, metrics)

  // 移除组的 wrapper styles
  const newWrapperStyles = { ...blockWrapperStyles.value }
  children.forEach((child: VisualEditorBlockData) => {
    delete newWrapperStyles[child._vid]
  })
  blockWrapperStyles.value = newWrapperStyles

  // 统一使用网格度量：子组件的 x/y 是相对于组的网格偏移
  const releasedBlocks: VisualEditorBlockData[] = children.map((child: VisualEditorBlockData) => {
    const clonedChild = cloneDeep(child)

    // 重新生成 vid 和 i
    clonedChild._vid = `vid_${generateNanoid()}`
    clonedChild.i = clonedChild._vid

    // 简单网格偏移（新数据模型）
    clonedChild.x = (group.x || 0) + (child.x || 0)
    clonedChild.y = (group.y || 0) + (child.y || 0)
    // w/h 保持不变

    // 清理旧的绝对布局信息
    delete (clonedChild as any).groupInnerLayout

    // 清除 focus 状态
    clonedChild.focus = false
    clonedChild.focusWithChild = false

    return clonedChild
  })

  // 找到组在当前 blocks 数组中的位置
  const groupIndex = currentPage.value.blocks.findIndex(item => item._vid === groupVid)

  // 删除组
  if (groupIndex !== -1) {
    delete globalProperties.$$refs[groupVid]
    currentPage.value.blocks.splice(groupIndex, 1)
  }

  // 将子组件插入到原来组的位置
  currentPage.value.blocks.splice(groupIndex, 0, ...releasedBlocks)

  // 更新选中状态为释放后的子组件
  selectedBlockIds.value = releasedBlocks.map(b => b._vid)
  clearAllBlockFocus(currentPage.value.blocks)
  setMultiFocus(currentPage.value.blocks, selectedBlockIds.value)

  // 设置第一个子组件为当前选中
  if (releasedBlocks.length > 0) {
    setCurrentBlock(releasedBlocks[0])
  }

  exitGroupEditMode()
  recordHistory()
}

function onContextmenuBlock(e: MouseEvent, block: VisualEditorBlockData, parentBlocks = currentPage.value.blocks) {
  const menuOptions: any[] = [
    {
      label: '复制节点',
      icon: 'el-icon-document-copy',
      onClick: () => {
        const index = parentBlocks.findIndex(item => item._vid === block._vid)
        if (index !== -1) {
          const setBlockVid = (block: VisualEditorBlockData) => {
            block._vid = `vid_${generateNanoid()}`
            block.focus = false
            const slots = block?.props?.slots || {}
            const slotKeys = Object.keys(slots)
            if (slotKeys.length) {
              slotKeys.forEach((slotKey) => {
                slots[slotKey]?.children?.forEach((child: VisualEditorBlockData) => setBlockVid(child))
              })
            }
          }
          const blockCopy = cloneDeep(parentBlocks[index])
          setBlockVid(blockCopy)
          parentBlocks.splice(index + 1, 0, blockCopy)
        }
      },
    },
    {
      label: '查看节点',
      icon: 'el-icon-view',
      onClick: () =>
        useModal({
          title: '节点信息',
          footer: null,
          props: {
            width: 600,
          },
          content: () => (
            <MonacoEditor
              code={JSON.stringify(block)}
              layout={{ width: 530, height: 600 }}
              vid={block._vid}
            />
          ),
        }),
    },
    {
      label: '删除节点',
      icon: 'el-icon-delete',
      onClick: () => {
        // 多选（含框选）时删除全部选中组件，与键盘 Delete 行为一致
        if (selectedBlockIds.value.length > 1 && selectedBlockIds.value.includes(block._vid)) {
          deleteComp()
        }
        else {
          deleteComp(block, parentBlocks)
        }
      },
    },
  ]

  // 多选时显示"合并为组"
  if (selectedBlockIds.value.length > 1) {
    menuOptions.push({
      label: '合并为组',
      icon: 'el-icon-folder-opened',
      onClick: () => mergeToGroup(),
    })
  }

  // 选中单个组时显示"拆分组"
  if (selectedBlockIds.value.length === 1 && selectedBlockIds.value[0] === block._vid && block.componentKey === 'group') {
    menuOptions.push({
      label: '拆分组',
      icon: 'el-icon-folder-remove',
      onClick: () => ungroup(),
    })
  }

  $$dropdown({
    reference: e,
    content: () => (
      <>
        {menuOptions.map(opt => (
          <DropdownOption
            label={opt.label}
            icon={opt.icon}
            {...{ onClick: opt.onClick }}
          />
        ))}
      </>
    ),
  })
}

function setScale(v: number) {
  currentScale.value = v
}

function getScale() {
  return currentScale.value
}

function initAnimate() {
  const animations = currentPage.value.blocks.filter(block => block?.animations)?.map(block => ({
    _vid: block._vid,
    animations: block.animations,
  }))

  animations.forEach(({ _vid, animations }) => {
    const anmiationEl = getBlockAnimationElement(_vid)
    useAnimate(anmiationEl, animations)
  })
}

watch(visualLoading, (value, oldValue) => {
  if (!value && oldValue) {
    nextTick(() => {
      resetAllContainerGridLocks()
      syncContainerGridAfterLockChange()
      syncGroupWrapperStyles()
      initAnimate()
    })
  }
})

watch(() => props?.scale, () => {
  currentScale.value = props?.scale || 1
}, { immediate: true })

watch(currentScale, () => {
  emits('changeScale', currentScale.value)
})

provide(ContainerEditorContextKey, {
  selectComp,
  selectedBlockIds,
  onContextmenuBlock,
  recordHistory,
  enterContainerEditMode,
  selectContainerByVid: (vid: string, event?: MouseEvent) => {
    const block = findBlockByVid(vid, currentPage.value.blocks)
    if (block)
      selectComp(block, event)
  },
  updateGroupInnerBlockPosition,
  updateGroupInnerBlockSize,
  onGroupInnerDragEnd,
})

defineExpose({
  setScale,
  getScale,
  drag: dragging,
  dragEnd,
  addBlock,
})
</script>

<template>
  <div :style="themeStyle" :class="$style['edit-control-container']">
    <div ref="wrapper" :class="$style['wrap-container']">
      <el-auto-resizer class="wrap-auto-resizer">
        <template #default="{ height, width }">
          <el-scrollbar
            ref="canvasScrollbarRef"
            :height="height"
            class="canvas-scrollbar"
          >
            <div
              ref="canvasRef"
              v-loading="visualLoading"
              class="edit-canvas"
              :style="editCanvasStyle"
              @dragover="onDragover"
              @drop="onDrop"
              @mousedown="onCanvasMousedown"
            >
              <div
                ref="rootGridRef"
                class="edit-canvas-inner main-grid-canvas"
                :style="{ position: 'relative', minHeight: rootCanvasMinHeightStyle }"
              >
                <!-- Reference guides for main canvas (drag or resize) -->
                <ReferenceGuides
                  v-if="activeDragRect || activeResizeRect"
                  :container-width="mainGuidesSize.width"
                  :container-height="mainGuidesSize.height"
                  :other-rects="mainOtherRects"
                  :active-rect="activeDragRect || activeResizeRect"
                  :visible="!!(activeDragRect || activeResizeRect)"
                  :threshold="6"
                />

                <!-- 自研根画布：使用 CanvasItem 替代 GridLayoutPlus -->
                <CanvasItem
                  v-for="item in currentPage.blocks"
                  :key="item._vid"
                  :vid="item._vid"
                  :left="getRootItemPixelRect(item).left"
                  :top="getRootItemPixelRect(item).top"
                  :width="getRootItemPixelRect(item).width"
                  :height="getRootItemPixelRect(item).height"
                  :is-editing="true"
                  :is-selected="selectedBlockIds.includes(item._vid)"
                  :is-focused="item.focus"
                  :item-class="['root-grid-item', { 'palette-ghost-item': isPaletteGhostBlock(item) }]"
                  :disabled="isRootItemDisabled(item)"
                  :show-selection-outline="false"
                  :snap-x-lines="mainSnapTargets.xs"
                  :snap-y-lines="mainSnapTargets.ys"
                  :snap-threshold="8"
                  :container-width="rootContainerWidth"
                  :data-vid-root="item._vid"
                  @mousedown="(e: MouseEvent) => onBlockMousedown(item, e)"
                  @pointerdown="(e: any) => onBlockPointerdown(item, e)"
                  @dblclick.stop="(e: MouseEvent) => onBlockDblClick(item, e)"
                  @contextmenu.stop.prevent="(e: MouseEvent) => onContextmenuBlock(e, item)"
                  @drag-start="onRootDragStart(item)"
                  @drag-update="(p: any) => onRootDragUpdate(item, p)"
                  @drag-end="(p: any) => onRootDragEnd(item, p)"
                  @resize-update="(s: any) => onRootResizeUpdate(item, s)"
                  @resize-end="(s: any) => onRootResizeEnd(item, s)"
                >
                  <div
                    :key="item._vid"
                    :data-label="item.label"
                    class="list-group-item"
                    :style="getBlockBorderStyle(item)"
                    :class="{
                      'focus': item.focus,
                      'focusWithChild': item.focusWithChild,
                      'multi-focus': selectedBlockIds.includes(item._vid),
                      'is-editing-container': isContainerComponent(item.componentKey) && isContainerInEditHierarchy(item._vid),
                      'is-editing-group': item.componentKey === 'group' && isContainerInEditHierarchy(item._vid),
                      'is-locked-for-inner': isContainerComponent(item.componentKey) && isEditingContainerVid(item._vid),
                      drag,
                      'has-slot': !!Object.keys(item.props?.slots || {}).length,
                      'has-inner-title': item.showTitle === true && isInnerBlockTitle(item.titleStyle),
                      'palette-ghost': isPaletteGhostBlock(item),
                      [`list-group-item-${item._vid}`]: true,
                    }"
                    @mousedown="onBlockMousedown(item, $event)"
                    @pointerdown="onBlockPointerdown(item, $event)"
                    @dblclick.stop="onBlockDblClick(item, $event)"
                    @contextmenu.stop.prevent="onContextmenuBlock($event, item)"
                  >
                    <div
                      v-if="item.showTitle === true && isInnerBlockTitle(item.titleStyle)"
                      class="block-title-inner"
                      :style="getBlockTitleInlineStyle(item.titleStyle)"
                    >
                      {{ getBlockTitleText(item) }}
                    </div>
                    <div class="list-group-item__body">
                      <span
                        v-if="item.showTitle === true && !isInnerBlockTitle(item.titleStyle)"
                        class="block-title-outer"
                        :class="`block-title-outer--${item.titleStyle?.position || 'outer-left'}`"
                        :style="getBlockTitleInlineStyle(item.titleStyle)"
                      >
                        {{ getBlockTitleText(item) }}
                      </span>
                      <CompRender
                        :element="item"
                        :style="{
                          pointerEvents: getCompRenderPointerEvents(item),
                        }"
                      >
                        <template v-for="(value, slotKey) in item.props?.slots" :key="slotKey" #[slotKey]>
                          <SlotItem
                            v-model:children="value.children"
                            v-model:drag="drag"
                            :slot-key="slotKey"
                            :parent-vid="item._vid"
                            :selected-block-ids="selectedBlockIds"
                            :editing-container-id="editingContainerId"
                            :is-container="isContainerComponent(item.componentKey)"
                            :block-wrapper-styles="blockWrapperStyles"
                            :disallow-drop="isContainerComponent(item.componentKey)"
                            :on-contextmenu-block="onContextmenuBlock"
                            :select-comp="selectComp"
                            :on-drag-enter-container="handleDragEnterContainer"
                            :on-drag-leave-container="handleDragLeaveContainer"
                            :select-block-by-vid="selectBlockByVid"
                            :on-inner-group-dbl-click="onInnerGroupDblClick"
                            :delete-comp="deleteComp"
                            :update-group-inner-block-position="updateGroupInnerBlockPosition"
                            :update-group-inner-block-size="updateGroupInnerBlockSize"
                            :on-group-inner-drag-end="onGroupInnerDragEnd"
                          />
                        </template>
                      </CompRender>
                    </div>
                  </div>
                </CanvasItem>

                <!-- 框选遮罩 -->
                <div
                  v-if="boxSelectionRect"
                  class="box-selection-overlay"
                  :style="boxSelectionStyle"
                />
              </div>
            </div>
          </el-scrollbar>
        </template>
      </el-auto-resizer>
    </div>
  </div>
</template>

<style lang="scss" module>
.edit-control-container {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;

  .wrap-container {
    width: 100%;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    box-shadow: var(--el-box-shadow-light);
    background-color: var(--el-fill-color-light);
    border-radius: var(--el-border-radius-base);
    overflow: hidden;
  }
}
</style>

<style lang="scss" scoped>
@use './func.scss' as *;

.wrap-auto-resizer {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
}

.canvas-scrollbar {
  width: 100%;

  :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
  }

  :deep(.el-scrollbar__view) {
    width: 100%;
  }
}

.edit-canvas-scroll {
  display: flex;
  justify-content: center;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
}

.edit-canvas {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  box-shadow: var(--el-box-shadow-light);
  border-radius: var(--el-border-radius-base);
  overflow: visible;
}

.edit-canvas-inner {
  width: 100%;
  height: auto;
  overflow: visible;
  border-radius: inherit;
}

.grid-layout-canvas {
  width: 100%;
  min-height: 100%;
}

.list-group-item {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-sizing: border-box;
  cursor: inherit;
  // background-color: #fff;
  overflow: hidden;
  outline: none;

  /* 组件库拖入时的临时 ghost：不参与 hit-test，避免容器 ghost 自带 slot 导致反复创建/销毁闪烁 */
  &.palette-ghost {
    pointer-events: none;
    opacity: 0.72;
  }

  &.is-editing-group,
  &.is-editing-container,
  &.is-locked-for-inner {
    /* 外框锁定（双击进入编辑内部）时的视觉提示通过 ::after 虚线边框实现 */
    z-index: 15;
    cursor: default;
    /* Do not use pointer-events:none here; it interferes with inner custom drag (GridCanvas)
       and outer interact hit-testing. Isolation is handled by:
       - static + dragIgnoreFrom on the block (reconfigures interact)
       - explicit early return in onBlockMousedown/onBlockPointerdown for slot targets
       - stopPropagation on inner canvases and their items (including capture phase)
    */
  }

  /* 组内的组件不需要滚动条 */
  &.inner {
    overflow: visible;
  }

  /* 选中/悬停描边置于最上层，避免被内部内容背景遮盖 */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 2px solid transparent;
    border-radius: inherit;
    pointer-events: none;
    z-index: 30;
    box-sizing: border-box;
    transition: border-color 0.15s ease;
  }

  &:hover:not(.focus)::after {
    border-color: var(--el-color-primary-light-5);
  }

  &.focus::after {
    border-color: var(--el-color-primary);
  }

  &.multi-focus::after {
    border-color: var(--el-color-warning);
    border-width: 2px;
  }

  &.focusWithChild:not(.focus)::after {
    border: 2px dashed var(--el-color-primary-light-7);
  }

  /* 双击锁定容器/组后，外框使用虚线边框（通过 ::after 实现，与 focus 机制一致） */
  &.is-editing-container::after,
  &.is-editing-group::after,
  &.is-locked-for-inner::after {
    border-style: dashed;
    border-color: var(--el-color-primary);
    border-width: 2px;
  }

  /* 即使同时有 focus，也保持虚线以明确“正在编辑其内部” */
  &.focus.is-editing-container::after,
  &.focus.is-editing-group::after,
  &.focus.is-locked-for-inner::after {
    border-style: dashed;
    border-color: var(--el-color-primary);
  }

  &.focusWithChild::before {
    display: none;
  }
}

.list-group-item__body {
  position: relative;
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  overflow: hidden;

  /* 组内的组件不需要滚动条 */
  :deep(.list-group-item.inner) & {
    overflow: visible;
  }
}

/* 卡片内顶部标题（参考图：左上、加粗、深色） */
.block-title-inner {
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
  line-height: 1.4;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
}

/* 编辑态外侧角标（可选） */
.block-title-outer {
  position: absolute;
  z-index: 5;
  line-height: 1.2;
  white-space: nowrap;
  pointer-events: none;
}

.block-title-outer--outer-left {
  top: 0;
  left: -3px;
  transform: translate(-100%, 0);
}

.block-title-outer--outer-right {
  top: 0;
  right: -3px;
  transform: translate(100%, 0);
}

.block-title-outer--outer-top {
  top: 2px;
  left: 0;
  transform: translate(0, -100%);
}

:deep(.vgl-item:has(.list-group-item.focus)) {
  z-index: 12;
}

:deep(.palette-ghost-item) {
  pointer-events: none;
  cursor: default;
}

/*
  鼠标样式规则（与统一 GridCanvas 保持一致）：
  - 可拖拽块：grab
  - 拖拽中：grabbing
  - 静态块：default
  手柄（resizer）外观则统一使用 GridLayoutPlus 原生样式（深色 L 形边框），
  GridCanvas 的 resizer 已与 GridLayoutPlus 保持一致的外观。
*/
:deep(.vgl-item:not(.vgl-item--static)) {
  cursor: grab;
}

:deep(.vgl-item--static) {
  cursor: default;
}

:deep(.vgl-item) {
  transition: box-shadow 0.15s ease;
}

:deep(.vgl-item--dragging) {
  cursor: grabbing !important;
  z-index: 10;
}

:deep(.vgl-item--resizing) {
  z-index: 10;
}

:deep(.vgl-item:has(.list-group-item.focus) .vgl-item__resizer),
:deep(.vgl-item:has(.list-group-item.multi-focus) .vgl-item__resizer) {
  z-index: 25;
}
</style>
