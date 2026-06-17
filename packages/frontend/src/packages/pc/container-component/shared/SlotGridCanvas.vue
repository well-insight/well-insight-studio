<script lang="ts" setup>
import type { CSSProperties, PropType } from 'vue'
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useResizeObserver } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { ContainerEditorContextKey, EditingContainerIdKey } from '@/packages/pc/container-component/container'
import {
  calcSlotColLeft,
  calcSlotDropLayout,
  calcSlotRowTop,
  getSlotGridMetrics,
} from '@/packages/pc/container-component/shared/slot-grid.utils'
import { useControlStore } from '@/stores/controlStore'
import { generateNanoid } from '@/visual-editor/lib'
import CompRender from '@/visual-editor/ui/canvas/simulator-grid-editor/comp-render'

const props = defineProps({
  children: {
    type: Array as PropType<VisualEditorBlockData[]>,
    default: (): VisualEditorBlockData[] => [],
  },
  slotKey: {
    type: String,
    default: '',
  },
  colNum: {
    type: Number,
    default: 12,
  },
  rowHeight: {
    type: Number,
    default: 15,
  },
  parentFocus: {
    type: Boolean,
    default: false,
  },
  containerVid: {
    type: String,
    default: '',
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:children', 'drag-enter', 'drag-leave', 'drop'])

const controlStore = useControlStore()
const editorCtx = inject(ContainerEditorContextKey, null)
const editingContainerId = inject(EditingContainerIdKey, ref<string | null>(null))

/** 直接读取画布注入的编辑态，避免 h() 传参快照滞后 */
const isEditingMode = computed(() =>
  Boolean(props.containerVid) && editingContainerId.value === props.containerVid,
)

const canvasRef = ref<HTMLElement>()
const emptyRef = ref<HTMLElement>()
const slotWidth = ref(0)

useResizeObserver(canvasRef, (entries) => {
  slotWidth.value = entries[0]?.contentRect.width ?? 0
})

onMounted(() => {
  if (canvasRef.value)
    slotWidth.value = canvasRef.value.clientWidth
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onItemMouseMove)
  document.removeEventListener('mouseup', onItemMouseUp)
  document.removeEventListener('mousemove', onItemResizeMove)
  document.removeEventListener('mouseup', onItemResizeUp)
})

/**
 * 与根画布的横向网格逻辑保持一致：
 * 横向网格按照画布容器的实际宽度自适应计算列数与列宽，
 * 所有坐标转换均使用与 PcWrapper 相同的公式（totalSpace + round）。
 */
const slotMetrics = computed(() => getSlotGridMetrics(slotWidth.value > 0 ? slotWidth.value : (props.colNum || 12) * 15))

const localChildren = computed({
  get: () => props.children || [],
  set: val => emit('update:children', val),
})

function isBlockSelected(vid: string) {
  return editorCtx?.selectedBlockIds.value.includes(vid) ?? false
}

/** 子项是否因父容器锁定而不可拖拽（进入编辑模式时锁定外层） */
function isChildGridLocked(block: VisualEditorBlockData | undefined) {
  if (!block)
    return false
  if (block.static || block._containerEditLocked)
    return true
  if (editingContainerId.value && block._vid === editingContainerId.value)
    return true
  return false
}

function canInteract(block: VisualEditorBlockData | undefined) {
  return isEditingMode.value && !isChildGridLocked(block)
}

// ---- 拖拽状态（自研像素级拖拽，替代 interact.js + GridLayout）----
const draggingBlockVid = ref<string | null>(null)
const dragStartPos = ref({ x: 0, y: 0 })
const hasDragMoved = ref(false)

// 拖拽时的平滑像素视觉位置（不随网格步进，释放时才落格）
const dragVisual = ref<{ vid: string, left: number, top: number } | null>(null)

// 缩放时的平滑像素尺寸
const resizeVisual = ref<{ vid: string, width: number, height: number } | null>(null)

const resizingBlockVid = ref<string | null>(null)
const resizeStartPos = ref({ x: 0, y: 0 })
const _resizeStartGrid = ref({ w: 0, h: 0 })
const hasResizeChanged = ref(false)

// 像素起点缓存（用于拖拽/缩放增量计算）
const dragStartBlockPos = ref({ left: 0, top: 0 })
const resizeStartBlockSize = ref({ width: 0, height: 0 })

function _parsePx(value: string | number | undefined, fallback = 0) {
  return Number.parseInt(String(value ?? ''), 10) || fallback
}

/** 根据当前槽的网格度量计算子项的像素矩形（与根画布完全一致的公式） */
function getItemPixelRect(block: VisualEditorBlockData) {
  const m = slotMetrics.value
  const left = calcSlotColLeft(block.x ?? 0, m)
  const top = calcSlotRowTop(block.y ?? 0, m)
  const right = calcSlotColLeft((block.x ?? 0) + (block.w ?? 4), m)
  const bottom = calcSlotRowTop((block.y ?? 0) + (block.h ?? 2), m)
  return {
    left,
    top,
    width: Math.max(1, right - left - m.margin[0]),
    height: Math.max(1, bottom - top - m.margin[1]),
  }
}

/**
 * 读取子项像素样式。
 * 拖拽中优先使用 dragVisual 的像素值，实现平滑跟随鼠标（不网格步进）。
 */
function getItemStyle(block: VisualEditorBlockData): CSSProperties {
  const base = getItemPixelRect(block)

  // 拖拽中的平滑视觉位置
  if (dragVisual.value && dragVisual.value.vid === block._vid) {
    return {
      position: 'absolute',
      left: `${dragVisual.value.left}px`,
      top: `${dragVisual.value.top}px`,
      width: `${base.width}px`,
      height: `${base.height}px`,
      margin: '0',
      padding: '0',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }
  }

  // 缩放中的平滑视觉尺寸（位置保持基线）
  if (resizeVisual.value && resizeVisual.value.vid === block._vid) {
    return {
      position: 'absolute',
      left: `${base.left}px`,
      top: `${base.top}px`,
      width: `${resizeVisual.value.width}px`,
      height: `${resizeVisual.value.height}px`,
      margin: '0',
      padding: '0',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }
  }

  return {
    position: 'absolute',
    left: `${base.left}px`,
    top: `${base.top}px`,
    width: `${base.width}px`,
    height: `${base.height}px`,
    margin: '0',
    padding: '0',
    boxSizing: 'border-box',
    overflow: 'hidden',
  }
}

function getBlockStyle(block: VisualEditorBlockData): CSSProperties {
  const styles = block.styles || {}
  return {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    ...styles,
  }
}

function shouldShowResizer(block: VisualEditorBlockData) {
  return isEditingMode.value && (block.focus || isBlockSelected(block._vid))
}

function handleSelect(block: VisualEditorBlockData | undefined, e: MouseEvent) {
  if (!block || !isEditingMode.value)
    return
  e.stopPropagation()
  if (editorCtx)
    editorCtx.selectComp(block, e)
  else
    controlStore.selectCanvasBlock(block)
}

function handleContextmenu(block: VisualEditorBlockData | undefined, e: MouseEvent) {
  if (!block || !isEditingMode.value)
    return
  e.preventDefault()
  e.stopPropagation()
  if (editorCtx)
    editorCtx.onContextmenuBlock(e, block, localChildren.value)
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('drag-enter', e)
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  emit('drag-leave', e)
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()
}

function handleCanvasMousedown(e: MouseEvent) {
  const target = e.target as HTMLElement
  const onItem = Boolean(target.closest('.slot-grid-item'))

  if (!isEditingMode.value) {
    e.stopPropagation()
    if (props.containerVid)
      editorCtx?.selectContainerByVid?.(props.containerVid, e)
    return
  }

  // 编辑模式下点击子项时不拦截，由子项自己处理拖拽
  if (onItem)
    return

  e.stopPropagation()
  if (props.containerVid)
    editorCtx?.selectContainerByVid?.(props.containerVid, e)
}

function handleCanvasPointerdown(e: PointerEvent) {
  if (!isEditingMode.value)
    return
  // 编辑模式下阻止冒泡到外层 grid-layout，避免 interact 抢事件
  e.stopPropagation()
}

/** Capture phase stop: cuts off ancestor listeners (including outer interact.js) as early as possible */
function handleCanvasPointerdownCapture(e: PointerEvent) {
  if (isEditingMode.value) {
    e.stopPropagation()
  }
}

function onItemPointerdown(e: PointerEvent) {
  if (!isEditingMode.value)
    return
  e.stopPropagation()
}

function handleContainerDblClick(e: MouseEvent) {
  if (isEditingMode.value)
    return
  e.stopPropagation()
  if (!props.containerVid)
    return
  editorCtx?.enterContainerEditMode?.(props.containerVid)
  editorCtx?.selectContainerByVid?.(props.containerVid, e)
}

const NESTED_CONTAINER_KEYS = new Set(['group', 'container', 'layout', 'form'])

function handleInnerContainerDblClick(block: VisualEditorBlockData | undefined, e: MouseEvent) {
  if (!block)
    return
  e.stopPropagation()
  if (!isEditingMode.value) {
    // 双击子项进入当前容器编辑模式（无论子项是否为嵌套容器）
    if (props.containerVid)
      editorCtx?.enterContainerEditMode?.(props.containerVid)
    editorCtx?.selectContainerByVid?.(props.containerVid, e)
    return
  }
  if (!NESTED_CONTAINER_KEYS.has(block.componentKey))
    return
  editorCtx?.enterContainerEditMode?.(block._vid)
  editorCtx?.selectContainerByVid?.(block._vid, e)
}

// ---- 自研拖拽 / 缩放实现（替代 interact.js + GridLayout）----

function onItemMouseDown(e: MouseEvent, block: VisualEditorBlockData) {
  if (e.button !== 0)
    return

  if (!isEditingMode.value) {
    // 非编辑态下点击插槽内的子项 → 选中该容器本身（便于查看属性、双击进入编辑）
    if (props.containerVid) {
      editorCtx?.selectContainerByVid?.(props.containerVid, e)
    }
    e.stopPropagation()
    return
  }

  if (!canInteract(block))
    return

  editorCtx?.selectComp(block, e)
  e.preventDefault()
  e.stopPropagation()

  const rect = getItemPixelRect(block)
  draggingBlockVid.value = block._vid
  hasDragMoved.value = false
  dragStartPos.value = { x: e.clientX, y: e.clientY }

  // 记录像素起点（用于平滑 delta 计算）
  dragStartBlockPos.value = { left: rect.left, top: rect.top }

  // 立即进入平滑像素拖拽视觉状态
  dragVisual.value = {
    vid: block._vid,
    left: rect.left,
    top: rect.top,
  }
  resizeVisual.value = null

  document.removeEventListener('mousemove', onItemMouseMove)
  document.removeEventListener('mouseup', onItemMouseUp)
  document.addEventListener('mousemove', onItemMouseMove)
  document.addEventListener('mouseup', onItemMouseUp)
}

function onItemMouseMove(e: MouseEvent) {
  const vid = draggingBlockVid.value
  if (!vid || !dragVisual.value)
    return

  const dx = e.clientX - dragStartPos.value.x
  const dy = e.clientY - dragStartPos.value.y

  // 允许极小的移动也开始（去除任何“防抖”感觉）
  if (dx === 0 && dy === 0 && !hasDragMoved.value)
    return

  hasDragMoved.value = true

  // 纯像素跟随，不做网格 round
  let newLeft = dragStartBlockPos.value.left + dx
  let newTop = dragStartBlockPos.value.top + dy

  // 边界夹紧（像素级），横向使用当前容器宽度自适应的列宽
  const block = localChildren.value.find(b => b._vid === vid)
  if (block) {
    const m = slotMetrics.value
    const itemWpx = (block.w ?? 4) * m.colWidth
    const maxLeft = Math.max(0, m.containerWidth - itemWpx)
    newLeft = Math.max(0, Math.min(maxLeft, newLeft))
    newTop = Math.max(0, newTop)
  }

  dragVisual.value = { vid, left: newLeft, top: newTop }
}

function onItemMouseUp() {
  const vid = draggingBlockVid.value
  const visual = dragVisual.value

  if (vid && hasDragMoved.value && visual) {
    const m = slotMetrics.value
    const block = localChildren.value.find(b => b._vid === vid)
    if (block) {
      const w = block.w ?? 4
      const maxX = Math.max(0, m.cols - w)

      // 释放时使用与根画布完全一致的横向网格逻辑：
      // gridX = Math.round( pixelLeft / colWidth )
      const newX = Math.max(0, Math.min(maxX, Math.round(visual.left / m.colWidth)))
      const newY = Math.max(0, Math.round(visual.top / m.rowHeight))

      block.x = newX
      block.y = newY
    }

    // 一次性提交变更 + 历史
    localChildren.value = [...localChildren.value]
    editorCtx?.recordHistory()
  }

  draggingBlockVid.value = null
  hasDragMoved.value = false
  dragVisual.value = null
  document.removeEventListener('mousemove', onItemMouseMove)
  document.removeEventListener('mouseup', onItemMouseUp)
}

function onItemResizeStart(e: MouseEvent, block: VisualEditorBlockData) {
  if (!canInteract(block) || e.button !== 0)
    return

  e.preventDefault()
  e.stopPropagation()
  editorCtx?.selectComp(block, e)

  const rect = getItemPixelRect(block)
  resizingBlockVid.value = block._vid
  hasResizeChanged.value = false
  resizeStartPos.value = { x: e.clientX, y: e.clientY }
  resizeStartBlockSize.value = { width: rect.width, height: rect.height }

  // 进入平滑像素缩放视觉
  resizeVisual.value = {
    vid: block._vid,
    width: rect.width,
    height: rect.height,
  }
  dragVisual.value = null

  document.removeEventListener('mousemove', onItemResizeMove)
  document.removeEventListener('mouseup', onItemResizeUp)
  document.addEventListener('mousemove', onItemResizeMove)
  document.addEventListener('mouseup', onItemResizeUp)
}

function onItemResizeMove(e: MouseEvent) {
  const vid = resizingBlockVid.value
  if (!vid || !resizeVisual.value)
    return

  const dx = e.clientX - resizeStartPos.value.x
  const dy = e.clientY - resizeStartPos.value.y
  if (dx === 0 && dy === 0 && !hasResizeChanged.value)
    return

  hasResizeChanged.value = true

  const block = localChildren.value.find(b => b._vid === vid)
  if (!block)
    return

  const baseW = resizeStartBlockSize.value.width
  const baseH = resizeStartBlockSize.value.height

  let newW = Math.max(15, baseW + dx) // 最小 1 列视觉
  const newH = Math.max(15, baseH + dy)

  // 右边界夹紧（不允许超出容器），横向网格按当前容器宽度自适应
  const m = slotMetrics.value
  const x = block.x ?? 0
  const maxColsForThisItem = m.cols - x
  const maxWPx = maxColsForThisItem * m.colWidth
  newW = Math.min(newW, Math.max(15, maxWPx))

  resizeVisual.value = { vid, width: newW, height: newH }
}

function onItemResizeUp() {
  const vid = resizingBlockVid.value
  const visual = resizeVisual.value

  if (vid && hasResizeChanged.value && visual) {
    const m = slotMetrics.value
    const block = localChildren.value.find(b => b._vid === vid)
    if (block) {
      const x = block.x ?? 0
      const maxW = m.cols - x

      // 释放时使用与根画布一致的横向网格逻辑计算新宽度
      const newW = Math.max(1, Math.min(maxW, Math.round(visual.width / m.colWidth)))
      const newH = Math.max(1, Math.round(visual.height / m.rowHeight))

      block.w = newW
      block.h = newH
    }

    localChildren.value = [...localChildren.value]
    editorCtx?.recordHistory()
  }

  resizingBlockVid.value = null
  hasResizeChanged.value = false
  resizeVisual.value = null
  document.removeEventListener('mousemove', onItemResizeMove)
  document.removeEventListener('mouseup', onItemResizeUp)
}

// ---- 拖放处理 ----
function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  const block = controlStore.moveVisualData
  if (!block)
    return

  if (!isEditingMode.value)
    emit('drop', e)

  const dropTarget = (canvasRef.value ?? emptyRef.value) as HTMLElement | undefined
  if (!dropTarget)
    return

  const dropRoot = (dropTarget.closest('.slot-grid-canvas') ?? dropTarget) as HTMLElement
  const { x: gridX, y: gridY, w, h } = calcSlotDropLayout(dropRoot, e.clientX, e.clientY, block)

  const copiedBlock = cloneDeep(block) as VisualEditorBlockData
  copiedBlock._vid = `vid_${generateNanoid()}`
  copiedBlock.i = copiedBlock._vid
  copiedBlock.x = gridX
  copiedBlock.y = gridY
  copiedBlock.w = w
  copiedBlock.h = h
  copiedBlock.focus = false
  copiedBlock.focusWithChild = false

  localChildren.value = [...localChildren.value, copiedBlock]
  controlStore.setMoveVisualData(null)
  editorCtx?.recordHistory()
}
</script>

<template>
  <div
    ref="canvasRef"
    class="slot-grid-canvas"
    :data-slot-key="slotKey"
    :class="{
      'is-editing': isEditingMode,
      'is-focused': parentFocus && !isEditingMode,
    }"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
    @mousedown="handleCanvasMousedown"
    @pointerdown="handleCanvasPointerdown"
    @pointerdown.capture="handleCanvasPointerdownCapture"
    @dblclick.stop="handleContainerDblClick"
  >
    <!-- 自研网格布局（不再使用 GridLayout + interact.js） -->
    <div
      v-if="localChildren.length > 0"
      class="slot-grid-layout"
      :class="{ 'is-editing': isEditingMode }"
    >
      <div
        v-for="child in localChildren"
        :key="child._vid"
        class="slot-grid-item"
        :class="{
          'is-selected': isBlockSelected(child._vid),
          'is-editing': isEditingMode,
          'focus': child.focus,
          'is-dragging': draggingBlockVid === child._vid,
          'is-resizing': resizingBlockVid === child._vid,
        }"
        :style="getItemStyle(child)"
        @mousedown.stop="onItemMouseDown($event, child)"
        @pointerdown.stop="onItemPointerdown($event)"
        @click.stop="(e: MouseEvent) => handleSelect(child, e)"
        @dblclick.stop="(e: MouseEvent) => handleInnerContainerDblClick(child, e)"
        @contextmenu.stop.prevent="(e: MouseEvent) => handleContextmenu(child, e)"
      >
        <div
          class="slot-block-wrapper"
          :class="{ 'is-editing': isEditingMode }"
          :style="getBlockStyle(child)"
        >
          <CompRender
            :element="child"
            :style="{ pointerEvents: 'none' }"
          />
        </div>
        <span
          v-if="shouldShowResizer(child)"
          class="slot-grid-resizer"
          @mousedown.stop="onItemResizeStart($event, child)"
        />
      </div>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      ref="emptyRef"
      class="slot-grid-empty"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
    >
      <span class="empty-text">
        {{ isEditingMode ? '拖入组件' : '双击容器进入编辑模式' }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.slot-grid-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: transparent;
  pointer-events: auto;

  &:not(.is-editing) {
    .slot-grid-layout,
    .slot-grid-item {
      pointer-events: none;
    }

    .slot-grid-empty {
      pointer-events: auto;
    }
  }

  &.is-editing {
    .slot-grid-layout,
    .slot-grid-item {
      pointer-events: auto;
    }

    // 编辑态提升层级，优先接收事件，避免外层 grid-layout interact 干扰
    z-index: 20;
  }

  &.is-focused {
    .slot-grid-empty {
      background: #f0f7ff;
      border-color: #409eff;

      .empty-text {
        color: #409eff;
      }
    }
  }
}

.slot-grid-layout {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.slot-grid-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #dcdfe6;
  background: #fafafa;
  pointer-events: auto;

  .empty-text {
    color: #909399;
    font-size: 12px;
  }
}

.slot-grid-item {
  position: absolute;
  touch-action: none;
  cursor: default;
  box-sizing: border-box;

  /* 编辑器内拖拽追求即时响应，禁用过渡 */
  transition: none;

  &.is-editing {
    cursor: grab;
  }

  &.is-selected,
  &.focus {
    outline: 2px solid var(--el-color-primary);
    outline-offset: -1px;
    z-index: 10;
  }

  &.is-dragging {
    cursor: grabbing;
    z-index: 100;
    opacity: 0.96;
    transition: none !important;
    user-select: none;
  }

  &.is-resizing {
    z-index: 100;
    transition: none !important;
  }
}

.slot-block-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  pointer-events: none;

  // 强制子组件（如按钮）不拦截鼠标，由外层 item 处理拖拽
  :deep(*) {
    pointer-events: none !important;
  }
}

.slot-grid-resizer {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  cursor: se-resize;
  background: var(--el-color-primary);
  z-index: 20;
  touch-action: none;
}
</style>
