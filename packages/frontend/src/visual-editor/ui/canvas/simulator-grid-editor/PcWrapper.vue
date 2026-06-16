<script lang="tsx" setup>
import type { CSSProperties } from 'vue'

import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useMouseInElement, useResizeObserver } from '@vueuse/core'
import { vLoading } from 'element-plus'
import { cloneDeep, debounce, throttle } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { GridLayout } from '@/components/grid-layout-plus'
import { useAnimate } from '@/hooks/useAnimate'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { resolveBlockBorderCss } from '@/utils/blockBorder'
import {
  getBlockTitleInlineStyle,
  getBlockTitleText,
  isInnerBlockTitle,
} from '@/visual-editor/core/visual-editor.utils'
import { useModal } from '@/visual-editor/hooks/useModal'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { generateNanoid } from '@/visual-editor/lib'
import { $$dropdown, DropdownOption } from '@/visual-editor/lib/dropdown-service'
import MonacoEditor from '@/visual-editor/ui/shared/monaco-editor/MonacoEditor'
import { getBlockAnimationElement } from '@/visual-editor/visual-editor.utils'
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

  // 将偏移量应用到其他选中块
  selectedBlockIds.value.forEach((vid) => {
    if (vid === multiDragState.dragVid)
      return
    const otherStart = multiDragState.startPositions[vid]
    if (!otherStart)
      return
    const otherBlock = findBlockByVid(vid, currentPage.value.blocks)
    if (otherBlock) {
      otherBlock.x = otherStart.x + dx
      otherBlock.y = otherStart.y + dy
    }
  })
}

const route = useRoute()

const canvasId = String(route.query?.key) || ''

const componentLoading = ref(false)

const wrapper = ref<HTMLElement>()
const canvasRef = useTemplateRef('canvasRef')
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

  keyEvent()

  nextTick(() => {
    setTimeout(() => {
      initAnimate()
    }, 1000)
  })
})

/**
 * @description 操作当前页面样式表
 */
const editCanvasStyle = computed(() => {
  const { bgImage, bgColor, pageSize, bgRepeat, bgSize } = currentPage.value.config
  const normalizedBgColor = bgColor || '#ffffff'
  const normalizedBgImage = bgImage ? `url(${bgImage})` : 'none'
  const normalizedBgRepeat = bgRepeat || 'no-repeat'
  const normalizedBgSize = bgSize || 'cover'
  return {
    width: '100%',
    height: '100%',
    backgroundColor: normalizedBgColor,
    backgroundImage: normalizedBgImage,
    backgroundRepeat: normalizedBgRepeat,
    backgroundSize: normalizedBgSize,
    cursor: isEnterSpace.value ? 'grab' : 'auto',
  } as CSSProperties
})

const gridLayout = ref<InstanceType<typeof GridLayout>>()

/** 基于页面设计宽度计算固定列数，使每列步长接近15px（不随窗口大小变化） */
const gridColNum = computed(() => {
  const designWidth = currentPage.value?.config?.pageSize?.width || 1920
  return Math.max(1, Math.floor(designWidth / 15))
})

onMounted(() => {
  document.addEventListener('dragover', syncMousePosition)
})

onBeforeUnmount(() => {
  document.removeEventListener('dragover', syncMousePosition)
})

const mouseAt = { x: -1, y: -1 }

function syncMousePosition(event: MouseEvent) {
  mouseAt.x = event.clientX
  mouseAt.y = event.clientY
}

const dropId = 'drop'
const dragItem = ref(defaultDragItem())

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
  const parentRect = wrapper.value?.getBoundingClientRect()

  if (!parentRect || !gridLayout.value)
    return

  // 检测是否拖拽到容器插槽上，如果是则跳过网格占位
  const overSlot = Boolean(findSlotContextAtPoint(mouseAt.x, mouseAt.y))

  const mouseInGrid
    = mouseAt.x > parentRect.left
      && mouseAt.x < parentRect.right
      && mouseAt.y > parentRect.top
      && mouseAt.y < parentRect.bottom

  if (mouseInGrid && !currentPage.value.blocks.some(item => item.i === dropId) && !overSlot) {
    const colNum = gridColNum.value
    const moveData = { ...controlStore.moveVisualData, x: (currentPage.value.blocks.length * 10) % colNum, y: currentPage.value.blocks.length + 5, i: dropId }
    dragItem.value.h = moveData?.h
    dragItem.value.w = moveData?.w
    dragItem.value.i = dropId
    currentPage.value.blocks.push(moveData)
  }

  // 如果光标在插槽上，清理可能残留的占位块
  if (overSlot) {
    currentPage.value.blocks = currentPage.value.blocks.filter(item => item.i !== dropId)
    return
  }

  const index = currentPage.value.blocks.findIndex(item => item.i === dropId)

  if (index !== -1) {
    const item = gridLayout.value.getItem(dropId)

    if (!item)
      return

    try {
      item.wrapper.style.display = 'none'
    }
    catch (error) {
      console.warn(error)
    }

    Object.assign(item.state, {
      top: mouseAt.y - parentRect.top,
      left: mouseAt.x - parentRect.left,
    })
    const newPos = item.calcXY(mouseAt.y - parentRect.top, mouseAt.x - parentRect.left)

    if (mouseInGrid) {
      gridLayout.value.dragEvent('dragstart', dropId, newPos.x, newPos.y, dragItem.value.h, dragItem.value.w)
      dragItem.value.i = String(index)
      dragItem.value.x = currentPage.value.blocks[index].x
      dragItem.value.y = currentPage.value.blocks[index].y
    }
    else {
      gridLayout.value.dragEvent('dragend', dropId, newPos.x, newPos.y, dragItem.value.h, dragItem.value.w)
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
 * 通过鼠标坐标检测是否落在某个容器插槽内
 */
function findSlotContextAtPoint(x: number, y: number): { parentBlock: VisualEditorBlockData, slotKey: string } | null {
  const elements = document.elementsFromPoint(x, y)
  for (const el of elements) {
    const slotEl = (el as HTMLElement).closest('.inner-draggable')
    if (!slotEl)
      continue
    const parentEl = (slotEl as HTMLElement).closest('[class*="list-group-item-"]') as HTMLElement | null
    if (!parentEl)
      continue
    const classList = Array.from(parentEl.classList)
    const vidClass = classList.find(c => c.startsWith('list-group-item-'))
    const parentVid = vidClass?.replace('list-group-item-', '')
    if (!parentVid)
      continue
    const parentBlock = findBlockByVid(parentVid, currentPage.value.blocks)
    if (!parentBlock)
      continue
    // 组容器不允许从外部拖入组件
    if (parentBlock.componentKey === 'group')
      continue
    const dataSlot = (slotEl as HTMLElement).getAttribute('data-slot') || ''
    const match = dataSlot.match(/插槽（(.+?)）/)
    const slotKey = match ? match[1] : ''
    if (slotKey && parentBlock.props?.slots?.[slotKey]) {
      return { parentBlock, slotKey }
    }
  }
  return null
}

function dragEnd() {
  const parentRect = wrapper.value?.getBoundingClientRect()

  if (!parentRect || !gridLayout.value)
    return

  const mouseInGrid
    = mouseAt.x > parentRect.left
      && mouseAt.x < parentRect.right
      && mouseAt.y > parentRect.top
      && mouseAt.y < parentRect.bottom

  if (!mouseInGrid) {
    return
  }

  // 检查是否拖放到容器插槽中
  const slotContext = findSlotContextAtPoint(mouseAt.x, mouseAt.y)

  gridLayout.value.dragEvent('dragend', dropId, dragItem.value.x, dragItem.value.y, dragItem.value.h, dragItem.value.w)
  currentPage.value.blocks = currentPage.value.blocks.filter(item => item.i !== dropId)

  if (!controlStore.moveVisualData) {
    dragItem.value = defaultDragItem()
    return
  }

  // 获取拖拽传递的数据
  const moveData = {
    ...controlStore.moveVisualData,
    x: slotContext ? 0 : dragItem.value.x,
    y: slotContext ? 0 : dragItem.value.y,
    w: dragItem.value.w,
    h: dragItem.value.h,
    i: controlStore.moveVisualData?._vid ?? controlStore.moveVisualData?.i,
  }

  if (slotContext) {
    // 将组件放入容器插槽
    const slotChildren = slotContext.parentBlock.props!.slots![slotContext.slotKey]!.children
    if (slotChildren) {
      slotChildren.push(moveData)
    }
  }
  else {
    // 放入画布根层级
    currentPage.value.blocks.push(moveData)
  }

  selectComp(moveData)
  controlStore.setMoveVisualData(null)

  gridLayout.value.dragEvent('dragend', dragItem.value.i, dragItem.value.x, dragItem.value.y, dragItem.value.h, dragItem.value.w)

  const item = gridLayout.value.getItem(dropId)

  if (item) {
    try {
      item.wrapper.style.display = ''
    }
    catch (error) {
      console.warn(error)
    }
  }

  dragItem.value = defaultDragItem()

  recordHistory()
}

/**
 * 双击添加组件到画布中心
 */
function addBlock(componentData: VisualEditorBlockData) {
  if (!gridLayout.value || !wrapper.value)
    return

  const parentRect = wrapper.value.getBoundingClientRect()
  const centerX = parentRect.width / 2
  const centerY = parentRect.height / 2

  // 计算网格位置
  const item = gridLayout.value.getItem(dropId)
  let x = 0
  let y = 0
  if (item) {
    const pos = item.calcXY(centerY, centerX)
    x = pos.x
    y = pos.y
  }

  // 确保不超出边界
  const w = componentData.w || 24
  const h = componentData.h || 8
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
 * 取消选择当前组件
 */
function deSelectComp() {
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

function onCanvasMousedown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (
    target.classList.contains('edit-canvas')
    || target.classList.contains('edit-canvas-inner')
    || target.classList.contains('vgl-layout')
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
  e.preventDefault()
}

function onLayoutUpdated() {
  // 多选拖动：将拖拽偏移同步到其他选中块
  if (multiDragState.active) {
    applyMultiDrag()
  }

  const focused = currentPage.value.blocks.find(item => item._vid === currentBlock.value?._vid)
  if (focused) {
    setCurrentBlock(focused)
  }
  recordHistory()
}

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

  // 计算边界框
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  selectedBlocks.forEach((b) => {
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + (b.w || 24))
    maxY = Math.max(maxY, b.y + (b.h || 8))
  })

  // 保留子组件在组内的相对位置
  const designWidth = currentPage.value?.config?.pageSize?.width || 1920
  const colNum = Math.max(1, Math.floor(designWidth / 15))
  const colWidth = designWidth / colNum
  const rowHeight = 15

  const newWrapperStyles: Record<string, CSSProperties> = {}
  selectedBlocks.forEach((b) => {
    const relX = b.x - minX
    const relY = b.y - minY
    // 将定位样式放在外层包装上（SlotItem 的 .list-group-item）
    newWrapperStyles[b._vid] = {
      position: 'absolute',
      left: `${relX * colWidth}px`,
      top: `${relY * rowHeight}px`,
      width: `${(b.w || 24) * colWidth}px`,
      height: `${(b.h || 8) * rowHeight}px`,
      margin: '0',
      flex: 'none',
    }
    // block 自身 styles 保持干净
    b.styles = b.styles || {}
    b.x = 0
    b.y = 0
    b.focus = false
  })
  blockWrapperStyles.value = {
    ...blockWrapperStyles.value,
    ...newWrapperStyles,
  }

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
    w: Math.max(24, maxX - minX),
    h: Math.max(8, maxY - minY),
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
      slots: {
        default: {
          key: 'default',
          children: selectedBlocks,
        },
      },
    },
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
  selectedBlockIds.value = [groupVid]
  clearAllBlockFocus(currentPage.value.blocks)
  setMultiFocus(currentPage.value.blocks, [groupVid])
  setCurrentBlock(groupBlock)
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
      onClick: () => deleteComp(block, parentBlocks),
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
    initAnimate()
  }
})

watch(() => props?.scale, () => {
  currentScale.value = props?.scale || 1
}, { immediate: true })

watch(currentScale, () => {
  emits('changeScale', currentScale.value)
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
  <div :class="$style['edit-control-container']">
    <div ref="wrapper" :class="$style['wrap-container']">
      <div
        ref="canvasRef"
        v-loading="visualLoading"
        class="edit-canvas"
        :style="editCanvasStyle"
        @dragover="onDragover"
        @mousedown="onCanvasMousedown"
      >
        <div class="edit-canvas-inner">
          <GridLayout
            ref="gridLayout"
            v-model:layout="currentPage.blocks"
            class="grid-layout-canvas"
            :col-num="gridColNum"
            :row-height="15"
            :margin="[0, 0]"
            :allow-overlap="true"
            @layout-updated="onLayoutUpdated"
          >
            <template #item="{ item }: { item: VisualEditorBlockData }">
              <div
                :key="item._vid"
                :data-label="item.label"
                class="list-group-item"
                :style="getBlockBorderStyle(item)"
                :class="{
                  'focus': item.focus,
                  'focusWithChild': item.focusWithChild,
                  'multi-focus': selectedBlockIds.includes(item._vid),
                  drag,
                  'has-slot': !!Object.keys(item.props?.slots || {}).length,
                  'has-inner-title': item.showTitle === true && isInnerBlockTitle(item.titleStyle),
                  [`list-group-item-${item._vid}`]: true,
                }"
                @mousedown.stop="selectComp(item, $event)"
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
                      pointerEvents: Object.keys(item.props?.slots || {}).length ? 'auto' : 'none',
                    }"
                  >
                    <template v-for="(value, slotKey) in item.props?.slots" :key="slotKey" #[slotKey]>
                      <SlotItem
                        v-model:children="value.children"
                        v-model:drag="drag"
                        :slot-key="slotKey"
                        :parent-vid="item._vid"
                        :selected-block-ids="selectedBlockIds"
                        :block-wrapper-styles="blockWrapperStyles"
                        :disallow-drop="item.componentKey === 'group'"
                        :on-contextmenu-block="onContextmenuBlock"
                        :select-comp="selectComp"
                        :delete-comp="deleteComp"
                      />
                    </template>
                  </CompRender>
                </div>
              </div>
            </template>
          </GridLayout>
          <!-- 框选遮罩 -->
          <div
            v-if="boxSelectionRect"
            class="box-selection-overlay"
            :style="boxSelectionStyle"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.edit-control-container {
  width: 100%;
  height: 100%;
  padding: 16px;

  .wrap-container {
    width: 100%;
    height: 100%;
    box-shadow: 0 8px 10px #00000012;
    background-color: #f5f5f5;
    border-radius: var(--el-border-radius-base);
    overflow: hidden;
  }
}
</style>

<style lang="scss" scoped>
@use './func.scss' as *;

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
  box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
  border-radius: var(--el-border-radius-base);
  overflow: visible;
}

.edit-canvas-inner {
  width: 100%;
  height: 100%;
  min-height: inherit;
  overflow: hidden;
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
  cursor: pointer;
  // background-color: #fff;
  overflow: hidden;
  outline: none;

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

:deep(.vgl-item) {
  transition: box-shadow 0.15s ease;
}

:deep(.vgl-item--resizing),
:deep(.vgl-item--dragging) {
  z-index: 10;
}
</style>
